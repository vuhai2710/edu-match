import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { PaymentAdminDto, PaymentStatus } from '../../../api/generated/client/models';
import { PaymentsService } from '../../../api/generated/client/services';
import { ApiErrorDetails, getApiErrorDetails } from '../../../core/http/api-error';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { formatDateTime, formatMoney, paymentStatusLabel, paymentStatusClass } from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-student-payments-page',
  imports: [ErrorBannerComponent, FormsModule, RouterLink, PaginationComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="font-display text-2xl font-black text-slate-900">Lịch sử thanh toán</h1>
          <p class="text-sm text-slate-500 mt-1">Xem thông tin và trạng thái các giao dịch thanh toán đặt cọc.</p>
        </div>
      </div>

      <div class="space-y-3">
        <!-- Tabs -->
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

        <!-- Filter bar -->
        <div class="flex flex-wrap items-center gap-3">
          <input type="text"
                 [(ngModel)]="searchTerm"
                 (ngModelChange)="onSearchChange()"
                 placeholder="Tìm theo mã giao dịch"
                 class="tactile-input w-full sm:max-w-xs px-3 py-2 text-sm" />
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
                <th class="px-4 py-3 text-left font-extrabold text-slate-600">Gia sư</th>
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
                  <td class="px-4 py-3 text-xs text-slate-600">
                    @if (item.tutorCode) {
                      <p class="font-bold text-slate-800">{{ item.tutorCode }}</p>
                      <p>{{ item.tutorName }}</p>
                    } @else if (item.tutorName) {
                      <p class="font-bold text-slate-800">{{ item.tutorName }}</p>
                    } @else {
                      <p>—</p>
                    }
                  </td>
                  <td class="px-4 py-3 text-right font-extrabold text-duo-green">{{ money(item.amount) }}</td>
                  <td class="px-4 py-3">
                    <span [class]="badgeClass(item.status)" class="rounded-full px-3 py-1 text-xs font-black">{{ label(item.status) }}</span>
                  </td>
                  <td class="px-4 py-3 text-xs text-slate-600">{{ dateTime(item.paidAt || item.createdAt) }}</td>
                  <td class="px-4 py-3 text-right">
                    <a [routerLink]="['/student/payments', item.id]" class="text-duo-blue font-bold text-xs hover:underline">Xem chi tiết</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (!isLoading() && !items().length) {
          <div class="p-8 text-center">
            <p class="font-extrabold text-slate-800">Không có giao dịch nào</p>
            <p class="text-sm text-slate-500 mt-1">Lịch sử giao dịch trống.</p>
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
export class StudentPaymentsPage implements OnInit {
  items = signal<PaymentAdminDto[]>([]);
  activeStatus = signal<PaymentStatus | null>(null);
  searchTerm = '';
  page = signal(1);
  pageSize = signal(5);
  totalCount = signal(0);
  isLoading = signal(false);
  errorDetails = signal<ApiErrorDetails | null>(null);

  readonly tabs: Array<{ label: string; status: PaymentStatus | null }> = [
    { label: 'Tất cả', status: null },
    { label: 'Chờ thanh toán', status: PaymentStatus.Pending },
    { label: 'Thành công', status: PaymentStatus.Success },
    { label: 'Thất bại', status: PaymentStatus.Failed },
    { label: 'Đã hủy', status: PaymentStatus.Cancelled },
  ];

  private readonly paymentsApi = inject(PaymentsService);
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

  label = paymentStatusLabel;

  badgeClass(status?: PaymentStatus | null): string {
    return paymentStatusClass(status);
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  dateTime(value?: Date | string | null): string {
    return formatDateTime(value);
  }

  private async load(): Promise<void> {
    this.isLoading.set(true);
    this.errorDetails.set(null);
    try {
      const response = await firstValueFrom(
        this.paymentsApi.getMyPayments(
          this.page(),
          this.pageSize(),
          this.activeStatus() ?? undefined
        ),
      );
      let items = response.data?.items ?? [];
      const search = this.searchTerm.trim();
      if (search) {
        items = items.filter((p) => String(p.orderCode ?? '').includes(search));
      }
      this.items.set(items);
      this.totalCount.set(response.data?.totalCount ?? 0);
    } catch (error) {
      console.error('[student/payments] load failed', error);
      this.errorDetails.set(getApiErrorDetails(error, 'Không tải được danh sách thanh toán của bạn.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
