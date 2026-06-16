import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { StudentDetailModalComponent } from '../../../shared/components/student-detail-modal';
import { TutorDetailModalComponent } from '../../../shared/components/tutor-detail-modal';

import {
  CancellationRequestDto,
  CancellationRequestStatus,
  ClassCompletionRequestDto,
  ClassCompletionRequestStatus,
  ClassDto,
  ClassStatus,
  PaymentStatus,
  ReviewEligibilityDto,
  ReviewDto,
} from '../../../api/generated/client/models';
import {
  CancellationRequestsService,
  ClassCompletionRequestsService,
  ClassesService,
  ReviewsService,
} from '../../../api/generated/client/services';
import { SessionService } from '../../../core/auth/session';
import { getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import {
  cancellationStatusClass,
  cancellationStatusLabel,
  classCompletionStatusClass,
  classCompletionStatusLabel,
  classStatusClass,
  classStatusLabel,
  formatDate,
  formatDateTime,
  formatMoney,
  formatTimeSlots,
  paymentStatusClass,
  paymentStatusLabel,
  userRoleLabel,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-student-class-detail-page',
  imports: [FormsModule, StudentDetailModalComponent, TutorDetailModalComponent],
  template: `
    @if (classItem(); as item) {
      <div class="max-w-3xl mx-auto space-y-6">
        <a href="javascript:void(0)" (click)="goBack($event)" class="text-sm font-bold text-slate-500 hover:text-slate-800"
          >← Quay lại</a
        >

        <div class="tactile-card p-6 space-y-5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 class="font-display text-2xl font-black text-slate-900">
                {{ item.subjectName || item.code }}
              </h1>
              <p class="text-sm text-slate-500 mt-1">Mã lớp: {{ item.code }}</p>
            </div>
            <div class="flex flex-col sm:items-end gap-2">
              <span
                [class]="statusBadgeClass(item.status)"
                class="rounded-full px-3 py-1 text-xs font-black w-fit"
              >
                {{ label(item.status) }}
              </span>
              @if (canCreateCompletionRequest(item)) {
                <button
                  (click)="submitCompletionRequest(item.id)"
                  [disabled]="isSubmittingCompletion()"
                  class="tactile-button-green py-2 px-4 rounded-xl text-xs font-extrabold uppercase disabled:opacity-50 w-full sm:w-auto mt-1"
                >
                  {{ isSubmittingCompletion() ? 'Đang gửi...' : 'Đánh dấu lớp đã hoàn thành' }}
                </button>
                @if (completionErrorMessage() && !completionRequest()) {
                  <p class="text-xs font-bold text-red-500">{{ completionErrorMessage() }}</p>
                }
                @if (completionSuccessMessage() && !completionRequest()) {
                  <p class="text-xs font-bold text-duo-green">{{ completionSuccessMessage() }}</p>
                }
              }
            </div>
          </div>

          <div class="grid sm:grid-cols-2 gap-4 text-sm">
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="font-bold text-slate-500">{{ isTutor() ? 'Học viên' : 'Gia sư' }}</p>
              <div class="flex items-center gap-2 mt-1">
                <p class="font-extrabold text-slate-900">
                  {{
                    isTutor()
                      ? item.studentName || 'Đang cập nhật'
                      : item.tutorName || 'Đang cập nhật'
                  }}
                </p>
                @if (isTutor() && item.studentId) {
                  <button
                    (click)="openStudentDetail(item.studentId)"
                    class="text-xs font-extrabold text-duo-blue hover:text-duo-blue-dark hover:underline cursor-pointer"
                  >
                    (Xem chi tiết)
                  </button>
                }
                @if (!isTutor() && item.tutorId) {
                  <button
                    (click)="openTutorDetail(item.tutorId)"
                    class="text-xs font-extrabold text-duo-blue hover:text-duo-blue-dark hover:underline cursor-pointer"
                  >
                    (Xem chi tiết)
                  </button>
                }
              </div>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="font-bold text-slate-500">Ngày bắt đầu</p>
              <p class="mt-1 font-extrabold text-slate-900">{{ date(item.startDate) }}</p>
            </div>
            @if (item.endDate) {
              <div class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p class="font-bold text-emerald-700">Ngày hoàn thành</p>
                <p class="mt-1 font-extrabold text-emerald-900">{{ dateTime(item.endDate) }}</p>
              </div>
            }
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="font-bold text-slate-500">Lịch học</p>
              <p class="mt-1 font-extrabold text-slate-900">{{ slots(item) }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="font-bold text-slate-500">Lịch</p>
              <p class="mt-1 font-extrabold text-slate-900">
                {{ scheduleSourceLabel(item.acceptedScheduleSource) }}
              </p>
            </div>
          </div>
        </div>

        @if (completionRequest(); as req) {
          <div class="tactile-card p-6 space-y-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 class="font-extrabold text-lg text-slate-900">Hoàn thành lớp học</h2>
              </div>
              <span
                [class]="completionBadgeClass(req.status)"
                class="rounded-full px-3 py-1 text-xs font-black"
              >
                {{ completionStatusLabel(req.status) }}
              </span>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-sm">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-extrabold text-slate-900">{{
                  req.requestedByUserName || 'Không rõ'
                }}</span>
                <span
                  class="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-black text-slate-600"
                >
                  {{ reqRoleLabel(req.requestedByRole) }}
                </span>
                <span class="text-slate-500">đã gửi yêu cầu hoàn thành</span>
              </div>

              <div class="grid sm:grid-cols-2 gap-3">
                <div class="rounded-2xl border border-slate-200 bg-white p-3">
                  <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Gửi lúc</p>
                  <p class="mt-1 font-extrabold text-slate-900">{{ dateTime(req.createdAt) }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-white p-3">
                  <p class="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {{
                      req.status === completionStatusEnum.Pending ? 'Trạng thái' : 'Phản hồi lúc'
                    }}
                  </p>
                  <p class="mt-1 font-extrabold text-slate-900">
                    {{
                      req.status === completionStatusEnum.Pending
                        ? completionStatusLabel(req.status)
                        : dateTime(req.respondedAt)
                    }}
                  </p>
                </div>
              </div>

              @if (req.status === completionStatusEnum.Pending && isCompletionRequester(req)) {
                <div
                  class="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 space-y-2 text-sm text-sky-700"
                >
                  <p class="font-bold">
                    Yêu cầu đã được gửi. Bạn đang chờ {{ counterpartLabel() }} xác nhận hoàn thành lớp.
                  </p>
                  <p class="text-xs font-medium bg-sky-100/50 p-2 rounded-xl">
                    ⏱ Nếu {{ counterpartLabel() }} không phản hồi, lớp sẽ tự động hoàn thành vào
                    <span class="font-bold">{{ autoCompleteDeadline(req.createdAt) }}</span>.
                  </p>
                </div>
              }

              @if (req.status === completionStatusEnum.Pending && canRespondCompletion(req)) {
                <div
                  class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 space-y-3"
                >
                  <p class="text-sm font-bold text-emerald-800">
                    {{ req.requestedByUserName || counterpartLabel() }} đã đánh dấu lớp này hoàn
                    thành. Bạn xác nhận theo thực tế?
                  </p>
                  <div class="flex flex-col sm:flex-row gap-3">
                    <button
                      (click)="respondCompletionRequest(req.id, true)"
                      [disabled]="isRespondingCompletion()"
                      class="w-full sm:w-auto tactile-button-green px-5 py-2.5 rounded-xl text-sm font-extrabold uppercase disabled:opacity-50"
                    >
                      {{ isRespondingCompletion() ? 'Đang xử lý...' : 'Xác nhận hoàn thành' }}
                    </button>
                    <button
                      (click)="respondCompletionRequest(req.id, false)"
                      [disabled]="isRespondingCompletion()"
                      class="w-full sm:w-auto rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Chưa hoàn thành
                    </button>
                  </div>
                </div>
              }

              @if (req.status === completionStatusEnum.Confirmed) {
                <div
                  class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                >
                  <p class="font-bold">Hai bên đã xác nhận lớp hoàn thành.</p>
                  @if (item.endDate) {
                    <p class="mt-1 font-medium">Lớp kết thúc lúc {{ dateTime(item.endDate) }}.</p>
                  }
                </div>
              }

              @if (req.status === completionStatusEnum.AutoConfirmed) {
                <div
                  class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                >
                  <p class="font-bold">Hệ thống đã tự động xác nhận hoàn thành do không có phản hồi trong 3 ngày.</p>
                  @if (item.endDate) {
                    <p class="mt-1 font-medium">Lớp kết thúc lúc {{ dateTime(item.endDate) }}.</p>
                  }
                </div>
              }

              @if (req.status === completionStatusEnum.Rejected) {
                <div
                  class="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                >
                  <p class="font-bold">Bên còn lại phản hồi rằng lớp chưa hoàn thành.</p>
                  @if (req.respondedAt) {
                    <p class="mt-1 font-medium">Phản hồi lúc {{ dateTime(req.respondedAt) }}.</p>
                  }
                </div>
              }
            </div>

            @if (completionErrorMessage()) {
              <p class="text-xs font-bold text-red-500">{{ completionErrorMessage() }}</p>
            }
            @if (completionSuccessMessage()) {
              <p class="text-xs font-bold text-duo-green">{{ completionSuccessMessage() }}</p>
            }
          </div>
        }

        <div class="tactile-card p-6 space-y-4">
          <h2 class="font-extrabold text-lg text-slate-900">Thanh toán</h2>
          <div class="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p class="text-slate-500 font-bold">Số tiền</p>
              <p class="font-extrabold text-duo-green">
                {{ money(item.paymentSummary?.amount ?? item.depositAmountSnapshot) }}
              </p>
            </div>
            <div>
              <p class="text-slate-500 font-bold mb-1">Trạng thái</p>
              <span
                [class]="paymentBadgeClass(item.paymentSummary?.status)"
                class="rounded-full px-2.5 py-0.5 text-xs font-black"
              >
                {{ paymentLabel(item.paymentSummary?.status) }}
              </span>
            </div>
            <div>
              <p class="text-slate-500 font-bold">Đã thanh toán lúc</p>
              <p class="font-extrabold text-slate-900">
                {{ dateTime(item.paymentSummary?.paidAt) }}
              </p>
            </div>
          </div>
        </div>

        @if (isLoadingReview()) {
          <div class="tactile-card p-6 text-center text-slate-500 font-bold">
            Đang tải thông tin đánh giá...
          </div>
        } @else {
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
                <div
                  class="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-black text-lg border-b-2 border-amber-300 shrink-0"
                >
                  {{ (rev.studentName || 'H')[0].toUpperCase() }}
                </div>
                <div class="space-y-1.5 flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="font-extrabold text-slate-800 text-sm">
                      {{ rev.studentName || 'Học viên' }}
                    </p>
                    <div class="flex gap-0.5">
                      @for (star of [1, 2, 3, 4, 5]; track star) {
                        <span
                          class="text-sm"
                          [class.text-amber-500]="star <= (rev.rating || 0)"
                          [class.text-slate-200]="star > (rev.rating || 0)"
                        >
                          ★
                        </span>
                      }
                    </div>
                  </div>
                  <p
                    class="text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-2xl border border-slate-100 font-medium"
                  >
                    {{ rev.comment || 'Không có nhận xét chi tiết.' }}
                  </p>
                </div>
              </div>
            </div>
          } @else if (
            !isTutor() && reviewEligibility()?.canReview && !reviewEligibility()?.alreadyReviewed
          ) {
            <div class="tactile-card p-6 space-y-4">
              <h2 class="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <span class="text-duo-green text-xl">★</span> Đánh giá lớp học & Gia sư
              </h2>
              <p class="text-xs text-slate-500 leading-relaxed">
                Chia sẻ ý kiến của bạn sẽ giúp gia sư cải thiện chất lượng giảng dạy và giúp các học
                viên khác tìm kiếm được gia sư phù hợp.
              </p>

              <div class="flex flex-wrap items-center gap-3 py-2">
                <span class="text-sm font-bold text-slate-600">Mức độ hài lòng:</span>
                <div class="flex gap-1">
                  @for (star of [1, 2, 3, 4, 5]; track star) {
                    <button
                      type="button"
                      (click)="reviewRating.set(star)"
                      class="text-3xl focus:outline-none transition-all duration-150 transform hover:scale-110 cursor-pointer active:scale-95"
                      [class.text-amber-500]="star <= reviewRating()"
                      [class.text-slate-200]="star > reviewRating()"
                    >
                      ★
                    </button>
                  }
                </div>
                <span class="text-sm font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
                  {{
                    reviewRating() === 1
                      ? 'Rất tệ 😟'
                      : reviewRating() === 2
                        ? 'Không hài lòng 🙁'
                        : reviewRating() === 3
                          ? 'Bình thường 😐'
                          : reviewRating() === 4
                            ? 'Hài lòng 🙂'
                            : 'Tuyệt vời! 😄'
                  }}
                </span>
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1"
                  >Nhận xét chi tiết</label
                >
                <textarea
                  [(ngModel)]="reviewComment"
                  rows="3"
                  placeholder="Nhập cảm nhận của bạn về buổi học, gia sư..."
                  class="tactile-input w-full px-3 py-2 text-sm outline-none"
                ></textarea>
              </div>

              @if (reviewErrorMessage()) {
                <p class="text-xs font-bold text-red-500">{{ reviewErrorMessage() }}</p>
              }
              @if (reviewSuccessMessage()) {
                <p class="text-xs font-bold text-duo-green">{{ reviewSuccessMessage() }}</p>
              }

              <div class="flex justify-end mt-2">
                <button
                  (click)="submitReview(item.id!)"
                  [disabled]="isSubmittingReview()"
                  class="w-full sm:w-auto tactile-button-green py-2.5 px-6 rounded-xl text-sm font-extrabold uppercase disabled:opacity-50"
                >
                  {{ isSubmittingReview() ? 'Đang gửi...' : 'Gửi đánh giá' }}
                </button>
              </div>
            </div>
          }
        }

        @if (cancellationRequest(); as req) {
          <div class="tactile-card p-6 space-y-4 border-2 border-orange-100 bg-orange-50/5">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 class="font-extrabold text-lg text-slate-900">Yêu cầu hủy lớp</h2>
              <span
                [class]="reqBadgeClass(req.status)"
                class="rounded-full px-3 py-1 text-xs font-black"
              >
                {{ reqStatusLabel(req.status) }}
              </span>
            </div>

            <div class="space-y-3 text-sm">
              <p class="text-slate-600">
                <span class="font-bold text-slate-700">Người yêu cầu:</span>
                {{ req.requestedByUserName || 'Không rõ' }}
                <span class="ml-1 text-xs rounded bg-slate-100 px-2 py-0.5 text-slate-600">{{
                  reqRoleLabel(req.requestedByRole)
                }}</span>
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
              <button
                (click)="showCancelForm.set(true)"
                class="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-extrabold px-6 py-3 rounded-xl border-b-4 border-red-700 hover:opacity-95 transition-all text-sm"
              >
                Yêu cầu hủy lớp học
              </button>
            </div>
          } @else {
            <div class="tactile-card p-6 space-y-4 border-2 border-red-200 bg-red-50/10">
              <h3 class="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <span class="text-red-500">⚠</span> Xác nhận yêu cầu hủy lớp
              </h3>

              <p class="text-xs text-slate-500 leading-relaxed">
                Lưu ý: Yêu cầu hủy lớp của bạn sẽ được gửi tới Admin để xác minh lý do và phê duyệt
                hoàn trả tiền đặt cọc theo chính sách của EduMatch.
              </p>

              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1"
                  >Lý do hủy lớp <span class="text-red-500">*</span></label
                >
                <textarea
                  [(ngModel)]="cancelReason"
                  rows="3"
                  placeholder="Vui lòng nhập rõ lý do hủy lớp để Admin phê duyệt..."
                  class="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-red-500 outline-none"
                ></textarea>
              </div>

              @if (cancelErrorMessage()) {
                <p class="text-xs font-bold text-red-500">{{ cancelErrorMessage() }}</p>
              }

              <div class="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  (click)="
                    showCancelForm.set(false); cancelReason.set(''); cancelErrorMessage.set('')
                  "
                  [disabled]="isSubmittingCancel()"
                  class="w-full sm:w-auto bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl text-sm transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  (click)="submitCancellation(item.id!)"
                  [disabled]="isSubmittingCancel() || !cancelReason().trim()"
                  class="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-extrabold px-5 py-2 rounded-xl border-b-4 border-red-700 hover:opacity-95 disabled:opacity-50 transition-all text-sm"
                >
                  {{ isSubmittingCancel() ? 'Đang gửi...' : 'Gửi yêu cầu' }}
                </button>
              </div>
            </div>
          }
        }

        @if (errorMessage()) {
          <p
            class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red"
          >
            {{ errorMessage() }}
          </p>
        }

        @if (selectedStudentId()) {
          <app-student-detail-modal
            [userId]="selectedStudentId()"
            (close)="selectedStudentId.set(null)"
          />
        }

        @if (selectedTutorId()) {
          <app-tutor-detail-modal
            [tutorId]="selectedTutorId()"
            (close)="selectedTutorId.set(null)"
          />
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
  completionRequest = signal<ClassCompletionRequestDto | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');

  showCancelForm = signal(false);
  cancelReason = signal('');
  cancelErrorMessage = signal('');
  isSubmittingCancel = signal(false);

  reviewEligibility = signal<ReviewEligibilityDto | null>(null);
  existingReview = signal<ReviewDto | null>(null);
  isLoadingReview = signal(false);

  reviewRating = signal<number>(5);
  reviewComment = signal('');
  isSubmittingReview = signal(false);
  reviewErrorMessage = signal('');
  reviewSuccessMessage = signal('');

  isSubmittingCompletion = signal(false);
  isRespondingCompletion = signal(false);
  completionErrorMessage = signal('');
  completionSuccessMessage = signal('');

  private readonly route = inject(ActivatedRoute);
  private readonly classesApi = inject(ClassesService);
  private readonly cancellationApi = inject(CancellationRequestsService);
  private readonly classCompletionApi = inject(ClassCompletionRequestsService);
  private readonly sessionService = inject(SessionService);
  private readonly reviewsApi = inject(ReviewsService);
  private readonly location = inject(Location);

  goBack(event: Event): void {
    event.preventDefault();
    this.location.back();
  }

  backLink = computed(() =>
    this.sessionService.role() === 'Tutor' ? '/tutor/classes' : '/student/classes',
  );
  isTutor = computed(() => this.sessionService.role() === 'Tutor');
  currentUserId = computed(() => this.sessionService.user()?.id ?? null);
  selectedStudentId = signal<number | null>(null);
  selectedTutorId = signal<number | null>(null);
  statusEnum = ClassStatus;
  completionStatusEnum = ClassCompletionRequestStatus;

  ngOnInit(): void {
    void this.loadClass();
  }

  openStudentDetail(studentId: number): void {
    this.selectedStudentId.set(studentId);
  }

  openTutorDetail(tutorId: number): void {
    this.selectedTutorId.set(tutorId);
  }

  label = classStatusLabel;
  paymentLabel = paymentStatusLabel;
  reqStatusLabel = cancellationStatusLabel;
  reqRoleLabel = userRoleLabel;
  completionStatusLabel = classCompletionStatusLabel;

  scheduleSourceLabel(src?: string | null): string {
    if (src === 'R1') return 'Học viên đề xuất';
    if (src === 'R2') return 'Gia sư đề xuất';
    return 'Chưa rõ';
  }

  date(value?: Date | string | null): string {
    return formatDate(value);
  }

  dateTime(value?: Date | string | null): string {
    return formatDateTime(value);
  }

  autoCompleteDeadline(createdAt?: Date | string | null): string {
    if (!createdAt) return '';
    const date = new Date(createdAt);
    date.setDate(date.getDate() + 3);
    return formatDateTime(date);
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

  completionBadgeClass(status?: ClassCompletionRequestStatus | null): string {
    return classCompletionStatusClass(status);
  }

  counterpartLabel(): string {
    return this.isTutor() ? 'học viên' : 'gia sư';
  }

  isCompletionRequester(request?: ClassCompletionRequestDto | null): boolean {
    return Boolean(
      request?.requestedByUserId && request.requestedByUserId === this.currentUserId(),
    );
  }

  canRespondCompletion(request?: ClassCompletionRequestDto | null): boolean {
    return (
      request?.status === ClassCompletionRequestStatus.Pending &&
      !this.isCompletionRequester(request)
    );
  }

  canCreateCompletionRequest(item: ClassDto): boolean {
    if (item.status !== ClassStatus.Active) {
      return false;
    }

    const latestRequest = this.completionRequest();
    return !latestRequest || latestRequest.status !== ClassCompletionRequestStatus.Pending;
  }

  private async loadClass(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage.set('Mã lớp không hợp lệ.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(this.classesApi.getClassById(id));
      const classData = unwrapApiData(response);
      this.classItem.set(classData);
      if (classData?.id) {
        await this.loadCancellationRequest(classData.id);
        await this.loadCompletionRequest(classData.id);
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

    if (isStudent) {
      try {
        const eligibilityRes = await firstValueFrom(
          this.classesApi.getClassReviewEligibility(classData.id),
        );
        this.reviewEligibility.set(eligibilityRes.data ?? null);
      } catch (error) {
        console.error('Failed to fetch review eligibility:', error);
        this.reviewEligibility.set(null);
      }
    }

    if (classData.tutorId) {
      this.isLoadingReview.set(true);
      try {
        const reviewsResponse = await firstValueFrom(
          this.reviewsApi.getReviewsByTutorId(classData.tutorId),
        );
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
        }),
      );
      this.reviewSuccessMessage.set('Cảm ơn bạn đã gửi đánh giá thành công!');
      this.reviewComment.set('');
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

  private async loadCompletionRequest(classId: number): Promise<void> {
    try {
      const response = await firstValueFrom(this.classesApi.getClassCompletionRequest(classId));
      this.completionRequest.set(response.data ?? null);
    } catch (error) {
      this.completionRequest.set(null);
    }
  }

  async submitCompletionRequest(classId?: number): Promise<void> {
    if (!classId) {
      return;
    }

    this.isSubmittingCompletion.set(true);
    this.completionErrorMessage.set('');
    this.completionSuccessMessage.set('');
    try {
      await firstValueFrom(
        this.classCompletionApi.createClassCompletionRequest({
          classId,
        }),
      );
      this.completionSuccessMessage.set('Đã gửi yêu cầu xác nhận hoàn thành lớp.');
      await this.loadClass();
    } catch (error) {
      this.completionErrorMessage.set(
        getApiErrorMessage(error, 'Không gửi được yêu cầu hoàn thành.'),
      );
    } finally {
      this.isSubmittingCompletion.set(false);
    }
  }

  async respondCompletionRequest(requestId?: number, isConfirmed = false): Promise<void> {
    if (!requestId) {
      return;
    }

    this.isRespondingCompletion.set(true);
    this.completionErrorMessage.set('');
    this.completionSuccessMessage.set('');
    try {
      await firstValueFrom(
        this.classCompletionApi.respondClassCompletionRequest(requestId, {
          isConfirmed,
        }),
      );
      this.completionSuccessMessage.set(
        isConfirmed
          ? 'Bạn đã xác nhận lớp hoàn thành.'
          : 'Bạn đã phản hồi rằng lớp chưa hoàn thành.',
      );
      await this.loadClass();
    } catch (error) {
      this.completionErrorMessage.set(
        getApiErrorMessage(error, 'Không xử lý được yêu cầu hoàn thành.'),
      );
    } finally {
      this.isRespondingCompletion.set(false);
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
        }),
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
