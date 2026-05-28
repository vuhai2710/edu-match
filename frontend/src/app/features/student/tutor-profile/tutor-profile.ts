import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  AcademicDegree,
  ReviewDto,
  TutorCareerStatus,
  TutorDetailDto,
  Gender,
  EducationLevel,
} from '../../../api/generated/client/models';
import { ReviewsService, TutorsService } from '../../../api/generated/client/services';
import { getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import {
  formatMoney,
  academicDegreeLabel,
  tutorCareerStatusLabel,
  genderLabel,
  educationLevelLabel,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-tutor-profile-page',
  imports: [RouterLink, MascotComponent],
  template: `
    @if (tutor(); as t) {
      <div class="space-y-6">
        <a
          routerLink="/student/discover"
          class="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          ← Quay lại
        </a>

        <!-- Header Profile Card -->
        <div class="tactile-card p-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            @if (t.avatarUrl && !avatarError()) {
              <img
                [src]="t.avatarUrl"
                [alt]="t.fullName"
                referrerpolicy="no-referrer"
                (error)="avatarError.set(true)"
                class="w-20 h-20 rounded-full object-cover border-4 border-green-100 shrink-0"
              />
            } @else {
              <div
                class="w-20 h-20 rounded-full bg-duo-blue text-white flex items-center justify-center font-black text-2xl border-b-4 border-duo-blue-dark shrink-0"
              >
                {{ initials(t.fullName) }}
              </div>
            }
            <div class="space-y-2 min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="font-display text-2xl font-black text-slate-900 leading-none">
                  {{ t.fullName }}
                </h1>
                @if (t.code) {
                  <span class="bg-blue-100 text-duo-blue text-xs font-extrabold px-2.5 py-1 rounded-lg border border-blue-200 uppercase">
                    {{ t.code }}
                  </span>
                }
              </div>
              <p class="text-slate-500 font-semibold text-sm">
                {{ t.address?.fullAddress || t.school || 'Chưa cập nhật địa chỉ' }}
              </p>
              <div class="flex items-center gap-3">
                @if (t.rating && t.rating > 0) {
                  <span class="text-sm text-slate-600 font-semibold">
                    {{ t.rating }}/5.0 <span class="text-amber-500">★</span>
                  </span>
                  <span class="text-slate-400">·</span>
                  <span class="text-sm text-slate-600 font-semibold">
                    {{ t.totalReviews ?? 0 }} đánh giá
                  </span>
                } @else {
                  <span class="text-sm text-slate-400 font-bold italic">
                    Chưa có đánh giá từ học viên
                  </span>
                }
              </div>

              <!-- Gender, Birth year, Email on the same line -->
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-slate-600 pt-2 border-t border-slate-100 mt-2">
                <div>
                  <span class="text-slate-400 font-bold mr-1">Giới tính:</span>
                  <span class="font-extrabold text-slate-800">{{ getGender(t.gender) }}</span>
                </div>
                @if (t.birth) {
                  <div class="h-3 w-px bg-slate-200 hidden sm:block"></div>
                  <div>
                    <span class="text-slate-400 font-bold mr-1">Năm sinh:</span>
                    <span class="font-extrabold text-slate-800">{{ t.birth }}</span>
                  </div>
                }
                @if (t.email) {
                  <div class="h-3 w-px bg-slate-200 hidden sm:block"></div>
                  <div class="min-w-0 truncate">
                    <span class="text-slate-400 font-bold mr-1">Email:</span>
                    <a [href]="'mailto:' + t.email" class="font-extrabold text-sky-blue hover:underline truncate" [title]="t.email">
                      {{ t.email }}
                    </a>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <div class="grid lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6 order-2 lg:order-1">
            <!-- Introduction Card -->
            <div class="tactile-card p-6">
              <h2 class="font-extrabold text-lg text-slate-900 mb-2">Giới thiệu</h2>
              <p class="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {{ t.profile || 'Gia sư chưa cập nhật phần giới thiệu.' }}
              </p>
              <div class="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
                <div class="rounded-xl border-2 border-slate-100 p-3">
                  <p class="text-slate-400 font-bold">Chuyên ngành</p>
                  <p class="font-extrabold text-slate-800">{{ t.major || 'Chưa cập nhật' }}</p>
                </div>
                <div class="rounded-xl border-2 border-slate-100 p-3">
                  <p class="text-slate-400 font-bold">Trạng thái nghề nghiệp</p>
                  <p class="font-extrabold text-slate-800">
                    {{ getCareerStatus(t.careerStatus) }}
                  </p>
                </div>
                <div class="rounded-xl border-2 border-slate-100 p-3">
                  <p class="text-slate-400 font-bold">Bằng cấp</p>
                  <p class="font-extrabold text-slate-800">
                    {{ getAcademicDegree(t.academicDegree) }}
                  </p>
                </div>
              </div>
            </div>

             <!-- Additional Info Card (No icons, clean layout) -->
             <div class="tactile-card p-6">
               <h2 class="font-extrabold text-lg text-slate-900 mb-4">Thông tin bổ sung</h2>
               <div class="space-y-4 text-sm">
                 <!-- Phone Number -->
                 @if (t.phoneNumber) {
                   <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100">
                     <span class="text-slate-500 font-bold">Số điện thoại liên hệ</span>
                     <span class="font-extrabold text-slate-800 mt-1 sm:mt-0">{{ t.phoneNumber }}</span>
                   </div>
                 }

                 <!-- Môn giảng dạy -->
                 @if (t.subjects?.length) {
                   <div class="flex flex-col gap-2 pb-3 border-b border-slate-100">
                     <span class="text-slate-500 font-bold">Môn giảng dạy</span>
                     <div class="flex flex-wrap gap-1.5">
                       @for (subject of t.subjects; track subject.subjectId) {
                         <span class="bg-blue-50 text-duo-blue px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-100">
                           {{ subject.subjectName }}
                         </span>
                       }
                     </div>
                   </div>
                 }

                 <!-- Cấp lớp giảng dạy -->
                 @if (t.teachingLevels?.length) {
                   <div class="flex flex-col gap-2 pb-3 border-b border-slate-100">
                     <span class="text-slate-500 font-bold">Cấp lớp giảng dạy</span>
                     <div class="flex flex-wrap gap-1.5">
                       @for (level of t.teachingLevels; track level) {
                         <span class="bg-blue-50 text-duo-blue px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-100">
                           {{ getEducationLevel(level) }}
                         </span>
                       }
                     </div>
                   </div>
                 }

                 <!-- CV URL -->
                 @if (t.cvUrl) {
                   <div class="flex items-center justify-between pt-1">
                     <div>
                       <span class="text-slate-500 font-bold block">Hồ sơ năng lực (CV)</span>
                       <span class="text-xs text-slate-400 font-semibold block mt-0.5">Tài liệu minh chứng năng lực giảng dạy</span>
                     </div>
                     <a [href]="t.cvUrl" target="_blank"
                        class="tactile-button-blue px-4 py-2 rounded-xl text-xs font-extrabold uppercase">
                       Xem hồ sơ
                     </a>
                   </div>
                 }
               </div>
             </div>

            <!-- Reviews Card -->
            <div class="tactile-card p-6">
              <h2 class="font-extrabold text-lg text-slate-900 mb-4">Đánh giá từ học viên</h2>
              <div class="space-y-4">
                @for (review of reviews(); track review.id) {
                  <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div class="flex items-center justify-between mb-2">
                      <p class="font-bold text-sm text-slate-900">
                        {{ review.studentName || 'Học viên' }}
                      </p>
                      <span class="text-xs text-slate-600 font-bold">
                        {{ review.rating }} <span class="text-amber-500">★</span>
                      </span>
                    </div>
                    <p class="text-sm text-slate-600">
                      {{ review.comment || 'Không có nhận xét.' }}
                    </p>
                  </div>
                }
                @if (!reviews().length) {
                  <p class="text-sm text-slate-500">Gia sư chưa có đánh giá.</p>
                }
              </div>
            </div>
          </div>

          <!-- Right Sidebar CTA -->
          <div class="space-y-4 order-1 lg:order-2">
            <div class="tactile-card p-6 sticky top-20">
              <div class="text-center mb-4">
                <p class="text-sm text-slate-500 font-bold">Học phí tham khảo / giờ</p>
                <p class="font-display text-3xl font-black text-duo-green mt-1">
                  {{ formatPrice(t.hourlyRate) }}
                </p>
              </div>
              <a
                [routerLink]="['/student/booking', t.id]"
                [queryParams]="subjectId ? { subjectId: subjectId } : {}"
                class="tactile-button-green w-full py-3 rounded-2xl text-base font-extrabold uppercase text-center block"
              >
                Đặt lịch học
              </a>
              <a
                [routerLink]="['/student/chat']"
                [queryParams]="{ partnerId: t.userId }"
                class="tactile-button-gray w-full py-2.5 rounded-2xl text-sm font-bold mt-2 text-center block"
              >
                Nhắn tin
              </a>
            </div>
          </div>
        </div>
      </div>
    } @else if (isLoading()) {
      <div class="tactile-card p-8 text-center font-bold text-slate-500">
        Đang tải hồ sơ gia sư...
      </div>
    } @else {
      <div class="text-center py-16">
        <app-mascot type="sadMagnifier" [size]="120" />
        <p class="mt-4 font-extrabold text-slate-700">Không tìm thấy gia sư</p>
        @if (errorMessage()) {
          <p class="text-sm text-duo-red mt-2">{{ errorMessage() }}</p>
        }
      </div>
    }
  `,
})
export class TutorProfilePage implements OnInit {
  tutor = signal<TutorDetailDto | null>(null);
  avatarError = signal(false);
  reviews = signal<ReviewDto[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  subjectId: number | null = null;

  private readonly route = inject(ActivatedRoute);
  private readonly tutorsApi = inject(TutorsService);
  private readonly reviewsApi = inject(ReviewsService);

  ngOnInit(): void {
    void this.loadTutor();
    const querySubId = this.route.snapshot.queryParamMap.get('subjectId');
    this.subjectId = querySubId ? Number(querySubId) : null;
  }

  initials(name?: string | null): string {
    if (!name) return '?';
    return name
      .split(' ')
      .slice(-2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  formatPrice(value?: number | null): string {
    return formatMoney(value);
  }

  getCareerStatus(status?: TutorCareerStatus | null): string {
    return tutorCareerStatusLabel(status);
  }

  getAcademicDegree(degree?: AcademicDegree | null): string {
    return academicDegreeLabel(degree);
  }

  getGender(gender?: Gender | string | null): string {
    return genderLabel(gender);
  }

  getEducationLevel(level?: EducationLevel | null): string {
    return educationLevelLabel(level);
  }

  private async loadTutor(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.errorMessage.set('Mã gia sư không hợp lệ.');
      return;
    }

    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.tutorsApi.getTutorById(idParam));
      const tutor = unwrapApiData(response);
      this.tutor.set(tutor);

      const tutorId = Number(idParam);
      if (!isNaN(tutorId)) {
        const reviewsResponse = await firstValueFrom(this.reviewsApi.getReviewsByTutorId(tutorId));
        this.reviews.set(reviewsResponse.data ?? []);
      }
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được hồ sơ gia sư.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
