import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  AdminDashboardDto,
  CancellationRequestDto,
  CancellationRequestStatus,
  PaymentAdminDto,
  PendingTutorItemDto,
} from '../../../api/generated/client/models';
import { AdminService, DashboardService } from '../../../api/generated/client/services';
import { ApiErrorDetails, getApiErrorDetails } from '../../../core/http/api-error';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner';
import {
  classStatusLabel,
  cancellationStatusLabel,
  cancellationStatusClass,
  formatDateTime,
  formatMoney,
  paymentStatusLabel,
  paymentStatusClass,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [ErrorBannerComponent, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 flex items-center gap-6 shadow-lg">
        <div class="flex-1 text-white">
          <h1 class="font-display text-2xl md:text-3xl font-black">Bảng điều khiển Admin</h1>
          <p class="mt-1 text-slate-400">Theo dõi người dùng, lớp học, thanh toán và yêu cầu hủy.</p>
        </div>
      </div>

      <app-error-banner [details]="errorDetails()" />

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <a routerLink="/admin/users" class="tactile-card p-5 text-center hover:shadow-md transition-shadow">
          @if (isLoading()) {
            <div class="h-7 w-12 mx-auto rounded bg-slate-200 animate-pulse"></div>
          } @else {
            <p class="font-display text-2xl font-black text-duo-blue">{{ dashboard()?.totalUsers ?? 0 }}</p>
          }
          <p class="text-xs text-slate-500 font-bold mt-1">Tổng người dùng</p>
        </a>
        <a routerLink="/admin/users" [queryParams]="{ role: 'Student' }" class="tactile-card p-5 text-center hover:shadow-md transition-shadow">
          @if (isLoading()) {
            <div class="h-7 w-12 mx-auto rounded bg-slate-200 animate-pulse"></div>
          } @else {
            <p class="font-display text-2xl font-black text-slate-800">{{ dashboard()?.totalStudents ?? 0 }}</p>
          }
          <p class="text-xs text-slate-500 font-bold mt-1">Học viên</p>
        </a>
        <a routerLink="/admin/users" [queryParams]="{ role: 'Tutor' }" class="tactile-card p-5 text-center hover:shadow-md transition-shadow">
          @if (isLoading()) {
            <div class="h-7 w-12 mx-auto rounded bg-slate-200 animate-pulse"></div>
          } @else {
            <p class="font-display text-2xl font-black text-duo-green">{{ dashboard()?.totalTutors ?? 0 }}</p>
          }
          <p class="text-xs text-slate-500 font-bold mt-1">Gia sư</p>
        </a>
        <a routerLink="/admin/users" [queryParams]="{ role: 'Tutor', status: 'Pending' }" class="tactile-card p-5 text-center hover:shadow-md transition-shadow relative">
          @if (isLoading()) {
            <div class="h-7 w-12 mx-auto rounded bg-slate-200 animate-pulse"></div>
          } @else {
            <p class="font-display text-2xl font-black text-duo-orange">
              {{ dashboard()?.pendingTutorApprovals ?? 0 }}
            </p>
          }
          <p class="text-xs text-slate-500 font-bold mt-1">Gia sư chờ duyệt</p>
          @if ((dashboard()?.pendingTutorApprovals ?? 0) > 0) {
            <span class="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-duo-orange animate-pulse"></span>
          }
        </a>
        <a routerLink="/admin/payments" class="tactile-card p-5 text-center hover:shadow-md transition-shadow">
          @if (isLoading()) {
            <div class="h-7 w-20 mx-auto rounded bg-slate-200 animate-pulse"></div>
          } @else {
            <p class="font-display text-2xl font-black text-duo-purple">{{ money(dashboard()?.revenueThisMonth) }}</p>
          }
          <p class="text-xs text-slate-500 font-bold mt-1">Doanh thu tháng</p>
        </a>
      </div>

      <div class="grid sm:grid-cols-3 gap-4">
        <a routerLink="/admin/classes" [queryParams]="{ status: 'PendingStart' }" class="tactile-card p-4 text-center hover:shadow-md transition-shadow">
          @if (isLoading()) {
            <div class="h-7 w-12 mx-auto rounded bg-slate-200 animate-pulse"></div>
          } @else {
            <p class="font-display text-xl font-black text-slate-800">{{ dashboard()?.pendingClasses ?? 0 }}</p>
          }
          <p class="text-xs text-slate-500 font-bold mt-1">Lớp chờ bắt đầu</p>
        </a>
        <a routerLink="/admin/classes" [queryParams]="{ status: 'Active' }" class="tactile-card p-4 text-center hover:shadow-md transition-shadow">
          @if (isLoading()) {
            <div class="h-7 w-12 mx-auto rounded bg-slate-200 animate-pulse"></div>
          } @else {
            <p class="font-display text-xl font-black text-duo-orange">{{ dashboard()?.activeClasses ?? 0 }}</p>
          }
          <p class="text-xs text-slate-500 font-bold mt-1">Lớp đang học</p>
        </a>
        <a routerLink="/admin/classes" [queryParams]="{ status: 'CancelledByStudent' }" class="tactile-card p-4 text-center hover:shadow-md transition-shadow">
          @if (isLoading()) {
            <div class="h-7 w-12 mx-auto rounded bg-slate-200 animate-pulse"></div>
          } @else {
            <p class="font-display text-xl font-black text-slate-800">{{ dashboard()?.cancelledClasses ?? 0 }}</p>
          }
          <p class="text-xs text-slate-500 font-bold mt-1">Lớp đã hủy</p>
        </a>
      </div>

      @if (hasNoData() && !errorDetails()) {
        <div class="tactile-card p-6 text-center bg-slate-50">
          <p class="font-extrabold text-slate-800">Chưa có dữ liệu trong hệ thống</p>
          <p class="text-sm text-slate-500 mt-1">Khi có người dùng, lớp học hoặc thanh toán, bảng điều khiển sẽ cập nhật tự động.</p>
        </div>
      }

      <div class="grid lg:grid-cols-3 gap-5">
        <section>
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-extrabold text-lg text-slate-800">Gia sư chờ duyệt</h2>
            <a routerLink="/admin/users" [queryParams]="{ role: 'Tutor', status: 'Pending' }" class="text-sm font-bold text-duo-blue hover:underline">Xem tất cả →</a>
          </div>
          <div class="space-y-3">
            @for (tutor of dashboard()?.pendingTutors ?? []; track tutor.tutorId) {
              <a [routerLink]="['/admin/users', tutor.userId]" class="tactile-card p-4 flex gap-3 items-start hover:shadow-md transition-shadow cursor-pointer block">
                @if (tutor.avatarUrl) {
                  <img [src]="tutor.avatarUrl" [alt]="tutor.fullName || ''" class="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm" />
                } @else {
                  <div class="w-10 h-10 rounded-full bg-duo-orange text-white flex items-center justify-center font-black text-sm">
                    {{ initials(tutor.fullName) }}
                  </div>
                }
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-1">
                    <span class="font-extrabold text-slate-900 group-hover:text-duo-blue block truncate">
                      {{ tutor.fullName }}
                    </span>
                    <span class="font-extrabold text-duo-green text-xs whitespace-nowrap">{{ money(tutor.hourlyRate) }}/h</span>
                  </div>
                  <p class="text-xs text-slate-500 mt-0.5 line-clamp-2">{{ tutor.profile || 'Chưa cập nhật phần tự giới thiệu.' }}</p>
                  <p class="text-[10px] text-slate-400 font-bold mt-1.5">Yêu cầu: {{ dateTime(tutor.requestedAt) }}</p>
                </div>
              </a>
            }
            @if (!isLoading() && !(dashboard()?.pendingTutors?.length)) {
              <div class="tactile-card p-5 text-center font-bold text-slate-500">Không có gia sư nào đang chờ phê duyệt.</div>
            }
          </div>
        </section>

        <section>
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-extrabold text-lg text-slate-800">Yêu cầu hủy đang chờ</h2>
            <a routerLink="/admin/cancellation-requests" class="text-sm font-bold text-duo-blue hover:underline">Xem tất cả →</a>
          </div>
          <div class="space-y-3">
            @for (request of cancellationRequests(); track request.id) {
              <a [routerLink]="['/admin/cancellation-requests', request.id]" class="tactile-card p-4 block hover:shadow-md transition-shadow cursor-pointer">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-extrabold text-slate-900">{{ request.requestedByUserName || 'Người dùng' }}</p>
                    <p class="text-sm text-slate-500">Lớp {{ request.classCode }} · {{ classLabel(request) }}</p>
                  </div>
                  <span [class]="cancelClass(request)" class="rounded-full px-3 py-1 text-xs font-black">{{ cancelLabel(request) }}</span>
                </div>
                <p class="mt-3 text-sm text-slate-600">{{ request.reason || 'Không có lý do.' }}</p>
              </a>
            }
            @if (!isLoading() && !cancellationRequests().length) {
              <div class="tactile-card p-5 text-center font-bold text-slate-500">Không có yêu cầu hủy đang chờ.</div>
            }
          </div>
        </section>

        <section>
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-extrabold text-lg text-slate-800">Thanh toán gần đây</h2>
            <a routerLink="/admin/payments" class="text-sm font-bold text-duo-blue hover:underline">Xem tất cả →</a>
          </div>
          <div class="space-y-3">
            @for (payment of payments(); track payment.id) {
              <a [routerLink]="['/admin/payments', payment.id]" class="tactile-card p-4 block hover:shadow-md transition-shadow cursor-pointer">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-extrabold text-slate-900">Order #{{ payment.orderCode }}</p>
                    <p class="text-sm text-slate-500">LR #{{ payment.learningRequestId }} · Class #{{ payment.classId || 'chưa có' }}</p>
                  </div>
                  <span [class]="paymentClass(payment)" class="rounded-full px-3 py-1 text-xs font-black">{{ paymentLabel(payment) }}</span>
                </div>
                <div class="mt-3 flex items-center justify-between text-sm">
                  <span class="font-bold text-slate-500">{{ dateTime(payment.createdAt) }}</span>
                  <span class="font-extrabold text-duo-green">{{ money(payment.amount) }}</span>
                </div>
              </a>
            }
            @if (!isLoading() && !payments().length) {
              <div class="tactile-card p-5 text-center font-bold text-slate-500">Chưa có thanh toán nào.</div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
})
export class AdminDashboardPage implements OnInit {
  dashboard = signal<AdminDashboardDto | null>(null);
  payments = signal<PaymentAdminDto[]>([]);
  cancellationRequests = signal<CancellationRequestDto[]>([]);
  errorDetails = signal<ApiErrorDetails | null>(null);
  isLoading = signal(true);

  hasNoData = computed(() => {
    const d = this.dashboard();
    if (!d) return false;
    return (d.totalUsers ?? 0) === 0 && (d.activeClasses ?? 0) === 0 && (d.totalRevenue ?? 0) === 0;
  });

  private readonly dashboardApi = inject(DashboardService);
  private readonly adminApi = inject(AdminService);

  ngOnInit(): void {
    void this.loadDashboard();
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  dateTime(value?: Date | null): string {
    return formatDateTime(value);
  }

  initials(name?: string | null): string {
    if (!name) return '?';
    return name.split(' ').slice(-2).map((s) => s[0]).join('').toUpperCase();
  }

  paymentLabel(payment: PaymentAdminDto): string {
    return paymentStatusLabel(payment.status);
  }

  paymentClass(payment: PaymentAdminDto): string {
    return paymentStatusClass(payment.status);
  }

  classLabel(request: CancellationRequestDto): string {
    return classStatusLabel(request.classStatus);
  }

  cancelLabel(request: CancellationRequestDto): string {
    return cancellationStatusLabel(request.status);
  }

  cancelClass(request: CancellationRequestDto): string {
    return cancellationStatusClass(request.status);
  }

  private async loadDashboard(): Promise<void> {
    this.isLoading.set(true);
    this.errorDetails.set(null);
    try {
      const [dashboardResponse, paymentsResponse, cancellationResponse] = await Promise.all([
        firstValueFrom(this.dashboardApi.getAdminDashboard()),
        firstValueFrom(this.adminApi.getAllPayments(1, 5)),
        firstValueFrom(
          this.adminApi.getAllCancellationRequestsForAdmin(
            CancellationRequestStatus.Pending,
            1,
            5,
            undefined,
            'createdAt',
            'desc',
          ),
        ),
      ]);
      this.dashboard.set(dashboardResponse.data ?? null);
      this.payments.set(paymentsResponse.data?.items ?? []);
      this.cancellationRequests.set(cancellationResponse.data?.items ?? []);
    } catch (error) {
      console.error('[admin/dashboard] load failed', error);
      this.errorDetails.set(getApiErrorDetails(error, 'Không tải được dashboard admin.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
