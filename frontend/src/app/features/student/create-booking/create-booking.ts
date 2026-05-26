import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { TimeSlotInputDto, TutorDetailDto } from '../../../api/generated/client/models';
import { LearningRequestsService, TutorsService } from '../../../api/generated/client/services';
import { getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import {
  DAY_OPTIONS,
  buildEndTime,
  formatMoney,
  validateTimeSlots,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-create-booking-page',
  imports: [FormsModule, RouterLink],
  template: `
    @if (tutor(); as t) {
      <div class="max-w-3xl mx-auto space-y-6">
        <a routerLink="/student/discover" class="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800">
          ← Quay lại
        </a>

        <div class="text-center">
          <h1 class="font-display text-2xl font-black text-slate-900">Đặt lịch học</h1>
          <p class="text-slate-500 mt-1">Gửi yêu cầu học tới {{ t.fullName }}</p>
        </div>

        <div class="tactile-card p-6 space-y-5">
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Môn học</label>
              <select [(ngModel)]="subjectId" class="tactile-input w-full text-sm font-semibold bg-white">
                @for (subject of t.subjects ?? []; track subject.subjectId) {
                  <option [ngValue]="subject.subjectId">{{ subject.subjectName }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Ngày bắt đầu mong muốn</label>
              <input type="date" [(ngModel)]="desiredStartDate" class="tactile-input w-full text-sm font-semibold" />
            </div>
          </div>

          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Số giờ mỗi buổi</label>
              <select [(ngModel)]="hoursPerSession" (ngModelChange)="recalculateSlots()"
                      class="tactile-input w-full text-sm font-semibold bg-white">
                @for (hour of [0.5,1,1.5,2,2.5,3]; track hour) {
                  <option [ngValue]="hour">{{ hour }} giờ</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Ngân sách / giờ</label>
              <input type="number" [(ngModel)]="budgetPerHour" class="tactile-input w-full text-sm font-semibold" />
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
              <div class="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end rounded-2xl border-2 border-slate-100 p-3">
                <div>
                  <label class="block text-xs font-extrabold text-slate-500 mb-1">Ngày</label>
                  <select [ngModel]="slot.day" (ngModelChange)="updateSlot(index, 'day', $event)"
                          class="tactile-input w-full text-sm font-semibold bg-white">
                    @for (day of dayOptions; track day.value) {
                      <option [ngValue]="day.value">{{ day.label }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-extrabold text-slate-500 mb-1">Bắt đầu</label>
                  <input type="time" [ngModel]="slot.startTime" (ngModelChange)="updateSlot(index, 'startTime', $event)"
                         class="tactile-input w-full text-sm font-semibold" />
                </div>
                <div>
                  <label class="block text-xs font-extrabold text-slate-500 mb-1">Kết thúc</label>
                  <input type="time" [ngModel]="slot.endTime" readonly class="tactile-input w-full text-sm font-semibold bg-slate-50" />
                </div>
                <button type="button" (click)="removeSlot(index)" [disabled]="slots().length === 1"
                        class="tactile-button-gray px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40">
                  Xóa
                </button>
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
              <span class="text-slate-500">Học phí tham khảo</span>
              <span class="font-bold text-slate-900">{{ formatPrice(t.hourlyRate) }}/h</span>
            </div>
            <div class="flex justify-between">
              <span class="font-bold text-slate-700">Cọc dự kiến</span>
              <span class="font-display text-xl font-black text-duo-green">{{ formatPrice((budgetPerHour || 0) * hoursPerSession) }}</span>
            </div>
          </div>

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
  slots = signal<TimeSlotInputDto[]>([
    { day: 'Monday', startTime: '17:00', endTime: '19:00' },
  ]);
  subjectId: number | null = null;
  desiredStartDate = this.defaultStartDate();
  hoursPerSession = 2;
  budgetPerHour: number | null = null;
  note = '';
  isLoading = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal('');
  readonly dayOptions = DAY_OPTIONS;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tutorsApi = inject(TutorsService);
  private readonly learningRequestsApi = inject(LearningRequestsService);

  ngOnInit(): void {
    void this.loadTutor();
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
  }

  async onSubmit(): Promise<void> {
    if (!this.tutor()?.id || !this.subjectId || !this.budgetPerHour || !this.desiredStartDate) {
      this.errorMessage.set('Vui lòng nhập đủ thông tin đặt lịch.');
      return;
    }

    const scheduleError = validateTimeSlots(this.slots(), this.hoursPerSession);
    if (scheduleError) {
      this.errorMessage.set(scheduleError);
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

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
      this.errorMessage.set(getApiErrorMessage(error, 'Không tạo được yêu cầu học.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  formatPrice(value?: number | null): string {
    return formatMoney(value);
  }

  private async loadTutor(): Promise<void> {
    const tutorId = Number(this.route.snapshot.paramMap.get('tutorId'));
    if (!tutorId) {
      this.errorMessage.set('Mã gia sư không hợp lệ.');
      return;
    }

    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.tutorsApi.getTutorById(tutorId));
      const tutor = unwrapApiData(response);
      this.tutor.set(tutor);
      this.subjectId = tutor.subjects?.[0]?.subjectId ?? null;
      this.budgetPerHour = tutor.hourlyRate ?? null;
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
