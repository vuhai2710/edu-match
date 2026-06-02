import { Component, HostListener, OnInit, inject, signal, viewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import {
  CreateAddressDto,
  Gender,
  Grade,
  ProvinceDto,
  StudentDetailDto,
  WardDto,
} from '../../../api/generated/client/models';
import { AddressService, StudentsService, UsersService } from '../../../api/generated/client/services';
import { SessionService } from '../../../core/auth/session';
import { getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import { TactileSelectComponent } from '../../../shared/components/tactile-select/tactile-select';

@Component({
  selector: 'app-profile-settings-page',
  imports: [FormsModule, MascotComponent, LucideEye, LucideEyeOff, TactileSelectComponent],
  template: `
    <div class="space-y-6">
      <h1 class="font-display text-2xl font-black text-slate-900">Cài đặt hồ sơ</h1>

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
                  <app-mascot type="studentBackpack" [size]="100" />
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
              <input #avatarInput type="file" accept="image/*" class="hidden" (change)="onAvatarSelected($event)" />
            </div>
            @if (isUploadingAvatar()) {
              <p class="mt-2 text-xs font-bold text-slate-500">Đang tải ảnh...</p>
            }
            <p class="mt-3 font-extrabold text-lg text-slate-900">{{ fullName || 'Học viên' }}</p>
            <p class="text-sm text-slate-500">{{ email || 'user@email.com' }}</p>
          </div>

          <div class="tactile-card p-5">
            <h3 class="font-extrabold text-sm text-slate-800 mb-3">Trạng thái hồ sơ</h3>
            <div class="space-y-2 text-sm font-bold text-slate-600">
              <p>Thông tin cá nhân: {{ fullName && phoneNumber ? 'Đã có' : 'Cần bổ sung' }}</p>
              <p>Địa chỉ: {{ provinceId() && wardCode() ? 'Đã có' : 'Cần bổ sung' }}</p>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 space-y-4">
          <div class="tactile-card p-6 space-y-4">
            <h2 class="font-extrabold text-lg text-slate-900">Thông tin cá nhân</h2>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">
                  Họ và tên <span class="text-red-500">*</span>
                </label>
                <input type="text" [(ngModel)]="fullName" class="tactile-input w-full text-sm font-semibold" />
              </div>
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Email</label>
                <input type="email" [(ngModel)]="email" disabled class="tactile-input w-full text-sm font-semibold bg-slate-50 text-slate-400" />
              </div>
            </div>

            <div class="grid sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Năm sinh</label>
                <input type="number" [(ngModel)]="birth" class="tactile-input w-full text-sm font-semibold" />
              </div>
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Giới tính</label>
                <app-tactile-select 
                  [value]="gender" 
                  (valueChange)="gender = $event"
                  [options]="genderOptions"
                  valueKey="value"
                  labelKey="label"
                  [showPlaceholderOption]="false"
                />
              </div>
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Khối lớp</label>
                <app-tactile-select 
                  [value]="gradeLevel" 
                  (valueChange)="gradeLevel = $event"
                  [options]="gradeOptions"
                  valueKey="value"
                  labelKey="label"
                  [showPlaceholderOption]="false"
                />
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">
                  Số điện thoại <span class="text-red-500">*</span>
                </label>
                <input type="tel" [(ngModel)]="phoneNumber" maxlength="10" class="tactile-input w-full text-sm font-semibold" />
                @if (phoneNumberError()) {
                  <span class="text-xs font-bold text-duo-red mt-1 block">{{ phoneNumberError() }}</span>
                }
              </div>
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Trường</label>
                <input type="text" [(ngModel)]="school" class="tactile-input w-full text-sm font-semibold" />
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">
                  Tỉnh / thành <span class="text-red-500">*</span>
                </label>
                <app-tactile-select
                  [value]="provinceId()"
                  (valueChange)="onProvinceChange($event)"
                  [options]="provinces()"
                  valueKey="provinceId"
                  labelKey="provinceName"
                  placeholder="Chọn tỉnh / thành"
                />
              </div>
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">
                  Phường / xã <span class="text-red-500">*</span>
                </label>
                <app-tactile-select
                  [value]="wardCode()"
                  (valueChange)="wardCode.set($event)"
                  [options]="wards()"
                  valueKey="wardCode"
                  labelKey="wardName"
                  [placeholder]="isLoadingWards() ? 'Đang tải...' : 'Chọn phường / xã'"
                  [disabled]="!provinceId() || isLoadingWards()"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Địa chỉ chi tiết</label>
              <input type="text" [(ngModel)]="addressDetail" class="tactile-input w-full text-sm font-semibold" />
            </div>

            <button (click)="onSave()" [disabled]="isSaving() || !!phoneNumberError()"
                    class="tactile-button-green px-6 py-2.5 rounded-xl text-sm font-extrabold uppercase disabled:opacity-60">
              {{ isSaving() ? 'Đang lưu...' : 'Lưu thay đổi' }}
            </button>
          </div>

          @if (!session.user()?.isGoogleAccount) {
            <div class="tactile-card p-6 space-y-4">
              <h2 class="font-extrabold text-lg text-slate-900">Đổi mật khẩu</h2>
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Mật khẩu hiện tại</label>
                <div class="relative">
                  <input [type]="showCurrentPassword() ? 'text' : 'password'" [(ngModel)]="currentPassword" class="tactile-input w-full text-sm font-semibold pr-12" />
                  <button
                    (click)="showCurrentPassword.set(!showCurrentPassword())"
                    type="button"
                    [attr.aria-label]="showCurrentPassword() ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                    class="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-colors hover:text-slate-700 focus:outline-none"
                  >
                    @if (showCurrentPassword()) {
                      <svg lucideEyeOff class="h-5 w-5"></svg>
                    } @else {
                      <svg lucideEye class="h-5 w-5"></svg>
                    }
                  </button>
                </div>
              </div>
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Mật khẩu mới</label>
                  <div class="relative">
                    <input [type]="showNewPassword() ? 'text' : 'password'" [(ngModel)]="newPassword" (ngModelChange)="onNewPasswordChange()" class="tactile-input w-full text-sm font-semibold pr-12" />
                    <button
                      (click)="showNewPassword.set(!showNewPassword())"
                      type="button"
                      [attr.aria-label]="showNewPassword() ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                      class="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-colors hover:text-slate-700 focus:outline-none"
                    >
                      @if (showNewPassword()) {
                        <svg lucideEyeOff class="h-5 w-5"></svg>
                      } @else {
                        <svg lucideEye class="h-5 w-5"></svg>
                      }
                    </button>
                  </div>
                  @if (newPasswordError()) {
                    <span class="text-xs font-bold text-duo-red mt-1 block">{{ newPasswordError() }}</span>
                  }
                </div>
                <div>
                  <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Xác nhận mật khẩu</label>
                  <div class="relative">
                    <input [type]="showConfirmPassword() ? 'text' : 'password'" [(ngModel)]="confirmPassword" (ngModelChange)="onConfirmPasswordChange()" class="tactile-input w-full text-sm font-semibold pr-12" />
                    <button
                      (click)="showConfirmPassword.set(!showConfirmPassword())"
                      type="button"
                      [attr.aria-label]="showConfirmPassword() ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                      class="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-colors hover:text-slate-700 focus:outline-none"
                    >
                      @if (showConfirmPassword()) {
                        <svg lucideEyeOff class="h-5 w-5"></svg>
                      } @else {
                        <svg lucideEye class="h-5 w-5"></svg>
                      }
                    </button>
                  </div>
                  @if (confirmPasswordError()) {
                    <span class="text-xs font-bold text-duo-red mt-1 block">{{ confirmPasswordError() }}</span>
                  }
                </div>
              </div>
              <button (click)="onChangePassword()" [disabled]="isChangingPassword() || !!newPasswordError() || !!confirmPasswordError()"
                      class="tactile-button-blue px-6 py-2.5 rounded-xl text-sm font-extrabold uppercase disabled:opacity-60">
                {{ isChangingPassword() ? 'Đang cập nhật...' : 'Cập nhật mật khẩu' }}
              </button>
            </div>
          }
        </div>
      </div>

      @if (successMessage()) {
        <div class="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:max-w-sm bg-duo-green text-white px-6 py-3 rounded-2xl font-extrabold shadow-lg z-50 text-center sm:text-left">
          {{ successMessage() }}
        </div>
      }
      @if (errorMessage()) {
        <div class="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:max-w-sm bg-duo-red text-white px-6 py-3 rounded-2xl font-extrabold shadow-lg z-50 text-center sm:text-left">
          {{ errorMessage() }}
        </div>
      }
    </div>
  `,
})
export class ProfileSettingsPage implements OnInit {
  protected readonly session = inject(SessionService);

  fullName = '';
  email = '';
  birth: number | null = null;
  gender = Gender.Male;
  gradeLevel = Grade.Grade12;
  phoneNumber = '';
  school = '';
  addressDetail = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  newPasswordError = signal('');
  confirmPasswordError = signal('');

  phoneNumberError(): string {
    const phone = this.phoneNumber.trim();
    if (!phone) return '';
    if (!phone.startsWith('0')) return 'Số điện thoại phải bắt đầu bằng số 0.';
    if (!/^\d+$/.test(phone)) return 'Số điện thoại chỉ được chứa các chữ số.';
    if (phone.length > 10) return 'Số điện thoại tối đa 10 chữ số.';
    return '';
  }

  onNewPasswordChange(): void {
    if (this.newPassword && this.newPassword.length < 6) {
      this.newPasswordError.set('Mật khẩu mới phải có ít nhất 6 ký tự.');
    } else {
      this.newPasswordError.set('');
    }

    if (this.confirmPassword && this.newPassword !== this.confirmPassword) {
      this.confirmPasswordError.set('Mật khẩu nhập lại không khớp.');
    } else {
      this.confirmPasswordError.set('');
    }
  }

  onConfirmPasswordChange(): void {
    if (this.confirmPassword && this.newPassword !== this.confirmPassword) {
      this.confirmPasswordError.set('Mật khẩu nhập lại không khớp.');
    } else {
      this.confirmPasswordError.set('');
    }
  }

  provinces = signal<ProvinceDto[]>([]);
  wards = signal<WardDto[]>([]);
  provinceId = signal<number | null>(null);
  wardCode = signal<string | null>(null);
  avatarUrl = signal<string | null>(null);
  showAvatarMenu = signal(false);
  isLoadingWards = signal(false);
  isSaving = signal(false);
  isChangingPassword = signal(false);
  isUploadingAvatar = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  protected readonly avatarInput = viewChild<ElementRef<HTMLInputElement>>('avatarInput');

  protected readonly genderOptions = [
    { value: Gender.Male, label: 'Nam' },
    { value: Gender.Female, label: 'Nữ' },
  ];
  protected readonly gradeOptions = [
    { value: Grade.Grade0, label: 'Mầm non' },
    { value: Grade.Grade1, label: 'Lớp 1' },
    { value: Grade.Grade2, label: 'Lớp 2' },
    { value: Grade.Grade3, label: 'Lớp 3' },
    { value: Grade.Grade4, label: 'Lớp 4' },
    { value: Grade.Grade5, label: 'Lớp 5' },
    { value: Grade.Grade6, label: 'Lớp 6' },
    { value: Grade.Grade7, label: 'Lớp 7' },
    { value: Grade.Grade8, label: 'Lớp 8' },
    { value: Grade.Grade9, label: 'Lớp 9' },
    { value: Grade.Grade10, label: 'Lớp 10' },
    { value: Grade.Grade11, label: 'Lớp 11' },
    { value: Grade.Grade12, label: 'Lớp 12' },
    { value: Grade.University, label: 'Đại học' },
    { value: Grade.Other, label: 'Khác' },
  ];

  private readonly studentsApi = inject(StudentsService);
  private readonly usersApi = inject(UsersService);
  private readonly addressApi = inject(AddressService);

  ngOnInit(): void {
    void this.loadProfile();
  }

  @HostListener('document:click')
  protected closeAvatarMenu(): void {
    this.showAvatarMenu.set(false);
  }

  triggerAvatarUpload(): void {
    this.showAvatarMenu.set(false);
    this.avatarInput()?.nativeElement.click();
  }

  async onAvatarSelected(event: Event): Promise<void> {
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

  async onProvinceChange(provinceId: number | null): Promise<void> {
    this.provinceId.set(provinceId);
    this.wardCode.set(null);
    this.wards.set([]);
    if (!provinceId) return;
    await this.loadWards(provinceId);
  }

  async onSave(): Promise<void> {
    const address = this.resolveAddress();
    if (!address) return;

    this.isSaving.set(true);
    this.clearMessages();

    try {
      const response = await firstValueFrom(
        this.studentsApi.updateMyStudentProfile({
          fullName: this.fullName,
          birth: this.birth,
          gender: this.gender,
          school: this.school || null,
          gradeLevel: this.gradeLevel,
          phoneNumber: this.phoneNumber,
          address,
        }),
      );
      const profile = unwrapApiData(response);
      this.applyProfile(profile);
      this.session.setUser({
        ...(this.session.user() ?? {
          id: profile.userId ?? 0,
          fullName: profile.fullName ?? '',
          email: profile.email ?? '',
          role: this.session.role()!,
          isActive: true,
        }),
        fullName: profile.fullName ?? this.fullName,
        email: profile.email ?? this.email,
        school: profile.school,
        birth: profile.birth,
        gender: profile.gender,
      });
      this.showSuccess('Đã lưu hồ sơ.');
    } catch (error) {
      this.showError(getApiErrorMessage(error, 'Không lưu được hồ sơ.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async onChangePassword(): Promise<void> {
    if (this.session.user()?.isGoogleAccount) {
      this.showError('Tài khoản Google không hỗ trợ đổi mật khẩu.');
      return;
    }

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
      this.showCurrentPassword.set(false);
      this.showNewPassword.set(false);
      this.showConfirmPassword.set(false);
      this.showSuccess('Đã cập nhật mật khẩu.');
    } catch (error) {
      this.showError(getApiErrorMessage(error, 'Không đổi được mật khẩu.'));
    } finally {
      this.isChangingPassword.set(false);
    }
  }

  private async loadProfile(): Promise<void> {
    try {
      const [provinceResponse, profileResponse] = await Promise.all([
        firstValueFrom(this.addressApi.getProvinces()),
        firstValueFrom(this.studentsApi.getMyStudentProfile()),
      ]);
      this.provinces.set(provinceResponse.data ?? []);
      const profile = unwrapApiData(profileResponse);
      this.applyProfile(profile);

      if (profile.address?.provinceId) {
        this.provinceId.set(profile.address.provinceId);
        await this.loadWards(profile.address.provinceId, profile.address.wardCode ?? null);
      }
    } catch (error) {
      this.showError(getApiErrorMessage(error, 'Không tải được hồ sơ.'));
    }
  }

  private applyProfile(profile: StudentDetailDto): void {
    this.fullName = profile.fullName ?? '';
    this.email = profile.email ?? '';
    this.birth = profile.birth ?? null;
    this.gender = profile.gender ?? Gender.Male;
    this.gradeLevel = profile.gradeLevel ?? Grade.Grade12;
    this.phoneNumber = profile.phoneNumber ?? '';
    this.school = profile.school ?? '';
    this.addressDetail = profile.address?.addressDetail ?? '';
    this.provinceId.set(profile.address?.provinceId ?? null);
    this.wardCode.set(profile.address?.wardCode ?? null);
    this.avatarUrl.set(profile.avatarUrl ?? null);
  }

  private async loadWards(provinceId: number, selectedWardCode?: string | null): Promise<void> {
    this.isLoadingWards.set(true);
    try {
      const response = await firstValueFrom(this.addressApi.getWards(provinceId));
      this.wards.set(response.data ?? []);
      if (selectedWardCode) {
        this.wardCode.set(selectedWardCode);
      }
    } catch (error) {
      this.showError(getApiErrorMessage(error, 'Không tải được phường / xã.'));
    } finally {
      this.isLoadingWards.set(false);
    }
  }

  private resolveAddress(): CreateAddressDto | null {
    const province = this.provinces().find((item) => item.provinceId === this.provinceId());
    const ward = this.wards().find((item) => item.wardCode === this.wardCode());

    if (!province?.provinceId || !province.provinceName || !ward?.wardCode || !ward.wardName) {
      this.showError('Vui lòng chọn tỉnh / thành và phường / xã.');
      return null;
    }

    return {
      provinceId: province.provinceId,
      provinceName: province.provinceName,
      wardCode: ward.wardCode,
      wardName: ward.wardName,
      addressDetail: this.addressDetail || null,
    };
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
