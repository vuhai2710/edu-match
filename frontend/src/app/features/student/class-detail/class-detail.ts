import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { StudentDetailModalComponent } from '../../../shared/components/student-detail-modal';

import { CancellationRequestDto, ClassDto, ClassStatus, CancellationRequestStatus, PaymentStatus, ReviewEligibilityDto, ReviewDto } from '../../../api/generated/client/models';
import { ClassesService, CancellationRequestsService, ReviewsService } from '../../../api/generated/client/services';
import { SessionService } from '../../../core/auth/session';
import { getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import {
  classStatusLabel,
  classStatusClass,
  cancellationStatusLabel,
  cancellationStatusClass,
  userRoleLabel,
  formatDate,
  formatDateTime,
  formatMoney,
  formatTimeSlots,
  paymentStatusLabel,
  paymentStatusClass,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-student-class-detail-page',
  imports: [RouterLink, FormsModule, StudentDetailModalComponent],
  template: `
    @if (classItem(); as item) {
      <div class="max-w-3xl mx-auto space-y-6">
        <a [routerLink]="backLink()" class="text-sm font-bold text-slate-500 hover:text-slate-800">← Quay lại</a>

        <div class="tactile-card p-6 space-y-5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 class="font-display text-2xl font-black text-slate-900">{{ item.subjectName || item.code }}</h1>
              <p class="text-sm text-slate-500 mt-1">Mã lớp: {{ item.code }}</p>
            </div>
            <span [class]="statusBadgeClass(item.status)" class="rounded-full px-3 py-1 text-xs font-black">
              {{ label(item.status) }}
            </span>
          </div>

          <div class="grid sm:grid-cols-2 gap-4 text-sm">
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="font-bold text-slate-500">{{ isTutor() ? 'Học viên' : 'Gia sư' }}</p>
              <div class="flex items-center gap-2 mt-1">
                <p class="font-extrabold text-slate-900">
                  {{ isTutor() ? (item.studentName || 'Đang cập nhật') : (item.tutorName || 'Đang cập nhật') }}
                </p>
                @if (isTutor() && item.studentId) {
                  <button (click)="openStudentDetail(item.studentId)" 
                          class="text-xs font-extrabold text-duo-blue hover:text-duo-blue-dark hover:underline">
                    (Xem chi tiết)
                  </button>
                }
              </div>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="font-bold text-slate-500">Ngày bắt đầu</p>
              <p class="mt-1 font-extrabold text-slate-900">{{ date(item.startDate) }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="font-bold text-slate-500">Lịch học</p>
              <p class="mt-1 font-extrabold text-slate-900">{{ slots(item) }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="font-bold text-slate-500">Nguồn lịch</p>
              <p class="mt-1 font-extrabold text-slate-900">{{ scheduleSourceLabel(item.acceptedScheduleSource) }}</p>
            </div>
          </div>
        </div>

        <div class="tactile-card p-6 space-y-4">
          <h2 class="font-extrabold text-lg text-slate-900">Thanh toán</h2>
          <div class="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p class="text-slate-500 font-bold">Số tiền</p>
              <p class="font-extrabold text-duo-green">{{ money(item.paymentSummary?.amount ?? item.depositAmountSnapshot) }}</p>
            </div>
            <div>
              <p class="text-slate-500 font-bold mb-1">Trạng thái</p>
              <span [class]="paymentBadgeClass(item.paymentSummary?.status)" class="rounded-full px-2.5 py-0.5 text-xs font-black">
                {{ paymentLabel(item.paymentSummary?.status) }}
              </span>
            </div>
            <div>
              <p class="text-slate-500 font-bold">Đã thanh toán lúc</p>
              <p class="font-extrabold text-slate-900">{{ dateTime(item.paymentSummary?.paidAt) }}</p>
            </div>
          </div>
        </div>

        <!-- Đánh giá lớp học (Reviews & Ratings) -->
        @if (isLoadingReview()) {
          <div class="tactile-card p-6 text-center text-slate-500 font-bold">
            Đang tải thông tin đánh giá...
          </div>
        } @else {
          <!-- 1. Hiển thị đánh giá đã có -->
          @if (existingReview(); as rev) {
            <div class="tactile-card p-6 space-y-4">
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 class="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <span class="text-amber-500 text-xl">★</span> Đánh giá từ học viên
                </h2>
                <span class="text-xs font-semibold text-slate-400">
                  {{ dateTime(rev.createdAt) }}
                </span>
              </div>
              
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-black text-lg border-b-2 border-amber-300 shrink-0">
                  {{ (rev.studentName || 'H')[0].toUpperCase() }}
                </div>
                <div class="space-y-1.5 flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="font-extrabold text-slate-800 text-sm">
                      {{ rev.studentName || 'Học viên' }}
                    </p>
                    <div class="flex gap-0.5">
                      @for (star of [1, 2, 3, 4, 5]; track star) {
                        <span class="text-sm" 
                              [class.text-amber-500]="star <= (rev.rating || 0)"
                              [class.text-slate-200]="star > (rev.rating || 0)">
                          ★
                        </span>
                      }
                    </div>
                  </div>
                  <p class="text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-2xl border border-slate-100 font-medium">
                    {{ rev.comment || 'Không có nhận xét chi tiết.' }}
                  </p>
                </div>
              </div>
            </div>
          } @else if (!isTutor() && reviewEligibility()?.canReview && !reviewEligibility()?.alreadyReviewed) {
            <!-- 2. Form gửi đánh giá cho Học viên -->
            <div class="tactile-card p-6 space-y-4">
              <h2 class="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <span class="text-duo-green text-xl">★</span> Đánh giá lớp học & Gia sư
              </h2>
              <p class="text-xs text-slate-500 leading-relaxed">
                Chia sẻ ý kiến của bạn sẽ giúp gia sư cải thiện chất lượng giảng dạy và giúp các học viên khác tìm kiếm được gia sư phù hợp.
              </p>

              <!-- Star selector -->
              <div class="flex flex-wrap items-center gap-3 py-2">
                <span class="text-sm font-bold text-slate-600">Mức độ hài lòng:</span>
                <div class="flex gap-1">
                  @for (star of [1, 2, 3, 4, 5]; track star) {
                    <button type="button" 
                            (click)="reviewRating.set(star)"
                            class="text-3xl focus:outline-none transition-all duration-150 transform hover:scale-110 cursor-pointer active:scale-95"
                            [class.text-amber-500]="star <= reviewRating()"
                            [class.text-slate-200]="star > reviewRating()">
                      ★
                    </button>
                  }
                </div>
                <span class="text-sm font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
                  {{ reviewRating() === 1 ? 'Rất tệ 😟' : reviewRating() === 2 ? 'Không hài lòng 🙁' : reviewRating() === 3 ? 'Bình thường 😐' : reviewRating() === 4 ? 'Hài lòng 🙂' : 'Tuyệt vời! 😄' }}
                </span>
              </div>

              <!-- Comment -->
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1">Nhận xét chi tiết (Không bắt buộc)</label>
                <textarea [(ngModel)]="reviewComment" rows="3"
                          placeholder="Nhập cảm nhận của bạn về buổi học, gia sư..."
                          class="tactile-input w-full px-3 py-2 text-sm outline-none"></textarea>
              </div>

              @if (reviewErrorMessage()) {
                <p class="text-xs font-bold text-red-500">{{ reviewErrorMessage() }}</p>
              }
              @if (reviewSuccessMessage()) {
                <p class="text-xs font-bold text-duo-green">{{ reviewSuccessMessage() }}</p>
              }

              <div class="flex justify-end mt-2">
                <button (click)="submitReview(item.id!)"
                        [disabled]="isSubmittingReview()"
                        class="w-full sm:w-auto tactile-button-green py-2.5 px-6 rounded-xl text-sm font-extrabold uppercase disabled:opacity-50">
                  {{ isSubmittingReview() ? 'Đang gửi...' : 'Gửi đánh giá' }}
                </button>
              </div>
            </div>
          }
        }

        <!-- Hủy lớp UI / UX -->
        @if (cancellationRequest(); as req) {
          <div class="tactile-card p-6 space-y-4 border-2 border-orange-100 bg-orange-50/5">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 class="font-extrabold text-lg text-slate-900">Yêu cầu hủy lớp</h2>
              <span [class]="reqBadgeClass(req.status)" class="rounded-full px-3 py-1 text-xs font-black">
                {{ reqStatusLabel(req.status) }}
              </span>
            </div>

            <div class="space-y-3 text-sm">
              <p class="text-slate-600">
                <span class="font-bold text-slate-700">Người yêu cầu:</span>
                {{ req.requestedByUserName || 'Không rõ' }} 
                <span class="ml-1 text-xs rounded bg-slate-100 px-2 py-0.5 text-slate-600">{{ reqRoleLabel(req.requestedByRole) }}</span>
              </p>
              <p class="text-slate-600">
                <span class="font-bold text-slate-700">Lý do:</span>
                {{ req.reason || 'Không có lý do.' }}
              </p>
              <p class="text-slate-600">
                <span class="font-bold text-slate-700">Ngày yêu cầu:</span>
                {{ dateTime(req.createdAt) }}
              </p>

              @if (req.status === 'Resolved') {
                <div class="mt-4 p-4 rounded-2xl bg-green-50 border border-green-200 space-y-2">
                  <p class="font-bold text-duo-green text-sm">✓ Yêu cầu hủy đã được Admin xử lý</p>
                  <p class="text-xs text-slate-600">
                    <span class="font-bold text-slate-700">Số tiền hoàn cọc:</span>
                    <span class="font-extrabold text-duo-green">{{ money(req.refundAmount) }}</span>
                  </p>
                  @if (req.refundNote) {
                    <p class="text-xs text-slate-600 font-medium">
                      <span class="font-bold text-slate-700">Ghi chú hoàn cọc:</span>
                      {{ req.refundNote }}
                    </p>
                  }
                  @if (req.resolvedAt) {
                    <p class="text-xs text-slate-500">
                      <span class="font-bold text-slate-600">Thời gian xử lý:</span>
                      {{ dateTime(req.resolvedAt) }}
                    </p>
                  }
                </div>
              } @else {
                <div class="mt-4 p-4 rounded-2xl bg-orange-50 border border-orange-100">
                  <p class="font-bold text-duo-orange text-sm flex items-center gap-1.5">
                    <span>⚠</span> Đang chờ Quản trị viên duyệt và hoàn tiền cọc.
                  </p>
                </div>
              }
            </div>
          </div>
        } @else if (item.status === 'PendingStart') {
          @if (!showCancelForm()) {
            <div class="flex justify-end mt-4">
              <button (click)="showCancelForm.set(true)"
                      class="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-extrabold px-6 py-3 rounded-xl border-b-4 border-red-700 hover:opacity-95 transition-all text-sm">
                Yêu cầu hủy lớp học
              </button>
            </div>
          } @else {
            <div class="tactile-card p-6 space-y-4 border-2 border-red-200 bg-red-50/10">
              <h3 class="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <span class="text-red-500">⚠</span> Xác nhận yêu cầu hủy lớp
              </h3>
              
              <p class="text-xs text-slate-500 leading-relaxed">
                Lưu ý: Yêu cầu hủy lớp của bạn sẽ được gửi tới Admin để xác minh lý do và phê duyệt hoàn trả tiền đặt cọc theo chính sách của EduMatch.
              </p>
 
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1">Lý do hủy lớp <span class="text-red-500">*</span></label>
                <textarea [(ngModel)]="cancelReason" rows="3"
                          placeholder="Vui lòng nhập rõ lý do hủy lớp để Admin phê duyệt..."
                          class="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-red-500 outline-none"></textarea>
              </div>
 
              @if (cancelErrorMessage()) {
                <p class="text-xs font-bold text-red-500">{{ cancelErrorMessage() }}</p>
              }
 
              <div class="flex flex-col sm:flex-row justify-end gap-3">
                <button (click)="showCancelForm.set(false); cancelReason.set(''); cancelErrorMessage.set('')"
                        [disabled]="isSubmittingCancel()"
                        class="w-full sm:w-auto bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl text-sm transition-colors">
                  Hủy bỏ
                </button>
                <button (click)="submitCancellation(item.id!)"
                        [disabled]="isSubmittingCancel() || !cancelReason().trim()"
                        class="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-extrabold px-5 py-2 rounded-xl border-b-4 border-red-700 hover:opacity-95 disabled:opacity-50 transition-all text-sm">
                  {{ isSubmittingCancel() ? 'Đang gửi...' : 'Gửi yêu cầu' }}
                </button>
              </div>
            </div>
          }
        }

        @if (errorMessage()) {
          <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">{{ errorMessage() }}</p>
        }

        <!-- Student Detail Modal overlay -->
        @if (selectedStudentId()) {
          <app-student-detail-modal [studentId]="selectedStudentId()" (close)="selectedStudentId.set(null)" />
        }
      </div>
    } @else if (isLoading()) {
      <div class="tactile-card p-8 text-center font-bold text-slate-500">Đang tải lớp học...</div>
    }
  `,
})
export class StudentClassDetailPage implements OnInit {
  classItem = signal<ClassDto | null>(null);
  cancellationRequest = signal<CancellationRequestDto | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');

  showCancelForm = signal(false);
  cancelReason = signal('');
  cancelErrorMessage = signal('');
  isSubmittingCancel = signal(false);

  // Review & Rating States
  reviewEligibility = signal<ReviewEligibilityDto | null>(null);
  existingReview = signal<ReviewDto | null>(null);
  isLoadingReview = signal(false);

  // Review Form Inputs
  reviewRating = signal<number>(5);
  reviewComment = signal('');
  isSubmittingReview = signal(false);
  reviewErrorMessage = signal('');
  reviewSuccessMessage = signal('');

  private readonly route = inject(ActivatedRoute);
  private readonly classesApi = inject(ClassesService);
  private readonly cancellationApi = inject(CancellationRequestsService);
  private readonly sessionService = inject(SessionService);
  private readonly reviewsApi = inject(ReviewsService);

  backLink = computed(() => this.sessionService.role() === 'Tutor' ? '/tutor/classes' : '/student/classes');
  isTutor = computed(() => this.sessionService.role() === 'Tutor');
  selectedStudentId = signal<number | null>(null);

  openStudentDetail(studentId: number): void {
    this.selectedStudentId.set(studentId);
  }

  scheduleSourceLabel(src?: string | null): string {
    if (src === 'R1') return 'Học viên đề xuất';
    if (src === 'R2') return 'Gia sư đề xuất';
    return 'Chưa rõ';
  }

  ngOnInit(): void {
    void this.loadClass();
  }

  label = classStatusLabel;
  paymentLabel = paymentStatusLabel;
  reqStatusLabel = cancellationStatusLabel;
  reqRoleLabel = userRoleLabel;

  date(value?: Date | null): string {
    return formatDate(value);
  }

  dateTime(value?: Date | null): string {
    return formatDateTime(value);
  }

  slots(item: ClassDto): string {
    return formatTimeSlots(item.timeSlots);
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  statusBadgeClass(status?: ClassStatus | null): string {
    return classStatusClass(status);
  }

  reqBadgeClass(status?: CancellationRequestStatus | null): string {
    return cancellationStatusClass(status);
  }

  paymentBadgeClass(status?: PaymentStatus | null): string {
    return paymentStatusClass(status);
  }

  private async loadClass(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage.set('Mã lớp không hợp lệ.');
      return;
    }

    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.classesApi.getClassById(id));
      const classData = unwrapApiData(response);
      this.classItem.set(classData);
      if (classData?.id) {
        await this.loadCancellationRequest(classData.id);
        await this.loadReviewLogic(classData);
      }
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được lớp học.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadReviewLogic(classData: ClassDto): Promise<void> {
    if (!classData.id) return;

    const isStudent = this.sessionService.role() === 'Student';

    // 1. Fetch review eligibility if the user is a student
    if (isStudent) {
      try {
        const eligibilityRes = await firstValueFrom(this.classesApi.getClassReviewEligibility(classData.id));
        this.reviewEligibility.set(eligibilityRes.data ?? null);
      } catch (error) {
        console.error('Failed to fetch review eligibility:', error);
        this.reviewEligibility.set(null);
      }
    }

    // 2. Fetch existing review if we have a tutorId
    if (classData.tutorId) {
      this.isLoadingReview.set(true);
      try {
        const reviewsResponse = await firstValueFrom(this.reviewsApi.getReviewsByTutorId(classData.tutorId));
        const allReviews = reviewsResponse.data ?? [];
        const match = allReviews.find((r) => r.classId === classData.id);
        this.existingReview.set(match ?? null);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        this.existingReview.set(null);
      } finally {
        this.isLoadingReview.set(false);
      }
    }
  }

  async submitReview(classId?: number): Promise<void> {
    if (!classId) return;
    const rating = this.reviewRating();
    const comment = this.reviewComment().trim();

    if (rating < 1 || rating > 5) {
      this.reviewErrorMessage.set('Đánh giá phải từ 1 đến 5 sao.');
      return;
    }

    this.isSubmittingReview.set(true);
    this.reviewErrorMessage.set('');
    this.reviewSuccessMessage.set('');
    try {
      await firstValueFrom(
        this.reviewsApi.createReview({
          classId,
          rating,
          comment: comment || undefined,
        })
      );
      this.reviewSuccessMessage.set('Cảm ơn bạn đã gửi đánh giá thành công!');
      this.reviewComment.set('');
      // Reload class and review details to transition states
      await this.loadClass();
    } catch (error) {
      this.reviewErrorMessage.set(getApiErrorMessage(error, 'Không gửi được đánh giá.'));
    } finally {
      this.isSubmittingReview.set(false);
    }
  }

  private async loadCancellationRequest(classId: number): Promise<void> {
    try {
      const response = await firstValueFrom(this.classesApi.getClassCancellationRequest(classId));
      this.cancellationRequest.set(response.data ?? null);
    } catch (error) {
      this.cancellationRequest.set(null);
    }
  }

  async submitCancellation(classId?: number): Promise<void> {
    if (!classId) return;
    const reason = this.cancelReason().trim();
    if (!reason) {
      this.cancelErrorMessage.set('Lý do hủy lớp là bắt buộc.');
      return;
    }

    this.isSubmittingCancel.set(true);
    this.cancelErrorMessage.set('');
    try {
      await firstValueFrom(
        this.cancellationApi.createCancellationRequest({
          classId,
          reason,
        })
      );
      this.showCancelForm.set(false);
      this.cancelReason.set('');
      await this.loadClass();
    } catch (error) {
      this.cancelErrorMessage.set(getApiErrorMessage(error, 'Không gửi được yêu cầu hủy lớp.'));
    } finally {
      this.isSubmittingCancel.set(false);
    }
  }
}
