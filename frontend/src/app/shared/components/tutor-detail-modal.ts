import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ReviewDto, TutorDetailDto } from '../../api/generated/client/models';
import { ReviewsService, TutorsService } from '../../api/generated/client/services';
import { getApiErrorMessage, unwrapApiData } from '../../core/http/api-error';
import {
  genderLabel,
  academicDegreeLabel,
  tutorCareerStatusLabel,
  educationLevelLabel,
  formatMoney,
  formatDateTime,
} from '../utils/api-ui';

@Component({
  selector: 'app-tutor-detail-modal',
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
         (click)="close.emit()">
      <div class="bg-white rounded-3xl border-2 border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
           (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="relative px-6 py-5 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 class="font-display font-black text-xl text-slate-800">Chi tiết gia sư</h3>
          <button (click)="close.emit()" 
                  class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 py-6 space-y-6 max-h-[75vh] overflow-y-auto">
          @if (isLoading()) {
            <div class="py-12 text-center text-slate-500 font-bold">
              <div class="animate-bounce mb-3 text-2xl">⚡</div>
              Đang tải thông tin gia sư...
            </div>
          } @else if (errorMessage()) {
            <div class="p-4 rounded-2xl border-2 border-red-100 bg-red-50 text-sm font-bold text-duo-red">
              {{ errorMessage() }}
            </div>
          } @else if (tutor(); as t) {
            <!-- Tutor Header Profile Info -->
            <div class="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div class="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                @if (t.avatarUrl) {
                  <img [src]="t.avatarUrl" alt="Avatar" class="w-full h-full object-cover" />
                } @else {
                  <svg class="w-9 h-9 text-[#58cc02]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M5 20a7 7 0 0 1 14 0" />
                  </svg>
                }
              </div>
              <div class="flex-1">
                <h4 class="font-display font-black text-lg text-slate-900 leading-tight">{{ t.fullName }}</h4>
                <p class="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Mã gia sư: {{ t.code || 'Đang cập nhật' }}</p>
                @if (t.rating) {
                  <div class="flex items-center gap-1 mt-1 text-amber-500 font-bold text-xs">
                    <span>★</span>
                    <span>{{ t.rating.toFixed(1) }}</span>
                    <span class="text-slate-400">({{ t.totalReviews || 0 }} đánh giá)</span>
                  </div>
                }
              </div>
            </div>

            <!-- Profile Fields -->
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="col-span-2 sm:col-span-1 rounded-2xl bg-slate-50 p-4 border border-slate-100/50">
                <p class="font-bold text-slate-400 text-xs uppercase tracking-wider">Giới tính</p>
                <p class="mt-1 font-extrabold text-slate-800">{{ getGender(t.gender) }}</p>
              </div>

              <div class="col-span-2 sm:col-span-1 rounded-2xl bg-slate-50 p-4 border border-slate-100/50">
                <p class="font-bold text-slate-400 text-xs uppercase tracking-wider">Tuổi</p>
                <p class="mt-1 font-extrabold text-slate-800">
                  @if (t.birth) {
                    {{ getAge(t.birth) }} tuổi ({{ t.birth }})
                  } @else {
                    Chưa cập nhật
                  }
                </p>
              </div>

              <div class="col-span-2 sm:col-span-1 rounded-2xl bg-slate-50 p-4 border border-slate-100/50">
                <p class="font-bold text-slate-400 text-xs uppercase tracking-wider">Vai trò / Học vị</p>
                <p class="mt-1 font-extrabold text-slate-800">
                  {{ getCareer(t.careerStatus) }} / {{ getDegree(t.academicDegree) }}
                </p>
              </div>

              <div class="col-span-2 sm:col-span-1 rounded-2xl bg-slate-50 p-4 border border-slate-100/50">
                <p class="font-bold text-slate-400 text-xs uppercase tracking-wider">Chuyên ngành</p>
                <p class="mt-1 font-extrabold text-slate-800">{{ t.major || 'Chưa cập nhật' }}</p>
              </div>

              <div class="col-span-2 sm:col-span-1 rounded-2xl bg-slate-50 p-4 border border-slate-100/50">
                <p class="font-bold text-slate-400 text-xs uppercase tracking-wider">Trường học</p>
                <p class="mt-1 font-extrabold text-slate-800">{{ t.school || 'Chưa cập nhật' }}</p>
              </div>

              <div class="col-span-2 sm:col-span-1 rounded-2xl bg-slate-50 p-4 border border-slate-100/50">
                <p class="font-bold text-slate-400 text-xs uppercase tracking-wider">Học phí / Giờ</p>
                <p class="mt-1 font-extrabold text-duo-green">{{ money(t.hourlyRate) }}</p>
              </div>

              <div class="col-span-2 rounded-2xl bg-slate-50 p-4 border border-slate-100/50 space-y-2">
                <p class="font-bold text-slate-400 text-xs uppercase tracking-wider">Dạy các lớp</p>
                <div class="flex flex-wrap gap-1">
                  @for (level of t.teachingLevels; track level) {
                    <span class="px-2.5 py-1 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-lg">
                      {{ getLevel(level) }}
                    </span>
                  } @empty {
                    <span class="text-slate-500 font-medium">Chưa cập nhật</span>
                  }
                </div>
              </div>

              <div class="col-span-2 rounded-2xl bg-slate-50 p-4 border border-slate-100/50 space-y-2">
                <p class="font-bold text-slate-400 text-xs uppercase tracking-wider">Môn dạy</p>
                <div class="flex flex-wrap gap-1">
                  @for (sub of t.subjects; track sub.subjectId) {
                    <span class="px-2.5 py-1 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-lg">
                      {{ sub.subjectName }}
                    </span>
                  } @empty {
                    <span class="text-slate-500 font-medium">Chưa cập nhật</span>
                  }
                </div>
              </div>

              <div class="col-span-2 rounded-2xl bg-slate-50 p-4 border border-slate-100/50 space-y-3">
                <p class="font-bold text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200/50 pb-1">Thông tin liên hệ</p>
                <div class="grid gap-2">
                  <div class="flex items-center gap-2 text-slate-600">
                    <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span class="font-semibold break-all">{{ t.email || 'Chưa cập nhật' }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-slate-600">
                    <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span class="font-semibold">{{ t.phoneNumber || 'Chưa cập nhật' }}</span>
                  </div>
                </div>
              </div>

              <div class="col-span-2 rounded-2xl bg-slate-50 p-4 border border-slate-100/50">
                <p class="font-bold text-slate-400 text-xs uppercase tracking-wider">Địa chỉ</p>
                <p class="mt-1 font-extrabold text-slate-800">
                  @if (t.address) {
                    {{ t.address.addressDetail ? t.address.addressDetail + ', ' : '' }}
                    {{ t.address.wardName ? t.address.wardName + ', ' : '' }}
                    {{ t.address.provinceName }}
                  } @else {
                    Chưa cập nhật
                  }
                </p>
              </div>

              @if (t.profile) {
                <div class="col-span-2 rounded-2xl bg-slate-50 p-4 border border-slate-100/50">
                  <p class="font-bold text-slate-400 text-xs uppercase tracking-wider mb-2">Giới thiệu bản thân</p>
                  <p class="text-slate-700 whitespace-pre-wrap leading-relaxed">{{ t.profile }}</p>
                </div>
              }

              @if (t.cvUrl) {
                <div class="col-span-2">
                  <a [href]="t.cvUrl" target="_blank" rel="noopener noreferrer"
                     class="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 hover:bg-slate-200 border-2 border-dashed border-slate-300 rounded-2xl text-slate-700 font-bold transition-colors">
                    <svg class="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Xem CV / Chứng chỉ gia sư
                  </a>
                </div>
              }

              @if (reviews().length > 0) {
                <div class="col-span-2 mt-2">
                  <h4 class="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Đánh giá gần đây</h4>
                  <div class="space-y-3">
                    @for (r of reviews().slice(0, 5); track r.id) {
                      <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div class="flex items-center justify-between mb-1">
                          <p class="font-bold text-slate-800 text-sm">{{ r.studentName }}</p>
                          <div class="flex text-amber-500 text-xs">
                            @for (s of [1,2,3,4,5]; track s) {
                              <span [class]="s <= r.rating! ? 'text-amber-500' : 'text-amber-200'">★</span>
                            }
                          </div>
                        </div>
                        <p class="text-xs text-slate-500 mb-2">Lớp: {{ r.classCode }} • {{ dateTime(r.createdAt) }}</p>
                        @if (r.comment) {
                          <p class="text-sm text-slate-700 font-medium">"{{ r.comment }}"</p>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t-2 border-slate-100 flex justify-end">
          <button (click)="close.emit()" 
                  class="tactile-button-gray px-5 py-2.5 rounded-xl text-sm font-bold">
            Đóng
          </button>
        </div>
      </div>
    </div>
  `,
})
export class TutorDetailModalComponent implements OnInit {
  tutorId = input<number | null | undefined>(null);
  close = output<void>();

  tutor = signal<TutorDetailDto | null>(null);
  reviews = signal<ReviewDto[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  private readonly tutorsApi = inject(TutorsService);
  private readonly reviewsApi = inject(ReviewsService);

  ngOnInit(): void {
    void this.loadTutorProfile();
  }

  getGender(g?: any): string {
    return genderLabel(g);
  }

  getCareer(c?: any): string {
    return tutorCareerStatusLabel(c);
  }

  getDegree(d?: any): string {
    return academicDegreeLabel(d);
  }

  getLevel(l?: any): string {
    return educationLevelLabel(l);
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  getAge(birthYear?: number | null): number {
    if (!birthYear) return 0;
    return new Date().getFullYear() - birthYear;
  }
  
  dateTime(value?: Date | string | null): string {
    return formatDateTime(value);
  }

  private async loadTutorProfile(): Promise<void> {
    const id = this.tutorId();
    if (!id) {
      this.errorMessage.set('Mã gia sư không hợp lệ.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(this.tutorsApi.getTutorById(String(id)));
      this.tutor.set(unwrapApiData(response));
      
      try {
        const reviewResponse = await firstValueFrom(this.reviewsApi.getReviewsByTutorId(id));
        this.reviews.set(reviewResponse.data || []);
      } catch (err) {
        console.error('Cannot load tutor reviews', err);
      }
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được thông tin gia sư.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
