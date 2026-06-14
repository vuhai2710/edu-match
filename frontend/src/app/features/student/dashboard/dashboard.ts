import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ScheduleCalendarComponent } from '../../../shared/components/schedule-calendar';
import { SessionService } from '../../../core/auth/session';


import {
  ClassDto,
  ClassStatus,
  LearningRequestDto,
  StudentDashboardDto,
} from '../../../api/generated/client/models';
import {
  ClassesService,
  DashboardService,
  LearningRequestsService,
} from '../../../api/generated/client/services';
import { getApiErrorMessage } from '../../../core/http/api-error';
import {
  classStatusLabel,
  classStatusClass,
  formatDate,
  formatMoney,
  learningRequestStatusLabel,
  learningRequestStatusClass,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-student-dashboard-page',
  imports: [RouterLink, ScheduleCalendarComponent],
  template: `
    <div class="space-y-6">
      <!-- Premium Hero Banner -->
      <div
        class="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-[#58cc02] rounded-3xl p-6 md:p-8 flex items-center gap-6 shadow-lg border-b-6 border-emerald-700"
      >
        <!-- Decorative grid overlay -->
        <div class="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
        <div class="flex-1 text-white relative z-10">
          <span class="inline-block bg-white/20 text-white font-extrabold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider mb-2">Học viên</span>
          <h1 class="font-display text-2xl md:text-4xl font-black tracking-tight leading-tight">{{ greetingString }} 👋</h1>
          <p class="mt-2 text-emerald-50 max-w-xl text-sm md:text-base font-medium opacity-90">
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
        <!-- Cột bên trái: Stats cards + Lớp học & Yêu cầu gần đây -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 3-Column Stats Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <a
              routerLink="/student/classes"
              [queryParams]="{ status: 'Active' }"
              class="tactile-card p-4 text-center block hover:border-duo-green hover:shadow-md transition-all group border-b-6 border-slate-200 hover:border-b-duo-green"
            >
              <div class="flex flex-col items-center justify-center">
                <p class="font-display text-xl sm:text-2xl font-black text-duo-green leading-none">
                  {{ dashboard()?.activeClasses ?? activeClassCount() }}
                </p>
                <p class="text-[10px] sm:text-xs text-slate-500 font-bold mt-1">Lớp đang hoạt động</p>
              </div>
            </a>
            <a
              routerLink="/student/classes"
              [queryParams]="{ status: 'PendingStart' }"
              class="tactile-card p-4 text-center block hover:border-duo-orange hover:shadow-md transition-all group border-b-6 border-slate-200 hover:border-b-duo-orange"
            >
              <div class="flex flex-col items-center justify-center">
                <p class="font-display text-xl sm:text-2xl font-black text-duo-orange leading-none">
                  {{ dashboard()?.pendingClasses ?? pendingClassCount() }}
                </p>
                <p class="text-[10px] sm:text-xs text-slate-500 font-bold mt-1">Lớp chờ bắt đầu</p>
              </div>
            </a>
            <a
              routerLink="/student/learning-requests"
              [queryParams]="{ status: 'Pending' }"
              class="tactile-card p-4 text-center block hover:border-duo-blue hover:shadow-md transition-all group border-b-6 border-slate-200 hover:border-b-duo-blue"
            >
              <div class="flex flex-col items-center justify-center">
                <p class="font-display text-xl sm:text-2xl font-black text-duo-blue leading-none">
                  {{ dashboard()?.pendingLearningRequests ?? 0 }}
                </p>
                <p class="text-[10px] sm:text-xs text-slate-500 font-bold mt-1">Yêu cầu học</p>
              </div>
            </a>
            <a
              routerLink="/student/classes"
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
            <!-- Cột 1: Yêu cầu gần đây -->
            <section class="tactile-card bg-white p-5 md:p-6 flex flex-col relative overflow-hidden">
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-duo-blue"></div>
              
              <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-duo-blue">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h2 class="font-display font-black text-base text-slate-800">Yêu cầu gần đây</h2>
                </div>
                <a routerLink="/student/learning-requests" class="text-xs font-bold text-duo-blue hover:text-duo-blue-dark transition-colors flex items-center gap-0.5">
                  Xem tất cả →
                </a>
              </div>

              <div class="space-y-3">
                @for (request of requests().slice(0, 3); track request.id) {
                  <a
                    [routerLink]="['/student/learning-requests', request.id]"
                    class="tactile-card p-4 block hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div class="flex flex-col gap-2">
                      <div class="flex items-center justify-between">
                        <span
                          [class]="requestClass(request)"
                          class="text-[10px] font-black rounded-full px-2.5 py-1 uppercase tracking-wider"
                          >{{ requestLabel(request) }}</span
                        >
                      </div>
                      <div>
                        <p class="font-extrabold text-slate-900 group-hover:text-duo-blue transition-colors">
                          {{ request.subjectName || 'Yêu cầu học' }}
                        </p>
                        <p class="text-xs text-slate-500 font-medium mt-1">
                          Gia sư: <span class="font-bold text-slate-700">{{ request.tutorName || 'Đang cập nhật' }}</span>
                        </p>
                      </div>
                    </div>
                    <div class="border-t border-slate-100 mt-3 pt-2 flex items-center justify-between">
                      <p class="text-[10px] text-slate-400 font-bold uppercase">Học phí dự kiến</p>
                      <p class="text-xs font-black text-slate-700">
                        {{ money(request.calculatedDepositAmount) }}
                      </p>
                    </div>
                  </a>
                }

                @if (!requests().length) {
                  <div class="flex flex-col items-center justify-center py-10 text-center px-4">
                    <div class="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center mb-4 text-duo-blue hover:scale-110 transition-transform duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p class="font-display font-extrabold text-slate-800 text-base">Chưa có yêu cầu học</p>
                    <p class="text-xs text-slate-400 mt-1 max-w-[200px]">Chưa có yêu cầu học nào được tạo gần đây.</p>
                  </div>
                }
              </div>
            </section>

            <!-- Cột 2: Lớp học của bạn -->
            <section class="tactile-card bg-white p-5 md:p-6 flex flex-col relative overflow-hidden">
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-duo-green"></div>

              <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-duo-green">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h2 class="font-display font-black text-base text-slate-800">Lớp học của bạn</h2>
                </div>
                <a routerLink="/student/classes" class="text-xs font-bold text-duo-blue hover:text-duo-blue-dark transition-colors flex items-center gap-0.5">
                  Xem tất cả →
                </a>
              </div>

              <div class="space-y-3">
                @for (item of upcomingClasses().slice(0, 3); track item.id) {
                  <a
                    [routerLink]="['/student/classes', item.id]"
                    class="tactile-card p-4 block hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div class="flex flex-col gap-2">
                      <div class="flex items-center justify-between">
                        <span
                          [class]="classClass(item)"
                          class="text-[10px] font-black rounded-full px-2.5 py-1 uppercase tracking-wider"
                          >{{ classLabel(item) }}</span
                        >
                      </div>
                      <div>
                        <p class="font-extrabold text-slate-900">{{ item.subjectName || item.code }}</p>
                        <p class="text-xs text-slate-500 font-medium mt-1">
                          Gia sư: <span class="font-bold text-slate-700">{{ item.tutorName || 'Đang cập nhật' }}</span>
                        </p>
                      </div>
                    </div>
                    <div class="border-t border-slate-100 mt-3 pt-2 flex items-center justify-between">
                      <p class="text-[10px] text-slate-400 font-bold uppercase">Ngày bắt đầu</p>
                      <p class="text-xs font-bold text-slate-700">
                        {{ date(item.startDate) }}
                      </p>
                    </div>
                  </a>
                }
                @if (!upcomingClasses().length) {
                  <div class="flex flex-col items-center justify-center py-10 text-center px-4">
                    <div class="w-16 h-16 rounded-2xl bg-green-50 border-2 border-green-100 flex items-center justify-center mb-4 text-duo-green hover:scale-110 transition-transform duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <p class="font-display font-extrabold text-slate-800 text-base">Chưa có lớp học</p>
                    <p class="text-xs text-slate-400 mt-1 max-w-[200px]">Bạn chưa tham gia lớp học nào.</p>
                  </div>
                }
              </div>
            </section>
          </div>
        </div>

        <!-- Cột bên phải: Lịch học tuần này -->
        <div class="lg:col-span-1">
          <app-schedule-calendar [classes]="classes()" role="student" />
        </div>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <a
          routerLink="/student/discover"
          class="tactile-card p-5 flex items-center gap-4 hover:shadow-md transition-all group hover:-translate-y-0.5 border-b-6 border-slate-200 hover:border-b-duo-blue"
        >
          <div class="w-12 h-12 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg class="w-6 h-6 text-duo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <div>
            <h3 class="font-extrabold text-slate-900 group-hover:text-duo-blue transition-colors">
              Tìm gia sư mới
            </h3>
            <p class="text-xs text-slate-500 font-medium mt-0.5">Duyệt hồ sơ gia sư theo môn học và địa điểm phù hợp</p>
          </div>
        </a>
        <a
          routerLink="/student/learning-requests"
          class="tactile-card p-5 flex items-center gap-4 hover:shadow-md transition-all group hover:-translate-y-0.5 border-b-6 border-slate-200 hover:border-b-duo-green"
        >
          <div class="w-12 h-12 rounded-2xl bg-green-50 border-2 border-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg class="w-6 h-6 text-duo-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </div>
          <div>
            <h3 class="font-extrabold text-slate-900 group-hover:text-duo-green transition-colors">
              Theo dõi yêu cầu học
            </h3>
            <p class="text-xs text-slate-500 font-medium mt-0.5">Xem phản hồi từ gia sư, trao đổi lịch học và đặt cọc</p>
          </div>
        </a>
      </div>
    </div>
  `,
})
export class StudentDashboardPage implements OnInit {
  dashboard = signal<StudentDashboardDto | null>(null);
  requests = signal<LearningRequestDto[]>([]);
  classes = signal<ClassDto[]>([]);
  upcomingClasses = computed(() => this.classes().filter(c => c.status === ClassStatus.PendingStart || c.status === ClassStatus.Active));
  errorMessage = signal('');

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

  private readonly dashboardApi = inject(DashboardService);
  private readonly learningRequestsApi = inject(LearningRequestsService);
  private readonly classesApi = inject(ClassesService);

  ngOnInit(): void {
    void this.loadDashboard();
  }

  activeClassCount(): number {
    return this.classes().filter((item) => item.status === 'Active').length;
  }

  pendingClassCount(): number {
    return this.classes().filter((item) => item.status === 'PendingStart').length;
  }

  completedClassCount(): number {
    return this.classes().filter((item) => item.status === 'Completed').length;
  }

  requestLabel(request: LearningRequestDto): string {
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

  private async loadDashboard(): Promise<void> {
    try {
      const [dashboardResponse, requestsResponse, classesResponse] = await Promise.all([
        firstValueFrom(this.dashboardApi.getStudentDashboard()),
        firstValueFrom(
          this.learningRequestsApi.getMyLearningRequests(
            undefined,
            1,
            3,
            undefined,
            'createdAt',
            'desc',
          ),
        ),
        firstValueFrom(
          this.classesApi.getMyClasses(undefined, undefined, undefined, undefined, 1, 20, undefined, 'createdAt', 'desc', 'body'),
        ),
      ]);
      this.dashboard.set(dashboardResponse.data ?? null);
      this.requests.set(requestsResponse.data?.items ?? []);
      this.classes.set(classesResponse.data?.items ?? []);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được dashboard.'));
    }
  }
}
