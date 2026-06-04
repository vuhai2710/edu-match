import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { UserDto, UserRole, TutorDetailDto, StudentDetailDto, ReviewDto } from '../../../api/generated/client/models';
import { UsersService, TutorsService, StudentsService, AdminService, ReviewsService } from '../../../api/generated/client/services';
import { ApiErrorDetails, getApiErrorDetails, getApiErrorMessage } from '../../../core/http/api-error';
import { SessionService } from '../../../core/auth/session';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner';
import {
  userRoleLabel,
  genderLabel,
  academicDegreeLabel,
  educationLevelLabel,
  gradeLabel,
  tutorCareerStatusLabel,
  formatMoney,
  formatDateTime,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-admin-user-detail-page',
  imports: [ErrorBannerComponent, RouterLink],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between gap-3">
        <a href="javascript:void(0)" (click)="goBack($event)" class="inline-flex items-center gap-2 text-sm font-extrabold text-duo-blue hover:underline">
          <span>←</span> Quay lại
        </a>
      </div>

      @if (errorDetails()) {
        <app-error-banner [details]="errorDetails()" />
      }
      @if (actionError()) {
        <p class="rounded-2xl border-2 border-duo-red/20 bg-red-50 px-4 py-3 text-sm font-extrabold text-duo-red">{{ actionError() }}</p>
      }

      @if (user(); as u) {
        <!-- Summary card -->
        <div class="tactile-card p-6">
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            @if (u.avatarUrl && !avatarError()) {
              <img [src]="u.avatarUrl" [alt]="u.fullName || ''"
                   referrerpolicy="no-referrer"
                   (error)="avatarError.set(true)"
                   class="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-inner" />
            } @else {
              <div class="w-24 h-24 rounded-full bg-duo-blue text-white flex items-center justify-center font-black text-3xl border-b-4 border-duo-blue-dark">
                {{ initials(u.fullName) }}
              </div>
            }
            <div class="flex-1 space-y-2">
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h1 class="font-display text-3xl font-black text-slate-800 tracking-wide">{{ u.fullName || 'Không rõ' }}</h1>
                <span class="rounded-xl bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 border border-slate-200">{{ roleLabel(u.role) }}</span>
                @if (u.isDeleted) {
                  <span class="rounded-xl bg-red-50 px-3 py-1 text-xs font-black text-duo-red border border-red-200">Đã xóa</span>
                } @else {
                  <span class="rounded-xl bg-green-50 px-3 py-1 text-xs font-black text-duo-green border border-green-200">Đang hoạt động</span>
                }
                @if (u.role === userRole.Tutor && tutorProfile(); as t) {
                  @if (t.approvalStatus === 'Pending') {
                    <span class="rounded-xl bg-amber-50 px-3 py-1 text-xs font-black text-amber-600 border border-amber-200">Chờ phê duyệt</span>
                  } @else if (t.approvalStatus === 'Approved') {
                    <span class="rounded-xl bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-600 border border-emerald-200">Đã phê duyệt</span>
                  } @else if (t.approvalStatus === 'Rejected') {
                    <span class="rounded-xl bg-rose-50 px-3 py-1 text-xs font-black text-rose-600 border border-rose-200">Bị từ chối</span>
                  }
                }
              </div>
              @if (subtitle(u)) {
                <p class="text-sm text-slate-500 font-extrabold tracking-wider">{{ subtitle(u) }}</p>
              }
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                @if (u.id !== session.user()?.id) {
                  <a [routerLink]="['/admin/chat']" [queryParams]="{ partnerId: u.id }"
                     class="px-4 py-2 bg-duo-green text-white font-extrabold text-xs uppercase tracking-wider rounded-xl border-b-4 border-duo-green-dark hover:brightness-105 active:border-b-0 active:translate-y-[4px] inline-flex items-center gap-1.5 transition-all">
                    Nhắn tin
                  </a>
                }
                @if (u.role === userRole.Tutor && tutorProfile(); as t) {
                  @if (t.approvalStatus === 'Pending') {
                    <button (click)="approveTutor(t.id)" [disabled]="isActionRunning() || isDeleting()"
                            class="px-4 py-2 bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl border-b-4 border-emerald-700 hover:brightness-105 active:border-b-0 active:translate-y-[4px] disabled:opacity-50 transition-all inline-flex items-center gap-1.5">
                      Phê duyệt
                    </button>
                    <button (click)="rejectTutor(t.id)" [disabled]="isActionRunning() || isDeleting()"
                            class="px-4 py-2 bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl border-b-4 border-rose-700 hover:brightness-105 active:border-b-0 active:translate-y-[4px] disabled:opacity-50 transition-all inline-flex items-center gap-1.5">
                      Từ chối
                    </button>
                  }
                }
              </div>
            </div>
            @if (canDelete()) {
              <button (click)="confirmDelete()"
                      [disabled]="isDeleting()"
                      class="px-5 py-2.5 bg-duo-red text-white font-extrabold text-xs uppercase tracking-wider rounded-xl border-b-4 border-duo-red-dark hover:brightness-105 active:border-b-0 active:translate-y-[4px] disabled:opacity-50 disabled:translate-y-0 disabled:border-b-4 transition-all">
                Xóa người dùng
              </button>
            }
          </div>
        </div>

        <!-- Detail card -->
        <div class="tactile-card p-6 space-y-4">
          <div class="flex items-center gap-2 border-b-2 border-slate-100 pb-3">
            <h2 class="font-display text-xl font-extrabold text-slate-800">Thông tin cá nhân cơ bản</h2>
          </div>
          
          <div class="grid sm:grid-cols-2 gap-4 text-sm">
            @if (u.code) {
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Mã định danh</p>
                <p class="mt-1 font-extrabold text-slate-700">{{ u.code }}</p>
              </div>
            }
            <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
              <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Vai trò hệ thống</p>
              <p class="mt-1 font-extrabold text-slate-700">{{ roleLabel(u.role) }}</p>
            </div>
            <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
              <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Địa chỉ Email</p>
              <p class="mt-1 font-extrabold text-slate-700 break-all">{{ u.email || '—' }}</p>
            </div>
            <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
              <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Giới tính</p>
              <p class="mt-1 font-extrabold text-slate-700">{{ getGenderLabel(u.gender) }}</p>
            </div>
            <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
              <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Năm sinh</p>
              <p class="mt-1 font-extrabold text-slate-700">{{ u.birth ?? '—' }}</p>
            </div>
            <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
              <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Trường học / Đơn vị</p>
              <p class="mt-1 font-extrabold text-slate-700">{{ u.school || '—' }}</p>
            </div>
            <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
              <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Trạng thái tài khoản</p>
              <p class="mt-1 font-extrabold text-slate-700">{{ u.isActive ? 'Đang hoạt động' : 'Đã xóa' }}</p>
            </div>
            <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
              <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Đăng nhập Google</p>
              <p class="mt-1 font-extrabold text-slate-700">{{ u.isGoogleAccount ? 'Có' : 'Không' }}</p>
            </div>
          </div>
        </div>

        @if (isLoadingProfile()) {
          <div class="tactile-card p-8 text-center">
            <div class="inline-block w-8 h-8 border-4 border-duo-blue border-t-transparent rounded-full animate-spin"></div>
            <p class="mt-2 font-extrabold text-slate-500 text-sm">Đang tải thông tin hồ sơ liên kết...</p>
          </div>
        }

        <!-- Tutor Profile Details -->
        @if (u.role === userRole.Tutor && tutorProfile(); as t) {
          <div class="tactile-card p-6 space-y-4">
            <div class="flex items-center gap-2 border-b-2 border-slate-100 pb-3">
              <h2 class="font-display text-xl font-bold text-slate-800">Thông tin gia sư chi tiết</h2>
            </div>
            
            <div class="grid sm:grid-cols-2 gap-4 text-sm">
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Số điện thoại</p>
                <p class="mt-1 font-extrabold text-slate-700">{{ t.phoneNumber || '—' }}</p>
              </div>
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Trạng thái nghề nghiệp</p>
                <p class="mt-1 font-extrabold text-slate-700">{{ getCareerStatusLabel(t.careerStatus) }}</p>
              </div>
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Học vị / Bằng cấp</p>
                <p class="mt-1 font-extrabold text-slate-700">{{ getAcademicDegreeLabel(t.academicDegree) }}</p>
              </div>
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Chuyên ngành</p>
                <p class="mt-1 font-extrabold text-slate-700">{{ t.major || '—' }}</p>
              </div>
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Học phí yêu cầu</p>
                <p class="mt-1 font-extrabold text-duo-green text-base">{{ formatPrice(t.hourlyRate) }} / giờ</p>
              </div>
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Đánh giá gia sư</p>
                  <p class="mt-1 font-extrabold text-slate-700">
                    @if (t.rating && t.rating > 0) {
                      <span class="text-duo-yellow font-extrabold">{{ t.rating }}/5.0 ★</span> ({{ t.totalReviews ?? 0 }} đánh giá)
                    } @else {
                      <span class="text-slate-400">Chưa có đánh giá từ học viên</span>
                    }
                  </p>
                </div>
                @if (t.totalReviews && t.totalReviews > 0) {
                  <button (click)="loadReviewsAndShowModal(t.id!)" class="mt-2 sm:mt-0 px-3 py-1.5 bg-white text-duo-blue font-bold text-xs uppercase rounded-lg border border-slate-200 hover:bg-blue-50 transition-colors shadow-sm">
                    Xem tất cả
                  </button>
                }
              </div>
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 sm:col-span-2">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Địa chỉ đầy đủ</p>
                <p class="mt-1 font-extrabold text-slate-700">{{ t.address?.fullAddress || '—' }}</p>
              </div>
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 sm:col-span-2">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Giới thiệu bản thân</p>
                <p class="mt-1 font-extrabold text-slate-700 leading-relaxed whitespace-pre-line">{{ t.profile || '—' }}</p>
              </div>

              @if (t.subjects?.length) {
                <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 sm:col-span-2">
                  <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Môn giảng dạy</p>
                  <div class="flex flex-wrap gap-2 mt-2">
                    @for (subj of t.subjects; track subj.subjectId) {
                      <span class="bg-duo-green-light text-duo-green-dark px-3 py-1 rounded-xl text-xs font-black border border-duo-green/20">
                        {{ subj.subjectName }}
                      </span>
                    }
                  </div>
                </div>
              }

              @if (t.teachingLevels?.length) {
                <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 sm:col-span-2">
                  <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Cấp lớp giảng dạy</p>
                  <div class="flex flex-wrap gap-2 mt-2">
                    @for (lvl of t.teachingLevels; track lvl) {
                      <span class="bg-blue-50 text-duo-blue px-3 py-1 rounded-xl text-xs font-black border border-blue-100">
                        {{ getEducationLevelLabel(lvl) }}
                      </span>
                    }
                  </div>
                </div>
              }

              @if (t.cvUrl) {
                <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 sm:col-span-2 flex items-center justify-between">
                  <div>
                    <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Hồ sơ năng lực (CV)</p>
                    <p class="text-xs text-slate-400 mt-0.5">Tài liệu minh chứng năng lực giảng dạy</p>
                  </div>
                  <a [href]="t.cvUrl" target="_blank" class="px-5 py-2.5 bg-duo-blue text-white rounded-xl text-xs font-black uppercase shadow-sm border-b-4 border-duo-blue-dark hover:brightness-105 active:border-b-0 active:translate-y-[4px] transition-all">
                    Xem hồ sơ CV
                  </a>
                </div>
              }
            </div>
          </div>
        }

        <!-- Student Profile Details -->
        @if (u.role === userRole.Student && studentProfile(); as s) {
          <div class="tactile-card p-6 space-y-4">
            <div class="flex items-center gap-2 border-b-2 border-slate-100 pb-3">
              <h2 class="font-display text-xl font-bold text-slate-800">Thông tin học viên chi tiết</h2>
            </div>
            
            <div class="grid sm:grid-cols-2 gap-4 text-sm">
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Số điện thoại</p>
                <p class="mt-1 font-extrabold text-slate-700">{{ s.phoneNumber || '—' }}</p>
              </div>
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Cấp học hiện tại</p>
                <p class="mt-1 font-extrabold text-slate-700">{{ getGradeLevelLabel(s.gradeLevel) }}</p>
              </div>
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 sm:col-span-2">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">Địa chỉ đầy đủ</p>
                <p class="mt-1 font-extrabold text-slate-700">{{ s.address?.fullAddress || '—' }}</p>
              </div>
            </div>
          </div>
        }
      } @else if (!errorDetails()) {
        <div class="tactile-card p-12 text-center">
          <div class="inline-block w-8 h-8 border-4 border-duo-blue border-t-transparent rounded-full animate-spin"></div>
          <p class="mt-2 font-extrabold text-slate-500">Đang tải thông tin người dùng...</p>
        </div>
      }

      @if (showAllReviewsModal()) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
             (click)="showAllReviewsModal.set(false)">
          <div class="bg-white rounded-3xl border-2 border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
               (click)="$event.stopPropagation()">
            <div class="px-6 py-5 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h3 class="font-display font-black text-xl text-slate-800">Tất cả đánh giá</h3>
              <button (click)="showAllReviewsModal.set(false)" 
                      class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="px-6 py-4 space-y-3 overflow-y-auto flex-1">
              @if (isLoadingReviews()) {
                <div class="py-10 text-center">
                  <div class="inline-block w-6 h-6 border-4 border-duo-blue border-t-transparent rounded-full animate-spin"></div>
                  <p class="mt-2 text-sm font-bold text-slate-500">Đang tải đánh giá...</p>
                </div>
              } @else {
                @for (r of reviews(); track r.id) {
                  <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div class="flex items-center justify-between mb-1">
                      <p class="font-bold text-slate-800 text-sm">{{ r.studentName }}</p>
                      <div class="flex text-amber-500 text-xs">
                        @for (s of [1,2,3,4,5]; track s) {
                          <span [class]="s <= (r.rating || 0) ? 'text-amber-500' : 'text-amber-200'">★</span>
                        }
                      </div>
                    </div>
                    <p class="text-xs text-slate-500 mb-2">Lớp: {{ r.classCode }} • {{ dateTime(r.createdAt) }}</p>
                    @if (r.comment) {
                      <p class="text-sm text-slate-700 font-medium">"{{ r.comment }}"</p>
                    }
                  </div>
                }
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminUserDetailPage implements OnInit {
  user = signal<UserDto | null>(null);
  avatarError = signal(false);
  tutorProfile = signal<TutorDetailDto | null>(null);
  studentProfile = signal<StudentDetailDto | null>(null);
  isLoadingProfile = signal(false);

  errorDetails = signal<ApiErrorDetails | null>(null);
  actionError = signal('');
  isDeleting = signal(false);
  isActionRunning = signal(false);

  showAllReviewsModal = signal(false);
  reviews = signal<ReviewDto[]>([]);
  isLoadingReviews = signal(false);

  protected readonly userRole = UserRole;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersApi = inject(UsersService);
  private readonly tutorsApi = inject(TutorsService);
  private readonly studentsApi = inject(StudentsService);
  private readonly adminApi = inject(AdminService);
  private readonly reviewsApi = inject(ReviewsService);
  protected readonly session = inject(SessionService);
  private readonly location = inject(Location);

  goBack(event: Event): void {
    event.preventDefault();
    this.location.back();
  }

  ngOnInit(): void {
    void this.loadUser();
  }

  initials(name?: string | null): string {
    if (!name) return '?';
    return name.split(' ').slice(-2).map((s) => s[0]).join('').toUpperCase();
  }

  roleLabel(role?: UserRole | null): string {
    return userRoleLabel(role);
  }

  getGenderLabel(gender?: string | null): string {
    return genderLabel(gender);
  }

  getAcademicDegreeLabel(degree?: any): string {
    return academicDegreeLabel(degree);
  }

  getEducationLevelLabel(level?: any): string {
    return educationLevelLabel(level);
  }

  getGradeLevelLabel(grade?: any): string {
    return gradeLabel(grade);
  }

  getCareerStatusLabel(status?: any): string {
    return tutorCareerStatusLabel(status);
  }

  formatPrice(value?: number | null): string {
    return formatMoney(value);
  }

  dateTime(value?: Date | string | null): string {
    return formatDateTime(value);
  }

  subtitle(user: UserDto): string {
    return user.code ? `Mã: ${user.code}` : '';
  }

  canDelete(): boolean {
    const u = this.user();
    if (!u?.id) return false;
    return u.id !== this.session.user()?.id;
  }

  async confirmDelete(): Promise<void> {
    const u = this.user();
    if (!u?.id) return;
    const confirmed = window.confirm(
      `Xác nhận xóa người dùng "${u.fullName || u.email}"? Thao tác này không thể hoàn tác.`,
    );
    if (!confirmed) return;
    this.isDeleting.set(true);
    this.actionError.set('');
    try {
      await firstValueFrom(this.usersApi.deleteUser(u.id));
      await this.router.navigateByUrl('/admin/users');
    } catch (error) {
      console.error('[admin/user-detail] delete failed', error);
      this.actionError.set(getApiErrorMessage(error, 'Không xóa được người dùng.'));
    } finally {
      this.isDeleting.set(false);
    }
  }

  private async loadUser(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorDetails.set({ message: 'ID người dùng không hợp lệ.' });
      return;
    }
    try {
      const response = await firstValueFrom(this.usersApi.getUserById(id));
      const u = response.data ?? null;
      this.user.set(u);
      
      if (u) {
        if (u.role === UserRole.Tutor) {
          await this.loadTutorProfile(u);
        } else if (u.role === UserRole.Student) {
          await this.loadStudentProfile(u);
        }
      }
    } catch (error) {
      console.error('[admin/user-detail] load failed', error);
      this.errorDetails.set(getApiErrorDetails(error, 'Không tải được thông tin người dùng.'));
    }
  }

  private async loadTutorProfile(u: UserDto): Promise<void> {
    this.isLoadingProfile.set(true);
    try {
      let tutorProfileData: TutorDetailDto | null = null;
      let tutorItem: any = null;
      
      // 1. Search tutor list by code
      if (u.code) {
        console.log('[loadTutorProfile] Searching tutor by code:', u.code);
        const res = await firstValueFrom(this.tutorsApi.getTutors(undefined, undefined, undefined, undefined, undefined, 1, 10, u.code));
        tutorItem = res.data?.items?.find(t => t.userId === u.id || t.code === u.code);
      }
      
      // 2. Fallback: search tutor list by full name
      if (!tutorItem && u.fullName) {
        console.log('[loadTutorProfile] Searching tutor by name:', u.fullName);
        const res = await firstValueFrom(this.tutorsApi.getTutors(undefined, undefined, undefined, undefined, undefined, 1, 50, u.fullName));
        tutorItem = res.data?.items?.find(t => t.userId === u.id);
      }
      
      // 3. Fallback: list all tutors (up to 100) and scan
      if (!tutorItem) {
        console.log('[loadTutorProfile] Scanning all tutors...');
        const res = await firstValueFrom(this.tutorsApi.getTutors(undefined, undefined, undefined, undefined, undefined, 1, 100));
        tutorItem = res.data?.items?.find(t => t.userId === u.id);
      }
      
      if (tutorItem?.id) {
        console.log('[loadTutorProfile] Found tutor item in list, fetching details for ID:', tutorItem.id);
        const detailRes = await firstValueFrom(this.tutorsApi.getTutorById(tutorItem.id));
        tutorProfileData = detailRes.data ?? null;
      }
      
      if (tutorProfileData) {
        this.tutorProfile.set(tutorProfileData);
      }
    } catch (e) {
      console.error('[admin/user-detail] Failed to load tutor profile details', e);
    } finally {
      this.isLoadingProfile.set(false);
    }
  }

  private async loadStudentProfile(u: UserDto): Promise<void> {
    if (!u.id) return;
    this.isLoadingProfile.set(true);
    try {
      const detailRes = await firstValueFrom(this.studentsApi.getStudentByUserId(u.id));
      this.studentProfile.set(detailRes.data ?? null);
    } catch (e) {
      console.error('[admin/user-detail] Failed to load student profile details', e);
      this.studentProfile.set(null);
    } finally {
      this.isLoadingProfile.set(false);
    }
  }

  async approveTutor(tutorId?: number): Promise<void> {
    if (!tutorId) return;

    this.isActionRunning.set(true);
    this.actionError.set('');
    try {
      await firstValueFrom(this.adminApi.approveTutor(tutorId));
      await this.loadUser(); // reload
    } catch (error) {
      console.error('[admin/user-detail] approve failed', error);
      this.actionError.set(getApiErrorMessage(error, 'Không thể phê duyệt gia sư.'));
    } finally {
      this.isActionRunning.set(false);
    }
  }

  async rejectTutor(tutorId?: number): Promise<void> {
    if (!tutorId) return;

    this.isActionRunning.set(true);
    this.actionError.set('');
    try {
      await firstValueFrom(this.adminApi.rejectTutor(tutorId));
      await this.loadUser(); // reload
    } catch (error) {
      console.error('[admin/user-detail] reject failed', error);
      this.actionError.set(getApiErrorMessage(error, 'Không thể từ chối gia sư.'));
    } finally {
      this.isActionRunning.set(false);
    }
  }

  async loadReviewsAndShowModal(tutorId: number) {
    this.showAllReviewsModal.set(true);
    if (this.reviews().length === 0) {
       this.isLoadingReviews.set(true);
       try {
         const res = await firstValueFrom(this.reviewsApi.getReviewsByTutorId(tutorId));
         this.reviews.set(res.data || []);
       } catch (err) {
         console.error(err);
       } finally {
         this.isLoadingReviews.set(false);
       }
    }
  }
}
