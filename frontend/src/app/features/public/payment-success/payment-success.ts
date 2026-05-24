import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-success-page',
  imports: [RouterLink],
  template: `
    <section class="card p-8">
      <p class="eyebrow">Payment callback</p>
      <h1 class="mt-3 text-3xl font-semibold text-slate-950">Thanh toán thành công</h1>
      <p class="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
        Route placeholder for <code>payment/success</code>. Hook this page to the real payment
        status query after the payment flow is implemented.
      </p>
      <div class="mt-6 flex flex-wrap gap-3">
        <a class="btn-primary" routerLink="/">Về trang chủ</a>
        <a class="btn-secondary" routerLink="/student/dashboard">Dashboard học viên</a>
      </div>
    </section>
  `,
})
export class PaymentSuccessPage {}
