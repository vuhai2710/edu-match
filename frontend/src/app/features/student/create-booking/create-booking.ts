import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DepositPreviewResponseDto, TimeSlotInputDto, TutorDetailDto } from '../../../api/generated/client/models';
import { DepositPolicyService, LearningRequestsService, TutorsService } from '../../../api/generated/client/services';
import { getApiErrorDetails, getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import { SignalrService } from '../../../core/realtime/signalr.service';
import {
  DAY_OPTIONS,
  buildEndTime,
  formatDate,
  formatMoney,
  getStartTimeOptions,
  validateTimeSlots,
} from '../../../shared/utils/api-ui';

import { VietnameseDatePickerComponent } from '../../../shared/components/vietnamese-datepicker/vietnamese-datepicker';
import { TactileSelectComponent } from '../../../shared/components/tactile-select/tactile-select';

@Component({
  selector: 'app-create-booking-page',
  imports: [FormsModule, VietnameseDatePickerComponent, TactileSelectComponent],
  template: `
    @if (tutor(); as t) {
      <div class="max-w-3xl mx-auto space-y-6">
        <a href="javascript:void(0)" (click)="goBack($event)" class="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800">
          ← Quay lại
        </a>

        <div class="text-center">
          <h1 class="font-display text-2xl font-black text-slate-900">Đặt lịch học</h1>
          <p class="text-slate-500 mt-1">Gửi yêu cầu học tới {{ t.fullName }}</p>
        </div>

        @if (policyUpdateMessage(); as msg) {
          <div class="border-2 border-amber-500 border-b-4 bg-amber-50 text-amber-900 rounded-2xl p-4 flex items-start gap-3 shadow-md animate-pulse">
            <span class="text-lg mt-0.5">🔔</span>
            <div class="flex-1 space-y-1">
              <p class="font-extrabold text-sm">{{ msg }}</p>
              <p class="text-xs text-amber-700 font-bold">Số tiền cọc dự kiến của bạn đã được cập nhật lại theo chính sách mới nhất.</p>
            </div>
            <button (click)="policyUpdateMessage.set(null)" class="text-amber-500 hover:text-amber-800 font-black ml-4 text-base p-1 leading-none">✕</button>
          </div>
        }

        <div class="tactile-card p-6 space-y-5">
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Môn học</label>
              @if (isSubjectFixed) {
                <input type="text" [value]="getFixedSubjectName()" readonly class="tactile-input w-full text-sm font-semibold bg-slate-50 text-slate-500 cursor-not-allowed" />
              } @else {
                <app-tactile-select
                  [(value)]="subjectId"
                  [options]="t.subjects ?? []"
                  valueKey="subjectId"
                  labelKey="subjectName"
                  placeholder="Chọn môn học"
                  [showPlaceholderOption]="false"
                />
              }
            </div>
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Ngày bắt đầu mong muốn</label>
              <app-vietnamese-datepicker [(value)]="desiredStartDate" [min]="minDate" placeholder="Chọn ngày bắt đầu" />
              @if (fieldErrors()['DesiredStartDate']) {
                <p class="text-xs font-bold text-duo-red mt-1">{{ fieldErrors()['DesiredStartDate'] }}</p>
              }
            </div>
          </div>

          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Số giờ mỗi buổi</label>
              <app-tactile-select
                [value]="hoursPerSession"
                (valueChange)="hoursPerSession = $event; recalculateSlots()"
                [options]="hourOptions"
                valueKey="value"
                labelKey="label"
                [showPlaceholderOption]="false"
              />
            </div>
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Ngân sách / giờ</label>
              <input type="number" [(ngModel)]="budgetPerHour" (ngModelChange)="updateDepositPreview()" class="tactile-input w-full text-sm font-semibold" />
              @if (fieldErrors()['BudgetPerHour']) {
                <p class="text-xs font-bold text-duo-red mt-1">{{ fieldErrors()['BudgetPerHour'] }}</p>
              }
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="font-extrabold text-lg text-slate-900">Lịch học mong muốn</h2>
              <button type="button" (click)="addSlot()" class="tactile-button-gray px-4 py-2 rounded-xl text-xs font-bold">
                Thêm lịch
              </button>
            </div>

            @for (slot of slots(); track $index; let index = $index) {
              <div class="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end rounded-2xl border-2 border-slate-100 p-3">
                <div>
                  <label class="block text-xs font-extrabold text-slate-500 mb-1">Ngày</label>
                  <app-tactile-select
                    [value]="slot.day"
                    (valueChange)="updateSlot(index, 'day', $event)"
                    [options]="dayOptions"
                    valueKey="value"
                    labelKey="label"
                    [showPlaceholderOption]="false"
                  />
                  @if (fieldErrors()['TimeSlots[' + index + '].Day']) {
                    <p class="text-xs font-bold text-duo-red mt-1">{{ fieldErrors()['TimeSlots[' + index + '].Day'] }}</p>
                  }
                </div>
                <div>
                  <label class="block text-xs font-extrabold text-slate-500 mb-1">Bắt đầu</label>
                  <app-tactile-select
                    [value]="slot.startTime"
                    (valueChange)="updateSlot(index, 'startTime', $event)"
                    [options]="getStartTimeOptions(slot.day)"
                    [showPlaceholderOption]="false"
                  />
                  @if (fieldErrors()['TimeSlots[' + index + '].StartTime']) {
                    <p class="text-xs font-bold text-duo-red mt-1">{{ fieldErrors()['TimeSlots[' + index + '].StartTime'] }}</p>
                  }
                </div>
                <div>
                  <label class="block text-xs font-extrabold text-slate-500 mb-1">Kết thúc</label>
                  <input type="text" [ngModel]="slot.endTime" readonly class="tactile-input w-full text-sm font-semibold bg-slate-50" />
                  @if (fieldErrors()['TimeSlots[' + index + '].EndTime']) {
                    <p class="text-xs font-bold text-duo-red mt-1">{{ fieldErrors()['TimeSlots[' + index + '].EndTime'] }}</p>
                  }
                </div>
                <button type="button" (click)="removeSlot(index)" [disabled]="slots().length === 1"
                        class="w-fit justify-self-end sm:w-auto tactile-button-gray px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40">
                  Xóa
                </button>
                @if (fieldErrors()['TimeSlots[' + index + ']']) {
                  <p class="text-xs font-bold text-duo-red mt-2 col-span-full">{{ fieldErrors()['TimeSlots[' + index + ']'] }}</p>
                }
              </div>
            }
          </div>

          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Ghi chú cho gia sư</label>
            <textarea [(ngModel)]="note" rows="4" placeholder="Mục tiêu học tập, nội dung muốn ôn..."
                      class="tactile-input w-full text-sm font-semibold resize-none"></textarea>
          </div>

          <div class="bg-slate-50 rounded-2xl p-5 space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Gia sư</span>
              <span class="font-bold text-slate-900">{{ t.fullName }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Học phí đề xuất</span>
              <span class="font-bold text-slate-900">{{ formatPrice(budgetPerHour) }}/h</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Số giờ học/buổi</span>
              <span class="font-bold text-slate-900">{{ hoursPerSession }} giờ</span>
            </div>
            <div class="flex justify-between">
              <span class="font-bold text-slate-700">Cọc dự kiến</span>
              <span class="font-display text-xl font-black text-duo-green">
                {{ formatPrice(depositPreview()?.depositAmount ?? (budgetPerHour || 0) * hoursPerSession) }}
              </span>
            </div>
          </div>

          <!-- Chính sách đặt cọc info banner -->
          @if (depositPreview(); as prev) {
            <div class="bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs space-y-2 text-slate-600">
              <div class="flex items-center gap-1.5 font-bold text-slate-700 uppercase tracking-wide">
                <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Chính sách đặt cọc
              </div>
              <ul class="list-disc list-inside space-y-1 pl-1 leading-relaxed">
                <li>Hệ thống áp dụng đặt cọc <strong>{{ prev.depositSessionCount }} buổi</strong> học đề xuất ban đầu (tương đương <strong>{{ (prev.depositSessionCount ?? 0) * hoursPerSession }} giờ học</strong>).</li>
                @if (prev.discountPercent && prev.discountPercent > 0) {
                  <li>Được ưu đãi giảm giá <strong>{{ prev.discountPercent * 100 }}%</strong> trên tiền đặt cọc.</li>
                }
                <li>Tiền cọc này dùng để giữ chỗ và cam kết lịch học giữa học viên và gia sư.</li>
                <li><strong>Chính sách hoàn cọc:</strong> Hoàn trả <strong>100%</strong> tiền đặt cọc nếu gia sư từ chối yêu cầu, hoặc lớp học không thể bắt đầu theo đúng quy định của EduMatch.</li>
              </ul>
            </div>
          }

          @if (fieldErrors()['TimeSlots']) {
            <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">
              {{ fieldErrors()['TimeSlots'] }}
            </p>
          }

          @if (errorMessage()) {
            <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">
              {{ errorMessage() }}
            </p>
          }

          <button (click)="onSubmit()" [disabled]="isSubmitting()"
                  class="tactile-button-green w-full py-3 rounded-xl font-extrabold uppercase disabled:opacity-60">
            {{ isSubmitting() ? 'Đang gửi...' : 'Gửi yêu cầu học' }}
          </button>
        </div>
      </div>
    } @else if (isLoading()) {
      <div class="tactile-card p-8 text-center font-bold text-slate-500">Đang tải gia sư...</div>
    }
  `,
})
export class CreateBookingPage implements OnInit {
  tutor = signal<TutorDetailDto | null>(null);
  policyUpdateMessage = signal<string | null>(null);
  slots = signal<TimeSlotInputDto[]>([
    { day: 'Monday', startTime: '17:00', endTime: '19:00' },
  ]);
  subjectId: number | null = null;
  isSubjectFixed = false;
  desiredStartDate = this.defaultStartDate();
  minDate = this.getMinDate();

  getMinDate(): string {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  hoursPerSession = 2;
  budgetPerHour: number | null = null;
  note = '';
  isLoading = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal('');
  fieldErrors = signal<Record<string, string>>({});
  depositPreview = signal<DepositPreviewResponseDto | null>(null);
  readonly dayOptions = DAY_OPTIONS;
  readonly hourOptions = [0.5, 1, 1.5, 2, 2.5, 3].map(h => ({ value: h, label: `${h} giờ` }));
  readonly getStartTimeOptions = getStartTimeOptions;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tutorsApi = inject(TutorsService);
  private readonly learningRequestsApi = inject(LearningRequestsService);
  private readonly depositPolicyApi = inject(DepositPolicyService);
  private readonly signalrService = inject(SignalrService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly location = inject(Location);

  goBack(event: Event): void {
    event.preventDefault();
    this.location.back();
  }

  ngOnInit(): void {
    void this.loadTutor();
    this.signalrService.depositPolicyUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.policyUpdateMessage.set(data.message);
        void this.updateDepositPreview();
      });
  }

  addSlot(): void {
    this.slots.update((current) => [
      ...current,
      { day: 'Monday', startTime: '17:00', endTime: buildEndTime('17:00', this.hoursPerSession) },
    ]);
  }

  removeSlot(index: number): void {
    this.slots.update((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  updateSlot(index: number, key: 'day' | 'startTime', value: string): void {
    this.slots.update((current) =>
      current.map((slot, itemIndex) => {
        if (itemIndex !== index) return slot;
        const next = { ...slot, [key]: value };
        if (key === 'day') {
          const isWeekend = value === 'Saturday' || value === 'Sunday';
          const [h] = next.startTime.split(':').map(Number);
          const minHour = isWeekend ? 8 : 17;
          if (h < minHour) {
            next.startTime = isWeekend ? '08:00' : '17:00';
          }
        }
        return { ...next, endTime: buildEndTime(next.startTime, this.hoursPerSession) };
      }),
    );
  }

  recalculateSlots(): void {
    this.slots.update((current) =>
      current.map((slot) => ({
        ...slot,
        endTime: buildEndTime(slot.startTime, this.hoursPerSession),
      })),
    );
    void this.updateDepositPreview();
  }

  async updateDepositPreview(): Promise<void> {
    const rate = this.budgetPerHour;
    const hours = this.hoursPerSession;
    if (!rate || rate <= 0 || !hours || hours <= 0) {
      this.depositPreview.set(null);
      return;
    }
    try {
      const response = await firstValueFrom(this.depositPolicyApi.previewDeposit(rate, hours));
      this.depositPreview.set(response.data ?? null);
    } catch {
      this.depositPreview.set(null);
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.tutor()?.id || !this.subjectId || !this.budgetPerHour || !this.desiredStartDate) {
      this.errorMessage.set('Vui lòng nhập đủ thông tin đặt lịch.');
      return;
    }

    const todayStr = this.minDate;
    if (this.desiredStartDate < todayStr) {
      this.errorMessage.set('Ngày bắt đầu học không được ở trong quá khứ.');
      return;
    }

    const scheduleError = validateTimeSlots(this.slots(), this.hoursPerSession);
    if (scheduleError) {
      this.errorMessage.set(scheduleError);
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.fieldErrors.set({});

    try {
      const response = await firstValueFrom(
        this.learningRequestsApi.createLearningRequest({
          tutorId: this.tutor()!.id!,
          subjectId: this.subjectId,
          note: this.note.trim() || null,
          timeSlots: this.slots(),
          desiredStartDate: new Date(`${this.desiredStartDate}T00:00:00`),
          hoursPerSession: this.hoursPerSession,
          budgetPerHour: this.budgetPerHour,
        }),
      );
      const request = unwrapApiData(response);
      await this.router.navigateByUrl(`/student/learning-requests/${request.id}`);
    } catch (error) {
      const errorDetails = getApiErrorDetails(error);
      this.errorMessage.set(errorDetails.message);
      
      const fe: Record<string, string> = {};
      if (errorDetails.errors && typeof errorDetails.errors === 'object' && !Array.isArray(errorDetails.errors)) {
        Object.entries(errorDetails.errors).forEach(([key, val]) => {
          if (val) {
            fe[key] = Array.isArray(val) ? val[0] : String(val);
          }
        });
      }
      this.fieldErrors.set(fe);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  formatPrice(value?: number | null): string {
    return formatMoney(value);
  }

  formatDate(value: string | Date | undefined | null): string {
    if (!value) return '';
    return formatDate(value);
  }

  getFixedSubjectName(): string {
    const sub = this.tutor()?.subjects?.find((s) => s.subjectId === this.subjectId);
    return sub?.subjectName || '';
  }

  private async loadTutor(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('tutorId');
    if (!idParam) {
      this.errorMessage.set('Mã gia sư không hợp lệ.');
      return;
    }

    const querySubId = this.route.snapshot.queryParamMap.get('subjectId');
    const parsedSubId = querySubId ? Number(querySubId) : null;

    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.tutorsApi.getTutorById(idParam));
      const tutor = unwrapApiData(response);
      this.tutor.set(tutor);
      if (parsedSubId && tutor.subjects?.some((s) => s.subjectId === parsedSubId)) {
        this.subjectId = parsedSubId;
        this.isSubjectFixed = true;
      } else {
        this.subjectId = tutor.subjects?.[0]?.subjectId ?? null;
        this.isSubjectFixed = false;
      }
      this.budgetPerHour = tutor.hourlyRate ?? null;
      void this.updateDepositPreview();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được gia sư.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private defaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
  }
}
