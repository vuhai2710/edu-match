import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  CancellationRequestDto,
  CancellationRequestStatus,
} from '../../../api/generated/client/models';
import { AdminService } from '../../../api/generated/client/services';
import { ApiErrorDetails, getApiErrorDetails } from '../../../core/http/api-error';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import {
  cancellationStatusLabel,
  formatDateTime,
  userRoleLabel,
  cancellationStatusClass,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-admin-cancellation-requests-page',
  imports: [ErrorBannerComponent, FormsModule, RouterLink, PaginationComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display text-2xl font-black text-slate-900">Yêu cầu hủy lớp</h1>
        <p class="text-sm text-slate-500 mt-1">Xử lý hoàn cọc thủ công khi học viên hoặc gia sư yêu cầu hủy lớp.</p>
      </div>

      <div class="space-y-3">
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

        <input type="text"
               [(ngModel)]="searchTerm"
               (ngModelChange)="onSearchChange()"
               placeholder="Tìm theo mã lớp hoặc tên người yêu cầu..."
               class="w-full sm:max-w-sm rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-duo-blue outline-none" />
      </div>

      @if (errorDetails()) {
        <app-error-banner [details]="errorDetails()" />
      }

      <div class="space-y-3 relative transition-opacity duration-200" [class.opacity-50]="isLoading()" [class.pointer-events-none]="isLoading()">
        @for (item of items(); track item.id) {
          <a [routerLink]="['/admin/cancellation-requests', item.id]" class="tactile-card p-5 block hover:shadow-md transition-shadow">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="space-y-1">
                <div class="flex items-center gap-3 flex-wrap">
                  <h2 class="font-extrabold text-slate-900">Lớp {{ item.classCode || '#' + item.classId }}</h2>
                  <span [class]="statusBadgeClass(item.status)"
                        class="rounded-full px-3 py-1 text-xs font-black">{{ statusLabel(item.status) }}</span>
                </div>
                <p class="text-sm text-slate-600">
                  Yêu cầu bởi <span class="font-bold">{{ item.requestedByUserName || 'Không rõ' }}</span>
                  <span class="ml-1 text-xs rounded bg-slate-100 px-2 py-0.5 text-slate-600">{{ roleLabel(item.requestedByRole) }}</span>
                </p>
                <p class="text-sm text-slate-500">{{ dateTime(item.createdAt) }}</p>
              </div>
              <span class="text-duo-blue font-bold text-sm">Xem chi tiết →</span>
            </div>
            @if (item.reason) {
              <p class="mt-3 text-sm text-slate-700 line-clamp-2">{{ item.reason }}</p>
            }
          </a>
        }
      </div>

      @if (!isLoading() && !items().length) {
        <div class="tactile-card p-8 text-center">
          <p class="font-extrabold text-slate-800">Không có yêu cầu hủy</p>
          <p class="text-sm text-slate-500 mt-1">Hiện chưa có yêu cầu phù hợp với bộ lọc.</p>
        </div>
      }

      <app-pagination [page]="page()"
                      [pageSize]="pageSize()"
                      [totalCount]="totalCount()"
                      itemsName="yêu cầu hủy"
                      (pageChange)="onPageChange($event)"
                      (pageSizeChange)="onPageSizeChange($event)" />
    </div>
  `,
})
export class AdminCancellationRequestsPage implements OnInit {
  items = signal<CancellationRequestDto[]>([]);
  activeStatus = signal<CancellationRequestStatus | null>(CancellationRequestStatus.Pending);
  searchTerm = '';
  page = signal(1);
  pageSize = signal(5);
  totalCount = signal(0);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));
  isLoading = signal(false);
  errorDetails = signal<ApiErrorDetails | null>(null);

  readonly tabs: Array<{ label: string; status: CancellationRequestStatus | null }> = [
    { label: 'Chờ xử lý', status: CancellationRequestStatus.Pending },
    { label: 'Đã xử lý', status: CancellationRequestStatus.Resolved },
    { label: 'Tất cả', status: null },
  ];

  private readonly adminApi = inject(AdminService);
  private searchDebounce?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    void this.load();
  }

  setStatus(status: CancellationRequestStatus | null): void {
    this.activeStatus.set(status);
    this.page.set(1);
    void this.load();
  }

  onSearchChange(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.page.set(1);
      void this.load();
    }, 400);
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    void this.load();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.page.set(1);
    void this.load();
  }

  statusLabel = cancellationStatusLabel;
  roleLabel = userRoleLabel;

  statusBadgeClass(status?: CancellationRequestStatus | null): string {
    return cancellationStatusClass(status);
  }

  dateTime(value?: Date | null): string {
    return formatDateTime(value);
  }

  private async load(): Promise<void> {
    this.isLoading.set(true);
    this.errorDetails.set(null);
    try {
      const search = this.searchTerm.trim() || undefined;
      const response = await firstValueFrom(
        this.adminApi.getAllCancellationRequestsForAdmin(
          this.activeStatus() ?? undefined,
          this.page(),
          this.pageSize(),
          search,
          'createdAt',
          'desc',
        ),
      );
      this.items.set(response.data?.items ?? []);
      this.totalCount.set(response.data?.totalCount ?? 0);
    } catch (error) {
      console.error('[admin/cancellation-requests] load failed', error);
      this.errorDetails.set(getApiErrorDetails(error, 'Không tải được danh sách yêu cầu hủy.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}

