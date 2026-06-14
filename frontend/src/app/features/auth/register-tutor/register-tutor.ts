import { Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import {
  AuthApiService,
  RegisterAddressPayload,
  RegistrationFileUpload,
} from '../../../api/facades/auth-api';
import {
  AcademicDegree,
  EducationLevel,
  Gender,
  ProvinceDto,
  SubjectListItemDto,
  TutorCareerStatus,
  WardDto,
} from '../../../api/generated/client/models';
import { AddressService } from '../../../api/generated/client/services';
import { SessionService } from '../../../core/auth/session';
import { LookupCacheService } from '../../../core/data/lookup-cache';
import { UserRole } from '../../../core/auth/session.models';
import { getApiErrorDetails, getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import { TactileSelectComponent } from '../../../shared/components/tactile-select/tactile-select';

@Component({
  selector: 'app-register-tutor-page',
  imports: [
    FormsModule,
    RouterLink,
    MascotComponent,
    LucideEye,
    LucideEyeOff,
    TactileSelectComponent,
  ],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div class="w-full max-w-3xl space-y-6">
        @if (isRegisteredPending()) {
          <div class="tactile-card p-8 text-center space-y-6 max-w-md mx-auto">
            <div class="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-duo-orange">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-10 h-10">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 class="font-display text-2xl font-black text-slate-800">Đăng ký thành công</h2>
            <p class="text-sm text-slate-600 font-bold leading-relaxed">
              {{ registrationSuccessMessage() || 'Đã gửi yêu cầu đăng ký tài khoản gia sư. Vui lòng chờ quản trị viên phê duyệt hồ sơ của bạn.' }}
            </p>
            <div class="pt-2">
              <a routerLink="/" class="tactile-button-blue block text-center w-full py-3 rounded-xl text-sm font-extrabold uppercase">
                Về trang chủ
              </a>
            </div>
          </div>
        } @else {
          <div class="text-center">
            <app-mascot type="tutorWand" [size]="80" />
            <h1 class="mt-4 font-display text-3xl font-black text-slate-900">Đăng ký Gia sư</h1>
            <p class="mt-1 text-slate-500">Hoàn thiện hồ sơ để học viên có thể tìm thấy bạn.</p>
          </div>

          <div class="flex items-center gap-2 px-2">
            <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-duo-blue rounded-full transition-all duration-500" [style.width.%]="progress()"></div>
            </div>
            <span class="text-xs font-bold text-slate-400">{{ progress() }}%</span>
          </div>

          <form (ngSubmit)="onRegister()" class="tactile-card p-6 sm:p-8 space-y-5">
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

            <div class="grid sm:grid-cols-3 gap-4">
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
import { UserRole } from '../../../core/auth/session.models';
import { getApiErrorDetails, getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import { TactileSelectComponent } from '../../../shared/components/tactile-select/tactile-select';

@Component({
  selector: 'app-register-tutor-page',
  imports: [
    FormsModule,
    RouterLink,
    MascotComponent,
    LucideEye,
    LucideEyeOff,
    TactileSelectComponent,
  ],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div class="w-full max-w-3xl space-y-6">
        @if (isRegisteredPending()) {
          <div class="tactile-card p-8 text-center space-y-6 max-w-md mx-auto">
            <div class="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-duo-orange">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-10 h-10">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 class="font-display text-2xl font-black text-slate-800">Đăng ký thành công</h2>
            <p class="text-sm text-slate-600 font-bold leading-relaxed">
              {{ registrationSuccessMessage() || 'Đã gửi yêu cầu đăng ký tài khoản gia sư. Vui lòng chờ quản trị viên phê duyệt hồ sơ của bạn.' }}
            </p>
            <div class="pt-2">
              <a routerLink="/" class="tactile-button-blue block text-center w-full py-3 rounded-xl text-sm font-extrabold uppercase">
                Về trang chủ
              </a>
            </div>
          </div>
        } @else {
          <div class="text-center">
            <app-mascot type="tutorWand" [size]="80" />
            <h1 class="mt-4 font-display text-3xl font-black text-slate-900">Đăng ký Gia sư</h1>
            <p class="mt-1 text-slate-500">Hoàn thiện hồ sơ để học viên có thể tìm thấy bạn.</p>
          </div>

          <div class="flex items-center gap-2 px-2">
            <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-duo-blue rounded-full transition-all duration-500" [style.width.%]="progress()"></div>
            </div>
            <span class="text-xs font-bold text-slate-400">{{ progress() }}%</span>
          </div>

          <form (ngSubmit)="onRegister()" class="tactile-card p-6 sm:p-8 space-y-5">
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

            <div class="grid sm:grid-cols-3 gap-4">
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
                  #wardSelect
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
              <input type="text" [(ngModel)]="addressDetail" name="addressDetail" class="tactile-input w-full text-sm font-semibold" />
            </div>

            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-2">
                Môn dạy <span class="text-red-500">*</span>
              </label>
              <div class="flex flex-wrap gap-2">
                @for (subject of subjects(); track subject.id) {
                  <button type="button" (click)="toggleSubject(subject.id)"
                          [class]="isSubjectSelected(subject.id)
                            ? 'bg-duo-blue text-white border-duo-blue-dark border-b-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-colors'
                            : 'bg-white border-2 border-slate-200 px-3 py-1.5 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-colors'">
                    {{ subject.name }}
                  </button>
                }
              </div>
              @if (subjectsError()) {
                <span class="text-xs font-bold text-duo-red mt-1 block">{{ subjectsError() }}</span>
              }
            </div>

            <div class="grid sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">
                  Học phí mong muốn / giờ <span class="text-red-500">*</span>
                </label>
                <input type="number" [(ngModel)]="hourlyRate" (ngModelChange)="hourlyRateError.set('')" name="hourlyRate" class="tactile-input w-full text-sm font-semibold" />
                @if (hourlyRateError()) {
                  <span class="text-xs font-bold text-duo-red mt-1 block">{{ hourlyRateError() }}</span>
                }
              </div>
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Trạng thái nghề nghiệp</label>
                <app-tactile-select
                  [value]="careerStatus"
                  (valueChange)="careerStatus = $event"
                  [options]="careerOptions"
                  valueKey="value"
                  labelKey="label"
                  [showPlaceholderOption]="false"
                />
              </div>
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Bằng cấp</label>
                <app-tactile-select
                  [value]="academicDegree"
                  (valueChange)="academicDegree = $event"
                  [options]="degreeOptions"
                  valueKey="value"
                  labelKey="label"
                  [showPlaceholderOption]="false"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">
                Chuyên ngành <span class="text-red-500">*</span>
              </label>
              <input type="text" [(ngModel)]="major" (ngModelChange)="majorError.set('')" name="major" class="tactile-input w-full text-sm font-semibold" />
              @if (majorError()) {
                <span class="text-xs font-bold text-duo-red mt-1 block">{{ majorError() }}</span>
              }
            </div>

            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-2">
                Cấp học có thể dạy <span class="text-red-500">*</span>
              </label>
              <div class="flex flex-wrap gap-2">
                @for (item of teachingLevelOptions; track item.value) {
                  <button type="button" (click)="toggleTeachingLevel(item.value)"
                          [class]="isTeachingLevelSelected(item.value)
                            ? 'bg-duo-green text-white border-duo-green-dark border-b-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-colors'
                            : 'bg-white border-2 border-slate-200 px-3 py-1.5 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-colors'">
                    {{ item.label }}
                  </button>
                }
              </div>
              @if (teachingLevelsError()) {
                <span class="text-xs font-bold text-duo-red mt-1 block">{{ teachingLevelsError() }}</span>
              }
            </div>

            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Giới thiệu bản thân</label>
              <textarea [(ngModel)]="profile" name="profile" rows="3" class="tactile-input w-full text-sm font-semibold resize-none"></textarea>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">
                  Ảnh đại diện <span class="text-red-500">*</span>
                </label>
                @if (!avatar) {
                  <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onAvatarChange($event)"
                         class="tactile-input w-full text-sm font-semibold bg-white" />
                } @else {
                  <div class="tactile-input w-full bg-slate-50 flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-700">
                    <div class="flex items-center gap-2 truncate">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 text-slate-400 shrink-0">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      <span class="truncate">{{ avatar.name }}</span>
                      <span class="text-xs text-slate-400 font-normal shrink-0">({{ formatBytes(avatar.size) }})</span>
                    </div>
                    <button type="button" (click)="clearAvatar()" class="text-slate-400 hover:text-duo-red transition-colors p-1" title="Xóa ảnh">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                }
                @if (avatarError()) {
                  <span class="text-xs font-bold text-duo-red mt-1 block">{{ avatarError() }}</span>
                }
                @if (isUploadingAvatar()) {
                  <span class="text-xs font-bold text-duo-blue mt-1 block">Đang tải ảnh lên...</span>
                } @else if (avatarUpload) {
                  <span class="text-xs font-bold text-duo-green mt-1 block">Ảnh đã sẵn sàng.</span>
                }
              </div>
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">
                  CV <span class="text-red-500">*</span>
                </label>
                @if (!cv) {
                  <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" (change)="onCvChange($event)"
                         class="tactile-input w-full text-sm font-semibold bg-white" />
                } @else {
                  <div class="tactile-input w-full bg-slate-50 flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-700">
                    <div class="flex items-center gap-2 truncate">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 text-slate-400 shrink-0">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <span class="truncate">{{ cv.name }}</span>
                      <span class="text-xs text-slate-400 font-normal shrink-0">({{ formatBytes(cv.size) }})</span>
                    </div>
                    <button type="button" (click)="clearCv()" class="text-slate-400 hover:text-duo-red transition-colors p-1" title="Xóa CV">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                }
                @if (cvError()) {
                  <span class="text-xs font-bold text-duo-red mt-1 block">{{ cvError() }}</span>
                }
                @if (isUploadingCv()) {
                  <span class="text-xs font-bold text-duo-blue mt-1 block">Đang tải CV lên...</span>
                } @else if (cvUpload) {
                  <span class="text-xs font-bold text-duo-green mt-1 block">CV đã sẵn sàng.</span>
                }
              </div>
            </div>

            <button type="submit" [disabled]="isSubmitting()"
                    class="tactile-button-green w-full py-3.5 rounded-2xl text-base font-extrabold uppercase disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isSubmitting() ? 'Đang gửi hồ sơ...' : 'Hoàn tất đăng ký' }}
            </button>


            @if (errorMessage()) {
              <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red text-center">
                {{ errorMessage() }}
              </p>
            }
          </form>

          <p class="text-center text-sm text-slate-500">
            Đã có tài khoản? <a routerLink="/auth/login" class="font-extrabold text-[#58cc02] hover:underline">Đăng nhập</a>
          </p>
        }
      </div>
    </div>
  `,
})
export class RegisterTutorPage implements OnInit {
  fullName = '';
  email = '';
  password = '';
  phoneNumber = '';
  gender = Gender.Male;
  addressDetail = '';
  hourlyRate: number | null = null;
  profile = '';
  careerStatus = TutorCareerStatus.Student;
  academicDegree = AcademicDegree.University;
  major = '';
  avatar: File | null = null;
  cv: File | null = null;
  avatarUpload: RegistrationFileUpload | null = null;
  cvUpload: RegistrationFileUpload | null = null;

  wardSelect = viewChild<TactileSelectComponent>('wardSelect');

  showPassword = signal(false);
  fullNameError = signal('');
  emailError = signal('');
  passwordError = signal('');
  phoneError = signal('');
  provinceError = signal('');
  wardError = signal('');
  subjectsError = signal('');
  hourlyRateError = signal('');
  majorError = signal('');
  teachingLevelsError = signal('');
  avatarError = signal('');
  cvError = signal('');

  provinces = signal<ProvinceDto[]>([]);
  wards = signal<WardDto[]>([]);
  subjects = signal<SubjectListItemDto[]>([]);
  selectedSubjectIds = signal<number[]>([]);
  selectedTeachingLevels = signal<EducationLevel[]>([EducationLevel.HighSchool]);
  provinceId = signal<number | null>(null);
  wardCode = signal<string | null>(null);
  isLoadingWards = signal(false);
  isSubmitting = signal(false);
  isUploadingAvatar = signal(false);
  isUploadingCv = signal(false);
  errorMessage = signal('');
  isRegisteredPending = signal(false);
  registrationSuccessMessage = signal('');

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

  protected readonly genderOptions = [
    { value: Gender.Male, label: 'Nam' },
    { value: Gender.Female, label: 'Nữ' },
  ];
  protected readonly careerOptions = [
    { value: TutorCareerStatus.Student, label: 'Sinh viên' },
    { value: TutorCareerStatus.Graduated, label: 'Đã tốt nghiệp' },
    { value: TutorCareerStatus.Teacher, label: 'Giáo viên' },
  ];
  protected readonly degreeOptions = [
    { value: AcademicDegree.Intermediate, label: 'Trung cấp' },
    { value: AcademicDegree.College, label: 'Cao đẳng' },
    { value: AcademicDegree.University, label: 'Đại học' },
  ];
  protected readonly teachingLevelOptions = [
    { value: EducationLevel.PrimarySchool, label: 'Tiểu học' },
    { value: EducationLevel.SecondarySchool, label: 'THCS' },
    { value: EducationLevel.HighSchool, label: 'THPT' },
    { value: EducationLevel.College, label: 'Cao đẳng' },
    { value: EducationLevel.University, label: 'Đại học' },
  ];

  private readonly authApi = inject(AuthApiService);
  private readonly addressApi = inject(AddressService);
  private readonly lookupCache = inject(LookupCacheService);
  private readonly session = inject(SessionService);
    this.selectedSubjectIds.update((current) =>
      current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId],
    );
  }

  isSubjectSelected(subjectId?: number): boolean {
    return Boolean(subjectId && this.selectedSubjectIds().includes(subjectId));
  }

  toggleTeachingLevel(level: EducationLevel): void {
    this.teachingLevelsError.set('');
    this.selectedTeachingLevels.update((current) =>
      current.includes(level)
        ? current.filter((item) => item !== level)
        : [...current, level],
    );
  }

  isTeachingLevelSelected(level: EducationLevel): boolean {
    return this.selectedTeachingLevels().includes(level);
  }

  async onAvatarChange(event: Event): Promise<void> {
    this.avatar = this.readFile(event);
    this.avatarUpload = null;
    this.avatarError.set('');
    if (this.avatar && this.avatar.size > 5 * 1024 * 1024) {
      this.avatar = null;
      this.avatarError.set('Ảnh đại diện tối đa 5MB.');
    }
    if (this.avatar) {
      await this.uploadAvatar();
    }
  }

  async onCvChange(event: Event): Promise<void> {
    this.cv = this.readFile(event);
    this.cvUpload = null;
    this.cvError.set('');
    if (this.cv && this.cv.size > 10 * 1024 * 1024) {
      this.cv = null;
      this.cvError.set('CV tối đa 10MB.');
    }
    if (this.cv) {
      await this.uploadCv();
    }
  }

  clearAvatar(): void {
    this.avatar = null;
    this.avatarUpload = null;
    this.avatarError.set('');
  }

  clearCv(): void {
    this.cv = null;
    this.cvUpload = null;
    this.cvError.set('');
  }

  private async uploadAvatar(): Promise<void> {
    if (!this.avatar || this.isUploadingAvatar()) return;

    this.isUploadingAvatar.set(true);
    this.avatarError.set('');
    try {
      const response = await firstValueFrom(this.authApi.uploadRegistrationAvatar(this.avatar));
      this.avatarUpload = unwrapApiData(response);
    } catch (error) {
      this.avatarUpload = null;
      this.avatarError.set(getApiErrorMessage(error, 'Không tải được ảnh đại diện.'));
    } finally {
      this.isUploadingAvatar.set(false);
    }
  }

  private async uploadCv(): Promise<void> {
    if (!this.cv || this.isUploadingCv()) return;

    this.isUploadingCv.set(true);
    this.cvError.set('');
    try {
      const response = await firstValueFrom(this.authApi.uploadRegistrationCv(this.cv));
      this.cvUpload = unwrapApiData(response);
    } catch (error) {
      this.cvUpload = null;
      this.cvError.set(getApiErrorMessage(error, 'Không tải được CV.'));
    } finally {
      this.isUploadingCv.set(false);
    }
  }

  private async ensureUploadsReady(): Promise<void> {
    if (!this.avatarUpload) {
      await this.uploadAvatar();
    }
    if (!this.cvUpload) {
      await this.uploadCv();
    }
  }

  canSubmit(): boolean {
    return (
      Boolean(this.fullName.trim()) &&
      Boolean(this.email.trim()) &&
      Boolean(this.password) &&
      Boolean(this.phoneNumber.trim()) &&
      Boolean(this.provinceId()) &&
      Boolean(this.wardCode()) &&
      Boolean(this.hourlyRate && this.hourlyRate > 0) &&
      Boolean(this.major.trim()) &&
      this.selectedSubjectIds().length > 0 &&
      this.selectedTeachingLevels().length > 0 &&
      Boolean(this.avatarUpload) &&
      Boolean(this.cvUpload) &&
      !this.isUploadingAvatar() &&
      !this.isUploadingCv()
    );
  }

  async onRegister(): Promise<void> {
    if (!this.validateBasics()) return;

    const address = this.resolveAddress();
    if (!address || !this.avatar || !this.cv || !this.hourlyRate) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      await this.ensureUploadsReady();
      if (!this.avatarUpload || !this.cvUpload) {
        return;
      }

      const response = await firstValueFrom(
        this.authApi.registerTutorComplete({
          fullName: this.fullName,
          email: this.email,
          password: this.password,
          phoneNumber: this.phoneNumber,
          gender: this.gender,
          address,
          profile: this.profile || null,
          hourlyRate: this.hourlyRate,
          subjectIds: this.selectedSubjectIds(),
          teachingLevels: this.selectedTeachingLevels(),
          careerStatus: this.careerStatus,
          major: this.major,
          academicDegree: this.academicDegree,
          avatarFileId: this.avatarUpload.fileId,
          avatarUploadToken: this.avatarUpload.uploadToken,
          cvFileId: this.cvUpload.fileId,
          cvUploadToken: this.cvUpload.uploadToken,
        }),
      );

      if (!response.success) {
        if (response.message.includes('phê duyệt hồ sơ') || response.message.includes('quản trị viên phê duyệt')) {
          this.registrationSuccessMessage.set(response.message);
          this.isRegisteredPending.set(true);
          return;
        }
        throw new Error(response.message);
      }

      const login = unwrapApiData(response);
      this.session.bootstrapFromLogin(login);
      await this.router.navigateByUrl('/tutor/dashboard');
    } catch (error) {
      const errMsg = getApiErrorMessage(error, 'Đăng ký gia sư thất bại.');
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

  progress(): number {
    let value = 0;
    if (this.fullName.trim()) value += 10;
    if (this.email.trim()) value += 10;
    if (this.password.length >= 6) value += 10;
    if (this.phoneNumber.trim()) value += 10;
    if (this.provinceId() && this.wardCode()) value += 10;
    if (this.selectedSubjectIds().length > 0) value += 15;
    if (this.hourlyRate && this.hourlyRate > 0) value += 10;
    if (this.major.trim()) value += 10;
    if (this.avatar && this.cv) value += 15;
    return Math.min(value, 100);
  }

  private async loadInitialData(): Promise<void> {
    try {
      const [provinceResponse, subjectResponse] = await Promise.all([
        this.lookupCache.getProvinces(),
        this.lookupCache.getSubjects(),
      ]);
      this.provinces.set(provinceResponse);
      this.subjects.set(subjectResponse);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được dữ liệu đăng ký.'));
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
    this.subjectsError.set('');
    this.hourlyRateError.set('');
    this.majorError.set('');
    this.teachingLevelsError.set('');
    this.avatarError.set('');
    this.cvError.set('');

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

    if (this.selectedSubjectIds().length === 0) {
      this.subjectsError.set('Vui lòng chọn ít nhất một môn dạy.');
      isValid = false;
    }

    if (!this.hourlyRate || this.hourlyRate <= 0) {
      this.hourlyRateError.set('Vui lòng nhập mức học phí hợp lệ.');
      isValid = false;
    }

    if (!this.major.trim()) {
      this.majorError.set('Vui lòng nhập chuyên ngành.');
      isValid = false;
    }

    if (this.selectedTeachingLevels().length === 0) {
      this.teachingLevelsError.set('Vui lòng chọn ít nhất một cấp học.');
      isValid = false;
    }

    if (!this.avatar) {
      this.avatarError.set('Vui lòng tải lên ảnh đại diện.');
      isValid = false;
    }

    if (!this.cv) {
      this.cvError.set('Vui lòng tải lên CV.');
      isValid = false;
    }

    return isValid;
  }

  private readFile(event: Event): File | null {
    const input = event.target as HTMLInputElement;
    return input.files?.item(0) ?? null;
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}
