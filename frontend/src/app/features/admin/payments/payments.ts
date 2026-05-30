import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { PaymentAdminDto, PaymentStatus } from '../../../api/generated/client/models';
import { AdminService } from '../../../api/generated/client/services';
import { ApiErrorDetails, getApiErrorDetails } from '../../../core/http/api-error';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { formatDate, formatDateTime, formatMoney, paymentStatusLabel, paymentStatusClass } from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-admin-payments-page',
  imports: [ErrorBannerComponent, FormsModule, RouterLink, PaginationComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display text-2xl font-black text-slate-900">Quản lý thanh toán</h1>
        <p class="text-sm text-slate-500 mt-1">Theo dõi các giao dịch đặt cọc qua PayOS.</p>
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

        <div class="flex flex-wrap items-center gap-3">
          <input type="text"
                 [(ngModel)]="searchTerm"
                 (ngModelChange)="onSearchChange()"
                 placeholder="Tìm theo mã giao dịch"
                 class="w-full sm:max-w-xs rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-duo-blue outline-none" />

          <div class="relative cursor-pointer w-full sm:w-44" (click)="fromInput.showPicker()">
            <input
              type="text"
              [value]="fromDate() ? formatDate(fromDate()) : ''"
              placeholder="Từ ngày"
              class="w-full rounded-xl border-2 border-slate-200 pl-3 pr-10 py-2 text-sm font-semibold bg-white pointer-events-none"
              readonly
            />
            <div class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              #fromInput
              type="date"
              [ngModel]="fromDate()"
              (ngModelChange)="onFromDateChange($event)"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              (click)="$event.stopPropagation(); fromInput.showPicker()"
            />
          </div>

          <div class="relative cursor-pointer w-full sm:w-44" (click)="toInput.showPicker()">
            <input
              type="text"
              [value]="toDate() ? formatDate(toDate()) : ''"
              placeholder="Đến ngày"
              class="w-full rounded-xl border-2 border-slate-200 pl-3 pr-10 py-2 text-sm font-semibold bg-white pointer-events-none"
              readonly
            />
            <div class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              #toInput
              type="date"
              [ngModel]="toDate()"
              (ngModelChange)="onToDateChange($event)"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              (click)="$event.stopPropagation(); toInput.showPicker()"
            />
          </div>

          @if (fromDate() || toDate()) {
            <button (click)="clearDateFilter()"
                    class="text-xs font-bold text-red-500 hover:text-red-700 hover:underline transition-colors">
              Xóa lọc ngày
            </button>
          }
        </div>
      </div>

      @if (errorDetails()) {
        <app-error-banner [details]="errorDetails()" />
      }

      <div class="tactile-card overflow-hidden relative transition-opacity duration-200" [class.opacity-50]="isLoading()" [class.pointer-events-none]="isLoading()">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 border-b-2 border-slate-100">
              <tr>
                <th class="px-4 py-3 text-left font-extrabold text-slate-600">Đơn hàng</th>
                <th class="px-4 py-3 text-right font-extrabold text-slate-600">Số tiền</th>
                <th class="px-4 py-3 text-left font-extrabold text-slate-600">Trạng thái</th>
                <th class="px-4 py-3 text-left font-extrabold text-slate-600">Thời gian</th>
                <th class="px-4 py-3 text-right font-extrabold text-slate-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track item.id) {
                <tr class="border-b border-slate-100 hover:bg-slate-50">
                  <td class="px-4 py-3">
                    <p class="font-extrabold text-slate-900">#{{ item.orderCode }}</p>
                    <p class="text-xs text-slate-500">{{ item.description || '—' }}</p>
                  </td>
                  <td class="px-4 py-3 text-right font-extrabold text-duo-green">{{ money(item.amount) }}</td>
                  <td class="px-4 py-3">
                    <span [class]="badgeClass(item.status)" class="rounded-full px-3 py-1 text-xs font-black">{{ label(item.status) }}</span>
                  </td>
                  <td class="px-4 py-3 text-xs text-slate-600">{{ dateTime(item.paidAt || item.createdAt) }}</td>
                  <td class="px-4 py-3 text-right">
                    <a [routerLink]="['/admin/payments', item.id]" class="text-duo-blue font-bold text-xs hover:underline">Xem</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (!isLoading() && !items().length) {
          <div class="p-8 text-center">
            <p class="font-extrabold text-slate-800">Không có giao dịch</p>
            <p class="text-sm text-slate-500 mt-1">Thử thay đổi bộ lọc.</p>
          </div>
        }
      </div>

      <app-pagination [page]="page()"
                      [pageSize]="pageSize()"
                      [totalCount]="totalCount()"
                      itemsName="giao dịch"
                      (pageChange)="onPageChange($event)"
                      (pageSizeChange)="onPageSizeChange($event)" />
    </div>
  `,
})
export class AdminPaymentsPage implements OnInit {
  items = signal<PaymentAdminDto[]>([]);
  fromDate = signal('');
  toDate = signal('');
  activeStatus = signal<PaymentStatus | null>(null);
  searchTerm = '';
  page = signal(1);
  pageSize = signal(5);
  totalCount = signal(0);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));
  isLoading = signal(false);
  errorDetails = signal<ApiErrorDetails | null>(null);

  readonly tabs: Array<{ label: string; status: PaymentStatus | null }> = [
    { label: 'Tất cả', status: null },
    { label: 'Chờ thanh toán', status: PaymentStatus.Pending },
    { label: 'Thành công', status: PaymentStatus.Success },
    { label: 'Thất bại', status: PaymentStatus.Failed },
    { label: 'Đã hủy', status: PaymentStatus.Cancelled },
  ];

  private readonly adminApi = inject(AdminService);
  private searchDebounce?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    void this.load();
  }

  setStatus(status: PaymentStatus | null): void {
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

  formatDate = formatDate;
  label = paymentStatusLabel;

  badgeClass(status?: PaymentStatus | null): string {
    return paymentStatusClass(status);
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  onFromDateChange(value: string): void {
    this.fromDate.set(value);
    this.page.set(1);
    void this.load();
  }

  onToDateChange(value: string): void {
    this.toDate.set(value);
    this.page.set(1);
    void this.load();
  }

  clearDateFilter(): void {
    this.fromDate.set('');
    this.toDate.set('');
    this.page.set(1);
    void this.load();
  }

  dateTime(value?: Date | null): string {
    return formatDateTime(value);
  }

  private async load(): Promise<void> {
    this.isLoading.set(true);
    this.errorDetails.set(null);
    try {
      const response = await firstValueFrom(
        this.adminApi.getAllPayments(
          this.page(),
          this.pageSize(),
          this.activeStatus() ?? undefined,
          this.fromDate() ? new Date(this.fromDate()) : undefined,
          this.toDate() ? new Date(this.toDate()) : undefined,
          'body'
        ),
      );
      let items = response.data?.items ?? [];
      const search = this.searchTerm.trim();
      if (search) {
        items = items.filter((p: PaymentAdminDto) => String(p.orderCode ?? '').includes(search));
      }
      this.items.set(items);
      this.totalCount.set(response.data?.totalCount ?? 0);
    } catch (error) {
      console.error('[admin/payments] load failed', error);
      this.errorDetails.set(getApiErrorDetails(error, 'Không tải được danh sách thanh toán.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}

