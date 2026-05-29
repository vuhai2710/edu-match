import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ClassDto, ClassStatus } from '../../../api/generated/client/models';
import { ClassesService } from '../../../api/generated/client/services';
import { getApiErrorMessage } from '../../../core/http/api-error';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import {
  classStatusLabel,
  classStatusClass,
  formatDate,
  formatMoney,
  formatTimeSlots,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-student-classes-page',
  imports: [RouterLink, PaginationComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display text-2xl font-black text-slate-900">Lớp học của tôi</h1>
        <p class="text-sm text-slate-500 mt-1">Các lớp đã được tạo sau khi thanh toán đặt cọc thành công.</p>
      </div>

      <div class="flex gap-2 overflow-x-auto pb-1">
        @for (tab of tabs; track tab.label) {
          <button (click)="setStatus(tab.status)"
                  [class]="activeStatus() === tab.status
                    ? 'bg-duo-green text-white border-b-2 border-duo-green-dark'
                    : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'"
                  class="px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap">
            {{ tab.label }}
          </button>
        }
      </div>

      @if (errorMessage()) {
        <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">{{ errorMessage() }}</p>
      }

      @if (isLoading() && classes().length === 0) {
        <div class="grid md:grid-cols-2 gap-4">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="tactile-card p-5 animate-pulse">
              <div class="h-6 bg-slate-100 rounded w-1/3"></div>
              <div class="h-4 bg-slate-100 rounded mt-3 w-1/2"></div>
              <div class="h-16 bg-slate-100 rounded mt-4"></div>
            </div>
          }
        </div>
      } @else if (classes().length > 0) {
        <div
          class="space-y-6 relative transition-opacity duration-200"
          [class.opacity-50]="isLoading()"
          [class.pointer-events-none]="isLoading()"
        >
          <div class="grid md:grid-cols-2 gap-4">
            @for (item of classes(); track item.id) {
              <a [routerLink]="['/student/classes', item.id]" class="tactile-card p-5 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h2 class="font-extrabold text-slate-900">{{ item.subjectName || item.code }}</h2>
                    <p class="text-sm text-slate-500 mt-1">Gia sư: {{ item.tutorName || 'Đang cập nhật' }}</p>
                  </div>
                  <span [class]="statusClass(item.status)" class="rounded-full px-3 py-1 text-xs font-black">{{ label(item.status) }}</span>
                </div>
                <div class="mt-4 space-y-2 text-sm text-slate-600">
                  <p><span class="font-bold">Bắt đầu:</span> {{ date(item.startDate) }}</p>
                  <p><span class="font-bold">Lịch:</span> {{ slots(item) }}</p>
                  <p><span class="font-bold">Cọc:</span> {{ money(item.depositAmountSnapshot) }}</p>
                </div>
              </a>
            }
          </div>

          <app-pagination
            [page]="page()"
            [pageSize]="pageSize()"
            [totalCount]="totalCount()"
            itemsName="lớp học"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          />
        </div>
      } @else {
        <div class="tactile-card p-8 text-center">
          <p class="font-extrabold text-slate-800">Chưa có lớp học</p>
          <p class="text-sm text-slate-500 mt-1">Lớp sẽ xuất hiện sau khi thanh toán đặt cọc thành công.</p>
        </div>
      }
    </div>
  `,
})
export class StudentClassesPage implements OnInit {
  classes = signal<ClassDto[]>([]);
  activeStatus = signal<ClassStatus | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');

  // Pagination states
  page = signal(1);
  pageSize = signal(5);
  totalCount = signal(0);

  readonly tabs = [
    { label: 'Tất cả', status: null },
    { label: 'Chờ bắt đầu', status: ClassStatus.PendingStart },
    { label: 'Đang học', status: ClassStatus.Active },
  ];

  private readonly classesApi = inject(ClassesService);

  ngOnInit(): void {
    void this.loadClasses();
  }

  setStatus(status: ClassStatus | null): void {
    this.activeStatus.set(status);
    this.page.set(1);
    void this.loadClasses();
  }

  label(status?: ClassStatus | null): string {
    return classStatusLabel(status);
  }

  statusClass(status?: ClassStatus | null): string {
    return classStatusClass(status);
  }

  date(value?: Date | null): string {
    return formatDate(value);
  }

  slots(item: ClassDto): string {
    return formatTimeSlots(item.timeSlots);
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    void this.loadClasses();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.page.set(1);
    void this.loadClasses();
  }

  private async loadClasses(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(
        this.classesApi.getMyClasses(
          this.activeStatus() ?? undefined,
          this.page(),
          this.pageSize(),
          undefined,
          'createdAt',
          'desc',
        ),
      );
      this.classes.set(response.data?.items ?? []);
      this.totalCount.set(response.data?.totalCount ?? 0);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được lớp học.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
