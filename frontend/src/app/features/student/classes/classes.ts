import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ClassDto, ClassStatus, SubjectListItemDto, ReviewEligibilityDto } from '../../../api/generated/client/models';
import { ClassesService, SubjectsService } from '../../../api/generated/client/services';
import { getApiErrorMessage } from '../../../core/http/api-error';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import {
  classStatusLabel,
  classStatusClass,
  formatDate,
  formatMoney,
  formatTimeSlots,
  DAY_OPTIONS,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-student-classes-page',
  imports: [RouterLink, PaginationComponent, FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display text-2xl font-black text-slate-900">Lớp học của tôi</h1>
        <p class="text-sm text-slate-500 mt-1">Các lớp đã được tạo sau khi thanh toán đặt cọc thành công.</p>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 overflow-x-auto pb-1">
        @for (tab of tabs; track tab.label) {
          <button (click)="setStatus(tab)"
                  [class]="isTabActive(tab)
                    ? 'bg-duo-green text-white border-b-2 border-duo-green-dark'
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
              placeholder="Tìm theo tên gia sư, mã lớp, mã gia sư"
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
          <div class="relative">
            <select
              [ngModel]="selectedSubjectId()"
              (ngModelChange)="selectedSubjectId.set($event); page.set(1)"
              class="tactile-input w-full text-sm font-semibold bg-white pl-4 pr-10 py-2.5 cursor-pointer appearance-none"
            >
              <option [ngValue]="null">Tất cả môn học</option>
              @for (subject of subjects(); track subject.id) {
                <option [ngValue]="subject.id">{{ subject.name }}</option>
              }
            </select>
            <svg class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            @if (selectedSubjectId() !== null) {
              <button
                (click)="selectedSubjectId.set(null); page.set(1)"
                class="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all cursor-pointer"
              >
                ✕
              </button>
            }
          </div>

          <!-- Dropdown thứ học hoặc bộ lọc Đánh giá -->
          <div class="relative">
            @if (activeTabIsReview()) {
              <select
                [ngModel]="selectedReviewFilter()"
                (ngModelChange)="selectedReviewFilter.set($event); page.set(1)"
                class="tactile-input w-full text-sm font-semibold bg-white pl-4 pr-10 py-2.5 cursor-pointer appearance-none"
              >
                <option value="all">Tất cả đánh giá</option>
                <option value="not_reviewed">Chưa đánh giá</option>
                <option value="reviewed">Đã đánh giá</option>
              </select>
              <svg class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              @if (selectedReviewFilter() !== 'all') {
                <button
                  (click)="selectedReviewFilter.set('all'); page.set(1)"
                  class="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                >
                  ✕
                </button>
              }
            } @else {
              <select
                [ngModel]="selectedDay()"
                (ngModelChange)="selectedDay.set($event); page.set(1)"
                class="tactile-input w-full text-sm font-semibold bg-white pl-4 pr-10 py-2.5 cursor-pointer appearance-none"
              >
                <option [ngValue]="null">Tất cả ngày học</option>
                @for (day of dayOptions; track day.value) {
                  <option [ngValue]="day.value">{{ day.label }}</option>
                }
              </select>
              <svg class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              @if (selectedDay() !== null) {
                <button
                  (click)="selectedDay.set(null); page.set(1)"
                  class="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                >
                  ✕
                </button>
              }
            }
          </div>

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

      <!-- Mô tả điều kiện đánh giá -->
      @if (activeTabIsReview()) {
        <div class="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex gap-3.5 items-start">
          <div class="bg-amber-100 p-2 rounded-xl text-amber-600 shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
          <div class="space-y-1">
            <h4 class="font-extrabold text-amber-900 text-sm">Yêu cầu điều kiện để có thể gửi đánh giá lớp học:</h4>
            <ul class="text-xs text-amber-800 space-y-1 list-disc pl-4 font-bold">
              <li>Lớp học phải ở trạng thái <strong class="text-amber-950">Đang hoạt động</strong>.</li>
              <li>Chỉ được phép thực hiện đánh giá sau <strong class="text-amber-950">tối thiểu 7 ngày</strong> kể từ ngày lớp học bắt đầu.</li>
              <li>Mỗi lớp học chỉ được phép gửi đánh giá <strong class="text-amber-950">duy nhất 1 lần</strong>.</li>
            </ul>
          </div>
        </div>
      }

      @if (errorMessage()) {
        <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">{{ errorMessage() }}</p>
      }

      @if (isLoading() && allClasses().length === 0) {
        <div class="grid md:grid-cols-2 gap-4">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="tactile-card p-5 animate-pulse">
              <div class="h-6 bg-slate-100 rounded w-1/3"></div>
              <div class="h-4 bg-slate-100 rounded mt-3 w-1/2"></div>
              <div class="h-16 bg-slate-100 rounded mt-4"></div>
            </div>
          }
        </div>
      } @else if (isLoadingEligibility()) {
        <div class="tactile-card p-8 text-center flex flex-col items-center justify-center space-y-3">
          <div class="w-8 h-8 border-4 border-slate-200 border-t-duo-green rounded-full animate-spin"></div>
          <p class="font-extrabold text-slate-800">Đang kiểm tra điều kiện đánh giá...</p>
          <p class="text-sm text-slate-500">Hệ thống đang tải danh sách điều kiện đánh giá các lớp học.</p>
        </div>
      } @else if (allClasses().length > 0) {
        @if (classes().length > 0) {
          <div
            class="space-y-6 relative transition-opacity duration-200"
            [class.opacity-50]="isLoading()"
            [class.pointer-events-none]="isLoading()"
          >
            <div class="grid md:grid-cols-2 gap-4">
              @for (item of classes(); track item.id) {
                <a [routerLink]="['/student/classes', item.id]" class="tactile-card p-5 hover:shadow-md transition-shadow">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <h2 class="font-extrabold text-slate-900">{{ item.subjectName || item.code }}</h2>
                      <p class="text-sm text-slate-500 mt-1">Gia sư: {{ item.tutorName || 'Đang cập nhật' }}</p>
                    </div>
                    <div class="flex flex-col items-end gap-1.5 shrink-0">
                      <span [class]="statusClass(item.status)" class="rounded-full px-3 py-1 text-xs font-black">{{ label(item.status) }}</span>
                      
                      @if (activeTabIsReview() && item.id && reviewEligibilityMap()[item.id]; as elig) {
                        @if (elig.alreadyReviewed) {
                          <span class="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-green-100 text-green-700 border border-green-200 uppercase tracking-wider">
                            Đã đánh giá
                          </span>
                        } @else if (elig.canReview) {
                          <span class="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wider">
                            Chưa đánh giá
                          </span>
                        }
                      }
                    </div>
                  </div>
                  <div class="mt-4 space-y-2 text-sm text-slate-600">
                    <p><span class="font-bold">Bắt đầu:</span> {{ date(item.startDate) }}</p>
                    <p><span class="font-bold">Lịch:</span> {{ slots(item) }}</p>
                    <p><span class="font-bold">Cọc:</span> {{ money(item.depositAmountSnapshot) }}</p>
                  </div>
                </a>
              }
            </div>

            <app-pagination
              [page]="page()"
              [pageSize]="pageSize()"
              [pageSizeOptions]="[4, 8, 12, 16]"
              [totalCount]="totalCount()"
              itemsName="lớp học"
              (pageChange)="onPageChange($event)"
              (pageSizeChange)="onPageSizeChange($event)"
            />
          </div>
        } @else {
          <div class="tactile-card p-8 text-center">
            <p class="font-extrabold text-slate-800">Không tìm thấy lớp học phù hợp</p>
            <p class="text-sm text-slate-500 mt-1">Vui lòng thay đổi từ khóa hoặc bộ lọc để tìm kiếm lại.</p>
          </div>
        }
      } @else {
        <div class="tactile-card p-8 text-center">
          <p class="font-extrabold text-slate-800">Chưa có lớp học</p>
          <p class="text-sm text-slate-500 mt-1">Lớp sẽ xuất hiện sau khi thanh toán đặt cọc thành công.</p>
        </div>
      }
    </div>
  `,
})
export class StudentClassesPage implements OnInit {
  // Master list of all classes loaded from API
  allClasses = signal<ClassDto[]>([]);
  subjects = signal<SubjectListItemDto[]>([]);

  // Filter states
  searchQuery = signal('');
  selectedSubjectId = signal<number | null>(null);
  selectedDay = signal<string | null>(null);
  activeStatus = signal<ClassStatus | null>(null);
  activeTabIsReview = signal(false);
  selectedReviewFilter = signal<'all' | 'reviewed' | 'not_reviewed'>('all');

  // Review states
  reviewEligibilityMap = signal<Record<number, ReviewEligibilityDto>>({});
  isLoadingEligibility = signal(false);

  isLoading = signal(false);
  errorMessage = signal('');

  // Pagination states
  page = signal(1);
  pageSize = signal(4);

  // Day options for dropdown
  readonly dayOptions = DAY_OPTIONS;

  readonly tabs = [
    { label: 'Tất cả', status: null, isReviewTab: false },
    { label: 'Chờ bắt đầu', status: ClassStatus.PendingStart, isReviewTab: false },
    { label: 'Đang hoạt động', status: ClassStatus.Active, isReviewTab: false },
    { label: 'Đánh giá', status: null, isReviewTab: true },
  ];

  private readonly classesApi = inject(ClassesService);
  private readonly subjectsApi = inject(SubjectsService);

  // Computed signals for filtering and pagination
  filteredClasses = computed(() => {
    let list = this.allClasses();

    // Filter by Review Eligibility if active tab is Review Tab
    if (this.activeTabIsReview()) {
      const map = this.reviewEligibilityMap();
      list = list.filter((item) => {
        if (!item.id) return false;
        const elig = map[item.id];
        if (!elig) return false;
        
        // Base condition: only show classes that can be reviewed or are already reviewed
        const isEligible = elig.canReview || elig.alreadyReviewed;
        if (!isEligible) return false;

        // Sub-filter condition
        const filter = this.selectedReviewFilter();
        if (filter === 'reviewed') {
          return elig.alreadyReviewed;
        } else if (filter === 'not_reviewed') {
          return elig.canReview && !elig.alreadyReviewed;
        }
        return true;
      });
    }

    // 1. Search filter
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter((item) => {
        const tutorNameMatch = item.tutorName?.toLowerCase().includes(query) ?? false;
        const classCodeMatch = item.code?.toLowerCase().includes(query) ?? false;
        
        // tutor id/code matching (check tutorId as standard and format "gs" + tutorId)
        const gsCode = `gs${item.tutorId}`;
        const tutorIdMatch = String(item.tutorId) === query || gsCode.includes(query);

        return tutorNameMatch || classCodeMatch || tutorIdMatch;
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

  // Displayed classes for current page
  classes = computed(() => {
    const list = this.filteredClasses();
    const start = (this.page() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return list.slice(start, end);
  });

  // Total count for paginator
  totalCount = computed(() => this.filteredClasses().length);

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
    void this.loadClasses();
  }

  isTabActive(tab: { label: string; status: ClassStatus | null; isReviewTab: boolean }): boolean {
    if (tab.isReviewTab) {
      return this.activeTabIsReview();
    }
    return !this.activeTabIsReview() && this.activeStatus() === tab.status;
  }

  setStatus(tab: { label: string; status: ClassStatus | null; isReviewTab: boolean }): void {
    this.activeStatus.set(tab.status);
    this.activeTabIsReview.set(tab.isReviewTab);
    this.page.set(1);
    void this.loadClasses();
  }

  label(status?: ClassStatus | null): string {
    return classStatusLabel(status);
  }

  statusClass(status?: ClassStatus | null): string {
    return classStatusClass(status);
  }

  date(value?: Date | null): string {
    return formatDate(value);
  }

  slots(item: ClassDto): string {
    return formatTimeSlots(item.timeSlots);
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.page.set(1);
  }

  hasActiveFilters(): boolean {
    const hasReviewFilter = this.activeTabIsReview() && this.selectedReviewFilter() !== 'all';
    const hasDayFilter = !this.activeTabIsReview() && this.selectedDay() !== null;
    return !!(this.searchQuery() || this.selectedSubjectId() !== null || hasDayFilter || hasReviewFilter);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedSubjectId.set(null);
    this.selectedDay.set(null);
    this.selectedReviewFilter.set('all');
    this.page.set(1);
  }

  private async loadClasses(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(
        this.classesApi.getMyClasses(
          this.activeStatus() ?? undefined,
          undefined,
          undefined,
          1,
          1000,
          undefined,
          'createdAt',
          'desc',
          'body'
        ),
      );
      const items = response.data?.items ?? [];
      this.allClasses.set(items);

      // If review tab is active, fetch review eligibility in parallel
      if (this.activeTabIsReview() && items.length > 0) {
        this.isLoadingEligibility.set(true);
        try {
          const eligibilityPromises = items.map(async (c: ClassDto) => {
            if (!c.id) return null;
            try {
              const res = await firstValueFrom(this.classesApi.getClassReviewEligibility(c.id));
              return { id: c.id, eligibility: res.data ?? { canReview: false, alreadyReviewed: false } };
            } catch (e) {
              return { id: c.id, eligibility: { canReview: false, alreadyReviewed: false } };
            }
          });
          const results = await Promise.all(eligibilityPromises);
          const map: Record<number, ReviewEligibilityDto> = {};
          for (const r of results) {
            if (r && r.eligibility) {
              map[r.id] = r.eligibility;
            }
          }
          this.reviewEligibilityMap.set(map);
        } finally {
          this.isLoadingEligibility.set(false);
        }
      }
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được lớp học.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
