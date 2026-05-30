import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  CancellationRequestDto,
  CancellationRequestStatus,
  ResolveCancellationRequestDto,
} from '../../../api/generated/client/models';
import { AdminService } from '../../../api/generated/client/services';
import { ApiErrorDetails, getApiErrorDetails, getApiErrorMessage } from '../../../core/http/api-error';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner';
import {
  cancellationStatusLabel,
  classStatusLabel,
  formatDateTime,
  formatMoney,
  userRoleLabel,
  cancellationStatusClass,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-admin-cancellation-request-detail-page',
  imports: [ErrorBannerComponent, FormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <a routerLink="/admin/cancellation-requests" class="text-sm font-bold text-duo-blue hover:underline">← Quay lại danh sách</a>

      @if (errorDetails()) {
        <app-error-banner [details]="errorDetails()" />
      }
      @if (errorMessage()) {
        <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">{{ errorMessage() }}</p>
      }
      @if (successMessage()) {
        <p class="rounded-xl border-2 border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-duo-green">{{ successMessage() }}</p>
      }

      @if (request(); as r) {
        <div class="tactile-card p-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Yêu cầu hủy</p>
              <h1 class="font-display text-2xl font-black text-slate-900">Lớp {{ r.classCode || '#' + r.classId }}</h1>
              <p class="text-sm text-slate-500 mt-1">Trạng thái lớp: {{ classStatus(r.classStatus) }}</p>
            </div>
            <span [class]="statusBadgeClass(r.status)" class="rounded-full px-4 py-1.5 text-sm font-black">{{ statusLabel(r.status) }}</span>
          </div>

          <div class="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Học viên</p>
              <p class="mt-1 font-bold text-slate-800">{{ r.studentName || '—' }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Gia sư</p>
              <p class="mt-1 font-bold text-slate-800">{{ r.tutorName || '—' }}</p>
            </div>
            <div class="rounded-xl bg-yellow-50 px-4 py-3 border-2 border-yellow-200">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Người yêu cầu</p>
              <p class="mt-1 font-bold text-slate-800">{{ r.requestedByUserName || '—' }}</p>
              <p class="text-xs text-slate-500 mt-0.5">{{ roleLabel(r.requestedByRole) }}</p>
            </div>
          </div>

          <div class="mt-4">
            <a [routerLink]="['/admin/classes', r.classId]" class="text-duo-blue font-bold text-sm hover:underline">Xem chi tiết lớp →</a>
          </div>
        </div>

        <div class="tactile-card p-5">
          <h2 class="font-extrabold text-slate-800 mb-2">Lý do hủy</h2>
          <p class="text-sm text-slate-700 whitespace-pre-wrap">{{ r.reason || 'Không có lý do.' }}</p>
        </div>

        @if (r.status === statusEnum.Pending) {
          <div class="tactile-card p-6 space-y-4">
            <h2 class="font-extrabold text-lg text-slate-800">Xử lý hoàn cọc</h2>

            <div class="rounded-xl border-2 border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-slate-700">
              ⚠ Vui lòng chuyển khoản tiền cọc cho học viên/gia sư trước khi tick "Đã hoàn tiền". EduMatch không hoàn tiền tự động.
            </div>

            <div>
              <label class="block text-sm font-bold text-slate-600 mb-1">
                Số tiền hoàn cọc <span class="text-red-500">*</span>
              </label>
              <input type="number" min="0" step="1000"
                     [(ngModel)]="refundAmount"
                     [class.border-red-500]="submitted() && isRefunded && (!refundAmount || refundAmount <= 0)"
                     class="w-full rounded-xl border-2 border-slate-200 px-3 py-2 focus:border-duo-blue outline-none" />
              @if (submitted() && isRefunded && (!refundAmount || refundAmount <= 0)) {
                <p class="text-xs text-red-500 font-bold mt-1">Số tiền hoàn cọc phải lớn hơn 0 khi đánh dấu đã hoàn tiền.</p>
              }
            </div>

            <div>
              <label class="block text-sm font-bold text-slate-600 mb-1">
                Ghi chú hoàn tiền <span class="text-red-500">*</span>
              </label>
              <textarea [(ngModel)]="refundNote" maxlength="1000" rows="3"
                        placeholder="VD: Đã chuyển 200,000đ qua tài khoản VCB ****1234"
                        [class.border-red-500]="submitted() && isRefunded && !refundNote.trim()"
                        class="w-full rounded-xl border-2 border-slate-200 px-3 py-2 focus:border-duo-blue outline-none"></textarea>
              @if (submitted() && isRefunded && !refundNote.trim()) {
                <p class="text-xs text-red-500 font-bold mt-1">Vui lòng nhập ghi chú hoàn tiền (thông tin chuyển khoản đối chiếu).</p>
              }
            </div>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="isRefunded" class="w-4 h-4 accent-duo-green" />
              <span class="text-sm font-bold text-slate-700">Đã hoàn tiền thủ công</span>
            </label>

            <button (click)="resolve()"
                    [disabled]="isResolving()"
                    class="w-full bg-duo-green text-white font-extrabold py-3 rounded-xl border-b-4 border-duo-green-dark hover:opacity-95 disabled:opacity-60">
              {{ isResolving() ? 'Đang xử lý...' : 'Xác nhận đã xử lý' }}
            </button>
          </div>
        } @else {
          <div class="tactile-card p-6 space-y-3 bg-slate-50">
            <h2 class="font-extrabold text-lg text-slate-800">Đã xử lý</h2>
            <div class="grid sm:grid-cols-2 gap-3 text-sm">
              <div class="rounded-xl bg-white px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Số tiền hoàn</p>
                <p class="mt-1 font-bold text-duo-green">{{ money(r.refundAmount) }}</p>
              </div>
              <div class="rounded-xl bg-white px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Trạng thái hoàn</p>
                <p class="mt-1 font-bold text-slate-800">{{ r.isRefunded ? 'Đã hoàn tiền' : 'Chưa hoàn tiền' }}</p>
              </div>
              <div class="rounded-xl bg-white px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Người xử lý</p>
                <p class="mt-1 font-bold text-slate-800">{{ r.resolvedByUserName || '—' }}</p>
              </div>
              <div class="rounded-xl bg-white px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Thời gian xử lý</p>
                <p class="mt-1 font-bold text-slate-800">{{ dateTime(r.resolvedAt) }}</p>
              </div>
              @if (r.refundNote) {
                <div class="rounded-xl bg-white px-4 py-3 sm:col-span-2">
                  <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Ghi chú</p>
                  <p class="mt-1 text-slate-700 whitespace-pre-wrap">{{ r.refundNote }}</p>
                </div>
              }
            </div>
          </div>
        }
      } @else if (!errorMessage()) {
        <div class="tactile-card p-8 text-center font-bold text-slate-500">Đang tải...</div>
      }
    </div>
  `,
})
export class AdminCancellationRequestDetailPage implements OnInit {
  request = signal<CancellationRequestDto | null>(null);
  errorDetails = signal<ApiErrorDetails | null>(null);
  errorMessage = signal('');
  successMessage = signal('');
  isResolving = signal(false);
  submitted = signal(false);

  refundAmount = 0;
  refundNote = '';
  isRefunded = false;

  protected readonly statusEnum = CancellationRequestStatus;

  private readonly route = inject(ActivatedRoute);
  private readonly adminApi = inject(AdminService);

  ngOnInit(): void {
    void this.load();
  }

  statusLabel = cancellationStatusLabel;
  classStatus = classStatusLabel;
  roleLabel = userRoleLabel;

  statusBadgeClass(status?: CancellationRequestStatus | null): string {
    return cancellationStatusClass(status);
  }

  dateTime(value?: Date | null): string {
    return formatDateTime(value);
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  async resolve(): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.submitted.set(true);

    if (this.refundAmount < 0) {
      this.errorMessage.set('Số tiền hoàn không thể âm.');
      return;
    }
    if (this.isRefunded && (!this.refundAmount || this.refundAmount <= 0)) {
      this.errorMessage.set('Khi đánh dấu "Đã hoàn tiền", số tiền hoàn phải lớn hơn 0.');
      return;
    }
    if (this.isRefunded && !this.refundNote.trim()) {
      this.errorMessage.set('Vui lòng nhập ghi chú hoàn tiền (thông tin chuyển khoản đối chiếu).');
      return;
    }

    const r = this.request();
    if (!r?.id) return;

    const dto: ResolveCancellationRequestDto = {
      refundAmount: this.refundAmount,
      refundNote: this.refundNote.trim() || null,
      isRefunded: this.isRefunded,
    };

    this.isResolving.set(true);
    try {
      const response = await firstValueFrom(this.adminApi.resolveCancellationRequest(r.id, dto));
      this.request.set(response.data ?? null);
      this.successMessage.set('Đã xử lý yêu cầu hủy.');
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không xử lý được yêu cầu.'));
    } finally {
      this.isResolving.set(false);
    }
  }

  private async load(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage.set('ID yêu cầu không hợp lệ.');
      return;
    }
    this.errorDetails.set(null);
    try {
      const response = await firstValueFrom(this.adminApi.getCancellationRequestByIdForAdmin(id));
      const data = response.data ?? null;
      this.request.set(data);
      if (data) {
        this.refundAmount = data.refundAmount ?? 0;
        this.refundNote = data.refundNote ?? '';
        this.isRefunded = data.isRefunded ?? false;
      }
    } catch (error) {
      console.error('[admin/cancellation-request-detail] load failed', error);
      this.errorDetails.set(getApiErrorDetails(error, 'Không tải được yêu cầu hủy.'));
    }
  }
}
