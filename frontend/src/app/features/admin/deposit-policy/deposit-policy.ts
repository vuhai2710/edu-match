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
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { formatDate, formatMoney } from '../../../shared/utils/api-ui';

type PolicyLifecycleStatus = 'active' | 'expired' | 'upcoming';



@Component({
  selector: 'app-admin-deposit-policy-page',
  imports: [ErrorBannerComponent, FormsModule, PaginationComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display text-2xl font-black text-slate-900">Chính sách đặt cọc</h1>
        <p class="text-sm text-slate-500 mt-1">
          Quản lý số buổi cọc mặc định và các chính sách giảm giá/thời gian đặc biệt. Hệ thống tự
          động áp dụng chính sách có thời hạn trước, sau đó về cọc mặc định.
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
            @if (isDefaultPolicy(activePolicy()!)) {
              <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"
                >Cọc mặc định (Fallback)</span
              >
            } @else {
              <span class="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-duo-green"
                >Ưu tiên theo thời gian</span
              >
            }
          } @else {
            <span class="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-duo-orange"
              >Chưa có</span
            >
          }
        </div>

        @if (activePolicy(); as p) {
          <!-- Fallback/Priority Explanatory Banner -->
          <div
            class="rounded-xl px-4 py-3 border text-sm flex gap-3 items-start"
            [class]="
              isDefaultPolicy(p)
                ? 'bg-slate-50 border-slate-200 text-slate-600'
                : 'bg-green-50 border-green-200 text-duo-green'
            "
          >
            <div class="flex-shrink-0 mt-0.5">
              @if (isDefaultPolicy(p)) {
                <svg
                  class="w-5 h-5 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              } @else {
                <svg
                  class="w-5 h-5 text-duo-green"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            </div>
            <div class="flex-1">
              <p class="font-extrabold mb-0.5">
                {{
                  isDefaultPolicy(p)
                    ? 'Đang áp dụng Cọc Mặc Định'
                    : 'Đang áp dụng Chính Sách Theo Thời Gian'
                }}
              </p>
              <p class="text-xs leading-relaxed opacity-90">
                {{
                  isDefaultPolicy(p)
                    ? 'Hệ thống đang áp dụng cài đặt cọc mặc định vì không có chính sách theo thời gian nào đang trong thời gian hiệu lực.'
                    : 'Chính sách đặt cọc theo thời gian đang hoạt động và được ưu tiên cao hơn cài đặt cọc mặc định.'
                }}
              </p>
            </div>
          </div>

          <div class="grid sm:grid-cols-3 gap-3 text-sm">
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Số buổi cọc</p>
              <p class="mt-1 font-display text-xl font-black text-slate-800">
                {{ p.depositSessionCount ?? '—' }} buổi
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
              <p class="mt-1 font-bold text-slate-800">
                {{ isDefaultPolicy(p) ? 'Vô hạn (Mặc định)' : activeRange(p) }}
              </p>
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
                class="w-full rounded-xl border-2 border-slate-200 px-3 py-2 focus:border-duo-blue outline-none font-bold"
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
                class="w-full rounded-xl border-2 border-slate-200 px-3 py-2 focus:border-duo-blue outline-none font-bold"
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
            Chưa có chính sách nào đang trong khoảng hiệu lực. Hãy thiết lập cọc mặc định hoặc chính
            sách theo thời gian ở mục bên dưới.
          </p>
        }
      </section>

      <!-- ===== Section B: Separate Configuration Panels ===== -->
      <div class="grid md:grid-cols-12 gap-6">
        <!-- Part B1: Default Deposit setting -->
        <div class="md:col-span-5">
          <section class="tactile-card p-6 space-y-5 h-full flex flex-col justify-between">
            <div class="space-y-4">
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-duo-blue"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h2 class="font-extrabold text-lg text-slate-800">Cọc mặc định (Fallback)</h2>
              </div>

              <p class="text-xs text-slate-500 leading-relaxed">
                Số buổi cọc mặc định áp dụng khi <strong>không có</strong> chính sách theo thời gian
                nào đang hiệu lực. Khi đổi cọc mặc định, các khoảng thời gian có chính sách ưu tiên
                đang chạy vẫn giữ nguyên.
              </p>

              @if (defaultError()) {
                <p
                  class="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-duo-red"
                >
                  {{ defaultError() }}
                </p>
              }
              @if (defaultSuccess()) {
                <p
                  class="rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-xs font-bold text-duo-green"
                >
                  {{ defaultSuccess() }}
                </p>
              }

              <div class="rounded-xl bg-slate-50 px-4 py-4 space-y-2 border border-slate-100">
                <label class="block text-xs font-bold uppercase text-slate-500 tracking-wide"
                  >Số buổi cọc mặc định</label
                >
                <div class="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    [(ngModel)]="defaultDepositSessionCount"
                    class="w-full rounded-xl border-2 border-slate-200 px-3 py-2 focus:border-duo-blue outline-none bg-white font-black text-slate-800"
                  />
                  <span class="text-sm font-bold text-slate-600 flex-shrink-0">buổi</span>
                </div>
                @if (defaultPolicy()) {
                  <p class="text-[11px] text-slate-400 font-bold">
                    Cập nhật lần cuối:
                    {{
                      defaultPolicy()?.updatedAt
                        ? formatDate(defaultPolicy()?.updatedAt!)
                        : formatDate(defaultPolicy()?.createdAt!)
                    }}
                  </p>
                }
              </div>
            </div>

            <div class="pt-4">
              <button
                (click)="submitDefault()"
                [disabled]="isSavingDefault()"
                class="w-full bg-duo-blue text-white font-extrabold py-3 px-4 rounded-xl border-b-4 border-blue-700 hover:opacity-95 disabled:opacity-60 text-sm transition-all uppercase"
              >
                {{ isSavingDefault() ? 'Đang lưu...' : 'Lưu cọc mặc định' }}
              </button>
            </div>
          </section>
        </div>

        <!-- Part B2: Time-based Policies -->
        <div class="md:col-span-7">
          <section class="tactile-card p-6 space-y-5 h-full flex flex-col justify-between">
            <div class="space-y-4">
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-duo-orange"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 class="font-extrabold text-lg text-slate-800">
                  Cài đặt cọc theo thời gian & giảm giá
                </h2>
              </div>

              <p class="text-xs text-slate-500 leading-relaxed">
                Thiết lập số buổi cọc đặc biệt và phần tích chiết khấu tự động cho một khoảng thời
                gian. Hệ thống sẽ <strong>tự động ưu tiên</strong> áp dụng chính sách này thay cho
                cọc mặc định khi ngày đặt nằm trong khoảng hiệu lực.
              </p>

              @if (timeError()) {
                <p
                  class="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-duo-red"
                >
                  {{ timeError() }}
                </p>
              }
              @if (timeSuccess()) {
                <p
                  class="rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-xs font-bold text-duo-green"
                >
                  {{ timeSuccess() }}
                </p>
              }

              <div class="grid sm:grid-cols-2 gap-4">
                <!-- Số buổi cọc -->
                <div class="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100 space-y-1">
                  <label class="block text-xs font-bold uppercase text-slate-500 tracking-wide"
                    >Số buổi cọc</label
                  >
                  <div class="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      [(ngModel)]="timeDepositSessionCount"
                      class="w-full rounded-xl border-2 border-slate-200 px-3 py-1.5 focus:border-duo-blue outline-none bg-white font-bold"
                    />
                    <span class="text-xs font-bold text-slate-600">buổi</span>
                  </div>
                </div>

                <!-- Giảm giá -->
                <div class="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100 space-y-1">
                  <label class="block text-xs font-bold uppercase text-slate-500 tracking-wide"
                    >Giảm giá</label
                  >
                  <div class="relative">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      step="1"
                      [ngModel]="timeDiscountPercentDisplay()"
                      (ngModelChange)="onTimeDiscountChange($event)"
                      class="w-full rounded-xl border-2 border-slate-200 px-3 py-1.5 pr-8 focus:border-duo-blue outline-none bg-white font-bold"
                    />
                    <span
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs"
                      >%</span
                    >
                  </div>
                </div>
              </div>

              <div class="grid sm:grid-cols-2 gap-4">
                <!-- Hiệu lực từ -->
                <div class="space-y-1">
                  <label class="block text-xs font-bold uppercase text-slate-500 tracking-wide"
                    >Hiệu lực từ ngày</label
                  >
                  <div class="relative cursor-pointer" (click)="timeActiveFromInput.showPicker()">
                    <input
                      type="text"
                      [value]="timeActiveFrom ? formatDate(timeActiveFrom) : ''"
                      placeholder="dd/mm/yyyy"
                      class="w-full rounded-xl border-2 border-slate-200 pl-3 pr-10 py-2 bg-white text-sm font-bold pointer-events-none"
                      readonly
                    />
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      #timeActiveFromInput
                      type="date"
                      [(ngModel)]="timeActiveFrom"
                      class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      (click)="$event.stopPropagation(); timeActiveFromInput.showPicker()"
                    />
                  </div>
                </div>

                <!-- Hiệu lực đến -->
                <div class="space-y-1">
                  <label class="block text-xs font-bold uppercase text-slate-500 tracking-wide"
                    >Hiệu lực đến ngày</label
                  >
                  <div class="relative cursor-pointer" (click)="timeActiveToInput.showPicker()">
                    <input
                      type="text"
                      [value]="timeActiveTo ? formatDate(timeActiveTo) : ''"
                      placeholder="dd/mm/yyyy"
                      class="w-full rounded-xl border-2 border-slate-200 pl-3 pr-10 py-2 bg-white text-sm font-bold pointer-events-none"
                      readonly
                    />
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      #timeActiveToInput
                      type="date"
                      [(ngModel)]="timeActiveTo"
                      class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      (click)="$event.stopPropagation(); timeActiveToInput.showPicker()"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-4">
              <button
                (click)="submitTimeBased()"
                [disabled]="isSubmittingTime()"
                class="w-full bg-duo-green text-white font-extrabold py-3 px-4 rounded-xl border-b-4 border-duo-green-dark hover:opacity-95 disabled:opacity-60 text-sm transition-all uppercase"
              >
                {{ isSubmittingTime() ? 'Đang lưu...' : 'Tạo chính sách theo thời gian' }}
              </button>
            </div>
          </section>
        </div>
      </div>

      <!-- ===== Section C: History list ===== -->
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-extrabold text-lg text-slate-800">Lịch sử chính sách đặt cọc</h2>
          @if (isLoadingHistory()) {
            <span class="text-xs font-bold text-slate-500 animate-pulse">Đang cập nhật...</span>
          }
        </div>

        <div
          class="tactile-card overflow-hidden relative min-h-[310px] transition-all duration-200"
          [class.pointer-events-none]="isLoadingHistory()"
        >
          <!-- Sleek Loading Progress Bar -->
          @if (isLoadingHistory()) {
            <div class="absolute top-0 left-0 right-0 h-1 bg-blue-50 overflow-hidden z-20">
              <div class="h-full bg-duo-blue animate-pulse"></div>
            </div>
          }
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 border-b-2 border-slate-100">
                <tr>
                  <th class="px-4 py-3 text-left font-extrabold text-slate-600">Loại chính sách</th>
                  <th class="px-4 py-3 text-left font-extrabold text-slate-600">
                    Thời gian hiệu lực
                  </th>
                  <th class="px-4 py-3 text-left font-extrabold text-slate-600">Số buổi cọc</th>
                  <th class="px-4 py-3 text-left font-extrabold text-slate-600">Giảm giá</th>
                  <th class="px-4 py-3 text-left font-extrabold text-slate-600">Trạng thái</th>
                  <th class="px-4 py-3 text-right font-extrabold text-slate-600">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                @for (item of history(); track item.id) {
                  <tr class="border-b border-slate-100 hover:bg-slate-50">
                    <td class="px-4 py-3 font-extrabold text-slate-700">
                      @if (isDefaultPolicy(item)) {
                        <span class="text-duo-blue">Cọc mặc định</span>
                      } @else {
                        <span class="text-slate-700">Theo thời gian</span>
                      }
                    </td>
                    <td class="px-4 py-3 text-slate-600">
                      {{ isDefaultPolicy(item) ? '—' : activeRange(item) }}
                    </td>
                    <td class="px-4 py-3 font-bold text-slate-800">
                      {{ item.depositSessionCount }}
                    </td>
                    <td class="px-4 py-3 font-bold text-duo-orange">
                      {{ percentDisplay(item.discountPercent) }}%
                    </td>
                    <td class="px-4 py-3">
                      <span
                        [class]="
                          isDefaultPolicy(item)
                            ? 'bg-slate-100 text-slate-600'
                            : lifecycleBadgeClass(item)
                        "
                        class="rounded-full px-3 py-1 text-xs font-black"
                      >
                        {{ isDefaultPolicy(item) ? 'Mặc định' : lifecycleLabel(item) }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      @if (!isDefaultPolicy(item)) {
                        <div class="flex justify-end gap-3">
                          <button
                            (click)="editItem(item)"
                            class="text-duo-blue font-bold text-xs hover:underline cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            (click)="confirmToDelete(item)"
                            class="text-duo-red font-bold text-xs hover:underline cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      } @else {
                        <span class="text-xs text-slate-400 italic font-medium">Hệ thống</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (!isLoadingHistory() && !history().length) {
            <div class="p-8 text-center">
              <p class="font-extrabold text-slate-800">Chưa có chính sách nào</p>
              <p class="text-sm text-slate-500 mt-1">Vui lòng thiết lập cọc mặc định ở trên.</p>
            </div>
          }
        </div>

        <app-pagination
          [page]="historyPage()"
          [pageSize]="historyPageSize()"
          [totalCount]="historyTotal()"
          itemsName="chính sách"
          (pageChange)="onHistoryPageChange($event)"
          (pageSizeChange)="onHistoryPageSizeChange($event)"
        />
      </section>

      <!-- ===== Custom Confirmation Modal ===== -->
      @if (isConfirmVisible()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div class="bg-white rounded-2xl border-2 border-slate-200 max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-150">
            <!-- Icon -->
            <div class="w-16 h-16 mx-auto mb-4 bg-red-50 text-duo-red rounded-2xl flex items-center justify-center animate-pulse-slow">
              <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 class="font-display text-xl font-black text-slate-800 mb-2">
              {{ confirmTitle() }}
            </h3>
            <p class="text-sm text-slate-500 font-bold leading-relaxed mb-6">
              {{ confirmMessage() }}
            </p>
            
            <div class="flex gap-3">
              <button
                (click)="onConfirmNo()"
                class="flex-1 tactile-button-gray py-3 rounded-xl text-sm font-extrabold uppercase"
              >
                Không
              </button>
              <button
                (click)="onConfirmYes()"
                class="flex-1 tactile-button-red py-3 rounded-xl text-sm font-extrabold uppercase text-white"
              >
                Có
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ===== Custom Edit Policy Modal ===== -->
      @if (isEditModalVisible()) {
        <div class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div class="bg-white rounded-2xl border-2 border-slate-200 max-w-lg w-full p-6 space-y-6 animate-in zoom-in-95 duration-150">
            <div class="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <h3 class="font-display text-xl font-black text-slate-800">
                Cập nhật chính sách đặt cọc
              </h3>
              <button
                (click)="cancelEditModal()"
                class="text-slate-400 hover:text-slate-600 font-black text-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            @if (editError()) {
              <p
                class="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-duo-red"
              >
                {{ editError() }}
              </p>
            }

            <div class="space-y-4">
              <div class="grid sm:grid-cols-2 gap-4">
                <!-- Số buổi cọc -->
                <div class="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100 space-y-1">
                  <label class="block text-xs font-bold uppercase text-slate-500 tracking-wide"
                    >Số buổi cọc</label
                  >
                  <div class="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      [(ngModel)]="editDepositSessionCount"
                      class="w-full rounded-xl border-2 border-slate-200 px-3 py-1.5 focus:border-duo-blue outline-none bg-white font-bold"
                    />
                    <span class="text-xs font-bold text-slate-600">buổi</span>
                  </div>
                </div>

                <!-- Giảm giá -->
                <div class="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100 space-y-1">
                  <label class="block text-xs font-bold uppercase text-slate-500 tracking-wide"
                    >Giảm giá</label
                  >
                  <div class="relative">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      step="1"
                      [ngModel]="editDiscountPercentDisplay()"
                      (ngModelChange)="onEditDiscountChange($event)"
                      class="w-full rounded-xl border-2 border-slate-200 px-3 py-1.5 pr-8 focus:border-duo-blue outline-none bg-white font-bold"
                    />
                    <span
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs"
                      >%</span
                    >
                  </div>
                </div>
              </div>

              <div class="grid sm:grid-cols-2 gap-4">
                <!-- Hiệu lực từ -->
                <div class="space-y-1">
                  <label class="block text-xs font-bold uppercase text-slate-500 tracking-wide"
                    >Hiệu lực từ ngày</label
                  >
                  <div class="relative cursor-pointer" (click)="editActiveFromInput.showPicker()">
                    <input
                      type="text"
                      [value]="editActiveFrom ? formatDate(editActiveFrom) : ''"
                      placeholder="dd/mm/yyyy"
                      class="w-full rounded-xl border-2 border-slate-200 pl-3 pr-10 py-2 bg-white text-sm font-bold pointer-events-none"
                      readonly
                    />
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      #editActiveFromInput
                      type="date"
                      [(ngModel)]="editActiveFrom"
                      class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      (click)="$event.stopPropagation(); editActiveFromInput.showPicker()"
                    />
                  </div>
                </div>

                <!-- Hiệu lực đến -->
                <div class="space-y-1">
                  <label class="block text-xs font-bold uppercase text-slate-500 tracking-wide"
                    >Hiệu lực đến ngày</label
                  >
                  <div class="relative cursor-pointer" (click)="editActiveToInput.showPicker()">
                    <input
                      type="text"
                      [value]="editActiveTo ? formatDate(editActiveTo) : ''"
                      placeholder="dd/mm/yyyy"
                      class="w-full rounded-xl border-2 border-slate-200 pl-3 pr-10 py-2 bg-white text-sm font-bold pointer-events-none"
                      readonly
                    />
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      #editActiveToInput
                      type="date"
                      [(ngModel)]="editActiveTo"
                      class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      (click)="$event.stopPropagation(); editActiveToInput.showPicker()"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex gap-3 pt-3 border-t-2 border-slate-100">
              <button
                (click)="cancelEditModal()"
                [disabled]="isSavingEdit()"
                class="flex-1 tactile-button-gray py-3 rounded-xl text-sm font-extrabold uppercase"
              >
                Hủy
              </button>
              <button
                (click)="submitEdit()"
                [disabled]="isSavingEdit()"
                class="flex-1 tactile-button-blue py-3 rounded-xl text-sm font-extrabold uppercase text-white"
              >
                {{ isSavingEdit() ? 'Đang lưu...' : 'Lưu thay đổi' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminDepositPolicyPage implements OnInit {
  // Active policy + preview
  activePolicy = signal<DepositPolicyDto | null>(null);
  preview = signal<DepositPreviewResponseDto | null>(null);
  previewHourlyRate = 150000;
  previewHoursPerSession = 2;

  // Edit modal state
  isEditModalVisible = signal(false);
  editPolicyId = signal<number | null>(null);
  editDepositSessionCount = 1;
  editDiscountPercentRaw = signal(0);
  editActiveFrom = '';
  editActiveTo = '';
  editError = signal('');
  isSavingEdit = signal(false);

  // Custom confirmation modal state
  isConfirmVisible = signal(false);
  confirmTitle = signal('');
  confirmMessage = signal('');
  confirmCallback = signal<(() => void) | null>(null);

  // Default policy state
  defaultPolicy = signal<DepositPolicyDto | null>(null);
  defaultDepositSessionCount = 1;
  isSavingDefault = signal(false);
  defaultError = signal('');
  defaultSuccess = signal('');

  // Time-based policy form state
  timeDepositSessionCount = 1;
  timeDiscountPercentRaw = signal(0);
  timeActiveFrom = '';
  timeActiveTo = '';
  isSubmittingTime = signal(false);
  timeError = signal('');
  timeSuccess = signal('');

  // History paging state
  history = signal<DepositPolicyDto[]>([]);
  historyPage = signal(1);
  historyPageSize = signal(5);
  historyTotal = signal(0);
  historyTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.historyTotal() / this.historyPageSize())),
  );
  isLoadingHistory = signal(false);

  // Errors
  loadError = signal<ApiErrorDetails | null>(null);

  private readonly adminApi = inject(DepositPolicyAdminApiService);
  private readonly previewApi = inject(DepositPolicyService);
  private previewDebounce?: ReturnType<typeof setTimeout>;
  private loadingTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    void this.loadAll();
  }

  // ===== Display helpers =====

  timeDiscountPercentDisplay(): number {
    return Math.round(this.timeDiscountPercentRaw() * 100);
  }

  onTimeDiscountChange(value: number): void {
    const pct = Math.max(0, Math.min(99, Number(value) || 0));
    this.timeDiscountPercentRaw.set(pct / 100);
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

  formatDate(value: string | Date | undefined | null): string {
    if (!value) return '';
    return formatDate(value);
  }

  isDefaultPolicy(p: DepositPolicyDto): boolean {
    return !p.activeFrom && !p.activeTo;
  }

  lifecycleStatus(p: DepositPolicyDto): PolicyLifecycleStatus {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const fromDate = p.activeFrom ? new Date(p.activeFrom) : null;
    const toDate = p.activeTo ? new Date(p.activeTo) : null;
    fromDate?.setHours(0, 0, 0, 0);
    toDate?.setHours(0, 0, 0, 0);
    const fromMs = fromDate?.getTime() ?? -Infinity;
    const toMs = toDate?.getTime() ?? Infinity;
    if (todayMs < fromMs) return 'upcoming';
    if (todayMs > toMs) return 'expired';
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

  confirmToDelete(p: DepositPolicyDto): void {
    if (!p.id) return;
    this.confirmTitle.set('Xác nhận xóa');
    this.confirmMessage.set(
      `Bạn có chắc chắn muốn xóa chính sách (${this.activeRange(p)}, ${this.percentDisplay(p.discountPercent)}%)? Thao tác này không thể hoàn tác.`
    );
    this.confirmCallback.set(() => {
      void this.executeDelete(p.id!);
    });
    this.isConfirmVisible.set(true);
  }

  async executeDelete(id: number): Promise<void> {
    this.timeError.set('');
    this.timeSuccess.set('');
    this.defaultError.set('');
    this.defaultSuccess.set('');

    try {
      await firstValueFrom(this.adminApi.delete(id));
      this.timeSuccess.set('Đã xóa chính sách thành công.');
      await this.loadAll();
    } catch (error) {
      console.error('[admin/deposit-policy] delete failed', error);
      this.timeError.set(getApiErrorMessage(error, 'Không xóa được chính sách.'));
    }
  }

  onConfirmYes(): void {
    const cb = this.confirmCallback();
    if (cb) cb();
    this.isConfirmVisible.set(false);
    this.confirmCallback.set(null);
  }

  onConfirmNo(): void {
    this.isConfirmVisible.set(false);
    this.confirmCallback.set(null);
  }

  editItem(p: DepositPolicyDto): void {
    if (!p.id) return;
    this.editPolicyId.set(p.id);
    this.editDepositSessionCount = p.depositSessionCount ?? 1;
    this.editDiscountPercentRaw.set(p.discountPercent ?? 0);
    this.editActiveFrom = p.activeFrom ? new Date(p.activeFrom).toISOString().slice(0, 10) : '';
    this.editActiveTo = p.activeTo ? new Date(p.activeTo).toISOString().slice(0, 10) : '';
    this.editError.set('');
    this.isEditModalVisible.set(true);
  }

  cancelEditModal(): void {
    this.isEditModalVisible.set(false);
    this.editPolicyId.set(null);
  }

  editDiscountPercentDisplay(): number {
    return Math.round(this.editDiscountPercentRaw() * 100);
  }

  onEditDiscountChange(value: number): void {
    const pct = Math.max(0, Math.min(99, Number(value) || 0));
    this.editDiscountPercentRaw.set(pct / 100);
  }

  async submitEdit(): Promise<void> {
    this.editError.set('');

    if (this.editDepositSessionCount <= 0) {
      this.editError.set('Số buổi cọc phải lớn hơn 0.');
      return;
    }
    const discount = this.editDiscountPercentRaw();
    if (discount < 0 || discount >= 1) {
      this.editError.set('Phần trăm giảm giá phải từ 0 đến 99.');
      return;
    }

    const fromDate = this.editActiveFrom ? new Date(this.editActiveFrom) : null;
    const toDate = this.editActiveTo ? new Date(this.editActiveTo) : null;

    if (this.editActiveFrom && (!fromDate || isNaN(fromDate.getTime()))) {
      this.editError.set('Ngày bắt đầu không hợp lệ.');
      return;
    }
    if (this.editActiveTo && (!toDate || isNaN(toDate.getTime()))) {
      this.editError.set('Ngày kết thúc không hợp lệ.');
      return;
    }
    if (!fromDate && !toDate) {
      this.editError.set(
        'Chính sách theo thời gian cần ít nhất ngày bắt đầu hoặc ngày kết thúc hiệu lực.',
      );
      return;
    }
    if (fromDate && toDate && toDate < fromDate) {
      this.editError.set('Ngày kết thúc hiệu lực không được trước ngày bắt đầu.');
      return;
    }

    const dto: UpsertDepositPolicyDto = {
      depositSessionCount: this.editDepositSessionCount,
      discountPercent: discount,
      activeFrom: fromDate,
      activeTo: toDate,
    };

    const id = this.editPolicyId();
    if (id === null) return;

    this.isSavingEdit.set(true);
    try {
      await firstValueFrom(this.adminApi.update(id, dto));
      this.isEditModalVisible.set(false);
      this.timeSuccess.set('Đã cập nhật chính sách đặt cọc thành công.');
      await this.loadAll();
    } catch (error) {
      console.error('[admin/deposit-policy] update failed', error);
      this.editError.set(getApiErrorMessage(error, 'Không cập nhật được chính sách đặt cọc.'));
    } finally {
      this.isSavingEdit.set(false);
    }
  }

  async submitDefault(): Promise<void> {
    this.defaultError.set('');
    this.defaultSuccess.set('');

    if (this.defaultDepositSessionCount <= 0) {
      this.defaultError.set('Số buổi cọc mặc định phải lớn hơn 0.');
      return;
    }

    const dto: UpsertDepositPolicyDto = {
      depositSessionCount: this.defaultDepositSessionCount,
      discountPercent: 0,
      activeFrom: null,
      activeTo: null,
    };

    this.isSavingDefault.set(true);
    try {
      await firstValueFrom(this.adminApi.create(dto));
      this.defaultSuccess.set('Cập nhật số buổi cọc mặc định thành công.');
      await this.loadAll();
    } catch (error) {
      console.error('[admin/deposit-policy] submitDefault failed', error);
      this.defaultError.set(getApiErrorMessage(error, 'Không lưu được cọc mặc định.'));
    } finally {
      this.isSavingDefault.set(false);
    }
  }

  async submitTimeBased(): Promise<void> {
    this.timeError.set('');
    this.timeSuccess.set('');

    if (this.timeDepositSessionCount <= 0) {
      this.timeError.set('Số buổi cọc phải lớn hơn 0.');
      return;
    }
    const discount = this.timeDiscountPercentRaw();
    if (discount < 0 || discount >= 1) {
      this.timeError.set('Phần trăm giảm giá phải từ 0 đến 99.');
      return;
    }

    const fromDate = this.timeActiveFrom ? new Date(this.timeActiveFrom) : null;
    const toDate = this.timeActiveTo ? new Date(this.timeActiveTo) : null;

    if (this.timeActiveFrom && (!fromDate || isNaN(fromDate.getTime()))) {
      this.timeError.set('Ngày bắt đầu không hợp lệ.');
      return;
    }
    if (this.timeActiveTo && (!toDate || isNaN(toDate.getTime()))) {
      this.timeError.set('Ngày kết thúc không hợp lệ.');
      return;
    }
    if (!fromDate && !toDate) {
      this.timeError.set(
        'Chính sách theo thời gian cần ít nhất ngày bắt đầu hoặc ngày kết thúc hiệu lực.',
      );
      return;
    }
    if (fromDate && toDate && toDate < fromDate) {
      this.timeError.set('Ngày kết thúc hiệu lực không được trước ngày bắt đầu.');
      return;
    }

    const dto: UpsertDepositPolicyDto = {
      depositSessionCount: this.timeDepositSessionCount,
      discountPercent: discount,
      activeFrom: fromDate,
      activeTo: toDate,
    };

    this.isSubmittingTime.set(true);
    try {
      await firstValueFrom(this.adminApi.create(dto));
      this.timeSuccess.set('Đã tạo chính sách theo thời gian thành công.');
      this.resetTimeForm();
      await this.loadAll();
    } catch (error) {
      console.error('[admin/deposit-policy] submitTimeBased failed', error);
      this.timeError.set(getApiErrorMessage(error, 'Không lưu được chính sách theo thời gian.'));
    } finally {
      this.isSubmittingTime.set(false);
    }
  }

  resetTimeForm(): void {
    this.timeDepositSessionCount = 1;
    this.timeDiscountPercentRaw.set(0);
    this.timeActiveFrom = '';
    this.timeActiveTo = '';
  }

  onHistoryPageChange(newPage: number): void {
    this.historyPage.set(newPage);
    void this.loadHistory();
  }

  onHistoryPageSizeChange(newSize: number): void {
    this.historyPageSize.set(newSize);
    this.historyPage.set(1);
    void this.loadHistory();
  }

  // ===== Loaders =====

  private async loadAll(): Promise<void> {
    this.loadError.set(null);
    await Promise.all([
      this.loadActive(),
      this.loadHistory(),
      this.loadPreview(),
      this.loadDefaultPolicy(),
    ]);
  }

  private async loadActive(): Promise<void> {
    try {
      const response = await firstValueFrom(this.adminApi.getCurrent());
      this.activePolicy.set(response.data ?? null);
    } catch (error) {
      this.activePolicy.set(null);
      const status = (error as { status?: number }).status;
      if (status !== 404) {
        console.error('[admin/deposit-policy] loadActive failed', error);
        this.loadError.set(getApiErrorDetails(error, 'Không tải được chính sách đang áp dụng.'));
      }
    }
  }

  private async loadHistory(): Promise<void> {
    if (this.loadingTimeout) clearTimeout(this.loadingTimeout);

    // Only trigger loading state visually if the request takes more than 150ms
    this.loadingTimeout = setTimeout(() => {
      this.isLoadingHistory.set(true);
    }, 150);

    try {
      const response = await firstValueFrom(
        this.adminApi.getHistory(this.historyPage(), this.historyPageSize()),
      );
      const paged: DepositPolicyPagedResult = response.data ?? {};
      this.history.set(paged.items ?? []);
      this.historyTotal.set(paged.totalCount ?? 0);
    } catch (error) {
      console.error('[admin/deposit-policy] loadHistory failed', error);
      this.loadError.set(getApiErrorDetails(error, 'Không tải được lịch sử chính sách.'));
    } finally {
      if (this.loadingTimeout) clearTimeout(this.loadingTimeout);
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

  private async loadDefaultPolicy(): Promise<void> {
    try {
      const response = await firstValueFrom(this.adminApi.getHistory(1, 100));
      const items = response.data?.items ?? [];
      const found = items.find((p) => this.isDefaultPolicy(p));
      if (found) {
        this.defaultPolicy.set(found);
        this.defaultDepositSessionCount = found.depositSessionCount ?? 1;
      } else {
        this.defaultPolicy.set(null);
        this.defaultDepositSessionCount = 1;
      }
    } catch (error) {
      console.error('[admin/deposit-policy] loadDefaultPolicy failed', error);
    }
  }
}
