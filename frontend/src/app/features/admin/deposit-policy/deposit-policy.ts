import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import {
  DepositPolicyDto,
  DepositPreviewResponseDto,
  UpsertDepositPolicyDto,
} from '../../../api/generated/client/models';
import { DepositPolicyService } from '../../../api/generated/client/services';
import {
  DepositPolicyAdminApiService,
  DepositPolicyPagedResult,
} from '../../../api/facades/deposit-policy-admin-api';
import {
  ApiErrorDetails,
  getApiErrorDetails,
  getApiErrorMessage,
} from '../../../core/http/api-error';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner';
import { formatDate, formatMoney } from '../../../shared/utils/api-ui';

type PolicyLifecycleStatus = 'active' | 'expired' | 'upcoming';

@Component({
  selector: 'app-admin-deposit-policy-page',
  imports: [ErrorBannerComponent, FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display text-2xl font-black text-slate-900">Chính sách đặt cọc</h1>
        <p class="text-sm text-slate-500 mt-1">
          Quản lý số buổi cọc, mức giảm giá và thời gian hiệu lực. Mỗi khoảng thời gian chỉ áp dụng
          một chính sách.
        </p>
      </div>

      @if (loadError()) {
        <app-error-banner [details]="loadError()" />
      }

      <!-- ===== Section A: Active policy ===== -->
      <section class="tactile-card p-6 space-y-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-extrabold text-lg text-slate-800">Chính sách đang áp dụng</h2>
          @if (activePolicy()) {
            <span class="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-duo-green"
              >Đang hiệu lực</span
            >
          } @else {
            <span class="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-duo-orange"
              >Chưa có</span
            >
          }
        </div>

        @if (activePolicy(); as p) {
          <div class="grid sm:grid-cols-3 gap-3 text-sm">
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Số buổi cọc</p>
              <p class="mt-1 font-display text-xl font-black text-slate-800">
                {{ p.depositSessionCount ?? '—' }}
              </p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Giảm giá</p>
              <p class="mt-1 font-display text-xl font-black text-duo-orange">
                {{ percentDisplay(p.discountPercent) }}%
              </p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Hiệu lực</p>
              <p class="mt-1 font-bold text-slate-800">{{ activeRange(p) }}</p>
            </div>
          </div>

          <!-- Preview block -->
          <div class="grid sm:grid-cols-2 gap-3 pt-3 border-t-2 border-slate-100">
            <div>
              <label class="block text-sm font-bold text-slate-600 mb-1"
                >Mô phỏng: Học phí/giờ</label
              >
              <input
                type="number"
                min="0"
                step="10000"
                [(ngModel)]="previewHourlyRate"
                (ngModelChange)="onPreviewChange()"
                class="w-full rounded-xl border-2 border-slate-200 px-3 py-2 focus:border-duo-blue outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-600 mb-1"
                >Mô phỏng: Số giờ/buổi</label
              >
              <input
                type="number"
                min="0.5"
                max="3"
                step="0.5"
                [(ngModel)]="previewHoursPerSession"
                (ngModelChange)="onPreviewChange()"
                class="w-full rounded-xl border-2 border-slate-200 px-3 py-2 focus:border-duo-blue outline-none"
              />
            </div>
          </div>

          @if (preview(); as prev) {
            <div class="rounded-xl bg-green-50 px-4 py-3 space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="font-bold text-slate-600"
                  >Tổng {{ prev.depositSessionCount }} buổi</span
                ><span class="font-extrabold">{{ money(prev.totalAmount) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-bold text-slate-600">Tiền cọc thực tế</span
                ><span class="font-display font-black text-duo-green">{{
                  money(prev.depositAmount)
                }}</span>
              </div>
            </div>
          }
        } @else {
          <p class="text-sm text-slate-500">
            Chưa có chính sách nào đang trong khoảng hiệu lực. Hãy tạo chính sách mới ở mục bên
            dưới.
          </p>
        }
      </section>

      <!-- ===== Section B: Form (create) ===== -->
      <section class="tactile-card p-6 space-y-5">
        <h2 class="font-extrabold text-lg text-slate-800">Tạo chính sách mới</h2>

        @if (formError()) {
          <p
            class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red"
          >
            {{ formError() }}
          </p>
        }
        @if (formSuccess()) {
          <p
            class="rounded-xl border-2 border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-duo-green"
          >
            {{ formSuccess() }}
          </p>
        }

        <!-- Sub-block B1: Số buổi cọc -->
        <div class="rounded-xl bg-slate-50 px-4 py-4 space-y-2">
          <h3 class="font-extrabold text-sm text-slate-700 uppercase tracking-wide">Số buổi cọc</h3>
          <p class="text-xs text-slate-500">
            Số buổi học mà học viên đặt cọc trước. Áp dụng cho toàn bộ khoảng thời gian hiệu lực
            phía dưới.
          </p>
          <input
            type="number"
            min="1"
            step="1"
            [(ngModel)]="depositSessionCount"
            class="w-full sm:max-w-xs rounded-xl border-2 border-slate-200 px-3 py-2 focus:border-duo-blue outline-none bg-white"
          />
        </div>

        <!-- Sub-block B2: Discount + active period -->
        <div class="rounded-xl bg-slate-50 px-4 py-4 space-y-3">
          <h3 class="font-extrabold text-sm text-slate-700 uppercase tracking-wide">
            Mức giảm giá + Thời gian hiệu lực
          </h3>
          <p class="text-xs text-slate-500">
            Mức giảm áp dụng và khoảng thời gian chính sách có hiệu lực. Hệ thống đảm bảo không có 2
            chính sách trùng khoảng.
          </p>

          <div>
            <label class="block text-sm font-bold text-slate-600 mb-1"
              >Phần trăm giảm giá (0–99)</label
            >
            <div class="relative">
              <input
                type="number"
                min="0"
                max="99"
                step="1"
                [ngModel]="discountPercentDisplay()"
                (ngModelChange)="onDiscountChange($event)"
                class="w-full sm:max-w-xs rounded-xl border-2 border-slate-200 px-3 py-2 pr-8 focus:border-duo-blue outline-none bg-white"
              />
              <span
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm"
                >%</span
              >
            </div>
          </div>

          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-bold text-slate-600 mb-1"
                >Hiệu lực từ (tùy chọn)</label
              >
              <input
                type="date"
                [(ngModel)]="activeFrom"
                class="w-full rounded-xl border-2 border-slate-200 px-3 py-2 focus:border-duo-blue outline-none bg-white"
              />
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-600 mb-1"
                >Hiệu lực đến (tùy chọn)</label
              >
              <input
                type="date"
                [(ngModel)]="activeTo"
                class="w-full rounded-xl border-2 border-slate-200 px-3 py-2 focus:border-duo-blue outline-none bg-white"
              />
            </div>
          </div>
          <p class="text-xs text-slate-500">
            Để trống nghĩa là không giới hạn (mở vô tận về phía đầu/cuối). Hệ thống sẽ từ chối nếu
            khoảng này trùng với chính sách khác.
          </p>
        </div>

        <div>
          <button
            (click)="submit()"
            [disabled]="isSubmitting()"
            class="bg-duo-green text-white font-extrabold py-3 px-6 rounded-xl border-b-4 border-duo-green-dark hover:opacity-95 disabled:opacity-60"
          >
            {{ isSubmitting() ? 'Đang lưu...' : 'Tạo chính sách mới' }}
          </button>
        </div>
      </section>

      <!-- ===== Section C: History list ===== -->
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-extrabold text-lg text-slate-800">Lịch sử chính sách</h2>
          @if (isLoadingHistory()) {
            <span class="text-xs font-bold text-slate-500">Đang tải...</span>
          }
        </div>

        <div class="tactile-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 border-b-2 border-slate-100">
                <tr>
                  <th class="px-4 py-3 text-left font-extrabold text-slate-600">Hiệu lực</th>
                  <th class="px-4 py-3 text-left font-extrabold text-slate-600">Số buổi</th>
                  <th class="px-4 py-3 text-left font-extrabold text-slate-600">Giảm giá</th>
                  <th class="px-4 py-3 text-left font-extrabold text-slate-600">Trạng thái</th>
                  <th class="px-4 py-3 text-right font-extrabold text-slate-600">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                @for (item of history(); track item.id) {
                  <tr class="border-b border-slate-100 hover:bg-slate-50">
                    <td class="px-4 py-3 text-slate-700">{{ activeRange(item) }}</td>
                    <td class="px-4 py-3 font-bold">{{ item.depositSessionCount }}</td>
                    <td class="px-4 py-3 font-bold text-duo-orange">
                      {{ percentDisplay(item.discountPercent) }}%
                    </td>
                    <td class="px-4 py-3">
                      <span
                        [class]="lifecycleBadgeClass(item)"
                        class="rounded-full px-3 py-1 text-xs font-black"
                      >
                        {{ lifecycleLabel(item) }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button
                        (click)="deleteItem(item)"
                        class="text-duo-red font-bold text-xs hover:underline"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (!isLoadingHistory() && !history().length) {
            <div class="p-8 text-center">
              <p class="font-extrabold text-slate-800">Chưa có chính sách nào</p>
              <p class="text-sm text-slate-500 mt-1">Tạo chính sách đầu tiên ở mục phía trên.</p>
            </div>
          }
        </div>

        @if (historyTotalPages() > 1) {
          <div class="flex items-center justify-between text-sm">
            <p class="text-slate-500">
              Tổng {{ historyTotal() }} chính sách · Trang {{ historyPage() }}/{{
                historyTotalPages()
              }}
            </p>
            <div class="flex gap-2">
              <button
                (click)="prevHistory()"
                [disabled]="historyPage() <= 1"
                class="px-3 py-1.5 rounded-lg border-2 border-slate-200 font-bold text-slate-600 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                (click)="nextHistory()"
                [disabled]="historyPage() >= historyTotalPages()"
                class="px-3 py-1.5 rounded-lg border-2 border-slate-200 font-bold text-slate-600 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        }
      </section>
    </div>
  `,
})
export class AdminDepositPolicyPage implements OnInit {
  // Active policy + preview
  activePolicy = signal<DepositPolicyDto | null>(null);
  preview = signal<DepositPreviewResponseDto | null>(null);
  previewHourlyRate = 150000;
  previewHoursPerSession = 2;

  // Form
  depositSessionCount = 1;
  discountPercentRaw = signal(0);
  activeFrom = '';
  activeTo = '';
  isSubmitting = signal(false);
  formError = signal('');
  formSuccess = signal('');

  // History
  history = signal<DepositPolicyDto[]>([]);
  historyPage = signal(1);
  readonly historyPageSize = 10;
  historyTotal = signal(0);
  historyTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.historyTotal() / this.historyPageSize)),
  );
  isLoadingHistory = signal(false);

  // Errors
  loadError = signal<ApiErrorDetails | null>(null);

  private readonly adminApi = inject(DepositPolicyAdminApiService);
  private readonly previewApi = inject(DepositPolicyService);
  private previewDebounce?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    void this.loadAll();
  }

  // ===== Display helpers =====

  discountPercentDisplay(): number {
    return Math.round(this.discountPercentRaw() * 100);
  }

  onDiscountChange(value: number): void {
    const pct = Math.max(0, Math.min(99, Number(value) || 0));
    this.discountPercentRaw.set(pct / 100);
  }

  percentDisplay(value?: number | null): number {
    return Math.round((value ?? 0) * 100);
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  activeRange(p: DepositPolicyDto): string {
    const from = p.activeFrom ? formatDate(p.activeFrom) : '—';
    const to = p.activeTo ? formatDate(p.activeTo) : '—';
    return `${from} → ${to}`;
  }

  lifecycleStatus(p: DepositPolicyDto): PolicyLifecycleStatus {
    const now = Date.now();
    const fromMs = p.activeFrom ? new Date(p.activeFrom).getTime() : -Infinity;
    const toMs = p.activeTo ? new Date(p.activeTo).getTime() : Infinity;
    if (now < fromMs) return 'upcoming';
    if (now > toMs) return 'expired';
    return 'active';
  }

  lifecycleLabel(p: DepositPolicyDto): string {
    switch (this.lifecycleStatus(p)) {
      case 'active':
        return 'Đang áp dụng';
      case 'upcoming':
        return 'Chưa hiệu lực';
      case 'expired':
        return 'Hết hiệu lực';
    }
  }

  lifecycleBadgeClass(p: DepositPolicyDto): string {
    switch (this.lifecycleStatus(p)) {
      case 'active':
        return 'bg-green-50 text-duo-green';
      case 'upcoming':
        return 'bg-blue-50 text-duo-blue';
      case 'expired':
        return 'bg-slate-100 text-slate-600';
    }
  }

  // ===== Actions =====

  onPreviewChange(): void {
    if (this.previewDebounce) clearTimeout(this.previewDebounce);
    this.previewDebounce = setTimeout(() => void this.loadPreview(), 300);
  }

  resetForm(): void {
    this.depositSessionCount = 1;
    this.discountPercentRaw.set(0);
    this.activeFrom = '';
    this.activeTo = '';
    this.formError.set('');
    this.formSuccess.set('');
  }

  async deleteItem(p: DepositPolicyDto): Promise<void> {
    if (!p.id) return;
    const confirmed = window.confirm(
      `Xác nhận xóa chính sách (${this.activeRange(p)}, ${this.percentDisplay(p.discountPercent)}%)? Thao tác không thể hoàn tác.`,
    );
    if (!confirmed) return;
    this.formError.set('');
    this.formSuccess.set('');
    try {
      await firstValueFrom(this.adminApi.delete(p.id));
      this.formSuccess.set('Đã xóa chính sách.');
      await this.loadAll();
    } catch (error) {
      console.error('[admin/deposit-policy] delete failed', error);
      this.formError.set(getApiErrorMessage(error, 'Không xóa được chính sách.'));
    }
  }

  async submit(): Promise<void> {
    this.formError.set('');
    this.formSuccess.set('');

    if (this.depositSessionCount <= 0) {
      this.formError.set('Số buổi cọc phải lớn hơn 0.');
      return;
    }
    const discount = this.discountPercentRaw();
    if (discount < 0 || discount >= 1) {
      this.formError.set('Phần trăm giảm giá phải từ 0 đến 99.');
      return;
    }
    if (this.activeFrom && this.activeTo && new Date(this.activeTo) <= new Date(this.activeFrom)) {
      this.formError.set('Ngày kết thúc hiệu lực phải sau ngày bắt đầu.');
      return;
    }

    const dto: UpsertDepositPolicyDto = {
      depositSessionCount: this.depositSessionCount,
      discountPercent: discount,
      activeFrom: this.activeFrom ? new Date(this.activeFrom) : null,
      activeTo: this.activeTo ? new Date(this.activeTo) : null,
    };

    this.isSubmitting.set(true);
    try {
      await firstValueFrom(this.adminApi.create(dto));
      this.formSuccess.set('Đã tạo chính sách mới.');
      this.resetForm();
      await this.loadAll();
    } catch (error) {
      console.error('[admin/deposit-policy] submit failed', error);
      this.formError.set(getApiErrorMessage(error, 'Không lưu được chính sách.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  prevHistory(): void {
    if (this.historyPage() > 1) {
      this.historyPage.update((p) => p - 1);
      void this.loadHistory();
    }
  }

  nextHistory(): void {
    if (this.historyPage() < this.historyTotalPages()) {
      this.historyPage.update((p) => p + 1);
      void this.loadHistory();
    }
  }

  // ===== Loaders =====

  private async loadAll(): Promise<void> {
    this.loadError.set(null);
    await Promise.all([this.loadActive(), this.loadHistory(), this.loadPreview()]);
  }

  private async loadActive(): Promise<void> {
    try {
      const response = await firstValueFrom(this.adminApi.getCurrent());
      this.activePolicy.set(response.data ?? null);
    } catch (error) {
      // 404 = no active policy → not an error to user; just leave null.
      this.activePolicy.set(null);
      const status = (error as { status?: number }).status;
      if (status !== 404) {
        console.error('[admin/deposit-policy] loadActive failed', error);
        this.loadError.set(getApiErrorDetails(error, 'Không tải được chính sách đang áp dụng.'));
      }
    }
  }

  private async loadHistory(): Promise<void> {
    this.isLoadingHistory.set(true);
    try {
      const response = await firstValueFrom(
        this.adminApi.getHistory(this.historyPage(), this.historyPageSize),
      );
      const paged: DepositPolicyPagedResult = response.data ?? {};
      this.history.set(paged.items ?? []);
      this.historyTotal.set(paged.totalCount ?? 0);
    } catch (error) {
      console.error('[admin/deposit-policy] loadHistory failed', error);
      this.loadError.set(getApiErrorDetails(error, 'Không tải được lịch sử chính sách.'));
    } finally {
      this.isLoadingHistory.set(false);
    }
  }

  private async loadPreview(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.previewApi.previewDeposit(this.previewHourlyRate, this.previewHoursPerSession),
      );
      this.preview.set(response.data ?? null);
    } catch {
      this.preview.set(null);
    }
  }
}
