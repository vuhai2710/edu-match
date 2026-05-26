import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  AcceptedScheduleSource,
  ClassDto,
  ClassStatus,
} from '../../../api/generated/client/models';
import { AdminService } from '../../../api/generated/client/services';
import { ApiErrorDetails, getApiErrorDetails } from '../../../core/http/api-error';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner';
import {
  classStatusLabel,
  formatDate,
  formatDateTime,
  formatMoney,
  formatTimeSlots,
  paymentStatusLabel,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-admin-class-detail-page',
  imports: [ErrorBannerComponent, RouterLink],
  template: `
    <div class="space-y-6">
      <a routerLink="/admin/classes" class="text-sm font-bold text-duo-blue hover:underline">← Quay lại danh sách lớp</a>

      @if (errorDetails()) {
        <app-error-banner [details]="errorDetails()" />
      }

      @if (classDetail(); as cls) {
        <div class="tactile-card p-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Mã lớp</p>
              <h1 class="font-display text-2xl font-black text-slate-900">{{ cls.code || 'Lớp #' + cls.id }}</h1>
              <p class="text-sm text-slate-500 mt-1">Môn: {{ cls.subjectName || '—' }}</p>
            </div>
            <span [class]="statusBadgeClass(cls.status)" class="rounded-full px-4 py-1.5 text-sm font-black">
              {{ label(cls.status) }}
            </span>
          </div>
        </div>

        <div class="grid lg:grid-cols-2 gap-5">
          <div class="tactile-card p-5 space-y-2">
            <h2 class="font-extrabold text-slate-800">Học viên</h2>
            <p class="text-sm"><span class="font-bold text-slate-600">Họ tên:</span> {{ cls.studentName || '—' }}</p>
            <p class="text-sm"><span class="font-bold text-slate-600">ID:</span> #{{ cls.studentId }}</p>
          </div>

          <div class="tactile-card p-5 space-y-2">
            <h2 class="font-extrabold text-slate-800">Gia sư</h2>
            <p class="text-sm"><span class="font-bold text-slate-600">Họ tên:</span> {{ cls.tutorName || '—' }}</p>
            <p class="text-sm"><span class="font-bold text-slate-600">ID:</span> #{{ cls.tutorId }}</p>
          </div>
        </div>

        <div class="tactile-card p-5 space-y-3">
          <h2 class="font-extrabold text-slate-800">Thông tin lớp</h2>
          <div class="grid sm:grid-cols-2 gap-3 text-sm">
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Ngày bắt đầu</p>
              <p class="mt-1 font-bold text-slate-800">{{ date(cls.startDate) }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Nguồn lịch</p>
              <p class="mt-1 font-bold text-slate-800">{{ scheduleSourceLabel(cls.acceptedScheduleSource) }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3 sm:col-span-2">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Lịch học</p>
              <p class="mt-1 font-bold text-slate-800">{{ slots(cls) }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Tiền cọc snapshot</p>
              <p class="mt-1 font-bold text-duo-green">{{ money(cls.depositAmountSnapshot) }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Ngày tạo</p>
              <p class="mt-1 font-bold text-slate-800">{{ dateTime(cls.createdAt) }}</p>
            </div>
          </div>
        </div>

        @if (cls.paymentSummary; as pay) {
          <div class="tactile-card p-5 space-y-3">
            <h2 class="font-extrabold text-slate-800">Thanh toán</h2>
            <div class="grid sm:grid-cols-2 gap-3 text-sm">
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Người trả</p>
                <p class="mt-1 font-bold text-slate-800">{{ pay.paidByUserName || '—' }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Số tiền</p>
                <p class="mt-1 font-bold text-duo-green">{{ money(pay.amount) }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Trạng thái</p>
                <p class="mt-1 font-bold text-slate-800">{{ paymentLabel(pay.status) }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Thanh toán lúc</p>
                <p class="mt-1 font-bold text-slate-800">{{ dateTime(pay.paidAt) }}</p>
              </div>
              <div class="sm:col-span-2">
                <a [routerLink]="['/admin/payments', pay.paymentId]" class="text-duo-blue font-bold text-sm hover:underline">
                  Xem chi tiết payment →
                </a>
              </div>
            </div>
          </div>
        }
      } @else if (!errorDetails()) {
        <div class="tactile-card p-8 text-center font-bold text-slate-500">Đang tải...</div>
      }
    </div>
  `,
})
export class AdminClassDetailPage implements OnInit {
  classDetail = signal<ClassDto | null>(null);
  errorDetails = signal<ApiErrorDetails | null>(null);

  private readonly route = inject(ActivatedRoute);
  private readonly adminApi = inject(AdminService);

  ngOnInit(): void {
    void this.load();
  }

  label(status?: ClassStatus | null): string {
    return classStatusLabel(status);
  }

  paymentLabel = paymentStatusLabel;

  scheduleSourceLabel(src?: AcceptedScheduleSource | null): string {
    if (src === AcceptedScheduleSource.R1) return 'R1 — Lịch ban đầu';
    if (src === AcceptedScheduleSource.R2) return 'R2 — Đề xuất từ gia sư';
    return '—';
  }

  statusBadgeClass(status?: ClassStatus | null): string {
    switch (status) {
      case ClassStatus.PendingStart:
        return 'bg-orange-50 text-duo-orange';
      case ClassStatus.Active:
        return 'bg-green-50 text-duo-green';
      case ClassStatus.CancelledByStudent:
      case ClassStatus.CancelledByTutor:
      case ClassStatus.CancelledByAdmin:
        return 'bg-red-50 text-duo-red';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  date(value?: Date | null): string {
    return formatDate(value);
  }

  dateTime(value?: Date | null): string {
    return formatDateTime(value);
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  slots(cls: ClassDto): string {
    return formatTimeSlots(cls.timeSlots);
  }

  private async load(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorDetails.set({ message: 'ID lớp không hợp lệ.' });
      return;
    }
    try {
      const response = await firstValueFrom(this.adminApi.getClassByIdForAdmin(id));
      this.classDetail.set(response.data ?? null);
    } catch (error) {
      console.error('[admin/class-detail] load failed', error);
      this.errorDetails.set(getApiErrorDetails(error, 'Không tải được thông tin lớp.'));
    }
  }
}
