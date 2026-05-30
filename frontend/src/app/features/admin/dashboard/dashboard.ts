import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '../../../core/auth/session';

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
      <!-- Premium Hero Banner -->
      <div
        class="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-3xl p-6 md:p-8 flex items-center gap-6 shadow-lg border-b-6 border-slate-950"
      >
        <!-- Decorative grid overlay -->
        <div class="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
        <div class="flex-1 text-white relative z-10">
          <h1 class="font-display text-2xl md:text-4xl font-black tracking-tight leading-tight">{{ greetingString }} 👋</h1>
          <p class="mt-2 text-slate-300 max-w-xl text-sm md:text-base font-medium opacity-90">
            {{ dateString }}
          </p>
        </div>
      </div>

      <app-error-banner [details]="errorDetails()" />

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <a
          routerLink="/admin/users"
          class="tactile-card p-5 text-center hover:shadow-md transition-shadow"
        >
          @if (isLoading()) {
            <div class="h-7 w-12 mx-auto rounded bg-slate-200 animate-pulse"></div>
          } @else {
            <p class="font-display text-2xl font-black text-duo-blue">
              {{ dashboard()?.totalUsers ?? 0 }}
            </p>
          }
          <p class="text-xs text-slate-500 font-bold mt-1">Tổng người dùng</p>
        </a>
        <a
          routerLink="/admin/users"
          [queryParams]="{ role: 'Student' }"
          class="tactile-card p-5 text-center hover:shadow-md transition-shadow"
        >
          @if (isLoading()) {
            <div class="h-7 w-12 mx-auto rounded bg-slate-200 animate-pulse"></div>
          } @else {
            <p class="font-display text-2xl font-black text-slate-800">
              {{ dashboard()?.totalStudents ?? 0 }}
            </p>
          }
          <p class="text-xs text-slate-500 font-bold mt-1">Học viên</p>
        </a>
        <a
          routerLink="/admin/users"
          [queryParams]="{ role: 'Tutor' }"
          class="tactile-card p-5 text-center hover:shadow-md transition-shadow"
        >
          @if (isLoading()) {
            <div class="h-7 w-12 mx-auto rounded bg-slate-200 animate-pulse"></div>
          } @else {
            <p class="font-display text-2xl font-black text-duo-green">
              {{ dashboard()?.totalTutors ?? 0 }}
            </p>
          }
          <p class="text-xs text-slate-500 font-bold mt-1">Gia sư</p>
        </a>
        <a
          routerLink="/admin/users"
          [queryParams]="{ role: 'Tutor', status: 'Pending' }"
          class="tactile-card p-5 text-center hover:shadow-md transition-shadow relative"
        >
          @if (isLoading()) {
            <div class="h-7 w-12 mx-auto rounded bg-slate-200 animate-pulse"></div>
          } @else {
            <p class="font-display text-2xl font-black text-duo-orange">
              {{ dashboard()?.pendingTutorApprovals ?? 0 }}
            </p>
          }
          <p class="text-xs text-slate-500 font-bold mt-1">Gia sư chờ duyệt</p>
          @if ((dashboard()?.pendingTutorApprovals ?? 0) > 0) {
            <span
              class="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-duo-orange animate-pulse"
            ></span>
          }
        </a>
        <a
          routerLink="/admin/payments"
          class="tactile-card p-5 text-center hover:shadow-md transition-shadow"
        >
          @if (isLoading()) {
            <div class="h-7 w-20 mx-auto rounded bg-slate-200 animate-pulse"></div>
          } @else {
            <p class="font-display text-2xl font-black text-duo-purple">
              {{ money(dashboard()?.revenueThisMonth) }}
            </p>
          }
          <p class="text-xs text-slate-500 font-bold mt-1">Doanh thu tháng</p>
        </a>
      </div>

      <div class="grid sm:grid-cols-3 gap-4">
        <a
          routerLink="/admin/classes"
          [queryParams]="{ status: 'PendingStart' }"
          class="tactile-card p-4 text-center hover:shadow-md transition-shadow"
        >
          @if (isLoading()) {
            <div class="h-7 w-12 mx-auto rounded bg-slate-200 animate-pulse"></div>
          } @else {
            <p class="font-display text-xl font-black text-slate-800">
              {{ dashboard()?.pendingClasses ?? 0 }}
            </p>
          }
          <p class="text-xs text-slate-500 font-bold mt-1">Lớp chờ bắt đầu</p>
        </a>
        <a
          routerLink="/admin/classes"
          [queryParams]="{ status: 'Active' }"
          class="tactile-card p-4 text-center hover:shadow-md transition-shadow"
        >
          @if (isLoading()) {
            <div class="h-7 w-12 mx-auto rounded bg-slate-200 animate-pulse"></div>
          } @else {
            <p class="font-display text-xl font-black text-duo-orange">
              {{ dashboard()?.activeClasses ?? 0 }}
            </p>
          }
          <p class="text-xs text-slate-500 font-bold mt-1">Lớp đang học</p>
        </a>
        <a
          routerLink="/admin/classes"
          [queryParams]="{ status: 'CancelledByStudent' }"
          class="tactile-card p-4 text-center hover:shadow-md transition-shadow"
        >
          @if (isLoading()) {
            <div class="h-7 w-12 mx-auto rounded bg-slate-200 animate-pulse"></div>
          } @else {
            <p class="font-display text-xl font-black text-slate-800">
              {{ dashboard()?.cancelledClasses ?? 0 }}
            </p>
          }
          <p class="text-xs text-slate-500 font-bold mt-1">Lớp đã hủy</p>
        </a>
      </div>

      @if (hasNoData() && !errorDetails()) {
        <div class="tactile-card p-6 text-center bg-slate-50">
          <p class="font-extrabold text-slate-800">Chưa có dữ liệu trong hệ thống</p>
          <p class="text-sm text-slate-500 mt-1">
            Khi có người dùng, lớp học hoặc thanh toán, bảng điều khiển sẽ cập nhật tự động.
          </p>
        </div>
      }

      <div class="grid lg:grid-cols-3 gap-6 items-start">
        <!-- Cột 1: Gia sư chờ duyệt -->
        <section class="tactile-card bg-white p-5 md:p-6 flex flex-col relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-1.5 bg-duo-orange"></div>

          <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-duo-orange"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                </svg>
              </div>
              <h2 class="font-display font-black text-base text-slate-800">Gia sư chờ duyệt</h2>
              @if (dashboard()?.pendingTutorApprovals) {
                <span
                  class="bg-duo-orange/10 text-duo-orange px-2 py-0.5 rounded-full text-xs font-black font-display"
                >
                  {{ dashboard()?.pendingTutorApprovals }}
                </span>
              }
            </div>
            <a
              routerLink="/admin/users"
              [queryParams]="{ role: 'Tutor', status: 'Pending' }"
              class="text-xs font-bold text-duo-blue hover:text-duo-blue-dark transition-colors flex items-center gap-0.5"
            >
              Xem tất cả →
            </a>
          </div>

          <div class="space-y-3">
            @for (tutor of dashboard()?.pendingTutors ?? []; track tutor.tutorId) {
              <a
                [routerLink]="['/admin/users', tutor.userId]"
                class="tactile-card p-4 flex gap-3 items-start hover:shadow-md transition-shadow cursor-pointer block"
              >
                @if (tutor.avatarUrl) {
                  <img
                    [src]="tutor.avatarUrl"
                    [alt]="tutor.fullName || ''"
                    class="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm"
                  />
                } @else {
                  <div
                    class="w-10 h-10 rounded-full bg-duo-orange text-white flex items-center justify-center font-black text-sm"
                  >
                    {{ initials(tutor.fullName) }}
                  </div>
                }
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-1">
                    <span
                      class="font-extrabold text-slate-900 group-hover:text-duo-blue block truncate"
                    >
                      {{ tutor.fullName }}
                    </span>
                    <span class="font-extrabold text-duo-green text-xs whitespace-nowrap"
                      >{{ money(tutor.hourlyRate) }}/h</span
                    >
                  </div>
                  <p class="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    {{ tutor.profile || 'Chưa cập nhật phần tự giới thiệu.' }}
                  </p>
                  <p class="text-[10px] text-slate-400 font-bold mt-1.5">
                    Yêu cầu: {{ dateTime(tutor.requestedAt) }}
                  </p>
                </div>
              </a>
            }

            @if (!isLoading() && !dashboard()?.pendingTutors?.length) {
              <div class="flex flex-col items-center justify-center py-10 text-center px-4">
                <div
                  class="w-16 h-16 rounded-2xl bg-orange-50 border-2 border-orange-100 flex items-center justify-center mb-4 text-duo-orange hover:scale-110 transition-transform duration-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <p class="font-display font-extrabold text-slate-800 text-base">
                  Không có gia sư nào đang chờ phê duyệt!
                </p>
              </div>
            }
          </div>
        </section>

        <!-- Cột 2: Yêu cầu hủy đang chờ -->
        <section class="tactile-card bg-white p-5 md:p-6 flex flex-col relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-1.5 bg-duo-red"></div>

          <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-duo-red"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                </svg>
              </div>
              <h2 class="font-display font-black text-base text-slate-800">Yêu cầu hủy lớp</h2>
              @if (cancellationRequests().length) {
                <span
                  class="bg-duo-red/10 text-duo-red px-2 py-0.5 rounded-full text-xs font-black font-display"
                >
                  {{ cancellationRequests().length }}
                </span>
              }
            </div>
            <a
              routerLink="/admin/cancellation-requests"
              class="text-xs font-bold text-duo-blue hover:text-duo-blue-dark transition-colors flex items-center gap-0.5"
            >
              Xem tất cả →
            </a>
          </div>

          <div class="space-y-3">
            @for (request of cancellationRequests(); track request.id) {
              <a
                [routerLink]="['/admin/cancellation-requests', request.id]"
                class="tactile-card p-4 block hover:shadow-md transition-shadow cursor-pointer"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-extrabold text-slate-900">
                      {{ request.requestedByUserName || 'Người dùng' }}
                    </p>
                    <p class="text-sm text-slate-500">
                      Lớp {{ request.classCode }} · {{ classLabel(request) }}
                    </p>
                  </div>
                  <span
                    [class]="cancelClass(request)"
                    class="rounded-full px-3 py-1 text-xs font-black"
                    >{{ cancelLabel(request) }}</span
                  >
                </div>
                <p class="mt-3 text-sm text-slate-600 line-clamp-2">
                  {{ request.reason || 'Không có lý do.' }}
                </p>
              </a>
            }

            @if (!isLoading() && !cancellationRequests().length) {
              <div class="flex flex-col items-center justify-center py-10 text-center px-4">
                <div
                  class="w-16 h-16 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center mb-4 text-duo-red hover:scale-110 transition-transform duration-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p class="font-display font-extrabold text-slate-800 text-base">
                  Không có yêu cầu hủy lớp nào đang chờ duyệt!
                </p>
              </div>
            }
          </div>
        </section>

        <!-- Cột 3: Thanh toán gần đây -->
        <section class="tactile-card bg-white p-5 md:p-6 flex flex-col relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-1.5 bg-duo-green"></div>

          <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-duo-green"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h2 class="font-display font-black text-base text-slate-800">Thanh toán gần đây</h2>
            </div>
            <a
              routerLink="/admin/payments"
              class="text-xs font-bold text-duo-blue hover:text-duo-blue-dark transition-colors flex items-center gap-0.5"
            >
              Xem tất cả →
            </a>
          </div>

          <div class="space-y-3">
            @for (payment of payments(); track payment.id) {
              <a
                [routerLink]="['/admin/payments', payment.id]"
                class="tactile-card p-4 block hover:shadow-md transition-shadow cursor-pointer"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-extrabold text-slate-900">Order #{{ payment.orderCode }}</p>
                    <p class="text-sm text-slate-500">
                      LR #{{ payment.learningRequestId }} · Class #{{
                        payment.classId || 'chưa có'
                      }}
                    </p>
                  </div>
                  <span
                    [class]="paymentClass(payment)"
                    class="rounded-full px-3 py-1 text-xs font-black"
                    >{{ paymentLabel(payment) }}</span
                  >
                </div>
                <div class="mt-3 flex items-center justify-between text-sm">
                  <span class="font-bold text-slate-500">{{ dateTime(payment.createdAt) }}</span>
                  <span class="font-extrabold text-duo-green">{{ money(payment.amount) }}</span>
                </div>
              </a>
            }

            @if (!isLoading() && !payments().length) {
              <div class="flex flex-col items-center justify-center py-10 text-center px-4">
                <div
                  class="w-16 h-16 rounded-2xl bg-green-50 border-2 border-green-100 flex items-center justify-center mb-4 text-duo-green hover:scale-110 transition-transform duration-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <p class="font-display font-extrabold text-slate-800 text-base">
                  Chưa có giao dịch
                </p>
                <p class="text-xs text-slate-400 mt-1 max-w-[200px]">
                  Không có dữ liệu thanh toán gần đây.
                </p>
              </div>
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

  private readonly session = inject(SessionService);

  get greetingString(): string {
    const hours = new Date().getHours();
    let period = 'sáng';
    if (hours >= 12 && hours < 18) {
      period = 'chiều';
    } else if (hours >= 18 || hours < 4) {
      period = 'tối';
    }
    const name = this.session.user()?.fullName ?? '';
    return `Chào buổi ${period}${name ? ' ' + name : ''}`;
  }

  get dateString(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const dayName = dayNames[dayOfWeek];
    const date = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    return `${dayName}, ngày ${date} tháng ${month} năm ${year}`;
  }

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
    return name
      .split(' ')
      .slice(-2)
      .map((s) => s[0])
      .join('')
      .toUpperCase();
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
