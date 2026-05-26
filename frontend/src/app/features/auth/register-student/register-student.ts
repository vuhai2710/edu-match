import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthApiService, RegisterAddressPayload } from '../../../api/facades/auth-api';
import { AddressService } from '../../../api/generated/client/services';
import { Gender, ProvinceDto, WardDto } from '../../../api/generated/client/models';
import { SessionService } from '../../../core/auth/session';
import { UserRole } from '../../../core/auth/session.models';
import { getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import { GoogleSignInButtonComponent } from '../../../shared/components/google-sign-in-button/google-sign-in-button';

@Component({
  selector: 'app-register-student-page',
  imports: [FormsModule, RouterLink, MascotComponent, GoogleSignInButtonComponent],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div class="w-full max-w-2xl space-y-6">
        <div class="text-center">
          <app-mascot type="studentBackpack" [size]="80" />
          <h1 class="mt-4 font-display text-3xl font-black text-slate-900">Tạo tài khoản Học viên</h1>
          <p class="mt-1 text-slate-500">Bắt đầu hành trình học tập thông minh.</p>
        </div>

        <div class="tactile-card p-6 sm:p-8 space-y-4">
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Họ và tên</label>
              <input type="text" [(ngModel)]="fullName" class="tactile-input w-full text-sm font-semibold" />
            </div>
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Số điện thoại</label>
              <input type="tel" [(ngModel)]="phoneNumber" class="tactile-input w-full text-sm font-semibold" />
            </div>
          </div>

          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Email</label>
              <input type="email" [(ngModel)]="email" class="tactile-input w-full text-sm font-semibold" />
            </div>
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Giới tính</label>
              <select [(ngModel)]="gender" class="tactile-input w-full text-sm font-semibold bg-white">
                @for (item of genderOptions; track item.value) {
                  <option [ngValue]="item.value">{{ item.label }}</option>
                }
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Mật khẩu</label>
            <input type="password" [(ngModel)]="password" placeholder="Tối thiểu 8 ký tự" class="tactile-input w-full text-sm font-semibold" />
            <div class="mt-2 flex items-center gap-2">
              <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                @for (i of [0,1,2,3]; track i) {
                  <div class="flex-1 rounded-full transition-colors" [class]="i < strength() ? strengthColor() : 'bg-slate-200'"></div>
                }
              </div>
              <span class="text-xs font-bold text-slate-500">{{ strengthLabel() }}</span>
            </div>
          </div>

          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Tỉnh / thành</label>
              <select [ngModel]="provinceId()" (ngModelChange)="onProvinceChange($event)"
                      class="tactile-input w-full text-sm font-semibold bg-white">
                <option [ngValue]="null">Chọn tỉnh / thành</option>
                @for (province of provinces(); track province.provinceId) {
                  <option [ngValue]="province.provinceId">{{ province.provinceName }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Phường / xã</label>
              <select [ngModel]="wardCode()" (ngModelChange)="wardCode.set($event)"
                      class="tactile-input w-full text-sm font-semibold bg-white"
                      [disabled]="!provinceId() || isLoadingWards()">
                <option [ngValue]="null">{{ isLoadingWards() ? 'Đang tải...' : 'Chọn phường / xã' }}</option>
                @for (ward of wards(); track ward.wardCode) {
                  <option [ngValue]="ward.wardCode">{{ ward.wardName }}</option>
                }
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Địa chỉ chi tiết</label>
            <input type="text" [(ngModel)]="addressDetail" placeholder="Số nhà, tên đường, tòa nhà..."
                   class="tactile-input w-full text-sm font-semibold" />
          </div>

          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Ảnh đại diện (không bắt buộc)</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onAvatarChange($event)"
                   class="tactile-input w-full text-sm font-semibold bg-white" />
          </div>

          <button (click)="onRegister()" [disabled]="!canSubmit() || isSubmitting()"
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
        </div>

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
  addressDetail = '';
  avatar: File | null = null;

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

  private readonly authApi = inject(AuthApiService);
  private readonly addressApi = inject(AddressService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected strength = computed(() => {
    const p = this.password;
    let score = 0;
    if (p.length >= 4) score++;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  });
  protected strengthColor = computed(() => ['bg-duo-red', 'bg-duo-orange', 'bg-duo-yellow', 'bg-duo-green'][this.strength() - 1] ?? 'bg-slate-200');
  protected strengthLabel = computed(() => ['Yếu', 'Trung bình', 'Khá tốt', 'Mạnh'][this.strength() - 1] ?? '');

  ngOnInit(): void {
    void this.loadProvinces();
  }

  async onProvinceChange(provinceId: number | null): Promise<void> {
    this.provinceId.set(provinceId);
    this.wardCode.set(null);
    this.wards.set([]);

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
    if (this.avatar && this.avatar.size > 5 * 1024 * 1024) {
      this.avatar = null;
      this.errorMessage.set('Ảnh đại diện tối đa 5MB.');
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
          address,
          avatar: this.avatar,
        }),
      );
      const login = unwrapApiData(response);
      this.session.bootstrapFromLogin(login);
      await this.router.navigateByUrl('/student/dashboard');
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Đăng ký học viên thất bại.'));
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
    const province = this.provinces().find((item) => item.provinceId === this.provinceId());
    const ward = this.wards().find((item) => item.wardCode === this.wardCode());

    if (!province?.provinceId || !province.provinceName || !ward?.wardCode || !ward.wardName) {
      this.errorMessage.set('Vui lòng chọn tỉnh / thành và phường / xã.');
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
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(this.email.trim())) {
      this.errorMessage.set('Email đăng ký phải là địa chỉ Gmail hợp lệ.');
      return false;
    }

    if (this.password.length < 6) {
      this.errorMessage.set('Mật khẩu phải có ít nhất 6 ký tự.');
      return false;
    }

    if (!/^0\d{9}$/.test(this.phoneNumber.trim())) {
      this.errorMessage.set('Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số.');
      return false;
    }

    return true;
  }

  private readFile(event: Event): File | null {
    const input = event.target as HTMLInputElement;
    return input.files?.item(0) ?? null;
  }
}
