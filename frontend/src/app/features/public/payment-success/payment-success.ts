import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { PaymentStatus, PaymentStatusDto } from '../../../api/generated/client/models';
import { PaymentsService } from '../../../api/generated/client/services';
import { SessionService } from '../../../core/auth/session';
import { UserRole } from '../../../core/auth/session.models';
import { getApiErrorMessage } from '../../../core/http/api-error';
import { formatMoney, paymentStatusLabel } from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-payment-success-page',
  imports: [RouterLink],
  template: `
    <section class="tactile-card max-w-2xl mx-auto p-8 space-y-5">
      <p class="text-sm font-black uppercase text-duo-green">Kết quả thanh toán</p>
      <h1 class="font-display text-3xl font-black text-slate-900">Thanh toán thành công</h1>
      <p class="text-sm leading-6 text-slate-600">
        EduMatch đang kiểm tra trạng thái giao dịch và sẽ đưa bạn vào lớp học ngay khi xác nhận hoàn tất.
      </p>

      @if (payment(); as p) {
        <div class="rounded-2xl bg-green-50 p-5 grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p class="font-bold text-slate-500">Mã đơn</p>
            <p class="font-extrabold text-slate-900">{{ p.orderCode }}</p>
          </div>
          <div>
            <p class="font-bold text-slate-500">Số tiền</p>
            <p class="font-extrabold text-duo-green">{{ money(p.amount) }}</p>
          </div>
          <div>
            <p class="font-bold text-slate-500">Trạng thái</p>
            <p class="font-extrabold text-slate-900">{{ statusLabel(p.status) }}</p>
          </div>
        </div>
      }

      @if (isPolling()) {
        <p class="text-sm font-bold text-slate-500">Đang đồng bộ thanh toán và khởi tạo lớp học...</p>
      }
      @if (errorMessage()) {
        <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">{{ errorMessage() }}</p>
      }

      <div class="flex flex-wrap gap-3">
        @if (classLink()) {
          <a class="tactile-button-green px-5 py-2.5 rounded-xl font-extrabold uppercase" [routerLink]="classLink()!">
            Vào lớp học
          </a>
        }
        <a class="tactile-button-gray px-5 py-2.5 rounded-xl font-bold" [routerLink]="classesListLink()">
          Danh sách lớp
        </a>
      </div>
    </section>
  `,
})
export class PaymentSuccessPage implements OnInit {
  readonly payment = signal<PaymentStatusDto | null>(null);
  readonly isPolling = signal(false);
  readonly errorMessage = signal('');

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentsApi = inject(PaymentsService);
  private readonly session = inject(SessionService);

  ngOnInit(): void {
    void this.pollStatus();
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  statusLabel(status?: PaymentStatus | null): string {
    return paymentStatusLabel(status);
  }

  classLink(): string | null {
    const classId = this.payment()?.classId;
    if (!classId) {
      return null;
    }

    return this.roleBasePath() === '/tutor'
      ? `/tutor/classes/${classId}`
      : `/student/classes/${classId}`;
  }

  classesListLink(): string {
    return this.roleBasePath() === '/tutor' ? '/tutor/classes' : '/student/classes';
  }

  private async pollStatus(): Promise<void> {
    const orderCode = Number(this.route.snapshot.queryParamMap.get('orderCode'));
    if (!orderCode) {
      this.errorMessage.set('Không tìm thấy mã thanh toán trên URL callback.');
      return;
    }

    this.isPolling.set(true);
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        const response = await firstValueFrom(this.paymentsApi.getPaymentStatus(orderCode));
        const payment = response.data ?? null;
        this.payment.set(payment);

        if (payment?.status === PaymentStatus.Success && payment.classId) {
          await this.router.navigateByUrl(this.classLink()!);
          return;
        }
      } catch (error) {
        this.errorMessage.set(getApiErrorMessage(error, 'Không kiểm tra được trạng thái thanh toán.'));
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    this.isPolling.set(false);

    if (!this.errorMessage()) {
      this.errorMessage.set('Thanh toán đã ghi nhận nhưng chưa đồng bộ xong lớp học. Bạn có thể mở danh sách lớp sau vài giây.');
    }
  }

  private roleBasePath(): '/student' | '/tutor' {
    return this.session.role() === UserRole.Tutor ? '/tutor' : '/student';
  }
}
