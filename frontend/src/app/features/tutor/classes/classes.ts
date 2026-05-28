import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ClassDto, ClassStatus } from '../../../api/generated/client/models';
import { ClassesService } from '../../../api/generated/client/services';
import { getApiErrorMessage } from '../../../core/http/api-error';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { classStatusLabel, formatDate, formatTimeSlots } from '../../../shared/utils/api-ui';
import { StudentDetailModalComponent } from '../../../shared/components/student-detail-modal';

@Component({
  selector: 'app-tutor-classes-page',
  imports: [RouterLink, StudentDetailModalComponent, PaginationComponent],
  template: `
    <div class="space-y-6">
      <h1 class="font-display text-2xl font-black text-slate-900">Lớp dạy của tôi</h1>
      @if (errorMessage()) {
        <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">{{ errorMessage() }}</p>
      }

      @if (isLoading() && classes().length === 0) {
        <div class="grid md:grid-cols-2 gap-4">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="tactile-card p-5 animate-pulse">
              <div class="h-6 bg-slate-100 rounded w-1/3"></div>
              <div class="h-4 bg-slate-100 rounded mt-3 w-1/2"></div>
              <div class="h-8 bg-slate-100 rounded mt-4"></div>
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
              <a [routerLink]="['/tutor/classes', item.id]" class="tactile-card p-5 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h2 class="font-extrabold text-slate-900">{{ item.subjectName || item.code }}</h2>
                    <div class="flex items-center gap-2 mt-1">
                      <p class="text-sm text-slate-500">Học viên: {{ item.studentName || 'Đang cập nhật' }}</p>
                      @if (item.studentId) {
                        <button type="button" 
                                (click)="openStudentDetail(item.studentId, $event)" 
                                class="text-xs font-extrabold text-duo-blue hover:text-duo-blue-dark hover:underline">
                          (Xem chi tiết)
                        </button>
                      }
                    </div>
                  </div>
                  <span class="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-duo-green">{{ label(item.status) }}</span>
                </div>
                <p class="text-sm text-slate-500 mt-3">{{ date(item.startDate) }} · {{ slots(item) }}</p>
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
          <p class="font-extrabold text-slate-800">Chưa có lớp dạy nào</p>
          <p class="text-sm text-slate-500 mt-1">Các lớp học bạn nhận dạy sẽ được hiển thị ở đây.</p>
        </div>
      }

      @if (selectedStudentId()) {
        <app-student-detail-modal [studentId]="selectedStudentId()" (close)="selectedStudentId.set(null)" />
      }
    </div>
  `,
})
export class TutorClassesPage implements OnInit {
  classes = signal<ClassDto[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  selectedStudentId = signal<number | null>(null);

  // Pagination states
  page = signal(1);
  pageSize = signal(5);
  totalCount = signal(0);

  private readonly classesApi = inject(ClassesService);

  openStudentDetail(studentId: number, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.selectedStudentId.set(studentId);
  }

  ngOnInit(): void {
    void this.loadClasses();
  }

  label(status?: ClassStatus | null): string {
    return classStatusLabel(status);
  }

  date(value?: Date | null): string {
    return formatDate(value);
  }

  slots(item: ClassDto): string {
    return formatTimeSlots(item.timeSlots);
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
        this.classesApi.getTutorClasses(
          undefined,
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
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được lớp dạy.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
