import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-cancel-page',
  imports: [RouterLink],
  template: `
    <section class="card p-8">
      <p class="eyebrow">Payment callback</p>
      <h1 class="mt-3 text-3xl font-semibold text-slate-950">Thanh toán đã bị hủy</h1>
      <p class="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
        Route placeholder for <code>payment/cancel</code>. The backend already points development
        returns here, so this page is ready for follow-up payment recovery UX.
      </p>
      <div class="mt-6 flex flex-wrap gap-3">
        <a class="btn-primary" routerLink="/">Về trang chủ</a>
        <a class="btn-secondary" routerLink="/auth/login">Đăng nhập lại</a>
      </div>
    </section>
  `,
})
export class PaymentCancelPage {}
