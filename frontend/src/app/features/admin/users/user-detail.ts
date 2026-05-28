import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { UserDto, UserRole, TutorDetailDto, StudentDetailDto } from '../../../api/generated/client/models';
import { UsersService, TutorsService, StudentsService } from '../../../api/generated/client/services';
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
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-admin-user-detail-page',
  imports: [ErrorBannerComponent, RouterLink],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between gap-3">
        <a routerLink="/admin/users" class="inline-flex items-center gap-2 text-sm font-extrabold text-duo-blue hover:underline">
          <span>←</span> Quay lại danh sách
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
                @if (u.isActive) {
                  <span class="rounded-xl bg-green-50 px-3 py-1 text-xs font-black text-duo-green border border-green-200">Đang hoạt động</span>
                } @else {
                  <span class="rounded-xl bg-red-50 px-3 py-1 text-xs font-black text-duo-red border border-red-200">Đã khóa</span>
                }
              </div>
              @if (subtitle(u)) {
                <p class="text-sm text-slate-500 font-extrabold tracking-wider">{{ subtitle(u) }}</p>
              }
              @if (u.id !== session.user()?.id) {
                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                  <a [routerLink]="['/admin/chat']" [queryParams]="{ partnerId: u.id }"
                     class="px-4 py-2 bg-duo-green text-white font-extrabold text-xs uppercase tracking-wider rounded-xl border-b-4 border-duo-green-dark hover:brightness-105 active:border-b-0 active:translate-y-[4px] inline-flex items-center gap-1.5 transition-all">
                    💬 Nhắn tin
                  </a>
                </div>
              }
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
            <span class="text-2xl">📋</span>
            <h2 class="font-display text-xl font-extrabold text-slate-800">Thông tin cá nhân cơ bản</h2>
          </div>
          
          <div class="grid sm:grid-cols-2 gap-4 text-sm">
            @if (u.code) {
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">🏷️ Mã định danh</p>
                <p class="mt-1 font-extrabold text-slate-700">{{ u.code }}</p>
              </div>
            }
            <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
              <p class="text-xs font-black uppercase text-slate-400 tracking-wider">🔑 Vai trò hệ thống</p>
              <p class="mt-1 font-extrabold text-slate-700">{{ roleLabel(u.role) }}</p>
            </div>
            <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
              <p class="text-xs font-black uppercase text-slate-400 tracking-wider">📧 Địa chỉ Email</p>
              <p class="mt-1 font-extrabold text-slate-700 break-all">{{ u.email || '—' }}</p>
            </div>
            <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
              <p class="text-xs font-black uppercase text-slate-400 tracking-wider">👤 Giới tính</p>
              <p class="mt-1 font-extrabold text-slate-700">{{ getGenderLabel(u.gender) }}</p>
            </div>
            <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
              <p class="text-xs font-black uppercase text-slate-400 tracking-wider">🎂 Năm sinh</p>
              <p class="mt-1 font-extrabold text-slate-700">{{ u.birth ?? '—' }}</p>
            </div>
            <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
              <p class="text-xs font-black uppercase text-slate-400 tracking-wider">🏫 Trường học / Đơn vị</p>
              <p class="mt-1 font-extrabold text-slate-700">{{ u.school || '—' }}</p>
            </div>
            <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
              <p class="text-xs font-black uppercase text-slate-400 tracking-wider">🛡️ Trạng thái tài khoản</p>
              <p class="mt-1 font-extrabold text-slate-700">{{ u.isActive ? 'Đang hoạt động' : 'Đã khóa' }}</p>
            </div>
            <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
              <p class="text-xs font-black uppercase text-slate-400 tracking-wider">🌐 Đăng nhập Google</p>
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
              <span class="text-2xl">🎓</span>
              <h2 class="font-display text-xl font-bold text-slate-800">Thông tin gia sư chi tiết</h2>
            </div>
            
            <div class="grid sm:grid-cols-2 gap-4 text-sm">
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">📞 Số điện thoại</p>
                <p class="mt-1 font-extrabold text-slate-700">{{ t.phoneNumber || '—' }}</p>
              </div>
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">💼 Trạng thái nghề nghiệp</p>
                <p class="mt-1 font-extrabold text-slate-700">{{ getCareerStatusLabel(t.careerStatus) }}</p>
              </div>
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">📜 Học vị / Bằng cấp</p>
                <p class="mt-1 font-extrabold text-slate-700">{{ getAcademicDegreeLabel(t.academicDegree) }}</p>
              </div>
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">📚 Chuyên ngành</p>
                <p class="mt-1 font-extrabold text-slate-700">{{ t.major || '—' }}</p>
              </div>
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">💸 Học phí yêu cầu</p>
                <p class="mt-1 font-extrabold text-duo-green text-base">{{ formatPrice(t.hourlyRate) }} / giờ</p>
              </div>
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">⭐ Đánh giá gia sư</p>
                <p class="mt-1 font-extrabold text-slate-700">
                  @if (t.rating && t.rating > 0) {
                    <span class="text-duo-yellow font-extrabold">{{ t.rating }}/5.0 ★</span> ({{ t.totalReviews ?? 0 }} đánh giá)
                  } @else {
                    <span class="text-slate-400">Chưa có đánh giá từ học viên</span>
                  }
                </p>
              </div>
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 sm:col-span-2">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">📍 Địa chỉ đầy đủ</p>
                <p class="mt-1 font-extrabold text-slate-700">{{ t.address?.fullAddress || '—' }}</p>
              </div>
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 sm:col-span-2">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">✍️ Giới thiệu bản thân</p>
                <p class="mt-1 font-extrabold text-slate-700 leading-relaxed whitespace-pre-line">{{ t.profile || '—' }}</p>
              </div>

              @if (t.subjects?.length) {
                <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 sm:col-span-2">
                  <p class="text-xs font-black uppercase text-slate-400 tracking-wider">📖 Môn giảng dạy</p>
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
                  <p class="text-xs font-black uppercase text-slate-400 tracking-wider">🏫 Cấp lớp giảng dạy</p>
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
                    <p class="text-xs font-black uppercase text-slate-400 tracking-wider">📄 Hồ sơ năng lực (CV)</p>
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
              <span class="text-2xl">🎒</span>
              <h2 class="font-display text-xl font-bold text-slate-800">Thông tin học viên chi tiết</h2>
            </div>
            
            <div class="grid sm:grid-cols-2 gap-4 text-sm">
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">📞 Số điện thoại</p>
                <p class="mt-1 font-extrabold text-slate-700">{{ s.phoneNumber || '—' }}</p>
              </div>
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">🏫 Cấp học hiện tại</p>
                <p class="mt-1 font-extrabold text-slate-700">{{ getGradeLevelLabel(s.gradeLevel) }}</p>
              </div>
              <div class="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 sm:col-span-2">
                <p class="text-xs font-black uppercase text-slate-400 tracking-wider">📍 Địa chỉ đầy đủ</p>
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

  protected readonly userRole = UserRole;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersApi = inject(UsersService);
  private readonly tutorsApi = inject(TutorsService);
  private readonly studentsApi = inject(StudentsService);
  protected readonly session = inject(SessionService);

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
    this.isLoadingProfile.set(true);
    try {
      let studentItem: any = null;
      
      // 1. Search student list by code
      if (u.code) {
        console.log('[loadStudentProfile] Searching student by code:', u.code);
        const res = await firstValueFrom(this.studentsApi.getStudents(undefined, undefined, 1, 10, u.code));
        studentItem = res.data?.items?.find(s => s.userId === u.id || s.code === u.code);
      }
      
      // 2. Fallback: search student list by full name
      if (!studentItem && u.fullName) {
        console.log('[loadStudentProfile] Searching student by name:', u.fullName);
        const res = await firstValueFrom(this.studentsApi.getStudents(undefined, undefined, 1, 50, u.fullName));
        studentItem = res.data?.items?.find(s => s.userId === u.id);
      }
      
      // 3. Fallback: list all students (up to 100) and scan
      if (!studentItem) {
        console.log('[loadStudentProfile] Scanning all students...');
        const res = await firstValueFrom(this.studentsApi.getStudents(undefined, undefined, 1, 100));
        studentItem = res.data?.items?.find(s => s.userId === u.id);
      }
      
      if (studentItem?.id) {
        console.log('[loadStudentProfile] Found student item in list, fetching details for ID:', studentItem.id);
        const detailRes = await firstValueFrom(this.studentsApi.getStudentById(studentItem.id));
        this.studentProfile.set(detailRes.data ?? null);
      }
    } catch (e) {
      console.error('[admin/user-detail] Failed to load student profile details', e);
    } finally {
      this.isLoadingProfile.set(false);
    }
  }
}
