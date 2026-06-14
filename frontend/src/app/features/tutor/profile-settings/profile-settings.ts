import { Component, ElementRef, HostListener, OnInit, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import {
  AcademicDegree,
  CreateAddressDto,
  EducationLevel,
  Gender,
  ProvinceDto,
  ReviewDto,
  SubjectListItemDto,
  TutorCareerStatus,
  TutorDetailDto,
  UpdateTutorSubjectDto,
  WardDto,
} from '../../../api/generated/client/models';
import {
  AddressService,
  SubjectsService,
  TutorsService,
  UsersService,
  ReviewsService,
} from '../../../api/generated/client/services';
import { SessionService } from '../../../core/auth/session';
import { getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import { TactileSelectComponent } from '../../../shared/components/tactile-select/tactile-select';

@Component({
  selector: 'app-tutor-profile-settings-page',
  imports: [FormsModule, MascotComponent, LucideEye, LucideEyeOff, TactileSelectComponent, DatePipe],
  template: `
    <div class="space-y-6">
      <h1 class="font-display text-2xl font-black text-slate-900">Hồ sơ gia sư</h1>

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
                  <app-mascot type="tutorWand" [size]="100" />
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
            <p class="mt-3 font-extrabold text-lg text-slate-900">{{ fullName || 'Gia sư' }}</p>
            <p class="text-sm text-slate-500">{{ email || 'user@email.com' }}</p>
            @if (rating() > 0) {
              <p class="mt-2 text-sm font-bold text-amber-500">★ {{ rating().toFixed(1) }} · {{ totalReviews() }} đánh giá</p>
            }
          </div>

          <div class="tactile-card p-5">
            <h3 class="font-extrabold text-sm text-slate-800 mb-3">Trạng thái hồ sơ</h3>
            <div class="space-y-2 text-sm font-bold text-slate-600">
              <p>Thông tin cá nhân: {{ fullName && phoneNumber ? 'Đã có' : 'Cần bổ sung' }}</p>
              <p>Địa chỉ: {{ provinceId() && wardCode() ? 'Đã có' : 'Cần bổ sung' }}</p>
              <p>Môn dạy: {{ selectedSubjectIds().length > 0 ? selectedSubjectIds().length + ' môn' : 'Cần bổ sung' }}</p>
              <p>Cấp dạy: {{ selectedLevels().length > 0 ? selectedLevels().length + ' cấp' : 'Cần bổ sung' }}</p>
          </div>
          </div>

          <!-- Recent Reviews Card -->
          <div class="tactile-card p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-extrabold text-sm text-slate-800">Đánh giá gần đây</h3>
              @if (totalReviews() > 0) {
                <button type="button" (click)="showAllReviews.set(true)"
                        class="text-xs font-bold text-[#58cc02] hover:underline">
                  Xem tất cả
                </button>
              }
            </div>

            @if (isLoadingReviews()) {
              <p class="text-xs text-slate-400 font-semibold text-center py-3">Đang tải...</p>
            } @else if (recentReviews().length === 0) {
              <p class="text-xs text-slate-400 font-semibold text-center py-3">Chưa có đánh giá nào.</p>
            } @else {
              <div class="space-y-3">
                @for (review of recentReviews(); track review.id) {
                  <div class="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="font-extrabold text-xs text-slate-800 truncate">{{ review.studentName || 'Học viên' }}</span>
                      <span class="text-amber-500 font-bold text-xs shrink-0 ml-1">
                        @for (star of getStars(review.rating ?? 0); track $index) {
                          <span>★</span>
                        }
                      </span>
                    </div>
                    <div class="text-xs text-slate-500 font-semibold">
                      {{ review.classCode || '—' }}
                      @if (review.subjectName) { · {{ review.subjectName }} }
                    </div>
                    <div class="text-xs text-slate-400">
                      {{ review.createdAt | date:'dd/MM/yyyy' }}
                    </div>
                  </div>
                }
              </div>
            }
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
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">
                  Số điện thoại <span class="text-red-500">*</span>
                </label>
                <input type="tel" [(ngModel)]="phoneNumber" maxlength="10" class="tactile-input w-full text-sm font-semibold" />
                @if (phoneNumberError()) {
                  <span class="text-xs font-bold text-duo-red mt-1 block">{{ phoneNumberError() }}</span>
                }
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Trường / Đơn vị công tác</label>
                <input type="text" [(ngModel)]="school" class="tactile-input w-full text-sm font-semibold" />
              </div>
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">
                  Học phí / giờ (VND) <span class="text-red-500">*</span>
                </label>
                <input type="number" [(ngModel)]="hourlyRate" class="tactile-input w-full text-sm font-semibold" />
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
                  #wardSelect
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
          </div>

          <div class="tactile-card p-6 space-y-4">
            <h2 class="font-extrabold text-lg text-slate-900">Thông tin chuyên môn</h2>

            <div class="grid sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Tình trạng nghề</label>
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
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Học vị</label>
                <app-tactile-select 
                  [value]="academicDegree" 
                  (valueChange)="academicDegree = $event"
                  [options]="degreeOptions"
                  valueKey="value"
                  labelKey="label"
                  [showPlaceholderOption]="false"
                />
              </div>
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">
                  Chuyên ngành <span class="text-red-500">*</span>
                </label>
                <input type="text" [(ngModel)]="major" class="tactile-input w-full text-sm font-semibold" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Giới thiệu bản thân</label>
              <textarea [(ngModel)]="profile" rows="4" class="tactile-input w-full text-sm font-semibold"></textarea>
            </div>

            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-2">Cấp dạy</label>
              <div class="flex flex-wrap gap-2">
                @for (level of levelOptions; track level.value) {
                  <button type="button"
                          (click)="toggleLevel(level.value)"
                          [class]="isLevelSelected(level.value)
                            ? 'px-3 py-1.5 rounded-full text-xs font-extrabold bg-duo-blue text-white border-b-2 border-duo-blue-dark'
                            : 'px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200'">
                    {{ level.label }}
                  </button>
                }
              </div>
            </div>

            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-2">Môn dạy</label>
              <div class="flex flex-wrap gap-2">
                @for (subject of subjects(); track subject.id) {
                  <button type="button"
                          (click)="toggleSubject(subject.id!)"
                          [class]="isSubjectSelected(subject.id!)
                            ? 'px-3 py-1.5 rounded-full text-xs font-extrabold bg-duo-green text-white border-b-2 border-[#4b9b04]'
                            : 'px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200'">
                    {{ subject.name }}
                  </button>
                }
                @if (subjects().length === 0) {
                  <p class="text-sm text-slate-500">Đang tải môn học...</p>
                }
              </div>
            </div>

            <button (click)="onSave()" [disabled]="isSaving() || !!phoneNumberError()"
                    class="tactile-button-green px-6 py-2.5 rounded-xl text-sm font-extrabold uppercase disabled:opacity-60">
              {{ isSaving() ? 'Đang lưu...' : 'Lưu thay đổi' }}
            </button>
          </div>

          <div class="tactile-card p-6 space-y-4">
            <h2 class="font-extrabold text-lg text-slate-900">CV / Hồ sơ năng lực</h2>
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-duo-blue/10 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-duo-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                @if (cvUrl()) {
                  <a [href]="cvUrl()!" target="_blank" rel="noopener"
                     class="font-bold text-sm text-duo-blue hover:underline break-all">
                    Xem CV hiện tại
                  </a>
                } @else {
                  <p class="font-bold text-sm text-slate-700">Chưa có CV</p>
                  <p class="text-xs text-slate-500 mt-0.5">Tải lên file PDF hoặc Word để học viên xem.</p>
                }
              </div>
            </div>

            <input #cvInput type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                   class="hidden" (change)="onCvSelected($event)" />

            <div class="flex flex-wrap gap-2">
              <button type="button" (click)="triggerCvUpload()" [disabled]="isUploadingCv()"
                      class="tactile-button-blue px-5 py-2 rounded-xl text-sm font-extrabold uppercase disabled:opacity-60">
                {{ isUploadingCv() ? 'Đang tải...' : (cvUrl() ? 'Đổi CV' : 'Tải CV') }}
              </button>
              @if (cvUrl()) {
                <button type="button" (click)="onDeleteCv()" [disabled]="isUploadingCv()"
                        class="px-5 py-2 rounded-xl border-2 border-red-200 text-duo-red font-extrabold text-sm uppercase hover:bg-red-50 disabled:opacity-60">
                  Xóa CV
                </button>
              }
            </div>
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

      <!-- All Reviews Modal -->
      @if (showAllReviews()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
             (click)="showAllReviews.set(false)">
          <div class="bg-white rounded-3xl border-2 border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden"
               (click)="$event.stopPropagation()">
            <!-- Modal Header -->
            <div class="relative px-6 py-5 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 class="font-display font-black text-xl text-slate-800">
                Tất cả đánh giá · {{ totalReviews() }}
              </h3>
              <button type="button" (click)="showAllReviews.set(false)"
                      class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <!-- Modal Body -->
            <div class="px-6 py-5 space-y-3 max-h-[65vh] overflow-y-auto">
              @if (allReviews().length === 0) {
                <p class="text-center text-slate-400 font-bold py-8">Chưa có đánh giá nào.</p>
              } @else {
                @for (review of allReviews(); track review.id) {
                  <div class="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2">
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex-1 min-w-0">
                        <p class="font-extrabold text-sm text-slate-800 truncate">{{ review.studentName || 'Học viên' }}</p>
                        <p class="text-xs text-slate-500 font-semibold mt-0.5">
                          {{ review.classCode || '—' }}
                          @if (review.subjectName) { · {{ review.subjectName }} }
                        </p>
                      </div>
                      <div class="shrink-0 flex flex-col items-end gap-0.5">
                        <span class="text-amber-500 font-bold text-sm">
                          @for (star of getStars(review.rating ?? 0); track $index) { ★ }
                        </span>
                        <span class="text-xs text-slate-400">{{ review.createdAt | date:'dd/MM/yyyy' }}</span>
                      </div>
                    </div>
                    @if (review.comment) {
                      <p class="text-sm text-slate-600 leading-relaxed border-t border-slate-200 pt-2">{{ review.comment }}</p>
                    }
                  </div>
                }
              }
            </div>
            <!-- Modal Footer -->
            <div class="px-6 py-4 bg-slate-50 border-t-2 border-slate-100 flex justify-end">
              <button type="button" (click)="showAllReviews.set(false)"
                      class="tactile-button-gray px-5 py-2.5 rounded-xl text-sm font-bold">
                Đóng
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class TutorProfileSettingsPage implements OnInit {
  protected readonly session = inject(SessionService);

  fullName = '';
  email = '';
  birth: number | null = null;
  gender = Gender.Male;
  phoneNumber = '';
  school = '';
  hourlyRate = 0;
  addressDetail = '';
  profile = '';
  major = '';
  careerStatus = TutorCareerStatus.Student;
  academicDegree = AcademicDegree.University;
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
  subjects = signal<SubjectListItemDto[]>([]);
  provinceId = signal<number | null>(null);
  wardCode = signal<string | null>(null);
  selectedSubjectIds = signal<number[]>([]);
  selectedLevels = signal<EducationLevel[]>([]);
  avatarUrl = signal<string | null>(null);
  cvUrl = signal<string | null>(null);
  showAvatarMenu = signal(false);
  rating = signal(0);
  totalReviews = signal(0);
  isLoadingWards = signal(false);
  isSaving = signal(false);
  isChangingPassword = signal(false);
  isUploadingAvatar = signal(false);
  isUploadingCv = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  allReviews = signal<ReviewDto[]>([]);
  recentReviews = signal<ReviewDto[]>([]);
  isLoadingReviews = signal(false);
  showAllReviews = signal(false);

  protected readonly avatarInput = viewChild<ElementRef<HTMLInputElement>>('avatarInput');
  protected readonly cvInput = viewChild<ElementRef<HTMLInputElement>>('cvInput');
  wardSelect = viewChild<TactileSelectComponent>('wardSelect');

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
  protected readonly levelOptions = [
    { value: EducationLevel.Preschool, label: 'Mầm non' },
    { value: EducationLevel.PrimarySchool, label: 'Tiểu học' },
    { value: EducationLevel.SecondarySchool, label: 'THCS' },
    { value: EducationLevel.HighSchool, label: 'THPT' },
    { value: EducationLevel.College, label: 'Cao đẳng' },
    { value: EducationLevel.University, label: 'Đại học' },
  ];

  private readonly tutorsApi = inject(TutorsService);
  private readonly usersApi = inject(UsersService);
  private readonly addressApi = inject(AddressService);
  private readonly subjectsApi = inject(SubjectsService);
  private readonly reviewsApi = inject(ReviewsService);

  ngOnInit(): void {
    void this.loadProfile();
  }

  getStars(rating: number): number[] {
    return Array.from({ length: Math.max(0, Math.min(5, Math.round(rating))) });
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

  triggerCvUpload(): void {
    this.cvInput()?.nativeElement.click();
  }

  async onCvSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploadingCv.set(true);
    this.clearMessages();

    try {
      const response = await firstValueFrom(this.tutorsApi.updateMyCv(file));
      this.cvUrl.set(response.data?.filePath ?? null);
      this.showSuccess('Đã cập nhật CV.');
    } catch (error) {
      this.showError(getApiErrorMessage(error, 'Không tải được CV.'));
    } finally {
      this.isUploadingCv.set(false);
      input.value = '';
    }
  }

  async onDeleteCv(): Promise<void> {
    this.isUploadingCv.set(true);
    this.clearMessages();

    try {
      await firstValueFrom(this.tutorsApi.deleteMyCv());
      this.cvUrl.set(null);
      this.showSuccess('Đã xóa CV.');
    } catch (error) {
      this.showError(getApiErrorMessage(error, 'Không xóa được CV.'));
    } finally {
      this.isUploadingCv.set(false);
    }
  }

  async onProvinceChange(provinceId: number | null): Promise<void> {
    this.provinceId.set(provinceId);
    this.wardCode.set(null);
    this.wards.set([]);
    if (!provinceId) return;
    await this.loadWards(provinceId);
    setTimeout(() => {
      this.wardSelect()?.openDropdown();
    }, 0);
  }

  toggleLevel(level: EducationLevel): void {
    const current = this.selectedLevels();
    this.selectedLevels.set(
      current.includes(level) ? current.filter((l) => l !== level) : [...current, level],
    );
  }

  isLevelSelected(level: EducationLevel): boolean {
    return this.selectedLevels().includes(level);
  }

  toggleSubject(id: number): void {
    const current = this.selectedSubjectIds();
    this.selectedSubjectIds.set(
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id],
    );
  }

  isSubjectSelected(id: number): boolean {
    return this.selectedSubjectIds().includes(id);
  }

  async onSave(): Promise<void> {
    const address = this.resolveAddress();
    if (!address) return;

    this.isSaving.set(true);
    this.clearMessages();

    const subjects: UpdateTutorSubjectDto[] = this.selectedSubjectIds().map((subjectId) => ({
      subjectId,
    }));

    try {
      const response = await firstValueFrom(
        this.tutorsApi.updateMyTutorProfile({
          fullName: this.fullName,
          birth: this.birth,
          gender: this.gender,
          profile: this.profile || null,
          hourlyRate: this.hourlyRate || 0,
          phoneNumber: this.phoneNumber,
          school: this.school || null,
          address,
          careerStatus: this.careerStatus,
          major: this.major || null,
          academicDegree: this.academicDegree,
          teachingLevels: this.selectedLevels(),
          subjects,
        }),
      );
      const tutor = unwrapApiData(response);
      this.applyProfile(tutor);
      this.session.setUser({
        ...(this.session.user() ?? {
          id: tutor.userId ?? 0,
          fullName: tutor.fullName ?? '',
          email: tutor.email ?? '',
          role: this.session.role()!,
          isActive: true,
        }),
        fullName: tutor.fullName ?? this.fullName,
        email: tutor.email ?? this.email,
        school: tutor.school,
        birth: tutor.birth,
        gender: tutor.gender,
        avatarUrl: tutor.avatarUrl,
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
      const [provinceResponse, subjectsResponse, profileResponse] = await Promise.all([
        firstValueFrom(this.addressApi.getProvinces()),
        firstValueFrom(this.subjectsApi.getSubjects()),
        firstValueFrom(this.tutorsApi.getMyTutorProfile()),
      ]);
      this.provinces.set(provinceResponse.data ?? []);
      this.subjects.set(subjectsResponse.data ?? []);
      const tutor = unwrapApiData(profileResponse);
      this.applyProfile(tutor);

      if (tutor.address?.provinceId) {
        this.provinceId.set(tutor.address.provinceId);
        await this.loadWards(tutor.address.provinceId, tutor.address.wardCode ?? null);
      }

      if (tutor.id) {
        void this.loadReviews(tutor.id);
      }
    } catch (error) {
      this.showError(getApiErrorMessage(error, 'Không tải được hồ sơ.'));
    }
  }

  private async loadReviews(tutorId: number): Promise<void> {
    this.isLoadingReviews.set(true);
    try {
      const response = await firstValueFrom(this.reviewsApi.getReviewsByTutorId(tutorId));
      const reviews = response.data ?? [];
      this.allReviews.set(reviews);
      this.recentReviews.set(reviews.slice(0, 3));
    } catch {
      // silently fail — reviews are supplementary info
    } finally {
      this.isLoadingReviews.set(false);
    }
  }

  private applyProfile(tutor: TutorDetailDto): void {
    this.fullName = tutor.fullName ?? '';
    this.email = tutor.email ?? '';
    this.birth = tutor.birth ?? null;
    this.gender = tutor.gender ?? Gender.Male;
    this.phoneNumber = tutor.phoneNumber ?? '';
    this.school = tutor.school ?? '';
    this.hourlyRate = tutor.hourlyRate ?? 0;
    this.profile = tutor.profile ?? '';
    this.major = tutor.major ?? '';
    this.careerStatus = tutor.careerStatus ?? TutorCareerStatus.Student;
    this.academicDegree = tutor.academicDegree ?? AcademicDegree.University;
    this.addressDetail = tutor.address?.addressDetail ?? '';
    this.provinceId.set(tutor.address?.provinceId ?? null);
    this.wardCode.set(tutor.address?.wardCode ?? null);
    this.avatarUrl.set(tutor.avatarUrl ?? null);
    this.cvUrl.set(tutor.cvUrl ?? null);
    this.rating.set(tutor.rating ?? 0);
    this.totalReviews.set(tutor.totalReviews ?? 0);
    this.selectedLevels.set(tutor.teachingLevels ?? []);
    this.selectedSubjectIds.set(
      (tutor.subjects ?? []).map((s) => s.subjectId!).filter((id) => id != null),
    );
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
