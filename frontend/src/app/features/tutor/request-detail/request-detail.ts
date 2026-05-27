import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { LearningRequestDto, TimeSlotInputDto, ScheduleProposalDto } from '../../../api/generated/client/models';
import { LearningRequestsService, ScheduleProposalsService } from '../../../api/generated/client/services';
import { getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import { SessionService } from '../../../core/auth/session';
import {
  DAY_OPTIONS,
  buildEndTime,
  formatDate,
  formatMoney,
  formatTimeSlots,
  learningRequestStatusLabel,
  validateTimeSlots,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-tutor-request-detail-page',
  imports: [FormsModule, RouterLink],
  template: `
    @if (request(); as lr) {
      <div class="max-w-3xl mx-auto space-y-6">
        <a routerLink="/tutor/dashboard" class="text-sm font-bold text-slate-500 hover:text-slate-800">← Quay lại</a>

        <div class="tactile-card p-6 space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h1 class="font-display text-2xl font-black text-slate-900">{{ lr.subjectName || 'Yêu cầu học' }}</h1>
              <p class="text-sm text-slate-500 mt-1">Học viên: {{ lr.studentName || 'Đang cập nhật' }}</p>
            </div>
            <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-duo-blue">{{ label(lr) }}</span>
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
            <div class="flex flex-wrap gap-3">
              <button (click)="acceptRequest(lr)" [disabled]="isWorking()" class="tactile-button-green flex-1 min-w-36 py-2.5 rounded-xl text-sm font-extrabold uppercase disabled:opacity-60">
                Chấp nhận lịch ban đầu
              </button>
              <button (click)="openProposalForm()" [disabled]="isWorking() || proposalFormVisible()" class="tactile-button-blue flex-1 min-w-36 py-2.5 rounded-xl text-sm font-extrabold uppercase disabled:opacity-60">
                Đề xuất lịch khác
              </button>
              <button (click)="rejectRequest(lr)" [disabled]="isWorking()" class="tactile-button-gray flex-1 min-w-36 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60">
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
              <div class="flex flex-wrap gap-3">
                <button (click)="acceptProposal(p)" [disabled]="isWorking()"
                        class="tactile-button-green flex-1 py-2.5 rounded-xl text-sm font-extrabold uppercase disabled:opacity-60">
                  Chấp nhận đề xuất
                </button>
                <button (click)="openProposalForm()" [disabled]="isWorking() || proposalFormVisible()"
                        class="tactile-button-blue flex-1 py-2.5 rounded-xl text-sm font-extrabold uppercase disabled:opacity-60">
                  Đề xuất lịch khác
                </button>
                <button (click)="rejectProposal(p)" [disabled]="isWorking()"
                        class="tactile-button-gray flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60">
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
                <input type="date" [(ngModel)]="desiredStartDate" class="tactile-input w-full text-sm font-semibold" />
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
                </div>
                <div>
                  <label class="block text-xs font-extrabold text-slate-500 mb-1">Bắt đầu</label>
                  <input type="time" [ngModel]="slot.startTime" (ngModelChange)="updateSlot(index, 'startTime', $event)" class="tactile-input w-full text-sm font-semibold" />
                </div>
                <div>
                  <label class="block text-xs font-extrabold text-slate-500 mb-1">Kết thúc</label>
                  <input type="time" [ngModel]="slot.endTime" readonly class="tactile-input w-full text-sm font-semibold bg-slate-50" />
                </div>
                <button type="button" (click)="removeSlot(index)" [disabled]="proposalSlots().length === 1" class="tactile-button-gray px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40">Xóa</button>
              </div>
            }

            <button type="button" (click)="addSlot()" class="tactile-button-gray px-4 py-2 rounded-xl text-xs font-bold">Thêm lịch</button>

            <div class="flex gap-3 pt-2">
              <button (click)="createProposal(lr)" [disabled]="isWorking()" class="tactile-button-blue flex-1 py-3 rounded-xl text-sm font-extrabold uppercase disabled:opacity-60">
                Gửi đề xuất lịch mới
              </button>
              <button (click)="proposalFormVisible.set(false)" [disabled]="isWorking()" class="tactile-button-gray flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60">
                Hủy
              </button>
            </div>
          </div>
        }

        @if (errorMessage()) {
          <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">{{ errorMessage() }}</p>
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
  proposalFormVisible = signal(false);
  readonly dayOptions = DAY_OPTIONS;

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
    return learningRequestStatusLabel(request.status);
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
    if (!request.id || !this.hourlyRate) {
      this.errorMessage.set('Vui lòng nhập đủ thông tin đề xuất.');
      return;
    }

    const scheduleError = validateTimeSlots(this.proposalSlots(), this.hoursPerSession);
    if (scheduleError) {
      this.errorMessage.set(scheduleError);
      return;
    }

    await this.withWork(async () => {
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
    }, 'Không tạo được đề xuất lịch.');
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
