import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { TutorDetailModalComponent } from '../../../shared/components/tutor-detail-modal';

import {
  LearningRequestDto,
  LearningRequestStatus,
  PaymentStatus,
  ScheduleProposalDto,
  TimeSlotInputDto,
} from '../../../api/generated/client/models';
import {
  LearningRequestsService,
  PaymentsService,
  ScheduleProposalsService,
} from '../../../api/generated/client/services';
import { getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import { SessionService } from '../../../core/auth/session';
import {
  DAY_OPTIONS,
  buildEndTime,
  formatDate,
  formatDateTime,
  formatMoney,
  formatTimeSlots,
  learningRequestStatusLabel,
  learningRequestStatusClass,
  validateTimeSlots,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-learning-request-detail-page',
  imports: [FormsModule, RouterLink, TutorDetailModalComponent],
  template: `
    @if (request(); as lr) {
      <div class="mx-auto space-y-6" [class.max-w-6xl]="proposal()" [class.max-w-3xl]="!proposal()">
        <a routerLink="/student/learning-requests" class="text-sm font-bold text-slate-500 hover:text-slate-800">← Quay lại</a>

        <div [class]="proposal() ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-6'">
          <div class="tactile-card p-6 space-y-5 h-full">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 class="font-display text-2xl font-black text-slate-900">{{ lr.subjectName || 'Yêu cầu học' }}</h1>
                <p class="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                  <span>Gia sư: {{ lr.tutorName || 'Đang cập nhật' }}</span>
                  @if (lr.tutorId) {
                    <button (click)="openTutorDetail(lr.tutorId)" 
                            class="text-xs font-extrabold text-duo-blue hover:text-duo-blue-dark hover:underline cursor-pointer">
                      (Xem chi tiết)
                    </button>
                  }
                </p>
              </div>
              <span [class]="statusClass(lr.status)" class="rounded-full px-3 py-1 text-xs font-black">
                {{ label(lr.status) }}
              </span>
            </div>

            <div class="grid sm:grid-cols-2 gap-4 text-sm">
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="font-bold text-slate-500">Lịch đề xuất ban đầu</p>
                <p class="mt-1 font-extrabold text-slate-900">{{ slots(lr) }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="font-bold text-slate-500">Ngày bắt đầu</p>
                <p class="mt-1 font-extrabold text-slate-900">{{ date(lr.desiredStartDate) }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="font-bold text-slate-500">Ngân sách / giờ</p>
                <p class="mt-1 font-extrabold text-slate-900">{{ money(lr.budgetPerHour) }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="font-bold text-slate-500">Tiền đặt cọc</p>
                <p class="mt-1 font-extrabold text-duo-green">{{ money(lr.calculatedDepositAmount) }}</p>
              </div>
            </div>

            @if (lr.note) {
              <div>
                <p class="font-bold text-slate-500 text-sm">Ghi chú</p>
                <p class="mt-1 text-sm text-slate-700">{{ lr.note }}</p>
              </div>
            }

            <div class="grid sm:grid-cols-2 gap-4 text-xs text-slate-500 font-bold">
              <p>Hạn phản hồi lịch: {{ dateTime(lr.scheduleExpiresAt) }}</p>
              <p>Hạn thanh toán: {{ dateTime(lr.paymentExpiresAt) }}</p>
            </div>
          </div>

          @if (proposal(); as p) {
            @if (isMyProposal(p)) {
              <div class="tactile-card p-6 space-y-4 border-duo-blue bg-blue-50/10 h-full">
                <div class="flex items-center justify-between">
                  <h2 class="font-extrabold text-lg text-slate-900">Đề xuất lịch của bạn</h2>
                  <span class="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-duo-blue">Đang chờ phản hồi</span>
                </div>
                <p class="text-sm text-slate-500">Đề xuất lịch mới đang được gửi tới gia sư và chờ phản hồi từ họ.</p>
                
                <div class="grid sm:grid-cols-3 gap-4 text-sm">
                  <div class="rounded-2xl bg-slate-50 p-4 border-2 border-slate-100">
                    <p class="font-bold text-slate-500">Đề xuất lịch</p>
                    <p class="mt-1 font-extrabold text-slate-900">{{ proposalSlots(p) }}</p>
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
              <div class="tactile-card p-6 border-duo-blue flex flex-col justify-between h-full">
                <div class="space-y-4">
                  <h2 class="font-extrabold text-lg text-slate-900">Đề xuất lịch từ gia sư</h2>
                  <div class="grid sm:grid-cols-3 gap-4 text-sm">
                    <div class="rounded-2xl bg-blue-50 p-4">
                      <p class="font-bold text-slate-500">Lịch mới</p>
                      <p class="mt-1 font-extrabold text-slate-900">{{ proposalSlots(p) }}</p>
                    </div>
                    <div class="rounded-2xl bg-blue-50 p-4">
                      <p class="font-bold text-slate-500">Ngày bắt đầu</p>
                      <p class="mt-1 font-extrabold text-slate-900">{{ date(p.desiredStartDate) }}</p>
                    </div>
                    <div class="rounded-2xl bg-blue-50 p-4">
                      <p class="font-bold text-slate-500">Học phí / giờ</p>
                      <p class="mt-1 font-extrabold text-duo-green">{{ money(p.hourlyRate) }}</p>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col sm:flex-row gap-3 mt-6">
                  <button (click)="acceptProposal(p)" [disabled]="isWorking()"
                          class="w-full sm:flex-1 tactile-button-green py-2.5 rounded-xl text-sm font-extrabold uppercase disabled:opacity-60 text-center">
                    Chấp nhận
                  </button>
                  <button (click)="rejectProposal(p)" [disabled]="isWorking()"
                          class="w-full sm:flex-1 tactile-button-gray py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 text-center">
                    Từ chối
                  </button>
                </div>
              </div>
            }
          }
        </div>


        @if (lr.status === softBookedStatus) {
          <div class="tactile-card p-6 space-y-4">
            <h2 class="font-extrabold text-lg text-slate-900">Thanh toán đặt cọc</h2>
            <button (click)="payDeposit(lr)" [disabled]="isWorking()"
                    class="tactile-button-green w-full py-3 rounded-xl font-extrabold uppercase disabled:opacity-60">
              {{ isWorking() ? 'Vui lòng chờ...' : 'Thanh toán đặt cọc' }}
            </button>
          </div>
        }

        @if (errorMessage()) {
          <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">
            {{ errorMessage() }}
          </p>
        }
        @if (selectedTutorId()) {
          <app-tutor-detail-modal [tutorId]="selectedTutorId()" (close)="selectedTutorId.set(null)" />
        }
      </div>
    } @else if (isLoading()) {
      <div class="tactile-card p-8 text-center font-bold text-slate-500">Đang tải yêu cầu học...</div>
    }
  `,
})
export class LearningRequestDetailPage implements OnInit {
  request = signal<LearningRequestDto | null>(null);
  proposal = signal<ScheduleProposalDto | null>(null);
  isLoading = signal(false);
  isWorking = signal(false);
  selectedTutorId = signal<number | null>(null);
  errorMessage = signal('');

  openTutorDetail(tutorId: number): void {
    this.selectedTutorId.set(tutorId);
  }

  readonly dayOptions = DAY_OPTIONS;
  readonly softBookedStatus = LearningRequestStatus.SoftBooked;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly learningRequestsApi = inject(LearningRequestsService);
  private readonly proposalsApi = inject(ScheduleProposalsService);
  private readonly paymentsApi = inject(PaymentsService);
  private readonly sessionService = inject(SessionService);

  ngOnInit(): void {
    void this.loadRequest();
  }

  isMyProposal(proposal: ScheduleProposalDto): boolean {
    return proposal.proposedBy === this.sessionService.user()?.id;
  }



  label(status?: LearningRequestStatus | null): string {
    return learningRequestStatusLabel(status);
  }

  statusClass(status?: LearningRequestStatus | null): string {
    return learningRequestStatusClass(status);
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  date(value?: Date | null): string {
    return formatDate(value);
  }

  dateTime(value?: Date | null): string {
    return formatDateTime(value);
  }

  slots(request: LearningRequestDto): string {
    return formatTimeSlots(request.timeSlots);
  }

  proposalSlots(proposal: ScheduleProposalDto): string {
    return formatTimeSlots(proposal.timeSlots);
  }

  async acceptProposal(proposal: ScheduleProposalDto): Promise<void> {
    if (!proposal.id) return;
    await this.withWork(async () => {
      await firstValueFrom(this.proposalsApi.acceptScheduleProposal(proposal.id!));
      await this.loadRequest();
    }, 'Không chấp nhận được đề xuất.');
  }

  async rejectProposal(proposal: ScheduleProposalDto): Promise<void> {
    if (!proposal.id) return;
    await this.withWork(async () => {
      await firstValueFrom(this.proposalsApi.rejectScheduleProposal(proposal.id!));
      await this.loadRequest();
    }, 'Không từ chối được đề xuất.');
  }

  async payDeposit(request: LearningRequestDto): Promise<void> {
    if (!request.id) return;

    await this.withWork(async () => {
      const checkoutUrl = await this.resolveCheckoutUrl(request.id!);
      if (!checkoutUrl) {
        throw new Error('API không trả về đường dẫn thanh toán.');
      }
      window.location.href = checkoutUrl;
    }, 'Không tạo được thanh toán đặt cọc.');
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
      const response = await firstValueFrom(this.learningRequestsApi.getLearningRequestById(id));
      const request = unwrapApiData(response);
      this.request.set(request);
      await this.loadProposal(request);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được yêu cầu học.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadProposal(request: LearningRequestDto): Promise<void> {
    this.proposal.set(null);
    if (request.status !== LearningRequestStatus.Negotiating || !request.id) return;

    try {
      const response = await firstValueFrom(this.learningRequestsApi.getScheduleProposalByLearningRequest(request.id));
      this.proposal.set(response.data ?? null);
    } catch {
      this.proposal.set(null);
    }
  }

  private async resolveCheckoutUrl(learningRequestId: number): Promise<string | null> {
    try {
      const existing = await firstValueFrom(this.paymentsApi.getPaymentByLearningRequest(learningRequestId));
      if (existing.data?.status === PaymentStatus.Pending && existing.data.checkoutUrl) {
        return existing.data.checkoutUrl;
      }
    } catch (error) {
      if (!(error instanceof HttpErrorResponse) || error.status !== 404) {
        throw error;
      }
    }

    const created = await firstValueFrom(
      this.paymentsApi.createDepositPayment({ learningRequestId }),
    );
    return created.data?.checkoutUrl ?? null;
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
}
