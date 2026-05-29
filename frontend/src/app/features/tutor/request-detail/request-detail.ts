import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { StudentDetailModalComponent } from '../../../shared/components/student-detail-modal';

import { LearningRequestDto, TimeSlotInputDto, ScheduleProposalDto } from '../../../api/generated/client/models';
import { LearningRequestsService, ScheduleProposalsService } from '../../../api/generated/client/services';
import { getApiErrorDetails, getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import { SessionService } from '../../../core/auth/session';
import {
  DAY_OPTIONS,
  buildEndTime,
  formatDate,
  formatMoney,
  formatTimeSlots,
  getStartTimeOptions,
  learningRequestStatusLabel,
  learningRequestStatusClass,
  validateTimeSlots,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-tutor-request-detail-page',
  imports: [FormsModule, RouterLink, StudentDetailModalComponent],
  template: `

    @if (request(); as lr) {
      <div class="max-w-3xl mx-auto space-y-6">
        <a routerLink="/tutor/dashboard" class="text-sm font-bold text-slate-500 hover:text-slate-800">← Quay lại</a>

        <div class="tactile-card p-6 space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h1 class="font-display text-2xl font-black text-slate-900">{{ lr.subjectName || 'Yêu cầu học' }}</h1>
              <div class="flex items-center gap-2 mt-1">
                <p class="text-sm text-slate-500">Học viên: {{ lr.studentName || 'Đang cập nhật' }}</p>
                @if (lr.studentId) {
                  <button (click)="openStudentDetail(lr.studentId)" 
                          class="text-xs font-extrabold text-duo-blue hover:text-duo-blue-dark hover:underline flex items-center gap-0.5">
                    (Xem chi tiết)
                  </button>
                }
              </div>
            </div>
            <span [class]="statusClass(lr.status)" class="rounded-full px-3 py-1 text-xs font-black">{{ label(lr) }}</span>
          </div>

          <div class="grid sm:grid-cols-2 gap-4 text-sm">
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="font-bold text-slate-500">Lịch học viên đề xuất</p>
              <p class="mt-1 font-extrabold text-slate-900">{{ slots(lr) }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="font-bold text-slate-500">Ngân sách</p>
              <p class="mt-1 font-extrabold text-duo-green">{{ money(lr.budgetPerHour) }}/h</p>
            </div>
          </div>

          @if (lr.status === 'Pending') {
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button (click)="acceptRequest(lr)" [disabled]="isWorking()" class="tactile-button-green w-full py-2.5 rounded-xl text-sm font-extrabold uppercase disabled:opacity-60">
                Chấp nhận
              </button>
              <button (click)="openProposalForm()" [disabled]="isWorking() || proposalFormVisible()" class="tactile-button-blue w-full py-2.5 rounded-xl text-sm font-extrabold uppercase disabled:opacity-60">
                Đề xuất lịch khác
              </button>
              <button (click)="rejectRequest(lr)" [disabled]="isWorking()" class="tactile-button-gray w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-60">
                Từ chối
              </button>
            </div>
          }
        </div>

        @if (proposal(); as p) {

          @if (isMyProposal(p)) {
            <div class="tactile-card p-6 space-y-4 border-duo-blue bg-blue-50/10">
              <div class="flex items-center justify-between">
                <h2 class="font-extrabold text-lg text-slate-900">Đề xuất lịch của bạn</h2>
                <span class="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-duo-blue">Đang chờ học viên phản hồi</span>
              </div>
              <p class="text-sm text-slate-500">Đề xuất lịch mới đang được gửi tới học viên và chờ họ phản hồi.</p>
              
              <div class="grid sm:grid-cols-3 gap-4 text-sm">
                <div class="rounded-2xl bg-slate-50 p-4 border-2 border-slate-100">
                  <p class="font-bold text-slate-500">Đề xuất lịch</p>
                  <p class="mt-1 font-extrabold text-slate-900">{{ proposalSlotsText(p) }}</p>
                </div>
                <div class="rounded-2xl bg-slate-50 p-4 border-2 border-slate-100">
                  <p class="font-bold text-slate-500">Ngày bắt đầu</p>
                  <p class="mt-1 font-extrabold text-slate-900">{{ date(p.desiredStartDate) }}</p>
                </div>
                <div class="rounded-2xl bg-slate-50 p-4 border-2 border-slate-100">
                  <p class="font-bold text-slate-500">Học phí mong muốn</p>
                  <p class="mt-1 font-extrabold text-duo-green">{{ money(p.hourlyRate) }}/h</p>
                </div>
              </div>
            </div>
          } @else {
            <div class="tactile-card p-6 space-y-4 border-duo-blue">
              <h2 class="font-extrabold text-lg text-slate-900">Đề xuất lịch từ học viên</h2>
              <div class="grid sm:grid-cols-3 gap-4 text-sm">
                <div class="rounded-2xl bg-blue-50 p-4">
                  <p class="font-bold text-slate-500">Lịch học viên đề xuất</p>
                  <p class="mt-1 font-extrabold text-slate-900">{{ proposalSlotsText(p) }}</p>
                </div>
                <div class="rounded-2xl bg-blue-50 p-4">
                  <p class="font-bold text-slate-500">Ngày bắt đầu</p>
                  <p class="mt-1 font-extrabold text-slate-900">{{ date(p.desiredStartDate) }}</p>
                </div>
                <div class="rounded-2xl bg-blue-50 p-4">
                  <p class="font-bold text-slate-500">Học phí / giờ</p>
                  <p class="mt-1 font-extrabold text-duo-green">{{ money(p.hourlyRate) }}/h</p>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button (click)="acceptProposal(p)" [disabled]="isWorking()"
                        class="tactile-button-green w-full py-2.5 rounded-xl text-sm font-extrabold uppercase disabled:opacity-60">
                  Chấp nhận đề xuất
                </button>
                <button (click)="openProposalForm()" [disabled]="isWorking() || proposalFormVisible()"
                        class="tactile-button-blue w-full py-2.5 rounded-xl text-sm font-extrabold uppercase disabled:opacity-60">
                  Đề xuất lịch khác
                </button>
                <button (click)="rejectProposal(p)" [disabled]="isWorking()"
                        class="tactile-button-gray w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-60">
                  Từ chối đề xuất
                </button>
              </div>
            </div>
          }
        }

        @if (proposalFormVisible()) {
          <div class="tactile-card p-6 space-y-4">
            <h2 class="font-extrabold text-lg text-slate-900">Tạo đề xuất lịch mới</h2>
            <div class="grid sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Ngày bắt đầu</label>
                <div class="relative cursor-pointer" (click)="desiredStartDateInput.showPicker()">
                  <input
                    type="text"
                    [value]="desiredStartDate ? date(desiredStartDate) : ''"
                    placeholder="dd/mm/yyyy"
                    class="tactile-input w-full text-sm font-semibold pl-3 pr-10 py-2.5 bg-white pointer-events-none"
                    readonly
                  />
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    #desiredStartDateInput
                    type="date"
                    [(ngModel)]="desiredStartDate"
                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    (click)="$event.stopPropagation(); desiredStartDateInput.showPicker()"
                  />
                </div>
                @if (fieldErrors()['DesiredStartDate']) {
                  <p class="text-xs font-bold text-duo-red mt-1">{{ fieldErrors()['DesiredStartDate'] }}</p>
                }
              </div>
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Số giờ / buổi</label>
                <select [(ngModel)]="hoursPerSession" (ngModelChange)="recalculateSlots()" class="tactile-input w-full text-sm font-semibold bg-white">
                  @for (hour of [0.5,1,1.5,2,2.5,3]; track hour) {
                    <option [ngValue]="hour">{{ hour }} giờ</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1.5">Học phí / giờ</label>
                <input type="number" [(ngModel)]="hourlyRate" class="tactile-input w-full text-sm font-semibold" />
                @if (fieldErrors()['HourlyRate']) {
                  <p class="text-xs font-bold text-duo-red mt-1">{{ fieldErrors()['HourlyRate'] }}</p>
                }
              </div>
            </div>

            @for (slot of proposalSlots(); track $index; let index = $index) {
              <div class="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end rounded-2xl border-2 border-slate-100 p-3">
                <div>
                  <label class="block text-xs font-extrabold text-slate-500 mb-1">Ngày</label>
                  <select [ngModel]="slot.day" (ngModelChange)="updateSlot(index, 'day', $event)" class="tactile-input w-full text-sm font-semibold bg-white">
                    @for (day of dayOptions; track day.value) {
                      <option [ngValue]="day.value">{{ day.label }}</option>
                    }
                  </select>
                  @if (fieldErrors()['TimeSlots[' + index + '].Day']) {
                    <p class="text-xs font-bold text-duo-red mt-1">{{ fieldErrors()['TimeSlots[' + index + '].Day'] }}</p>
                  }
                </div>
                <div>
                  <label class="block text-xs font-extrabold text-slate-500 mb-1">Bắt đầu</label>
                  <select [ngModel]="slot.startTime" (ngModelChange)="updateSlot(index, 'startTime', $event)"
                          class="tactile-input w-full text-sm font-semibold bg-white">
                    @for (time of getStartTimeOptions(slot.day); track time) {
                      <option [value]="time">{{ time }}</option>
                    }
                  </select>
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
                <button type="button" (click)="removeSlot(index)" [disabled]="proposalSlots().length === 1" class="tactile-button-gray w-fit justify-self-end sm:w-auto px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40">Xóa</button>
                @if (fieldErrors()['TimeSlots[' + index + ']']) {
                  <p class="text-xs font-bold text-duo-red mt-2 col-span-full">{{ fieldErrors()['TimeSlots[' + index + ']'] }}</p>
                }
              </div>
            }

            <button type="button" (click)="addSlot()" class="tactile-button-gray px-4 py-2 rounded-xl text-xs font-bold">Thêm lịch</button>

            <div class="flex flex-col sm:flex-row gap-2 pt-2">
              <button (click)="createProposal(lr)" [disabled]="isWorking()" class="tactile-button-blue w-full py-3 rounded-xl text-sm font-extrabold uppercase disabled:opacity-60">
                Gửi đề xuất lịch mới
              </button>
              <button (click)="proposalFormVisible.set(false)" [disabled]="isWorking()" class="tactile-button-gray w-full py-3 rounded-xl text-sm font-bold disabled:opacity-60">
                Hủy
              </button>
            </div>
          </div>
        }

        @if (fieldErrors()['TimeSlots']) {
          <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red mb-3">{{ fieldErrors()['TimeSlots'] }}</p>
        }

        @if (errorMessage()) {
          <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">{{ errorMessage() }}</p>
        }

        <!-- Student Detail Modal overlay -->
        @if (selectedStudentId()) {
          <app-student-detail-modal [studentId]="selectedStudentId()" (close)="selectedStudentId.set(null)" />
        }
      </div>
    } @else if (isLoading()) {
      <div class="max-w-3xl mx-auto py-8">
        <div class="tactile-card p-8 text-center font-bold text-slate-500">Đang tải yêu cầu học...</div>
      </div>
    } @else if (errorMessage()) {
      <div class="max-w-3xl mx-auto py-8 space-y-4">
        <a routerLink="/tutor/dashboard" class="text-sm font-bold text-slate-500 hover:text-slate-800">← Quay lại Dashboard</a>
        <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">{{ errorMessage() }}</p>
      </div>
    }
  `,
})
export class TutorRequestDetailPage implements OnInit {
  request = signal<LearningRequestDto | null>(null);
  proposal = signal<ScheduleProposalDto | null>(null);
  proposalSlots = signal<TimeSlotInputDto[]>([{ day: 'Monday', startTime: '17:00', endTime: '19:00' }]);
  desiredStartDate = '';
  hoursPerSession = 2;
  hourlyRate: number | null = null;
  isLoading = signal(false);
  isWorking = signal(false);
  errorMessage = signal('');
  fieldErrors = signal<Record<string, string>>({});
  proposalFormVisible = signal(false);
  selectedStudentId = signal<number | null>(null);

  openStudentDetail(studentId: number): void {
    this.selectedStudentId.set(studentId);
  }
  readonly dayOptions = DAY_OPTIONS;
  readonly getStartTimeOptions = getStartTimeOptions;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly requestsApi = inject(LearningRequestsService);
  private readonly proposalsApi = inject(ScheduleProposalsService);
  private readonly sessionService = inject(SessionService);

  ngOnInit(): void {
    void this.loadRequest();
  }

  isMyProposal(proposal: ScheduleProposalDto): boolean {
    return proposal.proposedBy === this.request()?.tutorId;
  }

  proposalSlotsText(proposal: ScheduleProposalDto): string {
    return formatTimeSlots(proposal.timeSlots);
  }

  openProposalForm(): void {
    const req = this.request();
    const prop = this.proposal();
    if (!req) return;

    this.desiredStartDate = prop?.desiredStartDate
      ? new Date(prop.desiredStartDate).toISOString().slice(0, 10)
      : req.desiredStartDate
        ? new Date(req.desiredStartDate).toISOString().slice(0, 10)
        : this.defaultStartDate();

    this.hoursPerSession = prop?.hoursPerSession ?? req.hoursPerSession ?? 2;
    this.hourlyRate = prop?.hourlyRate ?? req.budgetPerHour ?? null;

    const sourceSlots = prop?.timeSlots ?? req.timeSlots;
    this.proposalSlots.set(
      sourceSlots?.map((slot) => ({
        day: slot.day ?? 'Monday',
        startTime: slot.startTime ?? '17:00',
        endTime: buildEndTime(slot.startTime ?? '17:00', this.hoursPerSession),
      })) ?? [{ day: 'Monday', startTime: '17:00', endTime: '19:00' }]
    );

    this.proposalFormVisible.set(true);
  }

  label(request: LearningRequestDto): string {
    if (request.status === 'Negotiating') {
      return 'Đang chờ học viên phản hồi';
    }
    return learningRequestStatusLabel(request.status);
  }

  statusClass(status?: string | null): string {
    return learningRequestStatusClass(status as any);
  }

  slots(request: LearningRequestDto): string {
    return formatTimeSlots(request.timeSlots);
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  date(value?: Date | string | null): string {
    return formatDate(value);
  }

  addSlot(): void {
    this.proposalSlots.update((current) => [...current, { day: 'Monday', startTime: '17:00', endTime: buildEndTime('17:00', this.hoursPerSession) }]);
  }

  removeSlot(index: number): void {
    this.proposalSlots.update((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  updateSlot(index: number, key: 'day' | 'startTime', value: string): void {
    this.proposalSlots.update((current) =>
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
    this.proposalSlots.update((current) => current.map((slot) => ({ ...slot, endTime: buildEndTime(slot.startTime, this.hoursPerSession) })));
  }

  async acceptRequest(request: LearningRequestDto): Promise<void> {
    if (!request.id) return;
    await this.withWork(async () => {
      await firstValueFrom(this.requestsApi.acceptLearningRequest(request.id!));
      await this.router.navigateByUrl('/tutor/dashboard');
    }, 'Không chấp nhận được yêu cầu.');
  }

  async rejectRequest(request: LearningRequestDto): Promise<void> {
    if (!request.id) return;
    await this.withWork(async () => {
      await firstValueFrom(this.requestsApi.rejectLearningRequest(request.id!));
      await this.router.navigateByUrl('/tutor/dashboard');
    }, 'Không từ chối được yêu cầu.');
  }

  async createProposal(request: LearningRequestDto): Promise<void> {
    if (!request.id || !this.hourlyRate || !this.desiredStartDate) {
      this.errorMessage.set('Vui lòng nhập đủ thông tin đề xuất.');
      return;
    }

    const scheduleError = validateTimeSlots(this.proposalSlots(), this.hoursPerSession);
    if (scheduleError) {
      this.errorMessage.set(scheduleError);
      return;
    }

    this.isWorking.set(true);
    this.errorMessage.set('');
    this.fieldErrors.set({});

    try {
      await firstValueFrom(
        this.proposalsApi.createScheduleProposal({
          learningRequestId: request.id!,
          timeSlots: this.proposalSlots(),
          desiredStartDate: new Date(`${this.desiredStartDate}T00:00:00`),
          hoursPerSession: this.hoursPerSession,
          hourlyRate: this.hourlyRate!,
        }),
      );
      await this.router.navigateByUrl('/tutor/dashboard');
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
      this.isWorking.set(false);
    }
  }

  async acceptProposal(proposal: ScheduleProposalDto): Promise<void> {
    if (!proposal.id) return;
    await this.withWork(async () => {
      await firstValueFrom(this.proposalsApi.acceptScheduleProposal(proposal.id!));
      await this.router.navigateByUrl('/tutor/dashboard');
    }, 'Không chấp nhận được đề xuất.');
  }

  async rejectProposal(proposal: ScheduleProposalDto): Promise<void> {
    if (!proposal.id) return;
    await this.withWork(async () => {
      await firstValueFrom(this.proposalsApi.rejectScheduleProposal(proposal.id!));
      await this.loadRequest();
    }, 'Không từ chối được đề xuất.');
  }

  private async loadRequest(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage.set('Mã yêu cầu không hợp lệ.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(this.requestsApi.getLearningRequestById(id));
      const request = unwrapApiData(response);
      this.request.set(request);
      this.hourlyRate = request.budgetPerHour ?? null;
      this.hoursPerSession = request.hoursPerSession ?? 2;
      
      this.desiredStartDate = request.desiredStartDate
        ? new Date(request.desiredStartDate).toISOString().slice(0, 10)
        : this.defaultStartDate();

      this.proposalSlots.set(
        request.timeSlots?.map((slot) => ({
          day: slot.day ?? 'Monday',
          startTime: slot.startTime ?? '17:00',
          endTime: buildEndTime(slot.startTime ?? '17:00', this.hoursPerSession),
        })) ?? [{ day: 'Monday', startTime: '17:00', endTime: '19:00' }]
      );

      // Fetch proposal if in Negotiating state
      if (request.status === 'Negotiating') {
        try {
          const propRes = await firstValueFrom(this.requestsApi.getScheduleProposalByLearningRequest(id));
          this.proposal.set(propRes.data ?? null);
        } catch {
          this.proposal.set(null);
        }
      } else {
        this.proposal.set(null);
      }
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được yêu cầu học.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async withWork(action: () => Promise<void>, fallback: string): Promise<void> {
    this.isWorking.set(true);
    this.errorMessage.set('');
    try {
      await action();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, fallback));
    } finally {
      this.isWorking.set(false);
    }
  }

  private defaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
  }
}
