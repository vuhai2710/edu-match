import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ClassDto } from '../../../api/generated/client/models';
import { ClassesService } from '../../../api/generated/client/services';
import { getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import {
  classStatusLabel,
  formatDate,
  formatDateTime,
  formatMoney,
  formatTimeSlots,
  paymentStatusLabel,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-student-class-detail-page',
  imports: [RouterLink],
  template: `
    @if (classItem(); as item) {
      <div class="max-w-3xl mx-auto space-y-6">
        <a routerLink="/student/classes" class="text-sm font-bold text-slate-500 hover:text-slate-800">← Quay lại</a>

        <div class="tactile-card p-6 space-y-5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 class="font-display text-2xl font-black text-slate-900">{{ item.subjectName || item.code }}</h1>
              <p class="text-sm text-slate-500 mt-1">Mã lớp: {{ item.code }}</p>
            </div>
            <span class="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-duo-green">
              {{ label(item.status) }}
            </span>
          </div>

          <div class="grid sm:grid-cols-2 gap-4 text-sm">
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="font-bold text-slate-500">Gia sư</p>
              <p class="mt-1 font-extrabold text-slate-900">{{ item.tutorName || 'Đang cập nhật' }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="font-bold text-slate-500">Ngày bắt đầu</p>
              <p class="mt-1 font-extrabold text-slate-900">{{ date(item.startDate) }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="font-bold text-slate-500">Lịch học</p>
              <p class="mt-1 font-extrabold text-slate-900">{{ slots(item) }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="font-bold text-slate-500">Nguồn lịch</p>
              <p class="mt-1 font-extrabold text-slate-900">{{ item.acceptedScheduleSource || 'Chưa rõ' }}</p>
            </div>
          </div>
        </div>

        <div class="tactile-card p-6 space-y-4">
          <h2 class="font-extrabold text-lg text-slate-900">Thanh toán</h2>
          <div class="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p class="text-slate-500 font-bold">Số tiền</p>
              <p class="font-extrabold text-duo-green">{{ money(item.paymentSummary?.amount ?? item.depositAmountSnapshot) }}</p>
            </div>
            <div>
              <p class="text-slate-500 font-bold">Trạng thái</p>
              <p class="font-extrabold text-slate-900">{{ paymentLabel(item.paymentSummary?.status) }}</p>
            </div>
            <div>
              <p class="text-slate-500 font-bold">Đã thanh toán lúc</p>
              <p class="font-extrabold text-slate-900">{{ dateTime(item.paymentSummary?.paidAt) }}</p>
            </div>
          </div>
        </div>

        @if (errorMessage()) {
          <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">{{ errorMessage() }}</p>
        }
      </div>
    } @else if (isLoading()) {
      <div class="tactile-card p-8 text-center font-bold text-slate-500">Đang tải lớp học...</div>
    }
  `,
})
export class StudentClassDetailPage implements OnInit {
  classItem = signal<ClassDto | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');

  private readonly route = inject(ActivatedRoute);
  private readonly classesApi = inject(ClassesService);

  ngOnInit(): void {
    void this.loadClass();
  }

  label = classStatusLabel;
  paymentLabel = paymentStatusLabel;

  date(value?: Date | null): string {
    return formatDate(value);
  }

  dateTime(value?: Date | null): string {
    return formatDateTime(value);
  }

  slots(item: ClassDto): string {
    return formatTimeSlots(item.timeSlots);
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  private async loadClass(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage.set('Mã lớp không hợp lệ.');
      return;
    }

    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.classesApi.getClassById(id));
      this.classItem.set(unwrapApiData(response));
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được lớp học.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
