import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MascotComponent } from '../../../shared/components/mascot/mascot';

@Component({
  selector: 'app-register-student-page',
  imports: [FormsModule, RouterLink, MascotComponent],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div class="w-full max-w-md space-y-6">
        <div class="text-center">
          <app-mascot type="studentBackpack" [size]="80" />
          <h1 class="mt-4 font-display text-3xl font-black text-slate-900">Tạo tài khoản Học viên</h1>
          <p class="mt-1 text-slate-500">Bắt đầu hành trình học tập thông minh! 🎒</p>
        </div>

        <div class="tactile-card p-6 sm:p-8 space-y-4">
          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">👤 Họ và tên</label>
            <input type="text" [(ngModel)]="fullName" placeholder="Nguyễn Văn A" class="tactile-input w-full text-sm font-semibold" />
          </div>
          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">📧 Email</label>
            <input type="email" [(ngModel)]="email" placeholder="email@example.com" class="tactile-input w-full text-sm font-semibold" />
          </div>
          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">🔒 Mật khẩu</label>
            <input type="password" [(ngModel)]="password" placeholder="Tối thiểu 8 ký tự" class="tactile-input w-full text-sm font-semibold" />
            <!-- Strength bar -->
            <div class="mt-2 flex items-center gap-2">
              <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                @for (i of [0,1,2,3]; track i) {
                  <div class="flex-1 rounded-full transition-colors" [class]="i < strength() ? strengthColor() : 'bg-slate-200'"></div>
                }
              </div>
              <span class="text-xs font-bold" [class]="'text-' + strengthTextColor()">{{ strengthLabel() }}</span>
            </div>
          </div>
          <label class="flex items-start gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" [(ngModel)]="agreeTerms" class="mt-0.5 w-5 h-5 rounded accent-[#58cc02]" />
            <span>Tôi đồng ý với <a href="#" class="font-bold text-duo-blue hover:underline">Điều khoản</a> và <a href="#" class="font-bold text-duo-blue hover:underline">Chính sách bảo mật</a></span>
          </label>

          <button [disabled]="!agreeTerms" class="tactile-button-green w-full py-3.5 rounded-2xl text-base font-extrabold uppercase disabled:opacity-50 disabled:cursor-not-allowed">
            🎉 Đăng ký
          </button>

          <div class="flex items-center gap-4">
            <div class="flex-1 h-px bg-slate-200"></div>
            <span class="text-xs font-bold text-slate-400 uppercase">Hoặc</span>
            <div class="flex-1 h-px bg-slate-200"></div>
          </div>
          <button class="tactile-button-gray w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
            <svg class="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Đăng ký bằng Google
          </button>
        </div>

        <p class="text-center text-sm text-slate-500">
          Đã có tài khoản? <a routerLink="/auth/login" class="font-extrabold text-[#58cc02] hover:underline">Đăng nhập</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterStudentPage {
  fullName = '';
  email = '';
  password = '';
  agreeTerms = false;

  protected strength = computed(() => {
    const p = this.password;
    let s = 0;
    if (p.length >= 4) s++;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  });
  protected strengthColor = computed(() => ['bg-duo-red', 'bg-duo-orange', 'bg-duo-yellow', 'bg-duo-green'][this.strength() - 1] ?? 'bg-slate-200');
  protected strengthTextColor = computed(() => ['duo-red', 'duo-orange', 'duo-yellow', 'duo-green'][this.strength() - 1] ?? 'slate-400');
  protected strengthLabel = computed(() => ['Yếu 😰', 'Trung bình 🤔', 'Khá tốt 😊', 'Mạnh! 💪'][this.strength() - 1] ?? '');
}
