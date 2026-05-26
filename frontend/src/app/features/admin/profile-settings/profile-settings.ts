import { Component, ElementRef, HostListener, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { UsersService } from '../../../api/generated/client/services';
import { AuthApiService } from '../../../api/facades/auth-api';
import { SessionService } from '../../../core/auth/session';
import { SessionUser } from '../../../core/auth/session.models';
import { getApiErrorMessage } from '../../../core/http/api-error';
import { MascotComponent } from '../../../shared/components/mascot/mascot';

@Component({
  selector: 'app-admin-profile-settings-page',
  imports: [FormsModule, MascotComponent],
  template: `
    <div class="space-y-6">
      <h1 class="font-display text-2xl font-black text-slate-900">Hồ sơ quản trị</h1>

      <div class="grid lg:grid-cols-3 gap-6">
        <div class="space-y-4">
          <div class="tactile-card p-6 text-center">
            <div class="relative inline-block" (click)="$event.stopPropagation()">
              <button type="button"
                      (click)="showAvatarMenu.set(!showAvatarMenu())"
                      [disabled]="isUploadingAvatar()"
                      class="group relative block w-[100px] h-[100px] mx-auto rounded-full overflow-hidden disabled:opacity-60"
                      aria-haspopup="menu"
                      [attr.aria-expanded]="showAvatarMenu()">
                @if (avatarUrl()) {
                  <img [src]="avatarUrl()!" alt="avatar" referrerpolicy="no-referrer"
                       class="w-full h-full object-cover border-2 border-slate-200 rounded-full" />
                } @else {
                  <app-mascot type="adminBlueGlasses" [size]="100" />
                }
                <span class="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
              </button>
              @if (showAvatarMenu()) {
                <div class="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-white rounded-2xl shadow-xl border-2 border-slate-100 p-2 z-30" role="menu">
                  <button type="button" (click)="triggerAvatarUpload()"
                          class="w-full text-left px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-lg">
                    {{ avatarUrl() ? 'Đổi ảnh đại diện' : 'Tải ảnh đại diện' }}
                  </button>
                  @if (avatarUrl()) {
                    <button type="button" (click)="onDeleteAvatar()"
                            class="w-full text-left px-3 py-2 text-sm font-bold text-duo-red hover:bg-red-50 rounded-lg">
                      Xóa ảnh đại diện
                    </button>
                  }
                </div>
              }
              <input #avatarInput type="file" accept="image/*" class="hidden" (change)="onAvatarChange($event)" />
            </div>
            @if (isUploadingAvatar()) {
              <p class="mt-2 text-xs font-bold text-slate-500">Đang tải ảnh...</p>
            }
            <p class="mt-3 font-extrabold text-lg text-slate-900">{{ fullName() || 'Quản trị viên' }}</p>
            <p class="text-sm text-slate-500">{{ email() || 'user@email.com' }}</p>
            <span class="inline-block mt-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-duo-blue">Admin</span>
          </div>
        </div>

        <div class="lg:col-span-2 space-y-4">
          <div class="tactile-card p-6 space-y-4">
            <h2 class="font-extrabold text-lg text-slate-900">Thông tin tài khoản</h2>
            <div class="grid sm:grid-cols-2 gap-4 text-sm">
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Họ và tên</p>
                <p class="mt-1 font-bold text-slate-800">{{ fullName() || '—' }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Email</p>
                <p class="mt-1 font-bold text-slate-800 break-all">{{ email() || '—' }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Mã định danh</p>
                <p class="mt-1 font-bold text-slate-800">{{ code() || '#' + (userId() ?? '—') }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Vai trò</p>
                <p class="mt-1 font-bold text-slate-800">Quản trị viên</p>
              </div>
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Năm sinh</p>
                <p class="mt-1 font-bold text-slate-800">{{ birth() ?? '—' }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Giới tính</p>
                <p class="mt-1 font-bold text-slate-800">{{ genderLabel() }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 px-4 py-3 sm:col-span-2">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Trạng thái</p>
                <p class="mt-1 font-bold" [class.text-duo-green]="isActive()" [class.text-duo-red]="!isActive()">
                  {{ isActive() ? 'Đang hoạt động' : 'Đã khóa' }}
                </p>
              </div>
            </div>
            <p class="text-xs text-slate-500">
              Thông tin tài khoản quản trị được cấu hình hệ thống. Liên hệ quản trị cấp cao hơn nếu cần thay đổi.
            </p>
          </div>

          <div class="tactile-card p-6 space-y-4">
            <h2 class="font-extrabold text-lg text-slate-900">Đổi mật khẩu</h2>
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
            <button (click)="onChangePassword()" [disabled]="isChangingPassword()"
                    class="tactile-button-blue px-6 py-2.5 rounded-xl text-sm font-extrabold uppercase disabled:opacity-60">
              {{ isChangingPassword() ? 'Đang cập nhật...' : 'Cập nhật mật khẩu' }}
            </button>
          </div>
        </div>
      </div>

      @if (successMessage()) {
        <div class="fixed bottom-6 right-6 bg-duo-green text-white px-6 py-3 rounded-2xl font-extrabold shadow-lg z-50">
          {{ successMessage() }}
        </div>
      }
      @if (errorMessage()) {
        <div class="fixed bottom-6 right-6 bg-duo-red text-white px-6 py-3 rounded-2xl font-extrabold shadow-lg z-50 max-w-sm">
          {{ errorMessage() }}
        </div>
      }
    </div>
  `,
})
export class AdminProfileSettingsPage implements OnInit {
  protected readonly session = inject(SessionService);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  fullName = signal('');
  email = signal('');
  birth = signal<number | null>(null);
  gender = signal<number | string | null>(null);
  isActive = signal(true);
  avatarUrl = signal<string | null>(null);
  userId = signal<number | null>(null);
  code = signal<string | null>(null);
  showAvatarMenu = signal(false);
  isChangingPassword = signal(false);
  isUploadingAvatar = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  protected readonly avatarInput = viewChild<ElementRef<HTMLInputElement>>('avatarInput');

  private readonly usersApi = inject(UsersService);
  private readonly authApi = inject(AuthApiService);

  ngOnInit(): void {
    this.applyUser(this.session.user());
    void this.refreshFromServer();
  }

  @HostListener('document:click')
  protected closeAvatarMenu(): void {
    this.showAvatarMenu.set(false);
  }

  triggerAvatarUpload(): void {
    this.showAvatarMenu.set(false);
    this.avatarInput()?.nativeElement.click();
  }

  genderLabel(): string {
    const value = this.gender();
    if (value === 'Male' || value === 0) return 'Nam';
    if (value === 'Female' || value === 1) return 'Nữ';
    return '—';
  }

  async onAvatarChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploadingAvatar.set(true);
    this.clearMessages();

    try {
      const response = await firstValueFrom(this.usersApi.updateMyAvatar(file));
      const newUrl = response.data ?? null;
      this.avatarUrl.set(newUrl);
      const current = this.session.user();
      if (current) {
        this.session.setUser({ ...current, avatarUrl: newUrl });
      }
      this.showSuccess('Đã cập nhật ảnh đại diện.');
    } catch (error) {
      this.showError(getApiErrorMessage(error, 'Không tải được ảnh đại diện.'));
    } finally {
      this.isUploadingAvatar.set(false);
      input.value = '';
    }
  }

  async onDeleteAvatar(): Promise<void> {
    this.showAvatarMenu.set(false);
    this.isUploadingAvatar.set(true);
    this.clearMessages();

    try {
      await firstValueFrom(this.usersApi.deleteMyAvatar());
      this.avatarUrl.set(null);
      const current = this.session.user();
      if (current) {
        this.session.setUser({ ...current, avatarUrl: null });
      }
      this.showSuccess('Đã xóa ảnh đại diện.');
    } catch (error) {
      this.showError(getApiErrorMessage(error, 'Không xóa được ảnh đại diện.'));
    } finally {
      this.isUploadingAvatar.set(false);
    }
  }

  async onChangePassword(): Promise<void> {
    if (!this.currentPassword || !this.newPassword) {
      this.showError('Vui lòng nhập đủ mật khẩu.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.showError('Mật khẩu xác nhận không khớp.');
      return;
    }

    this.isChangingPassword.set(true);
    this.clearMessages();

    try {
      await firstValueFrom(
        this.usersApi.changeMyPassword({
          currentPassword: this.currentPassword,
          newPassword: this.newPassword,
        }),
      );
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
      this.showSuccess('Đã cập nhật mật khẩu.');
    } catch (error) {
      this.showError(getApiErrorMessage(error, 'Không đổi được mật khẩu.'));
    } finally {
      this.isChangingPassword.set(false);
    }
  }

  private async refreshFromServer(): Promise<void> {
    try {
      const response = await firstValueFrom(this.authApi.getCurrentUser());
      const user = response.data;
      if (!user) return;
      this.applyUser(user);
      this.session.setUser(user);
    } catch {
      // Fall back to whatever session has — silent failure to avoid noise on transient errors.
    }
  }

  private applyUser(user: SessionUser | null): void {
    if (!user) return;
    this.fullName.set(user.fullName ?? '');
    this.email.set(user.email ?? '');
    this.birth.set(user.birth ?? null);
    this.gender.set(user.gender ?? null);
    this.isActive.set(user.isActive ?? true);
    this.avatarUrl.set(user.avatarUrl ?? null);
    this.userId.set(user.id ?? null);
    const code = (user as { code?: string | null }).code;
    this.code.set(code ?? null);
  }

  private clearMessages(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  private showError(message: string): void {
    this.errorMessage.set(message);
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}
