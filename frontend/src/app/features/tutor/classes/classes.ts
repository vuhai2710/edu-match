import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ClassDto, ClassStatus } from '../../../api/generated/client/models';
import { ClassesService } from '../../../api/generated/client/services';
import { getApiErrorMessage } from '../../../core/http/api-error';
import { classStatusLabel, formatDate, formatTimeSlots } from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-tutor-classes-page',
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      <h1 class="font-display text-2xl font-black text-slate-900">Lớp dạy của tôi</h1>
      @if (errorMessage()) {
        <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">{{ errorMessage() }}</p>
      }
      <div class="grid md:grid-cols-2 gap-4">
        @for (item of classes(); track item.id) {
          <a [routerLink]="['/tutor/classes', item.id]" class="tactile-card p-5">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="font-extrabold text-slate-900">{{ item.subjectName || item.code }}</h2>
                <p class="text-sm text-slate-500">Học viên: {{ item.studentName || 'Đang cập nhật' }}</p>
              </div>
              <span class="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-duo-green">{{ label(item.status) }}</span>
            </div>
            <p class="text-sm text-slate-500 mt-3">{{ date(item.startDate) }} · {{ slots(item) }}</p>
          </a>
        }
      </div>
    </div>
  `,
})
export class TutorClassesPage implements OnInit {
  classes = signal<ClassDto[]>([]);
  errorMessage = signal('');
  private readonly classesApi = inject(ClassesService);

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

  private async loadClasses(): Promise<void> {
    try {
      const response = await firstValueFrom(this.classesApi.getTutorClasses(undefined, 1, 30, undefined, 'createdAt', 'desc'));
      this.classes.set(response.data?.items ?? []);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được lớp dạy.'));
    }
  }
}
