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
  selector: 'app-public-tutor-detail',
  imports: [RouterLink, MascotComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      @if (tutor(); as t) {
        <div class="space-y-6">
          <a
            routerLink="/"
            class="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            ← Quay lại Trang chủ
          </a>

          <div class="grid lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
              <!-- Header Profile Card -->
              <div class="tactile-card p-6">
                <div class="flex items-center gap-4">
                  @if (t.avatarUrl) {
                    <img
                      [src]="t.avatarUrl"
                      [alt]="t.fullName"
                      referrerpolicy="no-referrer"
                      class="w-20 h-20 rounded-full object-cover border-4 border-green-100"
                    />
                  } @else {
                    <div
                      class="w-20 h-20 rounded-full bg-duo-blue text-white flex items-center justify-center font-black text-2xl border-b-4 border-duo-blue-dark"
                    >
                      {{ initials(t.fullName) }}
                    </div>
                  }
                  <div>
                    <div class="flex flex-wrap items-center gap-2">
                      <h1 class="font-display text-2xl font-black text-slate-900">
                        {{ t.fullName }}
                      </h1>
                      @if (t.code) {
                        <span class="bg-blue-100 text-duo-blue text-xs font-extrabold px-2.5 py-1 rounded-lg border border-blue-200">
                          {{ t.code }}
                        </span>
                      }
                    </div>
                    <p class="text-slate-500 mt-1">
                      {{ t.address?.fullAddress || t.school || 'Chưa cập nhật địa chỉ' }}
                    </p>
                    <div class="flex items-center gap-3 mt-2">
                      <span class="flex items-center gap-1 text-amber-600 font-bold text-sm"
                        >★ {{ t.rating ?? 0 }}/5.0</span
                      >
                      <span class="text-slate-400">·</span>
                      <span class="text-sm text-slate-600 font-semibold"
                        >{{ t.totalReviews ?? 0 }} đánh giá</span
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- Introduction Card -->
              <div class="tactile-card p-6">
                <h2 class="font-extrabold text-lg text-slate-900 mb-2">Giới thiệu</h2>
                <p class="text-sm text-slate-600 leading-relaxed">
                  {{ t.profile || 'Gia sư chưa cập nhật phần giới thiệu.' }}
                </p>
                <div class="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
                  <div class="rounded-xl border-2 border-slate-100 p-3">
                    <p class="text-slate-400 font-bold">Chuyên ngành</p>
                    <p class="font-extrabold text-slate-800">{{ t.major || 'Chưa cập nhật' }}</p>
                  </div>
                  <div class="rounded-xl border-2 border-slate-100 p-3">
                    <p class="text-slate-400 font-bold">Trạng thái</p>
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

              <!-- Detailed Info Card -->
              <div class="tactile-card p-6">
                <h2 class="font-extrabold text-lg text-slate-900 mb-4">Thông tin chi tiết</h2>
                <div class="grid sm:grid-cols-2 gap-4 text-sm">
                  <!-- Giới tính -->
                  <div class="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 bg-slate-50/50">
                    <span class="text-xl">👤</span>
                    <div>
                      <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Giới tính</p>
                      <p class="font-extrabold text-slate-800">{{ getGender(t.gender) }}</p>
                    </div>
                  </div>

                  <!-- Năm sinh -->
                  @if (t.birth) {
                    <div class="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 bg-slate-50/50">
                      <span class="text-xl">📅</span>
                      <div>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Năm sinh</p>
                        <p class="font-extrabold text-slate-800">{{ t.birth }}</p>
                      </div>
                    </div>
                  }

                  <!-- Số điện thoại -->
                  @if (t.phoneNumber) {
                    <div class="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 bg-slate-50/50">
                      <span class="text-xl">📞</span>
                      <div>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Số điện thoại</p>
                        <p class="font-extrabold text-slate-800">{{ t.phoneNumber }}</p>
                      </div>
                    </div>
                  }

                  <!-- Email -->
                  @if (t.email) {
                    <div class="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 bg-slate-50/50 min-w-0">
                      <span class="text-xl">✉️</span>
                      <div class="min-w-0 flex-1">
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Email liên hệ</p>
                        <p class="font-extrabold text-slate-800 truncate" [title]="t.email">{{ t.email }}</p>
                      </div>
                    </div>
                  }

                  <!-- Cấp lớp dạy -->
                  @if (t.teachingLevels?.length) {
                    <div class="flex flex-col gap-1 p-3 rounded-xl border-2 border-slate-100 bg-slate-50/50 sm:col-span-2">
                      <div class="flex items-center gap-3">
                        <span class="text-xl">🏫</span>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Cấp lớp giảng dạy</p>
                      </div>
                      <div class="flex flex-wrap gap-1.5 mt-2">
                        @for (level of t.teachingLevels; track level) {
                          <span class="bg-blue-50 text-duo-blue px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-100">
                            {{ getEducationLevel(level) }}
                          </span>
                        }
                      </div>
                    </div>
                  }

                  <!-- CV đính kèm -->
                  @if (t.cvUrl) {
                    <div class="flex items-center justify-between p-3 rounded-xl border-2 border-slate-100 bg-slate-50/50 sm:col-span-2">
                      <div class="flex items-center gap-3">
                        <span class="text-xl">📄</span>
                        <div>
                          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Hồ sơ năng lực (CV)</p>
                          <p class="text-xs text-slate-500 font-semibold">Tài liệu minh chứng bằng cấp & năng lực</p>
                        </div>
                      </div>
                      <a [href]="t.cvUrl" target="_blank"
                         class="tactile-button-blue px-4 py-2 rounded-xl text-xs font-extrabold uppercase">
                        Xem hồ sơ
                      </a>
                    </div>
                  }
                </div>
              </div>

              <!-- Subjects Card -->
              <div class="tactile-card p-6">
                <h2 class="font-extrabold text-lg text-slate-900 mb-3">Môn giảng dạy</h2>
                <div class="flex flex-wrap gap-2">
                  @for (subject of t.subjects ?? []; track subject.subjectId) {
                    <span
                      class="bg-blue-50 text-duo-blue px-3 py-1.5 rounded-xl text-sm font-bold border border-blue-100"
                    >
                      {{ subject.subjectName }}
                    </span>
                  }
                  @if (!t.subjects?.length) {
                    <span class="text-sm text-slate-500">Chưa cập nhật môn học.</span>
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
                        <span class="text-xs text-amber-600 font-bold">★ {{ review.rating }}</span>
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
            <div class="space-y-4">
              <div class="tactile-card p-6 sticky top-24">
                <div class="text-center mb-4">
                  <p class="text-sm text-slate-500 font-bold">Học phí tham khảo / giờ</p>
                  <p class="font-display text-3xl font-black text-duo-green mt-1">
                    {{ formatPrice(t.hourlyRate) }}
                  </p>
                </div>

                <a
                  routerLink="/auth/login"
                  [queryParams]="{ returnUrl: '/student/tutor/' + t.id }"
                  class="tactile-button-green w-full py-3 rounded-2xl text-base font-extrabold uppercase text-center block mb-2"
                >
                  Đăng nhập để đặt lịch
                </a>
                <a
                  routerLink="/auth/login"
                  [queryParams]="{ returnUrl: '/student/tutor/' + t.id }"
                  class="tactile-button-gray w-full py-2.5 rounded-2xl text-sm font-bold text-center block"
                >
                  Đăng nhập để nhắn tin
                </a>

                <div class="mt-4 p-4 bg-amber-50 rounded-2xl border-2 border-amber-100 text-center">
                  <p class="text-xs font-bold text-amber-800 leading-relaxed">
                    💡 Bạn cần đăng nhập bằng tài khoản học viên để trò chuyện hoặc đặt lịch học
                    trực tiếp với gia sư này.
                  </p>
                </div>
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
    </div>
  `,
})
export class PublicTutorDetailPage implements OnInit {
  tutor = signal<TutorDetailDto | null>(null);
  reviews = signal<ReviewDto[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  private readonly route = inject(ActivatedRoute);
  private readonly tutorsApi = inject(TutorsService);
  private readonly reviewsApi = inject(ReviewsService);

  ngOnInit(): void {
    void this.loadTutor();
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
    const tutorId = Number(this.route.snapshot.paramMap.get('id'));
    if (!tutorId) {
      this.errorMessage.set('Mã gia sư không hợp lệ.');
      return;
    }

    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.tutorsApi.getTutorById(tutorId));
      const tutor = unwrapApiData(response);
      this.tutor.set(tutor);

      const reviewsResponse = await firstValueFrom(this.reviewsApi.getReviewsByTutorId(tutorId));
      this.reviews.set(reviewsResponse.data ?? []);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được hồ sơ gia sư.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
