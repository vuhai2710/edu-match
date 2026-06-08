import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { LearningRequestDto, LearningRequestStatus, SubjectListItemDto } from '../../../api/generated/client/models';
import { LearningRequestsService, SubjectsService } from '../../../api/generated/client/services';
import { getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { StudentDetailModalComponent } from '../../../shared/components/student-detail-modal';
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
  selector: 'app-tutor-learning-requests-page',
  imports: [RouterLink, StudentDetailModalComponent, PaginationComponent, FormsModule, TactileSelectComponent],
  template: `
    <div class="space-y-6">
      <div class="bg-gradient-to-r from-duo-blue to-cyan-500 rounded-3xl p-6 md:p-8 flex items-center gap-6 shadow-lg">
        <div class="flex-1 text-white">
          <h1 class="font-display text-2xl md:text-3xl font-black">Danh sách yêu cầu dạy</h1>
          <p class="mt-1 text-blue-100">Quản lý và phản hồi các yêu cầu nhận lớp từ học viên.</p>
        </div>
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
              placeholder="Tìm theo tên học viên, mã yêu cầu, mã học viên"
              class="tactile-input w-full text-sm font-semibold pl-4 pr-10 py-2.5"
            />
            @if (searchQuery()) {
              <button
                (click)="searchQuery.set(''); page.set(1)"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all cursor-pointer"
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
        <div class="grid md:grid-cols-2 gap-6">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="tactile-card p-5 animate-pulse flex flex-col justify-between h-[300px]">
              <div class="space-y-3">
                <div class="h-6 bg-slate-100 rounded w-1/3"></div>
                <div class="h-4 bg-slate-100 rounded w-1/2 mt-1"></div>
                <div class="h-20 bg-slate-100 rounded mt-3"></div>
              </div>
              <div class="h-10 bg-slate-100 rounded mt-5"></div>
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
            <div class="grid md:grid-cols-2 gap-6">
              @for (request of requests(); track request.id) {
                <div class="tactile-card p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div class="space-y-3">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <h2 class="font-extrabold text-lg text-slate-900">{{ request.subjectName || 'Môn học' }}</h2>
                        <p class="text-sm font-bold text-slate-500 mt-1 flex items-center gap-2">
                          <span>Học viên: {{ request.studentName || 'Đang cập nhật' }}</span>
                        </p>
                      </div>
                      <span [class]="statusClass(request.status)" class="rounded-full px-2.5 py-1 text-xs font-black shrink-0">
                        {{ label(request.status) }}
                      </span>
                    </div>
                    
                    <div class="space-y-1.5 text-sm text-slate-600 border-t border-slate-100 pt-3">
                      <p><span class="font-bold text-slate-500">Lịch học:</span> <span class="font-semibold">{{ slots(request) }}</span></p>
                      <p><span class="font-bold text-slate-500">Giờ dạy:</span> <span class="font-semibold">{{ request.hoursPerSession }} giờ/buổi</span></p>
                      <p><span class="font-bold text-slate-500">Ngày bắt đầu:</span> <span class="font-semibold">{{ date(request.desiredStartDate) }}</span></p>
                      <p><span class="font-bold text-slate-500">Học phí đề xuất:</span> <span class="font-extrabold text-duo-green">{{ money(request.budgetPerHour) }}/h</span></p>
                    </div>
                  </div>

                  <div class="mt-5 space-y-2">
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      @if (request.status === 'Pending') {
                        <button (click)="acceptRequest(request)" [disabled]="isWorking()"
                                class="tactile-button-green w-full py-2 rounded-xl text-xs font-black uppercase disabled:opacity-60">
                          Chấp nhận
                        </button>
                        <a [routerLink]="['/tutor/requests', request.id]"
                           class="tactile-button-blue w-full py-2 rounded-xl text-xs font-black uppercase text-center">
                          Đề xuất lịch
                        </a>
                        <button (click)="rejectRequest(request)" [disabled]="isWorking()"
                                class="tactile-button-gray w-full py-2 rounded-xl text-xs font-bold disabled:opacity-60">
                          Từ chối
                        </button>
                      } @else {
                        <a [routerLink]="['/tutor/requests', request.id]"
                           class="tactile-button-blue w-full py-2.5 rounded-xl text-sm font-extrabold uppercase text-center sm:col-span-3">
                          Xem chi tiết đàm phán
                        </a>
                      }
                    </div>

                    <!-- View Student Details Button -->
                    @if (request.studentId) {
                      <button (click)="openStudentDetail(request.studentId)"
                              class="w-full border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-extrabold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors">
                        <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M5 20a7 7 0 0 1 14 0" />
                        </svg>
                        Chi tiết học viên
                      </button>
                    }
                  </div>
                </div>
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
          <div class="tactile-card p-12 text-center">
            <p class="font-extrabold text-slate-800">Không tìm thấy yêu cầu phù hợp</p>
            <p class="text-sm text-slate-500 mt-1">Vui lòng thay đổi từ khóa hoặc bộ lọc để tìm kiếm lại.</p>
          </div>
        }
      } @else {
        <div class="tactile-card p-12 text-center">
          <div class="text-4xl mb-2">📬</div>
          <p class="font-extrabold text-slate-800">Không tìm thấy yêu cầu nào</p>
          <p class="text-sm text-slate-500 mt-1">Các yêu cầu từ học viên gửi đến bạn sẽ hiển thị ở đây.</p>
        </div>
      }
    </div>

    <!-- Student Detail Modal overlay -->
    @if (selectedStudentId()) {
      <app-student-detail-modal [userId]="selectedStudentId()" (close)="selectedStudentId.set(null)" />
    }
  `,
})
export class TutorLearningRequestsPage implements OnInit {
  allRequests = signal<LearningRequestDto[]>([]);
  subjects = signal<SubjectListItemDto[]>([]);
  activeStatus = signal<LearningRequestStatus | null>(null);
  isLoading = signal(false);
  isWorking = signal(false);
  errorMessage = signal('');
  selectedStudentId = signal<number | null>(null);

  // Filter states
  searchQuery = signal('');
  selectedSubjectId = signal<number | null>(null);
  selectedDay = signal<string | null>(null);

  // Pagination states
  page = signal(1);
  pageSize = signal(4);

  readonly dayOptions = DAY_OPTIONS;

  readonly tabs = [
    { label: 'Tất cả', status: null },
    { label: 'Cần phản hồi', status: LearningRequestStatus.Pending },
    { label: 'Chờ học viên phản hồi', status: LearningRequestStatus.Negotiating },
    { label: 'Chờ thanh toán', status: LearningRequestStatus.SoftBooked },
    { label: 'Đã tạo lớp', status: LearningRequestStatus.ConvertedToClass },
  ];

  private readonly requestsApi = inject(LearningRequestsService);
  private readonly subjectsApi = inject(SubjectsService);

  // Computed signal for filtering
  filteredRequests = computed(() => {
    let list = this.allRequests();

    // 1. Search filter
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter((item) => {
        const studentNameMatch = item.studentName?.toLowerCase().includes(query) ?? false;
        const requestCodeMatch = String(item.id).toLowerCase().includes(query) ?? false;
        
        // student id/code matching ("HV" + studentId, "YC" + id)
        const hvCode = `hv${item.studentId}`;
        const ycCode = `yc${item.id}`;
        const studentIdMatch = String(item.studentId) === query || hvCode.includes(query);
        const idMatch = String(item.id) === query || ycCode.includes(query);

        return studentNameMatch || requestCodeMatch || studentIdMatch || idMatch;
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
    if (status === LearningRequestStatus.Negotiating) {
      return 'Đang chờ học viên phản hồi';
    }
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

  openStudentDetail(studentId: number): void {
    this.selectedStudentId.set(studentId);
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

  onPageChange(newPage: number): void {
    this.page.set(newPage);
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.page.set(1);
  }

  async acceptRequest(request: LearningRequestDto): Promise<void> {
    if (!request.id) return;
    this.isWorking.set(true);
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(this.requestsApi.acceptLearningRequest(request.id!));
      unwrapApiData(response);
      await this.loadRequests();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không chấp nhận được yêu cầu.'));
    } finally {
      this.isWorking.set(false);
    }
  }

  async rejectRequest(request: LearningRequestDto): Promise<void> {
    if (!request.id) return;
    this.isWorking.set(true);
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(this.requestsApi.rejectLearningRequest(request.id!));
      unwrapApiData(response);
      await this.loadRequests();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không từ chối được yêu cầu.'));
    } finally {
      this.isWorking.set(false);
    }
  }

  private async loadRequests(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(
        this.requestsApi.getIncomingLearningRequests(
          this.activeStatus() ?? undefined,
          1,
          1000,
          undefined,
          'createdAt',
          'desc',
        ),
      );
      this.allRequests.set(response.data?.items ?? []);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được danh sách yêu cầu dạy.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
