import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import { SessionService } from '../../../core/auth/session';

@Component({
  selector: 'app-profile-settings-page',
  imports: [FormsModule, MascotComponent],
  template: `
    <div class="space-y-6">
      <h1 class="font-display text-2xl font-black text-slate-900">⚙️ Cài đặt hồ sơ</h1>

      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Left: Avatar + Stats -->
        <div class="space-y-4">
          <div class="tactile-card p-6 text-center">
            <app-mascot type="studentBackpack" [size]="100" />
            <p class="mt-3 font-extrabold text-lg text-slate-900">{{ session.user()?.fullName ?? 'Học viên' }}</p>
            <p class="text-sm text-slate-500">{{ session.user()?.email ?? 'user@email.com' }}</p>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <div class="bg-amber-50 rounded-xl p-3">
                <p class="text-xl">⭐</p>
                <p class="font-black text-amber-700 text-sm">128 XP</p>
              </div>
              <div class="bg-orange-50 rounded-xl p-3">
                <p class="text-xl">🔥</p>
                <p class="font-black text-orange-700 text-sm">5 ngày</p>
              </div>
            </div>
          </div>

          <div class="tactile-card p-5">
            <h3 class="font-extrabold text-sm text-slate-800 mb-3">🏆 Huy hiệu</h3>
            <div class="flex flex-wrap gap-2">
              <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">🌟 Tân binh</span>
              <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">📚 Ham học</span>
              <span class="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">💎 VIP</span>
            </div>
          </div>
        </div>

        <!-- Right: Settings Form -->
        <div class="lg:col-span-2 space-y-4">
          <div class="tactile-card p-6 space-y-4">
            <h2 class="font-extrabold text-lg text-slate-900">📝 Thông tin cá nhân</h2>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Họ và tên</label>
                <input type="text" [(ngModel)]="fullName" class="tactile-input w-full text-sm font-semibold" />
              </div>
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Email</label>
                <input type="email" [(ngModel)]="email" class="tactile-input w-full text-sm font-semibold" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Trường / Tổ chức</label>
              <input type="text" [(ngModel)]="school" placeholder="VD: ĐH Bách Khoa" class="tactile-input w-full text-sm font-semibold" />
            </div>
            <button (click)="onSave()" class="tactile-button-green px-6 py-2.5 rounded-xl text-sm font-extrabold uppercase">
              💾 Lưu thay đổi
            </button>
          </div>

          <div class="tactile-card p-6 space-y-4">
            <h2 class="font-extrabold text-lg text-slate-900">🔒 Đổi mật khẩu</h2>
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Mật khẩu hiện tại</label>
              <input type="password" [(ngModel)]="currentPassword" class="tactile-input w-full text-sm font-semibold" />
            </div>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Mật khẩu mới</label>
                <input type="password" [(ngModel)]="newPassword" class="tactile-input w-full text-sm font-semibold" />
              </div>
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Xác nhận mật khẩu</label>
                <input type="password" [(ngModel)]="confirmPassword" class="tactile-input w-full text-sm font-semibold" />
              </div>
            </div>
            <button class="tactile-button-blue px-6 py-2.5 rounded-xl text-sm font-extrabold uppercase">
              🔑 Cập nhật mật khẩu
            </button>
          </div>
        </div>
      </div>

      <!-- Toast -->
      @if (showToast()) {
        <div class="fixed bottom-6 right-6 bg-duo-green text-white px-6 py-3 rounded-2xl font-extrabold shadow-lg flex items-center gap-2 z-50 animate-bounce">
          ✅ Đã lưu thành công!
        </div>
      }
    </div>
  `,
})
export class ProfileSettingsPage {
  protected readonly session = inject(SessionService);
  fullName = '';
  email = '';
  school = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showToast = signal(false);

  constructor() {
    const user = this.session.user();
    if (user) {
      this.fullName = user.fullName;
      this.email = user.email;
      this.school = user.school ?? '';
    }
  }

  onSave() {
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }
}
