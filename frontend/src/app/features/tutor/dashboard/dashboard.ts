import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { StudentDetailModalComponent } from '../../../shared/components/student-detail-modal';
import { ScheduleCalendarComponent } from '../../../shared/components/schedule-calendar';
import { SessionService } from '../../../core/auth/session';


import {
  ClassDto,
  ClassStatus,
  LearningRequestDto,
  LearningRequestStatus,
  TutorDashboardDto,
} from '../../../api/generated/client/models';
import {
  ClassesService,
  DashboardService,
  LearningRequestsService,
} from '../../../api/generated/client/services';
import { getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import {
  classStatusLabel,
  classStatusClass,
  formatDate,
  formatMoney,
  formatTimeSlots,
  learningRequestStatusLabel,
  learningRequestStatusClass,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-tutor-dashboard-page',
  imports: [RouterLink, StudentDetailModalComponent, ScheduleCalendarComponent],
  template: `
    <div class="space-y-6">
      <!-- Premium Hero Banner -->
      <div
        class="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-duo-blue rounded-3xl p-6 md:p-8 flex items-center gap-6 shadow-lg border-b-6 border-indigo-700"
      >
        <!-- Decorative grid overlay -->
        <div class="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
        <div class="flex-1 text-white relative z-10">
          <span class="inline-block bg-white/20 text-white font-extrabold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider mb-2">Gia sư</span>
          <h1 class="font-display text-2xl md:text-4xl font-black tracking-tight leading-tight">{{ greetingString }} 👋</h1>
          <p class="mt-2 text-indigo-50 max-w-xl text-sm md:text-base font-medium opacity-90">
            {{ dateString }}
          </p>
        </div>
      </div>

      @if (errorMessage()) {
        <p
          class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red shadow-sm"
        >
          {{ errorMessage() }}
        </p>
      }

      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Cột bên trái: Stats cards + Yêu cầu mới & Lớp học sắp tới -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 3-Column Stats Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <a
              routerLink="/tutor/classes"
              [queryParams]="{ status: 'Active' }"
              class="tactile-card p-4 text-center block hover:border-duo-green hover:shadow-md transition-all group border-b-6 border-slate-200 hover:border-b-duo-green"
            >
              <div class="flex flex-col items-center justify-center">
                <p class="font-display text-xl sm:text-2xl font-black text-duo-green leading-none">
                  {{ dashboard()?.activeClasses ?? 0 }}
                </p>
                <p class="text-[10px] sm:text-xs text-slate-500 font-bold mt-1">Lớp đang dạy</p>
              </div>
            </a>
            <a
              routerLink="/tutor/requests"
              [queryParams]="{ status: 'Pending' }"
              class="tactile-card p-4 text-center block hover:border-duo-blue hover:shadow-md transition-all group border-b-6 border-slate-200 hover:border-b-duo-blue"
            >
              <div class="flex flex-col items-center justify-center">
                <p class="font-display text-xl sm:text-2xl font-black text-duo-blue leading-none">
                  {{ dashboard()?.pendingLearningRequests ?? 0 }}
                </p>
                <p class="text-[10px] sm:text-xs text-slate-500 font-bold mt-1">Yêu cầu mới</p>
              </div>
            </a>
            <div
              class="tactile-card p-4 text-center block border-b-6 border-slate-200"
            >
              <div class="flex flex-col items-center justify-center">
                @if ((dashboard()?.averageRating ?? 0) > 0) {
                  <p class="font-display text-xl sm:text-2xl font-black text-duo-orange leading-none">
                    {{ dashboard()?.averageRating }}/5
                  </p>
                } @else {
                  <p class="text-[10px] sm:text-xs font-black text-slate-400 leading-none h-[20px] sm:h-[24px] flex items-center justify-center">
                    Chưa có đánh giá
                  </p>
                }
                <p class="text-[10px] sm:text-xs text-slate-500 font-bold mt-1">Đánh giá TB</p>
              </div>
            </div>
            <a
              routerLink="/tutor/classes"
              [queryParams]="{ status: 'Completed' }"
              class="tactile-card p-4 text-center block hover:border-emerald-500 hover:shadow-md transition-all group border-b-6 border-slate-200 hover:border-b-emerald-500"
            >
              <div class="flex flex-col items-center justify-center">
                <p class="font-display text-xl sm:text-2xl font-black text-emerald-600 leading-none">
                  {{ dashboard()?.completedClasses ?? completedClassCount() }}
                </p>
                <p class="text-[10px] sm:text-xs text-slate-500 font-bold mt-1">Lớp hoàn thành</p>
              </div>
            </a>
          </div>

          <div class="grid md:grid-cols-2 gap-6 items-start">
            <!-- Cột 1: Yêu cầu mới -->
            <section class="tactile-card bg-white p-5 md:p-6 flex flex-col relative overflow-hidden">
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-duo-blue"></div>

              <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-duo-blue">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h2 class="font-display font-black text-base text-slate-800">Yêu cầu mới</h2>
                </div>
                <a routerLink="/tutor/requests" class="text-xs font-bold text-duo-blue hover:text-duo-blue-dark transition-colors flex items-center gap-0.5">
                  Xem tất cả →
                </a>
              </div>

              <div class="space-y-3">
                @for (request of incomingRequests().slice(0, 3); track request.id) {
                  <div class="tactile-card p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                    <div class="flex flex-col gap-3">
                      <div class="flex items-center justify-between">
                        <span [class]="requestClass(request)" class="text-[10px] font-black rounded-full px-2.5 py-1 uppercase tracking-wider">{{
                          requestLabel(request)
                        }}</span>
                      </div>
                      <div>
                        <p class="font-extrabold text-slate-900">
                          {{ request.studentName || 'Học viên' }}
                        </p>
                        <p class="text-xs text-slate-500 font-medium mt-1">
                          {{ request.subjectName }}
                        </p>
                        <p class="text-xs text-slate-700 font-black mt-1">
                          {{ money(request.budgetPerHour) }}/h
                          <span class="mx-1.5 text-slate-300 font-normal">|</span>
                          <span class="font-bold text-slate-500">{{ request.hoursPerSession }}h/buổi</span>
                        </p>
                        <p class="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">{{ slots(request) }}</p>
                      </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
                      @if (request.status === 'Pending') {
                        <button
                          (click)="acceptRequest(request)"
                          [disabled]="isWorking()"
                          class="tactile-button-green w-full py-2 rounded-xl text-xs font-black uppercase disabled:opacity-60 flex items-center justify-center"
                        >
                          Nhận
                        </button>
                        <a
                          [routerLink]="['/tutor/requests', request.id]"
                          class="tactile-button-blue w-full py-2 rounded-xl text-xs font-black uppercase text-center flex items-center justify-center"
                        >
                          Đề xuất
                        </a>
                        <button
                          (click)="rejectRequest(request)"
                          [disabled]="isWorking()"
                          class="tactile-button-gray w-full py-2 rounded-xl text-xs font-black uppercase disabled:opacity-60 flex items-center justify-center"
                        >
                          Từ chối
                        </button>
                      } @else {
                        <a
                          [routerLink]="['/tutor/requests', request.id]"
                          class="tactile-button-blue w-full py-2 rounded-xl text-xs font-black uppercase text-center sm:col-span-3 flex items-center justify-center"
                        >
                          Đàm phán
                        </a>
                      }
                    </div>

                    <!-- View Student Details Button -->
                    @if (request.studentId) {
                      <button
                        (click)="openStudentDetail(request.studentId)"
                        class="w-full mt-3 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-extrabold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <svg
                          class="w-4 h-4 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <circle cx="12" cy="8" r="4" />
                          <path d="M5 20a7 7 0 0 1 14 0" />
                        </svg>
                        Chi tiết học viên
                      </button>
                    }
                  </div>
                }
                @if (!incomingRequests().length) {
                  <div class="flex flex-col items-center justify-center py-10 text-center px-4">
                    <div class="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center mb-4 text-duo-blue hover:scale-110 transition-transform duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4" />
                      </svg>
                    </div>
                    <p class="font-display font-extrabold text-slate-800 text-base">Hộp thư trống</p>
                    <p class="text-xs text-slate-400 mt-1 max-w-[200px]">Không có yêu cầu học nào đang chờ xử lý.</p>
                  </div>
                }
              </div>
            </section>

            <!-- Cột 2: Lớp dạy sắp tới -->
            <section class="tactile-card bg-white p-5 md:p-6 flex flex-col relative overflow-hidden">
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-duo-green"></div>

              <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-duo-green">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h2 class="font-display font-black text-base text-slate-800">Lớp dạy của bạn</h2>
                </div>
                <a routerLink="/tutor/classes" class="text-xs font-bold text-duo-blue hover:text-duo-blue-dark transition-colors flex items-center gap-0.5">
                  Xem tất cả →
                </a>
              </div>

              <div class="space-y-3">
                @for (item of upcomingClasses().slice(0, 3); track item.id) {
                  <a
                    [routerLink]="['/tutor/classes', item.id]"
                    class="tactile-card p-4 flex items-center justify-between gap-3 block hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
                  >
                    <div>
                      <p class="font-extrabold text-sm text-slate-900">{{ item.subjectName || item.code }}</p>
                      <p class="text-xs text-slate-500 font-medium mt-1">
                        Học viên: <span class="font-bold text-slate-700">{{ item.studentName }}</span>
                      </p>
                    </div>
                    <span
                      [class]="classClass(item)"
                      class="text-[10px] font-black px-3 py-1 rounded-full shrink-0 uppercase tracking-wider"
                      >{{ classLabel(item) }}</span
                    >
                  </a>
                }
                @if (!upcomingClasses().length) {
                  <div class="flex flex-col items-center justify-center py-10 text-center px-4">
                    <div class="w-16 h-16 rounded-2xl bg-green-50 border-2 border-green-100 flex items-center justify-center mb-4 text-duo-green hover:scale-110 transition-transform duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <p class="font-display font-extrabold text-slate-800 text-base">Chưa có lớp dạy</p>
                    <p class="text-xs text-slate-400 mt-1 max-w-[200px]">Chưa có lớp dạy học nào được thiết lập.</p>
                  </div>
                }
              </div>
            </section>
          </div>
        </div>

        <!-- Cột bên phải: Lịch dạy tuần này -->
        <div class="lg:col-span-1">
          <app-schedule-calendar [classes]="classes()" role="tutor" />
        </div>
      </div>
    </div>

    <!-- Student Detail Modal overlay -->
    @if (selectedStudentId()) {
      <app-student-detail-modal
        [userId]="selectedStudentId()"
        (close)="selectedStudentId.set(null)"
      />
    }
  `,
})
export class TutorDashboardPage implements OnInit {
  dashboard = signal<TutorDashboardDto | null>(null);
  incomingRequests = signal<LearningRequestDto[]>([]);
  classes = signal<ClassDto[]>([]);
  upcomingClasses = computed(() => this.classes().filter(c => c.status === ClassStatus.PendingStart || c.status === ClassStatus.Active));
  isWorking = signal(false);
  errorMessage = signal('');
  selectedStudentId = signal<number | null>(null);

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

  openStudentDetail(studentId: number): void {
    this.selectedStudentId.set(studentId);
  }

  private readonly dashboardApi = inject(DashboardService);
  private readonly requestsApi = inject(LearningRequestsService);
  private readonly classesApi = inject(ClassesService);

  ngOnInit(): void {
    void this.loadDashboard();
  }

  async acceptRequest(request: LearningRequestDto): Promise<void> {
    if (!request.id) return;
    await this.withWork(async () => {
      const response = await firstValueFrom(this.requestsApi.acceptLearningRequest(request.id!));
      unwrapApiData(response);
      await this.loadDashboard();
    }, 'Không chấp nhận được yêu cầu.');
  }

  async rejectRequest(request: LearningRequestDto): Promise<void> {
    if (!request.id) return;
    await this.withWork(async () => {
      const response = await firstValueFrom(this.requestsApi.rejectLearningRequest(request.id!));
      unwrapApiData(response);
      await this.loadDashboard();
    }, 'Không từ chối được yêu cầu.');
  }

  requestLabel(request: LearningRequestDto): string {
    if (request.status === LearningRequestStatus.Negotiating) {
      return 'Đang chờ học viên phản hồi';
    }
    return learningRequestStatusLabel(request.status);
  }

  requestClass(request: LearningRequestDto): string {
    return learningRequestStatusClass(request.status);
  }

  classLabel(item: ClassDto): string {
    return classStatusLabel(item.status);
  }

  classClass(item: ClassDto): string {
    return classStatusClass(item.status);
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  date(value?: Date | null): string {
    return formatDate(value);
  }

  completedClassCount(): number {
    return this.classes().filter((item) => item.status === 'Completed').length;
  }

  slots(request: LearningRequestDto): string {
    return formatTimeSlots(request.timeSlots);
  }

  private async loadDashboard(): Promise<void> {
    this.errorMessage.set('');
    try {
      const [dashboardResponse, classesResponse] =
        await Promise.all([
          firstValueFrom(this.dashboardApi.getTutorDashboard()),
          firstValueFrom(
            this.classesApi.getTutorClasses(undefined, undefined, undefined, undefined, 1, 20, undefined, 'createdAt', 'desc', 'body'),
          ),
        ]);
      this.dashboard.set(dashboardResponse.data ?? null);

      this.incomingRequests.set(dashboardResponse.data?.recentLearningRequests ?? []);
      this.classes.set(classesResponse.data?.items ?? []);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được dashboard gia sư.'));
    }
  }

  private async withWork(action: () => Promise<void>, fallback: string): Promise<void> {
    this.isWorking.set(true);
    this.errorMessage.set('');
    try {
      await action();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, fallback));
    } finally {
      this.isWorking.set(false);
    }
  }
}
