import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { PaymentAdminDto, PaymentStatus } from '../../../api/generated/client/models';
import { PaymentsService } from '../../../api/generated/client/services';
import { ApiErrorDetails, getApiErrorDetails } from '../../../core/http/api-error';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner';
import { formatDateTime, formatMoney, paymentStatusLabel, paymentStatusClass } from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-student-payment-detail-page',
  imports: [ErrorBannerComponent, RouterLink],
  template: `
    <div class="space-y-6">
      <a routerLink="/student/payments" class="text-sm font-bold text-duo-blue hover:underline">← Quay lại lịch sử thanh toán</a>

      @if (errorDetails()) {
        <app-error-banner [details]="errorDetails()" />
      }

      @if (payment(); as p) {
        <div class="tactile-card p-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Mã giao dịch</p>
              <h1 class="font-display text-2xl font-black text-slate-900">#{{ p.orderCode }}</h1>
              <p class="text-sm text-slate-500 mt-1">{{ p.description || '—' }}</p>
            </div>
            <div class="text-right">
              <p class="font-display text-3xl font-black text-duo-green">{{ money(p.amount) }}</p>
              <span [class]="badgeClass(p.status)" class="mt-2 inline-block rounded-full px-3 py-1 text-xs font-black">{{ label(p.status) }}</span>
            </div>
          </div>
        </div>

        <div class="grid lg:grid-cols-2 gap-5">
          <div class="tactile-card p-5 space-y-3">
            <h2 class="font-extrabold text-slate-800">Thông tin giao dịch</h2>
            <div class="grid grid-cols-1 gap-3 text-sm">
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Người thanh toán</p>
                <p class="mt-1 font-bold text-slate-800">{{ p.paidByUserCode ? p.paidByUserCode + ' - ' + p.paidByUserName : (p.paidByUserName || 'Học viên #' + p.paidByUserId) }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Mã giao dịch ngân hàng</p>
                <p class="mt-1 font-bold text-slate-800 break-all">{{ p.transactionId || '—' }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Thanh toán lúc</p>
                <p class="mt-1 font-bold text-slate-800">{{ dateTime(p.paidAt) }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Tạo lúc</p>
                <p class="mt-1 font-bold text-slate-800">{{ dateTime(p.createdAt) }}</p>
              </div>
            </div>
          </div>

          <div class="tactile-card p-5 space-y-3">
            <h2 class="font-extrabold text-slate-800">Thông tin lớp học</h2>
            <div class="space-y-2 text-sm">
              <a [routerLink]="['/student/learning-requests', p.learningRequestId]" class="block rounded-xl bg-slate-50 px-4 py-3 hover:bg-slate-100">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Yêu cầu học</p>
                <p class="mt-1 font-bold text-duo-blue">Yêu cầu học #{{ p.learningRequestId ?? '—' }} →</p>
              </a>
              @if (p.classId) {
                <a [routerLink]="['/student/classes', p.classId]" class="block rounded-xl bg-slate-50 px-4 py-3 hover:bg-slate-100">
                  <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Lớp học</p>
                  <p class="mt-1 font-bold text-duo-blue">Lớp học #{{ p.classId }} →</p>
                </a>
              } @else {
                <div class="rounded-xl bg-slate-50 px-4 py-3">
                  <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Lớp học</p>
                  <p class="mt-1 font-bold text-slate-500">Chưa tạo lớp học (Đang xử lý)</p>
                </div>
              }
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Gia sư</p>
                <p class="mt-1 font-bold text-slate-800">{{ p.tutorCode ? p.tutorCode + ' - ' + p.tutorName : (p.tutorName || 'Gia sư #' + p.tutorId) }}</p>
              </div>
            </div>
          </div>
        </div>

        @if (p.checkoutUrl && p.status === paymentStatusEnum.Pending) {
          <div class="tactile-card p-5 bg-orange-50 border-2 border-orange-200">
            <h2 class="font-extrabold text-slate-800 mb-2">Thực hiện thanh toán</h2>
            <p class="text-sm text-slate-600 mb-4">Giao dịch này đang chờ thanh toán. Bạn có thể bấm vào nút dưới đây để tiếp tục thanh toán qua cổng PayOS:</p>
            <div class="flex flex-wrap items-center gap-3">
              <a [href]="p.checkoutUrl" target="_blank" rel="noopener noreferrer"
                 class="tactile-button-green px-6 py-2.5 rounded-xl text-sm font-extrabold uppercase text-center">
                Thanh toán ngay
              </a>
              <button (click)="copyUrl(p.checkoutUrl!)"
                      class="px-4 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-300">
                {{ copied() ? 'Đã sao chép link' : 'Sao chép link' }}
              </button>
            </div>
          </div>
        }
      } @else if (!errorDetails()) {
        <div class="tactile-card p-8 text-center font-bold text-slate-500">Đang tải chi tiết giao dịch...</div>
      }
    </div>
  `,
})
export class StudentPaymentDetailPage implements OnInit {
  payment = signal<PaymentAdminDto | null>(null);
  errorDetails = signal<ApiErrorDetails | null>(null);
  copied = signal(false);

  protected readonly paymentStatusEnum = PaymentStatus;

  private readonly route = inject(ActivatedRoute);
  private readonly paymentsApi = inject(PaymentsService);

  ngOnInit(): void {
    void this.load();
  }

  label = paymentStatusLabel;

  badgeClass(status?: PaymentStatus | null): string {
    return paymentStatusClass(status);
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  dateTime(value?: Date | string | null): string {
    return formatDateTime(value);
  }

  async copyUrl(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // ignore
    }
  }

  private async load(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorDetails.set({ message: 'Mã giao dịch không hợp lệ.' });
      return;
    }
    try {
      const response = await firstValueFrom(this.paymentsApi.getMyPaymentById(id));
      this.payment.set(response.data ?? null);
    } catch (error) {
      console.error('[student/payment-detail] load failed', error);
      this.errorDetails.set(getApiErrorDetails(error, 'Không tải được chi tiết giao dịch.'));
    }
  }
}
