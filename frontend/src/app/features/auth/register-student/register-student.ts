import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import { AuthApiService, RegisterAddressPayload } from '../../../api/facades/auth-api';
import { AddressService } from '../../../api/generated/client/services';
import { Gender, Grade, ProvinceDto, WardDto } from '../../../api/generated/client/models';
import { SessionService } from '../../../core/auth/session';
import { UserRole } from '../../../core/auth/session.models';
import { getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import { GoogleSignInButtonComponent } from '../../../shared/components/google-sign-in-button/google-sign-in-button';
import { TactileSelectComponent } from '../../../shared/components/tactile-select/tactile-select';

@Component({
  selector: 'app-register-student-page',
  imports: [
    FormsModule,
    RouterLink,
    MascotComponent,
    LucideEye,
    LucideEyeOff,
    GoogleSignInButtonComponent,
    TactileSelectComponent,
  ],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div class="w-full max-w-2xl space-y-6">
        <div class="text-center">
          <app-mascot type="studentBackpack" [size]="80" />
          <h1 class="mt-4 font-display text-3xl font-black text-slate-900">Tạo tài khoản Học viên</h1>
          <p class="mt-1 text-slate-500">Bắt đầu hành trình học tập thông minh.</p>
        </div>

        <form (ngSubmit)="onRegister()" class="tactile-card p-6 sm:p-8 space-y-4">
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">
                Họ và tên <span class="text-red-500">*</span>
              </label>
              <input type="text" [(ngModel)]="fullName" (ngModelChange)="fullNameError.set('')" name="fullName" class="tactile-input w-full text-sm font-semibold" />
              @if (fullNameError()) {
                <span class="text-xs font-bold text-duo-red mt-1 block">{{ fullNameError() }}</span>
              }
            </div>
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">
                Email <span class="text-red-500">*</span>
              </label>
              <input type="email" [(ngModel)]="email" (ngModelChange)="emailError.set('')" name="email" placeholder="user@gmail.com" class="tactile-input w-full text-sm font-semibold" />
              @if (emailError()) {
                <span class="text-xs font-bold text-duo-red mt-1 block">{{ emailError() }}</span>
              }
            </div>
          </div>

          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">
              Mật khẩu <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                [type]="showPassword() ? 'text' : 'password'"
                [(ngModel)]="password"
                (ngModelChange)="onPasswordChange()"
                name="password"
                placeholder="Tối thiểu 6 ký tự"
                class="tactile-input w-full text-sm font-semibold pr-12"
              />
              <button
                (click)="showPassword.set(!showPassword())"
                type="button"
                [attr.aria-label]="showPassword() ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                class="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-colors hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-duo-blue"
              >
                @if (showPassword()) {
                  <svg lucideEyeOff class="h-5 w-5"></svg>
                } @else {
                  <svg lucideEye class="h-5 w-5"></svg>
                }
              </button>
            </div>
            @if (passwordError()) {
              <span class="text-xs font-bold text-duo-red mt-1 block">{{ passwordError() }}</span>
            }
          </div>

          <div class="grid sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">
                Số điện thoại <span class="text-red-500">*</span>
              </label>
              <input
                type="tel"
                [(ngModel)]="phoneNumber"
                (ngModelChange)="phoneError.set('')"
                name="phoneNumber"
                maxlength="10"
                placeholder="0123456789"
                class="tactile-input w-full text-sm font-semibold"
              />
              @if (phoneError()) {
                <span class="text-xs font-bold text-duo-red mt-1 block">{{ phoneError() }}</span>
              }
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
              @if (provinceError()) {
                <span class="text-xs font-bold text-duo-red mt-1 block">{{ provinceError() }}</span>
              }
            </div>
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">
                Phường / xã <span class="text-red-500">*</span>
              </label>
              <app-tactile-select
                [value]="wardCode()"
                (valueChange)="wardCode.set($event); wardError.set('')"
                [options]="wards()"
                valueKey="wardCode"
                labelKey="wardName"
                [placeholder]="isLoadingWards() ? 'Đang tải...' : 'Chọn phường / xã'"
                [disabled]="!provinceId() || isLoadingWards()"
              />
              @if (wardError()) {
                <span class="text-xs font-bold text-duo-red mt-1 block">{{ wardError() }}</span>
              }
            </div>
          </div>

          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Địa chỉ chi tiết</label>
            <input type="text" [(ngModel)]="addressDetail" name="addressDetail" placeholder="Số nhà, tên đường, tòa nhà..."
                   class="tactile-input w-full text-sm font-semibold" />
          </div>

          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Ảnh đại diện</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onAvatarChange($event)"
                   class="tactile-input w-full text-sm font-semibold bg-white" />
            @if (avatarError()) {
              <span class="text-xs font-bold text-duo-red mt-1 block">{{ avatarError() }}</span>
            }
          </div>

          <button type="submit" [disabled]="isSubmitting()"
                  class="tactile-button-green w-full py-3.5 rounded-2xl text-base font-extrabold uppercase disabled:opacity-50 disabled:cursor-not-allowed">
            {{ isSubmitting() ? 'Đang đăng ký...' : 'Đăng ký' }}
          </button>

          @if (errorMessage()) {
            <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">
              {{ errorMessage() }}
            </p>
          }

          <div class="flex items-center gap-4">
            <div class="flex-1 h-px bg-slate-200"></div>
            <span class="text-xs font-bold text-slate-400 uppercase">Hoặc</span>
            <div class="flex-1 h-px bg-slate-200"></div>
          </div>

          <app-google-sign-in-button text="signup_with" (credential)="onGoogleCredential($event)" />
        </form>

        <p class="text-center text-sm text-slate-500">
          Đã có tài khoản? <a routerLink="/auth/login" class="font-extrabold text-[#58cc02] hover:underline">Đăng nhập</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterStudentPage implements OnInit {
  fullName = '';
  email = '';
  password = '';
  phoneNumber = '';
  gender = Gender.Male;
  gradeLevel = Grade.Grade12;
  addressDetail = '';
  avatar: File | null = null;

  showPassword = signal(false);
  fullNameError = signal('');
  emailError = signal('');
  passwordError = signal('');
  phoneError = signal('');
  provinceError = signal('');
  wardError = signal('');
  avatarError = signal('');
  provinces = signal<ProvinceDto[]>([]);
  wards = signal<WardDto[]>([]);
  provinceId = signal<number | null>(null);
  wardCode = signal<string | null>(null);
  isLoadingWards = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal('');

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

  private readonly authApi = inject(AuthApiService);
  private readonly addressApi = inject(AddressService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  onPasswordChange(): void {
    if (this.password && this.password.length < 6) {
      this.passwordError.set('Mật khẩu phải có ít nhất 6 ký tự.');
    } else {
      this.passwordError.set('');
    }
  }

  validatePhone(): boolean {
    const phone = this.phoneNumber.trim();
    if (!phone) {
      this.phoneError.set('Vui lòng nhập số điện thoại.');
      return false;
    }
    if (!phone.startsWith('0')) {
      this.phoneError.set('Số điện thoại phải bắt đầu bằng số 0.');
      return false;
    }
    if (!/^\d+$/.test(phone)) {
      this.phoneError.set('Số điện thoại chỉ được chứa các chữ số.');
      return false;
    }
    if (phone.length > 10) {
      this.phoneError.set('Số điện thoại tối đa 10 chữ số.');
      return false;
    }
    this.phoneError.set('');
    return true;
  }

  ngOnInit(): void {
    void this.loadProvinces();
  }

  async onProvinceChange(provinceId: number | null): Promise<void> {
    this.provinceId.set(provinceId);
    this.wardCode.set(null);
    this.wards.set([]);
    this.provinceError.set('');
    this.wardError.set('');

    if (!provinceId) return;

    this.isLoadingWards.set(true);
    try {
      const response = await firstValueFrom(this.addressApi.getWards(provinceId));
      this.wards.set(response.data ?? []);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được danh sách phường / xã.'));
    } finally {
      this.isLoadingWards.set(false);
    }
  }

  onAvatarChange(event: Event): void {
    this.avatar = this.readFile(event);
    this.avatarError.set('');
    if (this.avatar && this.avatar.size > 5 * 1024 * 1024) {
      this.avatar = null;
      this.avatarError.set('Ảnh đại diện tối đa 5MB.');
    }
  }

  canSubmit(): boolean {
    return (
      Boolean(this.fullName.trim()) &&
      Boolean(this.email.trim()) &&
      Boolean(this.password) &&
      Boolean(this.phoneNumber.trim()) &&
      Boolean(this.provinceId()) &&
      Boolean(this.wardCode())
    );
  }

  async onRegister(): Promise<void> {
    if (!this.validateBasics()) return;

    const address = this.resolveAddress();
    if (!address) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      const response = await firstValueFrom(
        this.authApi.registerStudent({
          fullName: this.fullName,
          email: this.email,
          password: this.password,
          phoneNumber: this.phoneNumber,
          gender: this.gender,
          gradeLevel: this.gradeLevel,
          address,
          avatar: this.avatar,
        }),
      );
      const login = unwrapApiData(response);
      this.session.bootstrapFromLogin(login);
      await this.router.navigateByUrl('/student/dashboard');
    } catch (error) {
      const errMsg = getApiErrorMessage(error, 'Đăng ký học viên thất bại.');
      if (errMsg.toLowerCase().includes('email')) {
        this.emailError.set(errMsg);
      } else if (errMsg.toLowerCase().includes('số điện thoại') || errMsg.toLowerCase().includes('phone')) {
        this.phoneError.set(errMsg);
      } else {
        this.errorMessage.set(errMsg);
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async onGoogleCredential(accessToken: string): Promise<void> {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      const response = await firstValueFrom(
        this.authApi.googleLogin({
          accessToken,
          requestedRole: UserRole.Student,
          registrationIntent: true,
        }),
      );
      const login = unwrapApiData(response);
      this.session.bootstrapFromLogin(login);
      await this.router.navigateByUrl('/student/settings');
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Đăng ký học viên bằng Google thất bại.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async loadProvinces(): Promise<void> {
    try {
      const response = await firstValueFrom(this.addressApi.getProvinces());
      this.provinces.set(response.data ?? []);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được danh sách tỉnh / thành.'));
    }
  }

  private resolveAddress(): RegisterAddressPayload | null {
    this.provinceError.set('');
    this.wardError.set('');

    let hasAddressError = false;
    if (!this.provinceId()) {
      this.provinceError.set('Vui lòng chọn tỉnh / thành.');
      hasAddressError = true;
    }

    const province = this.provinces().find((item) => item.provinceId === this.provinceId());
    const ward = this.wards().find((item) => item.wardCode === this.wardCode());

    if (!this.wardCode()) {
      this.wardError.set('Vui lòng chọn phường / xã.');
      hasAddressError = true;
    }

    if (hasAddressError || !province?.provinceId || !province.provinceName || !ward?.wardCode || !ward.wardName) {
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

  private validateBasics(): boolean {
    let isValid = true;
    this.fullNameError.set('');
    this.emailError.set('');
    this.passwordError.set('');
    this.provinceError.set('');
    this.wardError.set('');

    if (!this.fullName.trim()) {
      this.fullNameError.set('Vui lòng nhập họ và tên.');
      isValid = false;
    }

    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(this.email.trim())) {
      this.emailError.set('Email đăng ký phải là địa chỉ Gmail hợp lệ.');
      isValid = false;
    }

    if (this.password.length < 6) {
      this.passwordError.set('Mật khẩu phải có ít nhất 6 ký tự.');
      isValid = false;
    }

    if (!this.validatePhone()) {
      isValid = false;
    }

    return isValid;
  }

  private readFile(event: Event): File | null {
    const input = event.target as HTMLInputElement;
    return input.files?.item(0) ?? null;
  }
}
