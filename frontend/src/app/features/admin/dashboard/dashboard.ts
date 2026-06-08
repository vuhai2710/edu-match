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

      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      <!-- Premium Revenue Statistics Section -->
      <div class="tactile-card bg-white p-6 relative overflow-hidden">
        <div class="absolute top-0 left-0 bottom-0 w-1.5 bg-duo-purple"></div>

        <div class="flex flex-col lg:flex-row gap-6 items-stretch">
          <!-- Left side: Key Revenue Stats -->
          <div class="flex-1 flex flex-col justify-between gap-5 relative z-10">
            <div>
              <h3 class="font-display font-black text-lg text-slate-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-duo-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                Thống kê doanh thu
              </h3>
              <p class="text-xs text-slate-500 font-bold mt-0.5">Tổng quan và lịch sử kết quả kinh doanh</p>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <!-- Doanh thu tháng này -->
              <a routerLink="/admin/payments" class="tactile-card p-4 bg-purple-50/50 hover:bg-purple-50 transition-all border-purple-200 block">
                <span class="text-xs font-black text-purple-600 block mb-1">Doanh thu tháng này</span>
                @if (isLoading()) {
                  <div class="h-8 w-24 bg-purple-200/50 animate-pulse rounded"></div>
                } @else {
                  <span class="font-display text-2xl font-black text-duo-purple">
                    {{ money(dashboard()?.revenueThisMonth) }}
                  </span>
                }
              </a>

              <!-- Tổng doanh thu -->
              <a routerLink="/admin/payments" class="tactile-card p-4 bg-emerald-50/50 hover:bg-emerald-50 transition-all border-emerald-200 block">
                <span class="text-xs font-black text-emerald-600 block mb-1">Tổng doanh thu</span>
                @if (isLoading()) {
                  <div class="h-8 w-28 bg-emerald-200/50 animate-pulse rounded"></div>
                } @else {
                  <span class="font-display text-2xl font-black text-duo-green">
                    {{ money(dashboard()?.totalRevenue) }}
                  </span>
                }
              </a>
            </div>

            <div>
              <button
                (click)="showMonthlyDetails.set(!showMonthlyDetails())"
                class="tactile-button-gray px-4 py-2 text-xs font-black rounded-xl flex items-center gap-1.5"
              >
                {{ showMonthlyDetails() ? 'Ẩn chi tiết từng tháng' : 'Xem chi tiết từng tháng' }}
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 transition-transform duration-200" [class.rotate-180]="showMonthlyDetails()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
          </div>

          <!-- Right side: Mini Bar Chart -->
          <div class="flex-1 flex flex-col justify-end min-h-[160px] bg-slate-50/60 rounded-2xl p-4 border border-slate-100 relative">
            <div class="absolute top-4 left-4 text-xs font-bold text-slate-500">Lịch sử doanh thu (6 tháng gần đây)</div>

            @if (isLoading()) {
              <div class="h-full w-full flex items-center justify-center py-6">
                <div class="w-8 h-8 border-4 border-duo-purple border-t-transparent rounded-full animate-spin"></div>
              </div>
            } @else if (!dashboard()?.monthlyRevenues?.length) {
              <div class="h-full w-full flex items-center justify-center text-slate-400 text-xs font-bold py-6">
                Chưa có dữ liệu doanh thu tháng
              </div>
            } @else {
              <div class="flex items-end justify-between h-[100px] gap-2 mt-8 px-1">
                @for (item of (dashboard()?.monthlyRevenues ?? []).slice().reverse(); track (item.year ?? 0) + '-' + (item.month ?? 0)) {
                  <div class="flex-1 flex flex-col items-center justify-end gap-1.5 group relative h-full">
                    <!-- Bar visual -->
                    <div class="w-8 bg-gradient-to-t from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 rounded-md transition-all duration-300 relative cursor-pointer"
                         [style.height]="((item.revenue ?? 0) / maxRevenue() * 75) + '%'"
                         style="min-height: 8px;">
                      <!-- Tooltip -->
                      <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] font-black rounded-lg py-1 px-2 shadow-md z-20 whitespace-nowrap">
                        {{ money(item.revenue) }}
                      </div>
                    </div>
                    <!-- Label -->
                    <span class="text-[10px] font-black text-slate-400 whitespace-nowrap">
                      {{ item.month ?? '' }}/{{ item.year ? item.year.toString().slice(-2) : '' }}
                    </span>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Detailed breakdown table -->
        @if (showMonthlyDetails() && !isLoading() && dashboard()?.monthlyRevenues?.length) {
          <div class="border-t border-slate-100 mt-6 pt-6 animate-fade-in">
            <h4 class="font-display font-black text-sm text-slate-800 mb-3">Chi tiết doanh thu theo từng tháng</h4>
            <div class="overflow-x-auto">
              <table class="w-full border-collapse text-left text-xs">
                <thead>
                  <tr class="border-b-2 border-slate-100 text-slate-400 font-bold">
                    <th class="pb-2">Thời gian</th>
                    <th class="pb-2 text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  @for (item of dashboard()?.monthlyRevenues; track (item.year ?? 0) + '-' + (item.month ?? 0)) {
                    <tr class="hover:bg-slate-50/50 transition-colors">
                      <td class="py-2.5 font-bold text-slate-700">Tháng {{ item.month ?? '' }}/{{ item.year ?? '' }}</td>
                      <td class="py-2.5 font-extrabold text-duo-green text-right">{{ money(item.revenue) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </div>

      <!-- Class Statistics Section -->
      <div class="tactile-card bg-white p-6 relative overflow-hidden">
        <div class="absolute top-0 left-0 bottom-0 w-1.5 bg-duo-blue"></div>
        <h3 class="font-display font-black text-base text-slate-800 flex items-center gap-2 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-duo-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          Thống kê lớp học
        </h3>

        <div class="divide-y divide-slate-100 max-w-3xl">
          <!-- Row 1: Lớp chờ bắt đầu -->
          <a
            routerLink="/admin/classes"
            [queryParams]="{ status: 'PendingStart' }"
            class="flex items-center justify-between py-3.5 hover:bg-slate-50/50 px-3 -mx-3 rounded-xl transition-all group"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div>
                <p class="text-xs font-black text-slate-700">Lớp chờ bắt đầu</p>
                <p class="text-[10px] text-slate-400 font-bold">Các lớp học đã được lên lịch nhưng chưa đến thời gian bắt đầu</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              @if (isLoading()) {
                <div class="h-6 w-8 bg-slate-200/50 animate-pulse rounded-lg"></div>
              } @else {
                <span class="font-display text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                  {{ dashboard()?.pendingClasses ?? 0 }}
                </span>
              }
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-300 group-hover:text-slate-505 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </a>

          <!-- Row 2: Lớp đang học -->
          <a
            routerLink="/admin/classes"
            [queryParams]="{ status: 'Active' }"
            class="flex items-center justify-between py-3.5 hover:bg-slate-50/50 px-3 -mx-3 rounded-xl transition-all group"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-duo-orange">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div>
                <p class="text-xs font-black text-slate-700">Lớp đang hoạt động</p>
                <p class="text-[10px] text-slate-400 font-bold">Các lớp học đang trong quá trình giảng dạy và học tập tích cực</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              @if (isLoading()) {
                <div class="h-6 w-8 bg-slate-200/50 animate-pulse rounded-lg"></div>
              } @else {
                <span class="font-display text-xs font-black text-duo-orange bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">
                  {{ dashboard()?.activeClasses ?? 0 }}
                </span>
              }
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-300 group-hover:text-slate-505 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </a>

          <!-- Row 3: Lớp đã hoàn thành -->
          <a
            routerLink="/admin/classes"
            [queryParams]="{ status: 'Completed' }"
            class="flex items-center justify-between py-3.5 hover:bg-slate-50/50 px-3 -mx-3 rounded-xl transition-all group"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
              </div>
              <div>
                <p class="text-xs font-black text-slate-700">Lớp đã hoàn thành</p>
                <p class="text-[10px] text-slate-400 font-bold">Các lớp học đã được cả hai bên xác nhận kết thúc</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              @if (isLoading()) {
                <div class="h-6 w-8 bg-slate-200/50 animate-pulse rounded-lg"></div>
              } @else {
                <span class="font-display text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                  {{ dashboard()?.completedClasses ?? 0 }}
                </span>
              }
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-300 group-hover:text-slate-505 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </a>

          <!-- Row 4: Lớp đã hủy -->
          <a
            routerLink="/admin/classes"
            [queryParams]="{ status: 'CancelledByStudent' }"
            class="flex items-center justify-between py-3.5 hover:bg-slate-50/50 px-3 -mx-3 rounded-xl transition-all group"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-duo-red">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>
              <div>
                <p class="text-xs font-black text-slate-700">Lớp đã hủy</p>
                <p class="text-[10px] text-slate-400 font-bold">Các lớp học đã bị hủy bỏ bởi yêu cầu của học viên hoặc gia sư</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              @if (isLoading()) {
                <div class="h-6 w-8 bg-slate-200/50 animate-pulse rounded-lg"></div>
              } @else {
                <span class="font-display text-xs font-black text-red-500 bg-red-50 px-3 py-1 rounded-lg border border-red-100">
                  {{ dashboard()?.cancelledClasses ?? 0 }}
                </span>
              }
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-300 group-hover:text-slate-505 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </a>
        </div>
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
        <!-- Cột 1 & 2: Thanh toán gần đây (lg:col-span-2) -->
        <section class="lg:col-span-2 tactile-card bg-white p-5 md:p-6 flex flex-col relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-1.5 bg-duo-green"></div>

          <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-duo-green">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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

          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-left text-xs">
              <thead>
                <tr class="border-b border-slate-100 text-slate-400 font-bold">
                  <th class="pb-3">Mã đơn hàng</th>
                  <th class="pb-3">Lớp học</th>
                  <th class="pb-3">Thời gian</th>
                  <th class="pb-3 text-right">Số tiền</th>
                  <th class="pb-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                @for (payment of payments().slice(0, 5); track payment.id) {
                  <tr class="hover:bg-slate-50/50 transition-colors">
                    <td class="py-3 font-bold text-slate-800">
                      <a [routerLink]="['/admin/payments', payment.id]" class="hover:text-duo-blue transition-colors">
                        #{{ payment.orderCode }}
                      </a>
                    </td>
                    <td class="py-3 text-slate-600">
                      YCHL #{{ payment.learningRequestId }} · Lớp #{{ payment.classId || 'chưa có' }}
                    </td>
                    <td class="py-3 text-slate-500 font-bold">
                      {{ dateTime(payment.createdAt) }}
                    </td>
                    <td class="py-3 text-right font-extrabold text-duo-green">
                      {{ money(payment.amount) }}
                    </td>
                    <td class="py-3 text-center">
                      <span
                        [class]="paymentClass(payment)"
                        class="rounded-full px-2.5 py-0.5 text-[10px] font-black inline-block"
                      >
                        {{ paymentLabel(payment) }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            @if (!isLoading() && !payments().length) {
              <div class="flex flex-col items-center justify-center py-10 text-center px-4">
                <div class="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center mb-3 text-duo-green">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p class="font-display font-extrabold text-slate-800 text-sm">Chưa có giao dịch</p>
                <p class="text-xs text-slate-400 mt-1">Không có dữ liệu thanh toán gần đây.</p>
              </div>
            }
          </div>
        </section>

        <!-- Cột 3: Quản lý phê duyệt (lg:col-span-1) -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Gia sư chờ duyệt -->
          <section class="tactile-card bg-white p-5 md:p-6 flex flex-col relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-1.5 bg-duo-orange"></div>

            <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-duo-orange">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                  </svg>
                </div>
                <h2 class="font-display font-black text-base text-slate-800">Gia sư chờ duyệt</h2>
                @if (dashboard()?.pendingTutorApprovals) {
                  <span class="bg-duo-orange/10 text-duo-orange px-2 py-0.5 rounded-full text-xs font-black font-display">
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
              @for (tutor of (dashboard()?.pendingTutors ?? []).slice(0, 2); track tutor.tutorId) {
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
                    <div class="w-10 h-10 rounded-full bg-duo-orange text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                      {{ initials(tutor.fullName) }}
                    </div>
                  }
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-1">
                      <span class="font-extrabold text-slate-900 group-hover:text-duo-blue block truncate text-xs">
                        {{ tutor.fullName }}
                      </span>
                      <span class="font-extrabold text-duo-green text-[10px] whitespace-nowrap">
                        {{ money(tutor.hourlyRate) }}/h
                      </span>
                    </div>
                    <p class="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                      {{ tutor.profile || 'Chưa cập nhật phần tự giới thiệu.' }}
                    </p>
                    <p class="text-[9px] text-slate-400 font-bold mt-1.5">
                      Yêu cầu: {{ dateTime(tutor.requestedAt) }}
                    </p>
                  </div>
                </a>
              }

              @if (!isLoading() && !dashboard()?.pendingTutors?.length) {
                <div class="flex items-center gap-3 p-3 rounded-xl bg-orange-50/50 border border-orange-100 text-duo-orange">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-xs font-bold">Không có hồ sơ gia sư chờ duyệt</span>
                </div>
              }
            </div>
          </section>

          <!-- Yêu cầu hủy lớp -->
          <section class="tactile-card bg-white p-5 md:p-6 flex flex-col relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-1.5 bg-duo-red"></div>

            <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-duo-red">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                  </svg>
                </div>
                <h2 class="font-display font-black text-base text-slate-800">Yêu cầu hủy lớp</h2>
                @if (cancellationRequests().length) {
                  <span class="bg-duo-red/10 text-duo-red px-2 py-0.5 rounded-full text-xs font-black font-display">
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
              @for (request of cancellationRequests().slice(0, 2); track request.id) {
                <a
                  [routerLink]="['/admin/cancellation-requests', request.id]"
                  class="tactile-card p-4 block hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="font-extrabold text-slate-900 text-xs">
                        {{ request.requestedByUserName || 'Người dùng' }}
                      </p>
                      <p class="text-[10px] text-slate-500 mt-0.5">
                        Lớp {{ request.classCode }} · {{ classLabel(request) }}
                      </p>
                    </div>
                    <span
                      [class]="cancelClass(request)"
                      class="rounded-full px-2.5 py-0.5 text-[10px] font-black"
                    >
                      {{ cancelLabel(request) }}
                    </span>
                  </div>
                  <p class="mt-2 text-[10px] text-slate-600 line-clamp-1">
                    {{ request.reason || 'Không có lý do.' }}
                  </p>
                </a>
              }

              @if (!isLoading() && !cancellationRequests().length) {
                <div class="flex items-center gap-3 p-3 rounded-xl bg-red-50/50 border border-red-100 text-duo-red">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-xs font-bold">Không có yêu cầu hủy lớp chờ duyệt</span>
                </div>
              }
            </div>
          </section>
        </div>
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
  showMonthlyDetails = signal(false);

  maxRevenue = computed(() => {
    const list = this.dashboard()?.monthlyRevenues ?? [];
    if (list.length === 0) return 1;
    return Math.max(...list.map((r) => r.revenue ?? 0), 1);
  });

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
    return `Chào buổi ${period} ${name ? ' ' + name : ''}`;
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
        firstValueFrom(this.adminApi.getAllPayments(1, 3)),
        firstValueFrom(
          this.adminApi.getAllCancellationRequestsForAdmin(
            CancellationRequestStatus.Pending,
            1,
            3,
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
