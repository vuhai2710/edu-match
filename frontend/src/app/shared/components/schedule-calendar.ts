import { Component, input, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ClassDto } from '../../api/generated/client/models';
import { classStatusLabel, classStatusClass } from '../utils/api-ui';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  dayLabel: string;
  isToday: boolean;
  isSelected: boolean;
  hasClasses: boolean;
}

interface ScheduleItem {
  classId: number;
  classCode: string;
  subjectName: string;
  partnerName: string;
  startTime: string;
  endTime: string;
  status: string;
  statusLabel: string;
  statusClass: string;
}

@Component({
  selector: 'app-schedule-calendar',
  imports: [RouterLink],
  template: `
    <div class="tactile-card p-5 bg-white space-y-5">
      <!-- Calendar Header -->
      <div class="flex items-center justify-between border-b-2 border-slate-100 pb-3">
        <h2 class="font-display font-black text-lg text-slate-800">
          {{ role() === 'student' ? 'Lịch học' : 'Lịch dạy' }}
        </h2>
        <a
          [routerLink]="role() === 'student' ? '/student/classes' : '/tutor/classes'"
          [class.text-duo-green]="role() === 'student'"
          [class.text-duo-blue]="role() === 'tutor'"
          class="text-xs font-black hover:underline flex items-center gap-0.5"
        >
          Xem tất cả
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      <!-- Week Navigator (Mockup Style) -->
      <div class="flex items-center justify-between px-1">
        <button
          (click)="previousWeek()"
          class="p-1.5 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          (click)="goToToday()"
          class="font-display font-black text-slate-700 text-sm hover:underline"
        >
          {{ monthLabel() }}
        </button>
        <button
          (click)="nextWeek()"
          class="p-1.5 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Days Grid (Mockup Style: 7 Days) -->
      <div class="grid grid-cols-7 gap-2">
        @for (day of days(); track day.date.getTime()) {
          <button
            (click)="selectDay(day.date)"
            [class.border-duo-green]="day.isSelected && role() === 'student'"
            [class.bg-duo-green]="day.isSelected && role() === 'student'"
            [class.text-white]="day.isSelected"
            [class.border-duo-blue]="day.isSelected && role() === 'tutor'"
            [class.bg-duo-blue]="day.isSelected && role() === 'tutor'"
            [class.border-slate-200]="!day.isSelected"
            [class.bg-slate-50]="!day.isSelected && day.isToday"
            class="flex flex-col items-center py-3 rounded-2xl border-2 transition-all cursor-pointer select-none relative"
            style="border-bottom-width: 4px;"
          >
            <span
              [class.text-slate-400]="!day.isSelected"
              [class.text-white]="day.isSelected"
              class="text-[11px] font-black uppercase tracking-wider"
            >
              {{ day.dayLabel }}
            </span>
            <span class="text-lg font-black mt-1 leading-none">
              {{ day.dayNumber }}
            </span>

            <!-- Indicator dot for days with classes -->
            @if (day.hasClasses) {
              <span
                class="absolute bottom-1.5 w-1.5 h-1.5 rounded-full animate-pulse-slow"
                [class.bg-white]="day.isSelected"
                [class.bg-duo-green]="!day.isSelected && role() === 'student'"
                [class.bg-duo-blue]="!day.isSelected && role() === 'tutor'"
              >
              </span>
            } @else if (day.isToday && !day.isSelected) {
              <span class="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            }
          </button>
        }
      </div>

      <!-- Schedule Classes List -->
      <div class="space-y-3 mt-4">
        <h3 class="font-extrabold text-sm text-slate-500 uppercase tracking-wider">
          Lịch học ngày {{ formattedSelectedDay() }}
        </h3>

        @for (item of dailyItems(); track item.classId + '-' + item.startTime) {
          <a
            [routerLink]="[role() === 'student' ? '/student/classes' : '/tutor/classes', item.classId]"
            class="tactile-card p-4 flex items-center justify-between gap-4 hover:shadow-md transition-shadow block bg-slate-50/25"
          >
            <!-- Lớp học chi tiết không hiển thị icon như yêu cầu của người dùng -->
            <div>
              <p class="font-extrabold text-slate-900 leading-snug">
                {{ item.subjectName }}
              </p>
              <p class="text-xs text-slate-500 font-bold mt-0.5">
                {{ role() === 'student' ? 'Gia sư' : 'Học viên' }}: {{ item.partnerName }}
              </p>
            </div>

            <div class="text-right shrink-0">
              <p class="font-display font-black text-slate-800 text-sm">
                {{ item.startTime }} - {{ item.endTime }}
              </p>
              <span
                [class]="item.statusClass"
                class="inline-block text-[10px] font-black rounded-full px-2 py-0.5 mt-1"
              >
                {{ item.statusLabel }}
              </span>
            </div>
          </a>
        }

        @if (dailyItems().length === 0) {
          <div class="tactile-card p-6 text-center bg-slate-50/50">
            <p class="text-sm font-bold text-slate-400">Không có lịch học nào trong ngày này.</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class ScheduleCalendarComponent {
  classes = input<ClassDto[]>([]);
  role = input<'student' | 'tutor'>('student');

  selectedDate = signal<Date>(new Date());
  currentWeekStart = signal<Date>(this.getStartOfWeek(new Date()));

  private readonly DAY_MAP: Record<number, string> = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
  };

  private readonly DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  monthLabel = computed(() => {
    const start = this.currentWeekStart();
    const month = String(start.getMonth() + 1).padStart(2, '0');
    const year = start.getFullYear();
    return `Tháng ${month}, ${year}`;
  });

  formattedSelectedDay = computed(() => {
    const d = this.selectedDate();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const dayName = this.DAY_LABELS[d.getDay()];
    return `${dayName} (${day}/${month}/${year})`;
  });

  days = computed<CalendarDay[]>(() => {
    const start = new Date(this.currentWeekStart());
    const result: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sel = new Date(this.selectedDate());
    sel.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      currentDate.setHours(0, 0, 0, 0);

      const dayOfWeekName = this.DAY_MAP[currentDate.getDay()];

      const hasClasses = this.classes().some((c) => {
        if (c.status !== 'Active' && c.status !== 'PendingStart') return false;

        if (c.startDate) {
          const classStart = new Date(c.startDate);
          classStart.setHours(0, 0, 0, 0);
          if (currentDate < classStart) return false;
        }

        return c.timeSlots?.some((slot) => slot.day === dayOfWeekName);
      });

      result.push({
        date: currentDate,
        dayNumber: currentDate.getDate(),
        dayLabel: this.DAY_LABELS[currentDate.getDay()],
        isToday: currentDate.getTime() === today.getTime(),
        isSelected: currentDate.getTime() === sel.getTime(),
        hasClasses,
      });
    }

    return result;
  });

  dailyItems = computed<ScheduleItem[]>(() => {
    const sel = this.selectedDate();
    sel.setHours(0, 0, 0, 0);
    const dayOfWeekName = this.DAY_MAP[sel.getDay()];
    const roleValue = this.role();

    const items: ScheduleItem[] = [];

    for (const c of this.classes()) {
      if (c.status !== 'Active' && c.status !== 'PendingStart') continue;

      if (c.startDate) {
        const classStart = new Date(c.startDate);
        classStart.setHours(0, 0, 0, 0);
        if (sel < classStart) continue;
      }

      if (c.timeSlots) {
        for (const slot of c.timeSlots) {
          if (slot.day === dayOfWeekName) {
            items.push({
              classId: c.id ?? 0,
              classCode: c.code ?? '',
              subjectName: c.subjectName ?? 'Môn học',
              partnerName:
                (roleValue === 'student' ? c.tutorName : c.studentName) ?? 'Đang cập nhật',
              startTime: slot.startTime ?? '',
              endTime: slot.endTime ?? '',
              status: c.status ?? '',
              statusLabel: classStatusLabel(c.status),
              statusClass: classStatusClass(c.status),
            });
          }
        }
      }
    }

    return items.sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  selectDay(date: Date): void {
    this.selectedDate.set(new Date(date));
  }

  previousWeek(): void {
    const current = new Date(this.currentWeekStart());
    current.setDate(current.getDate() - 7);
    this.currentWeekStart.set(current);

    const newSelected = new Date(this.selectedDate());
    newSelected.setDate(newSelected.getDate() - 7);
    this.selectedDate.set(newSelected);
  }

  nextWeek(): void {
    const current = new Date(this.currentWeekStart());
    current.setDate(current.getDate() + 7);
    this.currentWeekStart.set(current);

    const newSelected = new Date(this.selectedDate());
    newSelected.setDate(newSelected.getDate() + 7);
    this.selectedDate.set(newSelected);
  }

  goToToday(): void {
    const today = new Date();
    this.selectedDate.set(new Date(today));
    this.currentWeekStart.set(this.getStartOfWeek(today));
  }

  private getStartOfWeek(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(date.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  }
}
