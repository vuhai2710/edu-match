import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { StudentDetailModalComponent } from '../../../shared/components/student-detail-modal';

import {
  ClassDto,
  LearningRequestDto,
  LearningRequestStatus,
  TutorDashboardDto,
} from '../../../api/generated/client/models';
import {
  ClassesService,
  DashboardService,
  LearningRequestsService,
} from '../../../api/generated/client/services';
import { getApiErrorMessage } from '../../../core/http/api-error';
import {
  classStatusLabel,
  formatDate,
  formatMoney,
  formatTimeSlots,
  learningRequestStatusLabel,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-tutor-dashboard-page',
  imports: [RouterLink, StudentDetailModalComponent],
  template: `
    <div class="space-y-6">
      <div
        class="bg-gradient-to-r from-duo-blue to-cyan-500 rounded-3xl p-6 md:p-8 flex items-center gap-6 shadow-lg"
      >
        <div class="flex-1 text-white">
          <h1 class="font-display text-2xl md:text-3xl font-black">Dashboard gia sư</h1>
          <p class="mt-1 text-blue-100">Xử lý yêu cầu học mới và lớp học.</p>
        </div>
      </div>

      @if (errorMessage()) {
        <p
          class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red"
        >
          {{ errorMessage() }}
        </p>
      }

      <div class="grid sm:grid-cols-3 gap-4">
        <div class="tactile-card p-5 text-center">
          <p class="font-display text-2xl font-black text-duo-blue">
            {{ dashboard()?.activeClasses ?? 0 }}
          </p>
          <p class="text-xs text-slate-500 font-bold">Lớp đang dạy</p>
        </div>
        <div class="tactile-card p-5 text-center">
          <p class="font-display text-2xl font-black text-duo-orange">
            {{ dashboard()?.averageRating ?? 0 }}/5
          </p>
          <p class="text-xs text-slate-500 font-bold">Đánh giá trung bình</p>
        </div>
      </div>

      <section>
        <h2 class="font-extrabold text-lg text-slate-800 mb-3">Yêu cầu mới từ học viên</h2>
        <div class="space-y-3">
          @for (request of incomingRequests(); track request.id) {
            <div class="tactile-card p-5">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="font-extrabold text-slate-900">
                    {{ request.studentName || 'Học viên' }}
                  </p>
                  <p class="text-sm text-slate-500">
                    {{ request.subjectName }} · {{ request.hoursPerSession }} giờ/buổi ·
                    {{ money(request.budgetPerHour) }}/h
                  </p>
                  <p class="text-xs text-slate-400 mt-1">{{ slots(request) }}</p>
                </div>
                <span class="text-xs font-black text-duo-blue bg-blue-50 rounded-full px-2 py-1">{{
                  requestLabel(request)
                }}</span>
              </div>
              <div class="flex flex-wrap gap-3 mt-4">
                @if (request.status === 'Pending') {
                  <button
                    (click)="acceptRequest(request)"
                    [disabled]="isWorking()"
                    class="tactile-button-green flex-1 min-w-32 py-2.5 rounded-xl text-sm font-extrabold uppercase disabled:opacity-60"
                  >
                    Chấp nhận
                  </button>
                  <a
                    [routerLink]="['/tutor/requests', request.id]"
                    class="tactile-button-blue flex-1 min-w-32 py-2.5 rounded-xl text-sm font-extrabold uppercase text-center"
                  >
                    Đề xuất lịch
                  </a>
                  <button
                    (click)="rejectRequest(request)"
                    [disabled]="isWorking()"
                    class="tactile-button-gray flex-1 min-w-32 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                  >
                    Từ chối
                  </button>
                } @else {
                  <a
                    [routerLink]="['/tutor/requests', request.id]"
                    class="tactile-button-blue w-full py-2.5 rounded-xl text-sm font-extrabold uppercase text-center"
                  >
                    Xem chi tiết đàm phán
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
            <div class="tactile-card p-5 text-center font-bold text-slate-500">
              Không có yêu cầu đang chờ.
            </div>
          }
        </div>
      </section>

      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-extrabold text-lg text-slate-800">Lớp học sắp tới</h2>
          <a routerLink="/tutor/classes" class="text-sm font-bold text-duo-blue hover:underline"
            >Xem tất cả</a
          >
        </div>
        <div class="space-y-3">
          @for (item of classes(); track item.id) {
            <a
              [routerLink]="['/tutor/classes', item.id]"
              class="tactile-card p-4 flex items-center justify-between gap-3"
            >
              <div>
                <p class="font-bold text-sm text-slate-900">{{ item.subjectName || item.code }}</p>
                <p class="text-xs text-slate-500">
                  {{ item.studentName }} · {{ date(item.startDate) }}
                </p>
              </div>
              <span
                class="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full"
                >{{ classLabel(item) }}</span
              >
            </a>
          }
          @if (!classes().length) {
            <div class="tactile-card p-5 text-center font-bold text-slate-500">
              Chưa có lớp học.
            </div>
          }
        </div>
      </section>
    </div>

    <!-- Student Detail Modal overlay -->
    @if (selectedStudentId()) {
      <app-student-detail-modal
        [studentId]="selectedStudentId()"
        (close)="selectedStudentId.set(null)"
      />
    }
  `,
})
export class TutorDashboardPage implements OnInit {
  dashboard = signal<TutorDashboardDto | null>(null);
  incomingRequests = signal<LearningRequestDto[]>([]);
  classes = signal<ClassDto[]>([]);
  isWorking = signal(false);
  errorMessage = signal('');
  selectedStudentId = signal<number | null>(null);

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
      await firstValueFrom(this.requestsApi.acceptLearningRequest(request.id!));
      await this.loadDashboard();
    }, 'Không chấp nhận được yêu cầu.');
  }

  async rejectRequest(request: LearningRequestDto): Promise<void> {
    if (!request.id) return;
    await this.withWork(async () => {
      await firstValueFrom(this.requestsApi.rejectLearningRequest(request.id!));
      await this.loadDashboard();
    }, 'Không từ chối được yêu cầu.');
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

  slots(request: LearningRequestDto): string {
    return formatTimeSlots(request.timeSlots);
  }

  private async loadDashboard(): Promise<void> {
    this.errorMessage.set('');
    try {
      const [dashboardResponse, pendingResponse, negotiatingResponse, classesResponse] =
        await Promise.all([
          firstValueFrom(this.dashboardApi.getTutorDashboard()),
          firstValueFrom(
            this.requestsApi.getIncomingLearningRequests(
              LearningRequestStatus.Pending,
              1,
              10,
              undefined,
              'createdAt',
              'desc',
            ),
          ),
          firstValueFrom(
            this.requestsApi.getIncomingLearningRequests(
              LearningRequestStatus.Negotiating,
              1,
              10,
              undefined,
              'createdAt',
              'desc',
            ),
          ),
          firstValueFrom(
            this.classesApi.getTutorClasses(undefined, 1, 5, undefined, 'createdAt', 'desc'),
          ),
        ]);
      this.dashboard.set(dashboardResponse.data ?? null);

      const merged = [
        ...(pendingResponse.data?.items ?? []),
        ...(negotiatingResponse.data?.items ?? []),
      ];
      merged.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });

      this.incomingRequests.set(merged);
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
