import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register-choice-page',
  imports: [RouterLink],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div class="w-full max-w-3xl space-y-8">
        <div class="text-center">
          <h1 class="font-display text-3xl sm:text-4xl font-black text-slate-900">Bạn muốn đăng ký với vai trò nào?</h1>
          <p class="mt-2 text-sm sm:text-base text-slate-500">Chọn đúng vai trò để EduMatch chuẩn bị form phù hợp cho bạn.</p>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <a routerLink="/auth/register/student"
             class="tactile-card p-6 flex flex-col items-center text-center gap-4 hover:-translate-y-1">
            <div>
              <h2 class="font-display text-2xl font-black text-slate-900">Học viên</h2>
              <p class="mt-2 text-sm font-semibold text-slate-500">Tìm gia sư, tạo yêu cầu học và quản lý lớp học.</p>
            </div>
            <span class="tactile-button-green w-full py-3 rounded-2xl text-sm font-extrabold uppercase mt-auto">
              Đăng ký học viên
            </span>
          </a>

          <a routerLink="/auth/register/tutor"
             class="tactile-card p-6 flex flex-col items-center text-center gap-4 hover:-translate-y-1">
            <div>
              <h2 class="font-display text-2xl font-black text-slate-900">Gia sư</h2>
              <p class="mt-2 text-sm font-semibold text-slate-500">Tạo hồ sơ giảng dạy và nhận yêu cầu từ học viên.</p>
            </div>
            <span class="tactile-button-blue w-full py-3 rounded-2xl text-sm font-extrabold uppercase mt-auto">
              Đăng ký gia sư
            </span>
          </a>
        </div>

        <p class="text-center text-sm text-slate-500">
          Đã có tài khoản? <a routerLink="/auth/login" class="font-extrabold text-[#58cc02] hover:underline">Đăng nhập</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterChoicePage {}
