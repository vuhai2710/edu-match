import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { PaymentAdminDto, PaymentStatus } from '../../../api/generated/client/models';
import { AdminService } from '../../../api/generated/client/services';
import { ApiErrorDetails, getApiErrorDetails } from '../../../core/http/api-error';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner';
import { formatDateTime, formatMoney, paymentStatusLabel, paymentStatusClass } from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-admin-payment-detail-page',
  imports: [ErrorBannerComponent, RouterLink],
  template: `
    <div class="space-y-6">
      <a routerLink="/admin/payments" class="text-sm font-bold text-duo-blue hover:underline">← Quay lại danh sách</a>

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
                <p class="mt-1 font-bold text-slate-800">{{ p.paidByUserCode ? p.paidByUserCode + ' - ' + p.paidByUserName : (p.paidByUserName || 'Người dùng #' + p.paidByUserId) }}</p>
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
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Mã yêu cầu học</p>
                <p class="mt-1 font-bold text-slate-800">YCHL #{{ p.learningRequestId ?? '—' }}</p>
              </div>
              @if (p.classId) {
                <a [routerLink]="['/admin/classes', p.classId]" class="block rounded-xl bg-slate-50 px-4 py-3 hover:bg-slate-100">
                  <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Lớp học</p>
                  <p class="mt-1 font-bold text-duo-blue">Lớp #{{ p.classId }} →</p>
                </a>
              } @else {
                <div class="rounded-xl bg-slate-50 px-4 py-3">
                  <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Lớp học</p>
                  <p class="mt-1 font-bold text-slate-500">Chưa tạo lớp</p>
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
            <h2 class="font-extrabold text-slate-800 mb-2">Link thanh toán</h2>
            <p class="text-xs text-slate-600 mb-2">Đơn này chưa thanh toán, học viên có thể tiếp tục thanh toán:</p>
            <div class="flex flex-wrap items-center gap-2">
              <a [href]="p.checkoutUrl" target="_blank" rel="noopener noreferrer"
                 class="text-sm font-bold text-duo-blue hover:underline break-all">{{ p.checkoutUrl }}</a>
              <button (click)="copyUrl(p.checkoutUrl!)"
                      class="px-3 py-1.5 rounded-lg bg-white border-2 border-slate-200 text-xs font-bold text-slate-600 hover:border-slate-300">
                {{ copied() ? 'Đã sao chép' : 'Sao chép' }}
              </button>
            </div>
          </div>
        }
      } @else if (!errorDetails()) {
        <div class="tactile-card p-8 text-center font-bold text-slate-500">Đang tải...</div>
      }
    </div>
  `,
})
export class AdminPaymentDetailPage implements OnInit {
  payment = signal<PaymentAdminDto | null>(null);
  errorDetails = signal<ApiErrorDetails | null>(null);
  copied = signal(false);

  protected readonly paymentStatusEnum = PaymentStatus;

  private readonly route = inject(ActivatedRoute);
  private readonly adminApi = inject(AdminService);

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

  dateTime(value?: Date | null): string {
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
      this.errorDetails.set({ message: 'ID giao dịch không hợp lệ.' });
      return;
    }
    try {
      const response = await firstValueFrom(this.adminApi.getPaymentById(id));
      this.payment.set(response.data ?? null);
    } catch (error) {
      console.error('[admin/payment-detail] load failed', error);
      this.errorDetails.set(getApiErrorDetails(error, 'Không tải được giao dịch.'));
    }
  }
}
