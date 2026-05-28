import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { LearningRequestDto, LearningRequestStatus } from '../../../api/generated/client/models';
import { LearningRequestsService } from '../../../api/generated/client/services';
import { getApiErrorMessage } from '../../../core/http/api-error';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import {
  formatDate,
  formatMoney,
  formatTimeSlots,
  learningRequestStatusLabel,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-learning-requests-page',
  imports: [RouterLink, PaginationComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="font-display text-2xl font-black text-slate-900">Yêu cầu học của tôi</h1>
          <p class="text-sm text-slate-500 mt-1">Theo dõi phản hồi, đề xuất lịch và thanh toán cọc.</p>
        </div>
        <a routerLink="/student/discover" class="tactile-button-green px-5 py-2.5 rounded-xl text-sm font-extrabold uppercase text-center">
          Tìm gia sư
        </a>
      </div>

      <div class="flex gap-2 overflow-x-auto pb-1">
        @for (tab of tabs; track tab.label) {
          <button (click)="setStatus(tab.status)"
                  [class]="activeStatus() === tab.status
                    ? 'bg-duo-blue text-white border-b-2 border-duo-blue-dark'
                    : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'"
                  class="px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap">
            {{ tab.label }}
          </button>
        }
      </div>

      @if (errorMessage()) {
        <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">{{ errorMessage() }}</p>
      }

      @if (isLoading() && requests().length === 0) {
        <div class="grid md:grid-cols-2 gap-4">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="tactile-card p-5 animate-pulse">
              <div class="h-6 bg-slate-100 rounded w-1/3"></div>
              <div class="h-4 bg-slate-100 rounded mt-3 w-1/2"></div>
              <div class="h-16 bg-slate-100 rounded mt-4"></div>
            </div>
          }
        </div>
      } @else if (requests().length > 0) {
        <div
          class="space-y-6 relative transition-opacity duration-200"
          [class.opacity-50]="isLoading()"
          [class.pointer-events-none]="isLoading()"
        >
          <div class="grid md:grid-cols-2 gap-4">
            @for (request of requests(); track request.id) {
              <a [routerLink]="['/student/learning-requests', request.id]" class="tactile-card p-5 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h2 class="font-extrabold text-slate-900">{{ request.subjectName || 'Môn học' }}</h2>
                    <p class="text-sm text-slate-500 mt-1">Gia sư: {{ request.tutorName || 'Đang cập nhật' }}</p>
                  </div>
                  <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-duo-blue">
                    {{ label(request.status) }}
                  </span>
                </div>
                <div class="mt-4 space-y-2 text-sm text-slate-600">
                  <p><span class="font-bold">Lịch:</span> {{ slots(request) }}</p>
                  <p><span class="font-bold">Ngày bắt đầu:</span> {{ date(request.desiredStartDate) }}</p>
                  <p><span class="font-bold">Cọc dự kiến:</span> {{ money(request.calculatedDepositAmount) }}</p>
                </div>
              </a>
            }
          </div>

          <app-pagination
            [page]="page()"
            [pageSize]="pageSize()"
            [totalCount]="totalCount()"
            itemsName="yêu cầu"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          />
        </div>
      } @else {
        <div class="tactile-card p-8 text-center">
          <p class="font-extrabold text-slate-800">Chưa có yêu cầu phù hợp</p>
          <p class="text-sm text-slate-500 mt-1">Tạo yêu cầu học từ hồ sơ gia sư bạn muốn học cùng.</p>
        </div>
      }
    </div>
  `,
})
export class LearningRequestsPage implements OnInit {
  requests = signal<LearningRequestDto[]>([]);
  activeStatus = signal<LearningRequestStatus | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');

  // Pagination states
  page = signal(1);
  pageSize = signal(5);
  totalCount = signal(0);

  readonly tabs = [
    { label: 'Tất cả', status: null },
    { label: 'Chờ phản hồi', status: LearningRequestStatus.Pending },
    { label: 'Cần phản hồi', status: LearningRequestStatus.Negotiating },
    { label: 'Cần thanh toán', status: LearningRequestStatus.SoftBooked },
    { label: 'Đã tạo lớp', status: LearningRequestStatus.ConvertedToClass },
  ];

  private readonly api = inject(LearningRequestsService);

  ngOnInit(): void {
    void this.loadRequests();
  }

  setStatus(status: LearningRequestStatus | null): void {
    this.activeStatus.set(status);
    this.page.set(1);
    void this.loadRequests();
  }

  label(status?: LearningRequestStatus | null): string {
    return learningRequestStatusLabel(status);
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  date(value?: Date | null): string {
    return formatDate(value);
  }

  slots(request: LearningRequestDto): string {
    return formatTimeSlots(request.timeSlots);
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    void this.loadRequests();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.page.set(1);
    void this.loadRequests();
  }

  private async loadRequests(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(
        this.api.getMyLearningRequests(
          this.activeStatus() ?? undefined,
          this.page(),
          this.pageSize(),
          undefined,
          'createdAt',
          'desc',
        ),
      );
      this.requests.set(response.data?.items ?? []);
      this.totalCount.set(response.data?.totalCount ?? 0);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được yêu cầu học.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
