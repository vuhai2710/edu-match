import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ClassDto, ClassStatus, SubjectListItemDto, ReviewEligibilityDto } from '../../../api/generated/client/models';
import { ClassesService, SubjectsService, ReviewsService } from '../../../api/generated/client/services';
import { getApiErrorMessage } from '../../../core/http/api-error';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import {
  classStatusLabel,
  classStatusClass,
  formatDate,
  formatTimeSlots,
  DAY_OPTIONS,
} from '../../../shared/utils/api-ui';
import { StudentDetailModalComponent } from '../../../shared/components/student-detail-modal';

import { TactileSelectComponent } from '../../../shared/components/tactile-select/tactile-select';

@Component({
  selector: 'app-tutor-classes-page',
  imports: [RouterLink, StudentDetailModalComponent, PaginationComponent, FormsModule, TactileSelectComponent],
  template: `
    <div class="space-y-6">
      <h1 class="font-display text-2xl font-black text-slate-900">Lớp dạy của tôi</h1>

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
              placeholder="Tìm theo tên học viên, mã lớp, mã học viên"
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
            [options]="tutorSubjects()"
            valueKey="id"
            labelKey="name"
            placeholder="Tất cả môn học"
            [clearable]="true"
          />

          <!-- Dropdown thứ học hoặc bộ lọc Đánh giá -->
          <div class="relative">
            @if (activeTabIsReview()) {
              <app-tactile-select
                [value]="selectedReviewFilter()"
                (valueChange)="selectedReviewFilter.set($event); page.set(1)"
                [options]="[{value: 'all', label: 'Lọc theo đánh giá'}, {value: 'not_reviewed', label: 'Chưa đánh giá'}, {value: '5', label: '5 sao'}, {value: '4', label: '4 sao'}, {value: '3', label: '3 sao'}, {value: '2', label: '2 sao'}, {value: '1', label: '1 sao'}]"
                valueKey="value"
                labelKey="label"
                [showPlaceholderOption]="false"
              />
            } @else {
              <app-tactile-select
                [value]="selectedDay()"
                (valueChange)="selectedDay.set($event); page.set(1)"
                [options]="dayOptions"
                valueKey="value"
                labelKey="label"
                placeholder="Tất cả ngày học"
                [clearable]="true"
              />
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

      @if (errorMessage()) {
        <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">{{ errorMessage() }}</p>
      }

      @if (isLoading() && allClasses().length === 0) {
        <div class="grid md:grid-cols-2 gap-4">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="tactile-card p-5 animate-pulse">
              <div class="h-6 bg-slate-100 rounded w-1/3"></div>
              <div class="h-4 bg-slate-100 rounded mt-3 w-1/2"></div>
              <div class="h-8 bg-slate-100 rounded mt-4"></div>
            </div>
          }
        </div>
      } @else if (isLoadingEligibility()) {
        <div class="tactile-card p-8 text-center flex flex-col items-center justify-center space-y-3">
          <div class="w-8 h-8 border-4 border-slate-200 border-t-duo-green rounded-full animate-spin"></div>
          <p class="font-extrabold text-slate-800">Đang tải trạng thái đánh giá...</p>
          <p class="text-sm text-slate-500">Hệ thống đang đồng bộ danh sách đánh giá từ học viên.</p>
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
                <a [routerLink]="['/tutor/classes', item.id]" class="tactile-card p-5 hover:shadow-md transition-shadow">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <h2 class="font-extrabold text-slate-900">{{ item.subjectName || item.code }}</h2>
                      <div class="flex items-center gap-2 mt-1">
                        <p class="text-sm text-slate-500">Học viên: {{ item.studentName || 'Đang cập nhật' }}</p>
                        @if (item.studentId) {
                          <button type="button" 
                                  (click)="openStudentDetail(item.studentId, $event)" 
                                  class="text-xs font-extrabold text-duo-blue hover:text-duo-blue-dark hover:underline">
                            (Xem chi tiết)
                          </button>
                        }
                      </div>
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
                  <p class="text-sm text-slate-500 mt-3">{{ date(item.startDate) }} · {{ slots(item) }}</p>
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
          <p class="font-extrabold text-slate-800">Chưa có lớp dạy nào</p>
          <p class="text-sm text-slate-500 mt-1">Các lớp học bạn nhận dạy sẽ được hiển thị ở đây.</p>
        </div>
      }

      @if (selectedStudentId()) {
        <app-student-detail-modal [userId]="selectedStudentId()" (close)="selectedStudentId.set(null)" />
      }
    </div>
  `,
})
export class TutorClassesPage implements OnInit {
  allClasses = signal<ClassDto[]>([]);
  subjects = signal<SubjectListItemDto[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  selectedStudentId = signal<number | null>(null);

  // Filter states
  searchQuery = signal('');
  selectedSubjectId = signal<number | null>(null);
  selectedDay = signal<string | null>(null);
  activeStatus = signal<ClassStatus | ClassStatus[] | null>(null);
  activeTabIsReview = signal(false);
  selectedReviewFilter = signal<string>('all');

  // Review states
  reviewEligibilityMap = signal<Record<number, ReviewEligibilityDto & { rating?: number }>>({});
  isLoadingEligibility = signal(false);

  // Pagination states
  page = signal(1);
  pageSize = signal(4);

  readonly dayOptions = DAY_OPTIONS;

  readonly tabs = [
    { label: 'Tất cả', status: null as ClassStatus | ClassStatus[] | null, isReviewTab: false },
    { label: 'Chờ bắt đầu', status: ClassStatus.PendingStart, isReviewTab: false },
    { label: 'Đang dạy', status: ClassStatus.Active, isReviewTab: false },
    { label: 'Hoàn thành', status: ClassStatus.Completed, isReviewTab: false },
    { label: 'Đã hủy', status: [ClassStatus.CancelledByStudent, ClassStatus.CancelledByTutor, ClassStatus.CancelledByAdmin], isReviewTab: false },
    { label: 'Đánh giá', status: null as ClassStatus | ClassStatus[] | null, isReviewTab: true },
  ];

  private readonly classesApi = inject(ClassesService);
  private readonly subjectsApi = inject(SubjectsService);
  private readonly reviewsApi = inject(ReviewsService);

  // Computed signal to dynamically list subjects taught by this tutor
  tutorSubjects = computed(() => {
    const classes = this.allClasses();
    const map = new Map<number, string>();
    for (const c of classes) {
      if (c.subjectId && c.subjectName) {
        map.set(c.subjectId, c.subjectName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  });

  // Computed signal for filtering
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
        if (filter === 'not_reviewed') {
          return elig.canReview && !elig.alreadyReviewed;
        } else if (filter !== 'all') {
          // It's a star filter: '1', '2', '3', '4', '5'
          const starNum = Number(filter);
          return elig.alreadyReviewed && elig.rating === starNum;
        }
        return true;
      });
    }

    // 1. Search filter
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter((item) => {
        const studentNameMatch = item.studentName?.toLowerCase().includes(query) ?? false;
        const classCodeMatch = item.code?.toLowerCase().includes(query) ?? false;
        
        // student id/code matching ("HV" + studentId)
        const hvCode = `hv${item.studentId}`;
        const studentIdMatch = String(item.studentId) === query || hvCode.includes(query);

        return studentNameMatch || classCodeMatch || studentIdMatch;
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

  openStudentDetail(studentId: number, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.selectedStudentId.set(studentId);
  }

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

  isTabActive(tab: { label: string; status: ClassStatus | ClassStatus[] | null; isReviewTab: boolean }): boolean {
    if (tab.isReviewTab) {
      return this.activeTabIsReview();
    }
    return !this.activeTabIsReview() && this.activeStatus() === tab.status;
  }

  setStatus(tab: { label: string; status: ClassStatus | ClassStatus[] | null; isReviewTab: boolean }): void {
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

  onPageChange(newPage: number): void {
    this.page.set(newPage);
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.page.set(1);
  }

  private async loadClasses(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const currentStatus = this.activeStatus();
      const isArray = Array.isArray(currentStatus);
      const statusParam = isArray ? undefined : (currentStatus ?? undefined);
      const statusesParam = isArray ? currentStatus : undefined;

      const response = await firstValueFrom(
        this.classesApi.getTutorClasses(
          statusParam,
          statusesParam,
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

      // Fetch review status for tutor
      if (this.activeTabIsReview() && items.length > 0) {
        // Find tutor ID from items
        const tutorId = items.find((c: ClassDto) => c.tutorId)?.tutorId;
        if (tutorId) {
          this.isLoadingEligibility.set(true);
          try {
            // 1. Get all reviews of this tutor
            const reviewsRes = await firstValueFrom(this.reviewsApi.getReviewsByTutorId(tutorId));
            const reviewsList = reviewsRes.data ?? [];
            
            // 2. Fetch parallel review eligibility, fallback to reviewsList check
            const eligibilityPromises = items.map(async (c: ClassDto) => {
              if (!c.id) return null;
              const review = reviewsList.find(r => r.classId === c.id);
              const rating = review?.rating;
              try {
                const res = await firstValueFrom(this.classesApi.getClassReviewEligibility(c.id));
                return {
                  id: c.id,
                  eligibility: {
                    canReview: res.data?.canReview ?? false,
                    alreadyReviewed: res.data?.alreadyReviewed ?? false,
                    rating
                  }
                };
              } catch (e) {
                const hasReview = !!review;
                return {
                  id: c.id,
                  eligibility: {
                    canReview: !hasReview && c.status === ClassStatus.Active,
                    alreadyReviewed: hasReview,
                    rating
                  }
                };
              }
            });
            const results = await Promise.all(eligibilityPromises);
            const map: Record<number, ReviewEligibilityDto & { rating?: number }> = {};
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
      }
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được lớp dạy.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
