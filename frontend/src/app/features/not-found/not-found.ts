import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-2xl rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
      <p class="eyebrow justify-center">404</p>
      <h1 class="mt-3 text-4xl font-semibold text-slate-950">Không tìm thấy trang</h1>
      <p class="mt-4 text-sm leading-6 text-slate-600">
        Đường dẫn này không tồn tại trong hệ thống EduMatch.
      </p>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <a class="btn-primary" routerLink="/">Về trang chủ</a>
        <a class="btn-secondary" routerLink="/auth/login">Đăng nhập</a>
      </div>
    </section>
  `,
})
export class NotFoundPage {}
