import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { PaymentsService } from '../../../api/generated/client/services';
import { SessionService } from '../../../core/auth/session';
import { UserRole } from '../../../core/auth/session.models';
import { getApiErrorMessage } from '../../../core/http/api-error';

@Component({
  selector: 'app-payment-cancel-page',
  imports: [RouterLink],
  template: `
    <section class="tactile-card max-w-2xl mx-auto p-8 space-y-5">
      <p class="text-sm font-black uppercase text-duo-orange">PayOS callback</p>
      <h1 class="font-display text-3xl font-black text-slate-900">Thanh toán đã bị hủy</h1>

      @if (isRedirecting()) {
        <p class="text-sm leading-6 text-slate-600">
          EduMatch đang đưa bạn về lại trang thông tin yêu cầu học.
        </p>
      } @else {
        <p class="text-sm leading-6 text-slate-600">
          Bạn có thể quay lại yêu cầu học để tạo lại hoặc tiếp tục checkout nếu payment vẫn còn hiệu lực.
        </p>
      }

      @if (errorMessage()) {
        <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">
          {{ errorMessage() }}
        </p>
      }

      <div class="flex flex-wrap gap-3">
        @if (learningRequestId()) {
          <a
            class="tactile-button-green px-5 py-2.5 rounded-xl font-extrabold uppercase"
            [routerLink]="requestLink()">
            Quay lại yêu cầu
          </a>
        }
        <a class="tactile-button-gray px-5 py-2.5 rounded-xl font-bold" [routerLink]="listLink()">
          Danh sách yêu cầu học
        </a>
      </div>
    </section>
  `,
})
export class PaymentCancelPage implements OnInit {
  readonly learningRequestId = signal<number | null>(null);
  readonly isRedirecting = signal(true);
  readonly errorMessage = signal('');

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentsApi = inject(PaymentsService);
  private readonly session = inject(SessionService);

  ngOnInit(): void {
    void this.resolveTargetAndRedirect();
  }

  requestLink(): string {
    const learningRequestId = this.learningRequestId();
    if (!learningRequestId) {
      return this.listLink();
    }

    return this.roleBasePath() === '/tutor'
      ? `/tutor/requests/${learningRequestId}`
      : `/student/learning-requests/${learningRequestId}`;
  }

  listLink(): string {
    return this.roleBasePath() === '/tutor'
      ? '/tutor/dashboard'
      : '/student/learning-requests';
  }

  private async resolveTargetAndRedirect(): Promise<void> {
    const learningRequestIdFromQuery = Number(this.route.snapshot.queryParamMap.get('learningRequestId')) || null;
    if (learningRequestIdFromQuery) {
      this.learningRequestId.set(learningRequestIdFromQuery);
      await this.router.navigateByUrl(this.requestLink());
      return;
    }

    const orderCode = Number(this.route.snapshot.queryParamMap.get('orderCode'));
    if (!orderCode) {
      this.isRedirecting.set(false);
      this.errorMessage.set('Không tìm thấy mã thanh toán trên URL hủy giao dịch.');
      return;
    }

    try {
      const response = await firstValueFrom(this.paymentsApi.getPaymentStatus(orderCode));
      const learningRequestId = response.data?.learningRequestId ?? null;

      if (!learningRequestId) {
        throw new Error('Không xác định được yêu cầu học từ giao dịch đã hủy.');
      }

      this.learningRequestId.set(learningRequestId);
      await this.router.navigateByUrl(this.requestLink());
    } catch (error) {
      this.isRedirecting.set(false);
      this.errorMessage.set(getApiErrorMessage(error, 'Không quay lại được trang yêu cầu học.'));
    }
  }

  private roleBasePath(): '/student' | '/tutor' {
    return this.session.role() === UserRole.Tutor ? '/tutor' : '/student';
  }
}
