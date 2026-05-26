import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthApiService, RegisterAddressPayload } from '../../../api/facades/auth-api';
import {
  AcademicDegree,
  EducationLevel,
  Gender,
  ProvinceDto,
  SubjectListItemDto,
  TutorCareerStatus,
  WardDto,
} from '../../../api/generated/client/models';
import { AddressService, SubjectsService } from '../../../api/generated/client/services';
import { SessionService } from '../../../core/auth/session';
import { UserRole } from '../../../core/auth/session.models';
import { getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import { GoogleSignInButtonComponent } from '../../../shared/components/google-sign-in-button/google-sign-in-button';

@Component({
  selector: 'app-register-tutor-page',
  imports: [FormsModule, RouterLink, MascotComponent, GoogleSignInButtonComponent],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div class="w-full max-w-3xl space-y-6">
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

        <div class="tactile-card p-6 sm:p-8 space-y-5">
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

          <div class="grid sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Mật khẩu</label>
              <input type="password" [(ngModel)]="password" class="tactile-input w-full text-sm font-semibold" />
            </div>
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Số điện thoại</label>
              <input type="tel" [(ngModel)]="phoneNumber" class="tactile-input w-full text-sm font-semibold" />
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
            <input type="text" [(ngModel)]="addressDetail" class="tactile-input w-full text-sm font-semibold" />
          </div>

          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-2">Môn dạy</label>
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
          </div>

          <div class="grid sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Học phí / giờ</label>
              <input type="number" [(ngModel)]="hourlyRate" class="tactile-input w-full text-sm font-semibold" />
            </div>
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Trạng thái nghề nghiệp</label>
              <select [(ngModel)]="careerStatus" class="tactile-input w-full text-sm font-semibold bg-white">
                @for (item of careerOptions; track item.value) {
                  <option [ngValue]="item.value">{{ item.label }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Bằng cấp</label>
              <select [(ngModel)]="academicDegree" class="tactile-input w-full text-sm font-semibold bg-white">
                @for (item of degreeOptions; track item.value) {
                  <option [ngValue]="item.value">{{ item.label }}</option>
                }
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Chuyên ngành</label>
            <input type="text" [(ngModel)]="major" class="tactile-input w-full text-sm font-semibold" />
          </div>

          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-2">Cấp học có thể dạy</label>
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
          </div>

          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Giới thiệu bản thân</label>
            <textarea [(ngModel)]="profile" rows="3" class="tactile-input w-full text-sm font-semibold resize-none"></textarea>
          </div>

          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Ảnh đại diện</label>
              <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onAvatarChange($event)"
                     class="tactile-input w-full text-sm font-semibold bg-white" />
            </div>
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">CV</label>
              <input type="file" accept=".pdf,.doc,.docx" (change)="onCvChange($event)"
                     class="tactile-input w-full text-sm font-semibold bg-white" />
            </div>
          </div>

          <button (click)="onRegister()" [disabled]="!canSubmit() || isSubmitting()"
                  class="tactile-button-green w-full py-3.5 rounded-2xl text-base font-extrabold uppercase disabled:opacity-50 disabled:cursor-not-allowed">
            {{ isSubmitting() ? 'Đang gửi hồ sơ...' : 'Hoàn tất đăng ký' }}
          </button>

          <div class="flex items-center gap-4">
            <div class="flex-1 h-px bg-slate-200"></div>
            <span class="text-xs font-bold text-slate-400 uppercase">Hoặc</span>
            <div class="flex-1 h-px bg-slate-200"></div>
          </div>

          <app-google-sign-in-button text="signup_with" (credential)="onGoogleCredential($event)" />

          @if (errorMessage()) {
            <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">
              {{ errorMessage() }}
            </p>
          }
        </div>

        <p class="text-center text-sm text-slate-500">
          Đã có tài khoản? <a routerLink="/auth/login" class="font-extrabold text-[#58cc02] hover:underline">Đăng nhập</a>
        </p>
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

  provinces = signal<ProvinceDto[]>([]);
  wards = signal<WardDto[]>([]);
  subjects = signal<SubjectListItemDto[]>([]);
  selectedSubjectIds = signal<number[]>([]);
  selectedTeachingLevels = signal<EducationLevel[]>([EducationLevel.HighSchool]);
  provinceId = signal<number | null>(null);
  wardCode = signal<string | null>(null);
  isLoadingWards = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal('');

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
  private readonly subjectsApi = inject(SubjectsService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.loadInitialData();
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

  toggleSubject(subjectId?: number): void {
    if (!subjectId) return;
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
    this.selectedTeachingLevels.update((current) =>
      current.includes(level)
        ? current.filter((item) => item !== level)
        : [...current, level],
    );
  }

  isTeachingLevelSelected(level: EducationLevel): boolean {
    return this.selectedTeachingLevels().includes(level);
  }

  onAvatarChange(event: Event): void {
    this.avatar = this.readFile(event);
    if (this.avatar && this.avatar.size > 5 * 1024 * 1024) {
      this.avatar = null;
      this.errorMessage.set('Ảnh đại diện tối đa 5MB.');
    }
  }

  onCvChange(event: Event): void {
    this.cv = this.readFile(event);
    if (this.cv && this.cv.size > 10 * 1024 * 1024) {
      this.cv = null;
      this.errorMessage.set('CV tối đa 10MB.');
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
      Boolean(this.avatar) &&
      Boolean(this.cv)
    );
  }

  async onRegister(): Promise<void> {
    if (!this.validateBasics()) return;

    const address = this.resolveAddress();
    if (!address || !this.avatar || !this.cv || !this.hourlyRate) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      const response = await firstValueFrom(
        this.authApi.registerTutor({
          fullName: this.fullName,
          email: this.email,
          password: this.password,
          phoneNumber: this.phoneNumber,
          gender: this.gender,
          address,
          avatar: this.avatar,
          cv: this.cv,
          profile: this.profile || null,
          hourlyRate: this.hourlyRate,
          subjectIds: this.selectedSubjectIds(),
          teachingLevels: this.selectedTeachingLevels(),
          careerStatus: this.careerStatus,
          major: this.major,
          academicDegree: this.academicDegree,
        }),
      );
      const login = unwrapApiData(response);
      this.session.bootstrapFromLogin(login);
      await this.router.navigateByUrl('/tutor/dashboard');
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Đăng ký gia sư thất bại.'));
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
          requestedRole: UserRole.Tutor,
          registrationIntent: true,
        }),
      );
      const login = unwrapApiData(response);
      this.session.bootstrapFromLogin(login);
      await this.router.navigateByUrl('/tutor/settings');
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Đăng ký gia sư bằng Google thất bại.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  progress(): number {
    let value = 0;
    if (this.fullName.trim()) value += 10;
    if (this.email.trim()) value += 10;
    if (this.password.length >= 8) value += 10;
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
        firstValueFrom(this.addressApi.getProvinces()),
        firstValueFrom(this.subjectsApi.getSubjects()),
      ]);
      this.provinces.set(provinceResponse.data ?? []);
      this.subjects.set(subjectResponse.data ?? []);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được dữ liệu đăng ký.'));
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
