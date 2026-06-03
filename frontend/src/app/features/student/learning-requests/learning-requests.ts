import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { LearningRequestDto, LearningRequestStatus, SubjectListItemDto } from '../../../api/generated/client/models';
import { LearningRequestsService, SubjectsService } from '../../../api/generated/client/services';
import { getApiErrorMessage } from '../../../core/http/api-error';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import {
  formatDate,
  formatMoney,
  formatTimeSlots,
  learningRequestStatusLabel,
  learningRequestStatusClass,
  DAY_OPTIONS,
} from '../../../shared/utils/api-ui';

import { TactileSelectComponent } from '../../../shared/components/tactile-select/tactile-select';

@Component({
  selector: 'app-learning-requests-page',
  imports: [RouterLink, PaginationComponent, FormsModule, TactileSelectComponent],
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

      <!-- Tabs -->
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

      <!-- Filters Block -->
      <div class="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-[1fr_200px_200px_100px] gap-3 items-center">
          <!-- Tìm kiếm -->
          <div class="relative">
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event); page.set(1)"
              placeholder="Tìm theo tên gia sư, mã yêu cầu, mã gia sư"
              class="tactile-input w-full text-sm font-semibold pl-4 pr-10 py-2.5"
            />
            @if (searchQuery()) {
              <button
                (click)="searchQuery.set(''); page.set(1)"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all cursor-pointer"
              >
                ✕
              </button>
            }
          </div>

          <!-- Dropdown môn học -->
          <app-tactile-select
            [value]="selectedSubjectId()"
            (valueChange)="selectedSubjectId.set($event); page.set(1)"
            [options]="subjects()"
            valueKey="id"
            labelKey="name"
            placeholder="Tất cả môn học"
            [clearable]="true"
          />

          <!-- Dropdown thứ học -->
          <app-tactile-select
            [value]="selectedDay()"
            (valueChange)="selectedDay.set($event); page.set(1)"
            [options]="dayOptions"
            valueKey="value"
            labelKey="label"
            placeholder="Tất cả ngày học"
            [clearable]="true"
          />

          <!-- Nút Đặt lại -->
          <button
            (click)="resetFilters()"
            [disabled]="!hasActiveFilters()"
            class="tactile-button-gray py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase whitespace-nowrap text-center disabled:opacity-50 disabled:pointer-events-none disabled:transform-none disabled:border-b-4 flex items-center justify-center w-full"
          >
            Đặt lại
          </button>
        </div>
      </div>

      @if (errorMessage()) {
        <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">{{ errorMessage() }}</p>
      }

      @if (isLoading() && allRequests().length === 0) {
        <div class="grid md:grid-cols-2 gap-4">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="tactile-card p-5 animate-pulse">
              <div class="h-6 bg-slate-100 rounded w-1/3"></div>
              <div class="h-4 bg-slate-100 rounded mt-3 w-1/2"></div>
              <div class="h-16 bg-slate-100 rounded mt-4"></div>
            </div>
          }
        </div>
      } @else if (allRequests().length > 0) {
        @if (requests().length > 0) {
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
                    <span [class]="statusClass(request.status)" class="rounded-full px-3 py-1 text-xs font-black">
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
              [pageSizeOptions]="[4, 8, 12, 16]"
              [totalCount]="totalCount()"
              itemsName="yêu cầu"
              (pageChange)="onPageChange($event)"
              (pageSizeChange)="onPageSizeChange($event)"
            />
          </div>
        } @else {
          <div class="tactile-card p-8 text-center">
            <p class="font-extrabold text-slate-800">Không tìm thấy yêu cầu học phù hợp</p>
            <p class="text-sm text-slate-500 mt-1">Vui lòng thay đổi từ khóa hoặc bộ lọc để tìm kiếm lại.</p>
          </div>
        }
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
  // Master list of all requests loaded from API
  allRequests = signal<LearningRequestDto[]>([]);
  subjects = signal<SubjectListItemDto[]>([]);

  // Filter states
  searchQuery = signal('');
  selectedSubjectId = signal<number | null>(null);
  selectedDay = signal<string | null>(null);
  activeStatus = signal<LearningRequestStatus | null>(null);

  isLoading = signal(false);
  errorMessage = signal('');

  // Pagination states
  page = signal(1);
  pageSize = signal(4);

  // Day options for dropdown
  readonly dayOptions = DAY_OPTIONS;

  readonly tabs = [
    { label: 'Tất cả', status: null },
    { label: 'Chờ phản hồi', status: LearningRequestStatus.Pending },
    { label: 'Cần phản hồi', status: LearningRequestStatus.Negotiating },
    { label: 'Cần thanh toán', status: LearningRequestStatus.SoftBooked },
    { label: 'Đã tạo lớp', status: LearningRequestStatus.ConvertedToClass },
  ];

  private readonly api = inject(LearningRequestsService);
  private readonly subjectsApi = inject(SubjectsService);

  // Computed signals for filtering and pagination
  filteredRequests = computed(() => {
    let list = this.allRequests();

    // 1. Search filter
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter((item) => {
        const tutorNameMatch = item.tutorName?.toLowerCase().includes(query) ?? false;
        const requestCodeMatch = String(item.id).includes(query);

        // tutor id/code matching (check tutorId as standard and format "gs" + tutorId)
        const gsCode = `gs${item.tutorId}`;
        const tutorIdMatch = String(item.tutorId) === query || gsCode.includes(query);

        return tutorNameMatch || requestCodeMatch || tutorIdMatch;
      });
    }

    // 2. Subject filter
    const subId = this.selectedSubjectId();
    if (subId !== null) {
      list = list.filter((item) => item.subjectId === subId);
    }

    // 3. Day of week filter
    const day = this.selectedDay();
    if (day !== null) {
      list = list.filter((item) =>
        item.timeSlots?.some((slot) => slot.day === day) ?? false
      );
    }

    return list;
  });

  // Displayed requests for current page
  requests = computed(() => {
    const list = this.filteredRequests();
    const start = (this.page() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return list.slice(start, end);
  });

  // Total count for paginator
  totalCount = computed(() => this.filteredRequests().length);

  ngOnInit(): void {
    void this.loadInitialData();
  }

  private async loadInitialData(): Promise<void> {
    try {
      const subjectResponse = await firstValueFrom(this.subjectsApi.getSubjects());
      this.subjects.set(subjectResponse.data ?? []);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
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

  statusClass(status?: LearningRequestStatus | null): string {
    return learningRequestStatusClass(status);
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
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.page.set(1);
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery() || this.selectedSubjectId() !== null || this.selectedDay() !== null);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedSubjectId.set(null);
    this.selectedDay.set(null);
    this.page.set(1);
  }

  private async loadRequests(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(
        this.api.getMyLearningRequests(
          this.activeStatus() ?? undefined,
          1,
          1000, // Load all requests of active status for client-side sorting and filtering
          undefined,
          'createdAt',
          'desc',
        ),
      );
      this.allRequests.set(response.data?.items ?? []);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được yêu cầu học.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
