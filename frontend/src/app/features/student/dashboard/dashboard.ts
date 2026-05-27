import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ClassDto, LearningRequestDto, StudentDashboardDto } from '../../../api/generated/client/models';
import { ClassesService, DashboardService, LearningRequestsService } from '../../../api/generated/client/services';
import { getApiErrorMessage } from '../../../core/http/api-error';
import {
  classStatusLabel,
  formatDate,
  formatMoney,
  learningRequestStatusLabel,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-student-dashboard-page',
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      <div class="bg-gradient-to-r from-[#58cc02] to-emerald-500 rounded-3xl p-6 md:p-8 flex items-center gap-6 shadow-lg">
        <div class="flex-1 text-white">
          <h1 class="font-display text-2xl md:text-3xl font-black">Dashboard học viên</h1>
          <p class="mt-1 text-green-100 text-sm md:text-base">Theo dõi yêu cầu học, lớp đang học và thanh toán đặt cọc.</p>
        </div>
      </div>

      @if (errorMessage()) {
        <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">{{ errorMessage() }}</p>
      }

      <div class="grid sm:grid-cols-3 gap-4">
        <div class="tactile-card p-5 text-center">
          <p class="font-display text-2xl font-black text-duo-blue">{{ dashboard()?.totalRequests ?? requests().length }}</p>
          <p class="text-xs text-slate-500 font-bold">Yêu cầu học</p>
        </div>
        <div class="tactile-card p-5 text-center">
          <p class="font-display text-2xl font-black text-duo-green">{{ dashboard()?.activeClasses ?? activeClassCount() }}</p>
          <p class="text-xs text-slate-500 font-bold">Lớp đang học</p>
        </div>
        <div class="tactile-card p-5 text-center">
          <p class="font-display text-2xl font-black text-duo-orange">{{ dashboard()?.pendingClasses ?? pendingClassCount() }}</p>
          <p class="text-xs text-slate-500 font-bold">Lớp chờ bắt đầu</p>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-4">
        <section>
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-extrabold text-lg text-slate-800">Yêu cầu gần đây</h2>
            <a routerLink="/student/learning-requests" class="text-sm font-bold text-duo-blue hover:underline">Xem tất cả</a>
          </div>
          <div class="space-y-3">
            @for (request of requests(); track request.id) {
              <a [routerLink]="['/student/learning-requests', request.id]" class="tactile-card p-4 block">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-extrabold text-slate-900">{{ request.subjectName || 'Yêu cầu học' }}</p>
                    <p class="text-sm text-slate-500">Gia sư: {{ request.tutorName || 'Đang cập nhật' }}</p>
                  </div>
                  <span class="text-xs font-black text-duo-blue bg-blue-50 rounded-full px-2 py-1">{{ requestLabel(request) }}</span>
                </div>
                <p class="text-xs text-slate-400 mt-2">Cọc dự kiến: {{ money(request.calculatedDepositAmount) }}</p>
              </a>
            }
            @if (!requests().length) {
              <div class="tactile-card p-5 text-center text-sm font-bold text-slate-500">Chưa có yêu cầu học.</div>
            }
          </div>
        </section>

        <section>
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-extrabold text-lg text-slate-800">Lớp học</h2>
            <a routerLink="/student/classes" class="text-sm font-bold text-duo-blue hover:underline">Xem tất cả</a>
          </div>
          <div class="space-y-3">
            @for (item of classes(); track item.id) {
              <a [routerLink]="['/student/classes', item.id]" class="tactile-card p-4 block">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-extrabold text-slate-900">{{ item.subjectName || item.code }}</p>
                    <p class="text-sm text-slate-500">Gia sư: {{ item.tutorName || 'Đang cập nhật' }}</p>
                  </div>
                  <span class="text-xs font-black text-duo-green bg-green-50 rounded-full px-2 py-1">{{ classLabel(item) }}</span>
                </div>
                <p class="text-xs text-slate-400 mt-2">Bắt đầu: {{ date(item.startDate) }}</p>
              </a>
            }
            @if (!classes().length) {
              <div class="tactile-card p-5 text-center text-sm font-bold text-slate-500">Chưa có lớp học.</div>
            }
          </div>
        </section>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <a routerLink="/student/discover" class="tactile-card p-5 flex items-center gap-4 hover:shadow-md transition-shadow group">
          <div class="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl">🔍</div>
          <div>
            <h3 class="font-extrabold text-slate-900 group-hover:text-duo-blue transition-colors">Tìm gia sư mới</h3>
            <p class="text-sm text-slate-500">Duyệt hồ sơ gia sư theo môn học và địa điểm</p>
          </div>
        </a>
        <a routerLink="/student/learning-requests" class="tactile-card p-5 flex items-center gap-4 hover:shadow-md transition-shadow group">
          <div class="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-2xl">📋</div>
          <div>
            <h3 class="font-extrabold text-slate-900 group-hover:text-duo-green transition-colors">Theo dõi yêu cầu</h3>
            <p class="text-sm text-slate-500">Xem phản hồi, proposal và thanh toán cọc</p>
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
  errorMessage = signal('');

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

  requestLabel(request: LearningRequestDto): string {
    return learningRequestStatusLabel(request.status);
  }

  classLabel(item: ClassDto): string {
    return classStatusLabel(item.status);
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
        firstValueFrom(this.learningRequestsApi.getMyLearningRequests(undefined, 1, 5, undefined, 'createdAt', 'desc')),
        firstValueFrom(this.classesApi.getMyClasses(undefined, 1, 5, undefined, 'createdAt', 'desc')),
      ]);
      this.dashboard.set(dashboardResponse.data ?? null);
      this.requests.set(requestsResponse.data?.items ?? []);
      this.classes.set(classesResponse.data?.items ?? []);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được dashboard.'));
    }
  }
}
