import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import {
  AcceptedScheduleSource,
  ClassCompletionRequestDto,
  ClassDto,
  ClassStatus,
  ReviewDto,
} from '../../../api/generated/client/models';
import { AdminService, ClassesService, ReviewsService, CancellationRequestsService } from '../../../api/generated/client/services';
import { ApiErrorDetails, getApiErrorDetails, getApiErrorMessage } from '../../../core/http/api-error';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner';
import { StudentDetailModalComponent } from '../../../shared/components/student-detail-modal';
import { TutorDetailModalComponent } from '../../../shared/components/tutor-detail-modal';
import {
  classCompletionStatusClass,
  classCompletionStatusLabel,
  classStatusLabel,
  classStatusClass,
  formatDate,
  formatDateTime,
  formatMoney,
  formatTimeSlots,
  paymentStatusLabel,
  paymentStatusClass,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-admin-class-detail-page',
  imports: [
    ErrorBannerComponent,
    RouterLink,
    StudentDetailModalComponent,
    TutorDetailModalComponent,
    FormsModule,
  ],
  template: `
    <div class="space-y-6">
      <a href="javascript:void(0)" (click)="goBack($event)" class="text-sm font-bold text-duo-blue hover:underline">← Quay lại</a>

      @if (errorDetails()) {
        <app-error-banner [details]="errorDetails()" />
      }

      @if (classDetail(); as cls) {
        <div class="tactile-card p-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Mã lớp</p>
              <h1 class="font-display text-2xl font-black text-slate-900">{{ cls.code || 'Lớp #' + cls.id }}</h1>
              <p class="text-sm text-slate-500 mt-1">Môn: {{ cls.subjectName || '—' }}</p>
            </div>
            <span [class]="statusBadgeClass(cls.status)" class="rounded-full px-4 py-1.5 text-sm font-black">
              {{ label(cls.status) }}
            </span>
            @if (cls.status === 'Active' || cls.status === 'PendingStart') {
              @if (!showCancelForm()) {
                <button
                  (click)="showCancelForm.set(true)"
                  class="ml-auto bg-red-500 hover:bg-red-600 text-white font-extrabold px-5 py-2 rounded-xl border-b-4 border-red-700 hover:opacity-95 transition-all text-sm"
                >
                  Hủy lớp
                </button>
              }
            }
          </div>
        </div>

        @if (showCancelForm()) {
          <div class="tactile-card p-6 space-y-4 border-2 border-red-200 bg-red-50/10">
            <h3 class="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <span class="text-red-500">⚠</span> Xác nhận yêu cầu hủy lớp
            </h3>
            
            <p class="text-xs text-slate-500 leading-relaxed">
              Lưu ý: Hành động này sẽ hủy lớp học, và bạn có thể hoàn trả tiền đặt cọc tùy theo quyết định.
            </p>

            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1"
                >Lý do hủy lớp <span class="text-red-500">*</span></label
              >
              <textarea
                [(ngModel)]="cancelReason"
                rows="3"
                placeholder="Vui lòng nhập rõ lý do hủy lớp..."
                class="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-red-500 outline-none"
              ></textarea>
            </div>
            
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1">
                  Số tiền hoàn trả (Không bắt buộc)
                </label>
                <input type="number" min="0" step="1000"
                       [(ngModel)]="cancelRefundAmount"
                       class="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-duo-blue outline-none" />
              </div>
              <div class="flex items-center gap-2 mt-7">
                <input type="checkbox" [(ngModel)]="cancelIsRefunded" class="w-4 h-4 accent-duo-green" />
                <span class="text-sm font-bold text-slate-700">Đã hoàn tiền thủ công</span>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">
                Ghi chú hoàn tiền (Tùy chọn)
              </label>
              <textarea [(ngModel)]="cancelRefundNote" rows="2"
                        placeholder="Nhập thông tin đối chiếu nếu đã chuyển khoản"
                        class="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-duo-blue outline-none"></textarea>
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
                (click)="submitCancellation(cls.id!)"
                [disabled]="isSubmittingCancel() || !cancelReason().trim()"
                class="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-extrabold px-5 py-2 rounded-xl border-b-4 border-red-700 hover:opacity-95 disabled:opacity-50 transition-all text-sm"
              >
                {{ isSubmittingCancel() ? 'Đang xử lý...' : 'Xác nhận hủy' }}
              </button>
            </div>
          </div>
        }

        <div class="grid lg:grid-cols-2 gap-5">
          <div class="tactile-card p-5 space-y-2">
            <h2 class="font-extrabold text-slate-800 flex justify-between items-center">
              <span>Học viên</span>
              <button (click)="showStudentModal.set(true)"
                      class="text-xs font-bold text-duo-blue hover:underline cursor-pointer">
                Xem chi tiết
              </button>
            </h2>
            <p class="text-sm"><span class="font-bold text-slate-600">Họ tên:</span> {{ cls.studentName || '—' }}</p>
            <p class="text-sm"><span class="font-bold text-slate-600">Mã học viên:</span> {{ getStudentCode(cls.studentId) }}</p>
          </div>

          <div class="tactile-card p-5 space-y-2">
            <h2 class="font-extrabold text-slate-800 flex justify-between items-center">
              <span>Gia sư</span>
              <button (click)="showTutorModal.set(true)"
                      class="text-xs font-bold text-duo-blue hover:underline cursor-pointer">
                Xem chi tiết
              </button>
            </h2>
            <p class="text-sm"><span class="font-bold text-slate-600">Họ tên:</span> {{ cls.tutorName || '—' }}</p>
            <p class="text-sm"><span class="font-bold text-slate-600">Mã gia sư:</span> {{ getTutorCode(cls.tutorId) }}</p>
          </div>
        </div>

        <div class="tactile-card p-5 space-y-3">
          <h2 class="font-extrabold text-slate-800">Thông tin lớp</h2>
          <div class="grid sm:grid-cols-2 gap-3 text-sm">
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Ngày bắt đầu</p>
              <p class="mt-1 font-bold text-slate-800">{{ date(cls.startDate) }}</p>
            </div>
            @if (cls.endDate) {
              <div class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-emerald-700 tracking-wide">Ngày hoàn thành</p>
                <p class="mt-1 font-bold text-emerald-900">{{ dateTime(cls.endDate) }}</p>
              </div>
            }
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Lịch</p>
              <p class="mt-1 font-bold text-slate-800">{{ scheduleSourceLabel(cls.acceptedScheduleSource) }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3 sm:col-span-2">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Lịch học</p>
              <p class="mt-1 font-bold text-slate-800">{{ slots(cls) }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Tiền cọc</p>
              <p class="mt-1 font-bold text-duo-green">{{ money(cls.depositAmountSnapshot) }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Ngày tạo</p>
              <p class="mt-1 font-bold text-slate-800">{{ dateTime(cls.createdAt) }}</p>
            </div>
          </div>
        </div>

        @if (completionRequest(); as req) {
          <div class="tactile-card p-5 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="font-extrabold text-slate-800">Xác nhận hoàn thành lớp</h2>
              <span [class]="completionBadgeClass(req.status)" class="rounded-full px-3 py-1 text-xs font-black">
                {{ completionLabel(req.status) }}
              </span>
            </div>

            <div class="grid sm:grid-cols-2 gap-3 text-sm">
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Người khởi tạo</p>
                <p class="mt-1 font-bold text-slate-800">{{ req.requestedByUserName || '—' }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Vai trò</p>
                <p class="mt-1 font-bold text-slate-800">{{ requestedByRoleLabel(req.requestedByRole) }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Gửi lúc</p>
                <p class="mt-1 font-bold text-slate-800">{{ dateTime(req.createdAt) }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">
                  {{ req.respondedAt ? 'Phản hồi lúc' : 'Trạng thái hiện tại' }}
                </p>
                <p class="mt-1 font-bold text-slate-800">
                  {{ req.respondedAt ? dateTime(req.respondedAt) : completionLabel(req.status) }}
                </p>
              </div>
            </div>

            @if (req.status === 'Confirmed' && cls.endDate) {
              <div class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <p class="font-bold">Lớp đã được hai bên xác nhận hoàn thành.</p>
                <p class="mt-1 font-medium">Kết thúc lúc {{ dateTime(cls.endDate) }}.</p>
              </div>
            } @else if (req.status === 'AutoConfirmed') {
              <div class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <p class="font-bold">Hệ thống đã tự động xác nhận hoàn thành do không có phản hồi trong 3 ngày.</p>
                @if (cls.endDate) {
                  <p class="mt-1 font-medium">Kết thúc lúc {{ dateTime(cls.endDate) }}.</p>
                }
              </div>
            } @else if (req.status === 'Rejected') {
              <div class="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p class="font-bold">Yêu cầu hoàn thành gần nhất đã bị từ chối.</p>
              </div>
            } @else if (req.status === 'Pending') {
              <div class="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800 space-y-2">
                <p class="font-bold">Lớp đang chờ bên còn lại xác nhận hoàn thành.</p>
                <p class="text-xs font-medium bg-sky-100/50 p-2 rounded-xl">
                  ⏱ Sẽ tự động hoàn thành vào
                  <span class="font-bold">{{ autoCompleteDeadline(req.createdAt) }}</span>.
                </p>
              </div>
            }
          </div>
        }

        @if (classReview(); as rev) {
          <div class="tactile-card p-5 space-y-3">
            <h2 class="font-extrabold text-slate-800">Đánh giá của học viên</h2>
            <div class="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 space-y-2">
              <div class="flex items-center gap-1 text-amber-500 font-black text-lg">
                @for (s of [1,2,3,4,5]; track s) {
                  <span [class]="s <= rev.rating! ? 'text-amber-500' : 'text-amber-200'">★</span>
                }
                <span class="ml-2 text-sm text-amber-800">{{ rev.rating }}/5.0</span>
              </div>
              @if (rev.comment) {
                <p class="text-sm text-slate-700 font-medium italic">"{{ rev.comment }}"</p>
              }
              <p class="text-xs text-slate-500 font-bold mt-2">Đánh giá lúc: {{ dateTime(rev.createdAt) }}</p>
            </div>
          </div>
        }

        @if (cls.paymentSummary; as pay) {
          <div class="tactile-card p-5 space-y-3">
            <h2 class="font-extrabold text-slate-800">Thanh toán</h2>
            <div class="grid sm:grid-cols-2 gap-3 text-sm">
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Người trả</p>
                <p class="mt-1 font-bold text-slate-800">{{ pay.paidByUserName || '—' }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Số tiền</p>
                <p class="mt-1 font-bold text-duo-green">{{ money(pay.amount) }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide mb-1">Trạng thái</p>
                <span [class]="paymentBadgeClass(pay.status)" class="rounded-full px-2.5 py-0.5 text-xs font-black">
                  {{ paymentLabel(pay.status) }}
                </span>
              </div>
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Thanh toán lúc</p>
                <p class="mt-1 font-bold text-slate-800">{{ dateTime(pay.paidAt) }}</p>
              </div>
              <div class="sm:col-span-2">
                <a [routerLink]="['/admin/payments', pay.paymentId]" class="text-duo-blue font-bold text-sm hover:underline">
                  Xem chi tiết thanh toán →
                </a>
              </div>
            </div>
          </div>
        }

        @if (showStudentModal() && cls.studentId) {
          <app-student-detail-modal
            [userId]="cls.studentId"
            (close)="showStudentModal.set(false)" />
        }

        @if (showTutorModal() && cls.tutorId) {
          <app-tutor-detail-modal
            [tutorId]="cls.tutorId"
            (close)="showTutorModal.set(false)" />
        }
      } @else if (!errorDetails()) {
        <div class="tactile-card p-8 text-center font-bold text-slate-500">Đang tải...</div>
      }
    </div>
  `,
})
export class AdminClassDetailPage implements OnInit {
  classDetail = signal<ClassDto | null>(null);
  classReview = signal<ReviewDto | null>(null);
  completionRequest = signal<ClassCompletionRequestDto | null>(null);
  errorDetails = signal<ApiErrorDetails | null>(null);
  showStudentModal = signal(false);
  showTutorModal = signal(false);

  showCancelForm = signal(false);
  cancelReason = signal('');
  cancelRefundAmount = signal<number>(0);
  cancelRefundNote = signal('');
  cancelIsRefunded = signal(false);
  cancelErrorMessage = signal('');
  isSubmittingCancel = signal(false);

  private readonly route = inject(ActivatedRoute);
  private readonly adminApi = inject(AdminService);
  private readonly classesApi = inject(ClassesService);
  private readonly reviewsApi = inject(ReviewsService);
  private readonly cancellationApi = inject(CancellationRequestsService);
  private readonly location = inject(Location);

  goBack(event: Event): void {
    event.preventDefault();
    this.location.back();
  }

  ngOnInit(): void {
    void this.load();
  }

  label(status?: ClassStatus | null): string {
    return classStatusLabel(status);
  }

  paymentLabel = paymentStatusLabel;

  scheduleSourceLabel(src?: AcceptedScheduleSource | null): string {
    if (src === AcceptedScheduleSource.R1) return 'Học viên đề xuất';
    if (src === AcceptedScheduleSource.R2) return 'Gia sư đề xuất';
    return '—';
  }

  statusBadgeClass(status?: ClassStatus | null): string {
    return classStatusClass(status);
  }

  paymentBadgeClass(status?: any | null): string {
    return paymentStatusClass(status);
  }

  completionLabel(status?: ClassCompletionRequestDto['status'] | null): string {
    return classCompletionStatusLabel(status);
  }

  completionBadgeClass(status?: ClassCompletionRequestDto['status'] | null): string {
    return classCompletionStatusClass(status);
  }

  requestedByRoleLabel(role?: ClassCompletionRequestDto['requestedByRole'] | null): string {
    if (role === 'Student') return 'Học viên';
    if (role === 'Tutor') return 'Gia sư';
    if (role === 'Admin') return 'Quản trị viên';
    return '—';
  }

  date(value?: Date | null): string {
    return formatDate(value);
  }

  dateTime(value?: Date | null): string {
    return formatDateTime(value);
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  autoCompleteDeadline(createdAt?: Date | string | null): string {
    if (!createdAt) return '';
    const date = new Date(createdAt);
    date.setDate(date.getDate() + 3);
    return formatDateTime(date);
  }

  slots(cls: ClassDto): string {
    return formatTimeSlots(cls.timeSlots);
  }

  getStudentCode(id?: number | null): string {
    if (!id) return '—';
    return `STU${String(id).padStart(5, '0')}`;
  }

  getTutorCode(id?: number | null): string {
    if (!id) return '—';
    return `TUT${String(id).padStart(5, '0')}`;
  }

  private async load(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorDetails.set({ message: 'ID lớp không hợp lệ.' });
      return;
    }
    try {
      const response = await firstValueFrom(this.adminApi.getClassByIdForAdmin(id));
      const classData = response.data ?? null;
      this.classDetail.set(classData);
      if (classData?.id) {
        const completionResponse = await firstValueFrom(this.classesApi.getClassCompletionRequest(classData.id));
        this.completionRequest.set(completionResponse.data ?? null);
        
        try {
          const reviewResponse = await firstValueFrom(this.reviewsApi.getReviewByClassId(classData.id));
          this.classReview.set(reviewResponse.data ?? null);
        } catch (reviewError) {
          // It's normal if review is not found
          console.log('[admin/class-detail] no review found', reviewError);
        }
      }
    } catch (error) {
      console.error('[admin/class-detail] load failed', error);
      this.errorDetails.set(getApiErrorDetails(error, 'Không tải được thông tin lớp.'));
    }
  }

  async submitCancellation(classId?: number): Promise<void> {
    if (!classId) return;
    const reason = this.cancelReason().trim();
    if (!reason) {
      this.cancelErrorMessage.set('Lý do hủy lớp là bắt buộc.');
      return;
    }

    if (this.cancelIsRefunded() && (!this.cancelRefundAmount() || this.cancelRefundAmount() <= 0)) {
      this.cancelErrorMessage.set('Vui lòng nhập số tiền hoàn trả lớn hơn 0 khi đánh dấu đã hoàn tiền.');
      return;
    }

    this.isSubmittingCancel.set(true);
    this.cancelErrorMessage.set('');
    try {
      await firstValueFrom(
        this.cancellationApi.createCancellationRequest({
          classId,
          reason,
          refundAmount: this.cancelRefundAmount() > 0 ? this.cancelRefundAmount() : undefined,
          refundNote: this.cancelRefundNote().trim() || undefined,
          isRefunded: this.cancelIsRefunded(),
        }),
      );
      this.showCancelForm.set(false);
      this.cancelReason.set('');
      this.cancelRefundAmount.set(0);
      this.cancelRefundNote.set('');
      this.cancelIsRefunded.set(false);
      await this.load();
    } catch (error) {
      this.cancelErrorMessage.set(getApiErrorMessage(error, 'Không gửi được yêu cầu hủy lớp.'));
    } finally {
      this.isSubmittingCancel.set(false);
    }
  }
}
