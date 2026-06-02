import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ClassDto, ClassStatus, SubjectListItemDto, DayOfWeek } from '../../../api/generated/client/models';
import { AdminService, SubjectsService } from '../../../api/generated/client/services';
import { ApiErrorDetails, getApiErrorDetails } from '../../../core/http/api-error';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { TactileSelectComponent } from '../../../shared/components/tactile-select/tactile-select';
import {
  classStatusLabel,
  classStatusClass,
  formatDate,
  formatMoney,
  formatTimeSlots,
} from '../../../shared/utils/api-ui';

// .NET DayOfWeek enum
const DAY_OPTIONS: Array<{ label: string; value: DayOfWeek }> = [
  { label: 'Thứ 2', value: DayOfWeek.Monday },
  { label: 'Thứ 3', value: DayOfWeek.Tuesday },
  { label: 'Thứ 4', value: DayOfWeek.Wednesday },
  { label: 'Thứ 5', value: DayOfWeek.Thursday },
  { label: 'Thứ 6', value: DayOfWeek.Friday },
  { label: 'Thứ 7', value: DayOfWeek.Saturday },
  { label: 'Chủ nhật', value: DayOfWeek.Sunday },
];

@Component({
  selector: 'app-admin-classes-page',
  imports: [ErrorBannerComponent, FormsModule, RouterLink, PaginationComponent, TactileSelectComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display text-2xl font-black text-slate-900">Quản lý lớp học</h1>
        <p class="text-sm text-slate-500 mt-1">Theo dõi toàn bộ lớp trong hệ thống.</p>
      </div>

      <div class="space-y-3">
        <!-- Status Tabs -->
        <div class="flex flex-wrap gap-2">
          @for (tab of tabs; track tab.label) {
            <button (click)="setStatus(tab.status)"
                    [class]="activeStatus() === tab.status
                      ? 'bg-duo-green text-white border-b-2 border-duo-green-dark'
                      : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'"
                    class="px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap">
              {{ tab.label }}
            </button>
          }
        </div>

        <!-- Filters row -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Subject dropdown -->
          <app-tactile-select
            [value]="selectedSubjectId"
            (valueChange)="selectedSubjectId = $event; onFilterChange()"
            [options]="subjects()"
            valueKey="id"
            labelKey="name"
            placeholder="Tất cả môn học"
            class="min-w-[160px]"
          />

          <!-- Day of week dropdown -->
          <app-tactile-select
            [value]="selectedDayOfWeek"
            (valueChange)="selectedDayOfWeek = $event; onFilterChange()"
            [options]="dayOptions"
            valueKey="value"
            labelKey="label"
            placeholder="Tất cả ngày học"
            class="min-w-[150px]"
          />

          <!-- Search -->
          <div class="flex-1 min-w-[200px]">
            <input type="text"
                   [(ngModel)]="searchTerm"
                   (ngModelChange)="onSearchChange()"
                   placeholder="Tìm theo mã lớp, học viên, gia sư..."
                   class="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-duo-blue outline-none" />
          </div>

          <!-- Clear filters button -->
          @if (hasActiveFilters()) {
            <button (click)="clearFilters()"
                    class="px-3 py-2 rounded-xl border-2 border-slate-200 text-xs font-bold text-slate-500 hover:border-red-300 hover:text-duo-red transition-colors whitespace-nowrap">
              ✕ Xóa bộ lọc
            </button>
          }
        </div>
      </div>

      @if (errorDetails()) {
        <app-error-banner [details]="errorDetails()" />
      }

      <div class="grid md:grid-cols-2 gap-4 relative transition-opacity duration-200" [class.opacity-50]="isLoading()" [class.pointer-events-none]="isLoading()">
        @for (item of classes(); track item.id) {
          <a [routerLink]="['/admin/classes', item.id]" class="tactile-card p-5 hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="font-extrabold text-slate-900">{{ item.code || 'Lớp #' + item.id }}</h2>
                <p class="text-sm text-slate-500 mt-1">{{ item.subjectName || '—' }}</p>
              </div>
              <span [class]="statusBadgeClass(item.status)"
                    class="rounded-full px-3 py-1 text-xs font-black whitespace-nowrap">
                {{ label(item.status) }}
              </span>
            </div>
            <div class="mt-4 space-y-2 text-sm text-slate-600">
              <p><span class="font-bold">Học viên:</span> {{ item.studentName || '—' }}</p>
              <p><span class="font-bold">Gia sư:</span> {{ item.tutorName || '—' }}</p>
              <p><span class="font-bold">Bắt đầu:</span> {{ date(item.startDate) }}</p>
              <p><span class="font-bold">Lịch:</span> {{ slots(item) }}</p>
              <p><span class="font-bold">Cọc:</span> {{ money(item.depositAmountSnapshot) }}</p>
            </div>
          </a>
        }
      </div>

      @if (!isLoading() && !classes().length) {
        <div class="tactile-card p-8 text-center">
          <p class="font-extrabold text-slate-800">Không có lớp học</p>
          <p class="text-sm text-slate-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      }

      <app-pagination [page]="page()"
                      [pageSize]="pageSize()"
                      [pageSizeOptions]="[4, 8, 12, 16]"
                      [totalCount]="totalCount()"
                      itemsName="lớp học"
                      (pageChange)="onPageChange($event)"
                      (pageSizeChange)="onPageSizeChange($event)" />
    </div>
  `,
})
export class AdminClassesPage implements OnInit {
  classes = signal<ClassDto[]>([]);
  subjects = signal<SubjectListItemDto[]>([]);
  activeStatus = signal<ClassStatus | null>(null);
  selectedSubjectId: number | null = null;
  selectedDayOfWeek: DayOfWeek | null = null;
  searchTerm = '';
  page = signal(1);
  pageSize = signal(4);
  totalCount = signal(0);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));
  isLoading = signal(false);
  errorDetails = signal<ApiErrorDetails | null>(null);

  readonly tabs: Array<{ label: string; status: ClassStatus | null }> = [
    { label: 'Tất cả', status: null },
    { label: 'Chờ bắt đầu', status: ClassStatus.PendingStart },
    { label: 'Đang học', status: ClassStatus.Active },
    { label: 'Học viên hủy', status: ClassStatus.CancelledByStudent },
    { label: 'Gia sư hủy', status: ClassStatus.CancelledByTutor },
    { label: 'Admin hủy', status: ClassStatus.CancelledByAdmin },
  ];

  readonly dayOptions = DAY_OPTIONS;

  private readonly adminApi = inject(AdminService);
  private readonly subjectsApi = inject(SubjectsService);
  private readonly route = inject(ActivatedRoute);
  private searchDebounce?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    const statusParam = this.route.snapshot.queryParams['status'];
    if (statusParam) {
      const match = Object.values(ClassStatus).find(val => val === statusParam);
      if (match) {
        this.activeStatus.set(match);
      }
    }
    void this.loadSubjects();
    void this.loadClasses();
  }

  setStatus(status: ClassStatus | null): void {
    this.activeStatus.set(status);
    this.page.set(1);
    void this.loadClasses();
  }

  onFilterChange(): void {
    this.page.set(1);
    void this.loadClasses();
  }

  onSearchChange(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.page.set(1);
      void this.loadClasses();
    }, 400);
  }

  clearFilters(): void {
    this.selectedSubjectId = null;
    this.selectedDayOfWeek = null;
    this.searchTerm = '';
    this.activeStatus.set(null);
    this.page.set(1);
    void this.loadClasses();
  }

  hasActiveFilters(): boolean {
    return (
      this.selectedSubjectId !== null ||
      this.selectedDayOfWeek !== null ||
      this.searchTerm.trim().length > 0 ||
      this.activeStatus() !== null
    );
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    void this.loadClasses();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.page.set(1);
    void this.loadClasses();
  }

  label(status?: ClassStatus | null): string {
    return classStatusLabel(status);
  }

  statusBadgeClass(status?: ClassStatus | null): string {
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

  private async loadSubjects(): Promise<void> {
    try {
      const res = await firstValueFrom(this.subjectsApi.getSubjects());
      this.subjects.set(res.data ?? []);
    } catch {
      // non-critical, subjects dropdown can be empty
    }
  }

  private async loadClasses(): Promise<void> {
    this.isLoading.set(true);
    this.errorDetails.set(null);
    try {
      const search = this.searchTerm.trim() || undefined;
      const response = await firstValueFrom(
        this.adminApi.getAllClasses(
          this.activeStatus() ?? undefined,
          this.selectedSubjectId ?? undefined,
          this.selectedDayOfWeek ?? undefined,
          this.page(),
          this.pageSize(),
          search,
          'createdAt',
          'desc',
          'body'
        ),
      );
      this.classes.set(response.data?.items ?? []);
      this.totalCount.set(response.data?.totalCount ?? 0);
    } catch (error) {
      console.error('[admin/classes] load failed', error);
      this.errorDetails.set(getApiErrorDetails(error, 'Không tải được danh sách lớp.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
