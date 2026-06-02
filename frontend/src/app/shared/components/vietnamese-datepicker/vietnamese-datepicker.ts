import { Component, model, input, signal, computed, ElementRef, HostListener } from '@angular/core';

@Component({
  selector: 'app-vietnamese-datepicker',
  standalone: true,
  imports: [],
  template: `
    <div class="relative w-full">
      <!-- Input box styling matching tactile-input -->
      <div class="relative cursor-pointer" (click)="toggleDropdown($event)">
        <input
          type="text"
          [value]="value() ? formatDateStr(value()) : ''"
          [placeholder]="placeholder()"
          class="tactile-input w-full text-sm font-semibold pl-3 pr-10 py-2.5 bg-white cursor-pointer select-none"
          readonly
        />
        <div class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      <!-- Calendar dropdown popup -->
      @if (isOpen()) {
        <div class="absolute z-50 mt-2 left-0 w-72 bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-2xl p-4 shadow-xl">
          <!-- Calendar Header -->
          <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <button
              type="button"
              (click)="prevMonth($event)"
              class="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-500"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span class="font-display font-black text-slate-700 text-sm">
              {{ monthLabel() }}
            </span>
            <button
              type="button"
              (click)="nextMonth($event)"
              class="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-500"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <!-- Days Header (T2 to CN) -->
          <div class="grid grid-cols-7 gap-1 text-center text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">
            @for (day of weekDays; track day) {
              <div class="py-1">{{ day }}</div>
            }
          </div>

          <!-- Days Grid -->
          <div class="grid grid-cols-7 gap-1">
            @for (day of daysInMonth(); track day.dateStr) {
              <button
                type="button"
                (click)="selectDay(day.dateStr, day.isDisabled, $event)"
                [disabled]="day.isDisabled"
                [class.text-slate-300]="!day.isCurrentMonth && !day.isSelected && !day.isDisabled"
                [class.bg-duo-green]="day.isSelected"
                [class.text-white]="day.isSelected"
                [class.font-black]="day.isSelected"
                [class.bg-slate-50]="day.isToday && !day.isSelected"
                [class.border-slate-300]="day.isToday && !day.isSelected"
                [class.opacity-30]="day.isDisabled"
                [class.cursor-not-allowed]="day.isDisabled"
                [class.hover:bg-slate-50]="!day.isSelected && !day.isDisabled"
                class="flex items-center justify-center w-8 h-8 rounded-xl border border-transparent text-xs font-bold transition-all relative select-none"
              >
                {{ day.date.getDate() }}
                @if (day.isToday && !day.isSelected) {
                  <span class="absolute bottom-0.5 w-1 h-1 rounded-full bg-duo-green"></span>
                }
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class VietnameseDatePickerComponent {
  value = model<string>(''); // format YYYY-MM-DD
  min = input<string>(''); // format YYYY-MM-DD
  placeholder = input<string>('Chọn ngày');

  isOpen = signal(false);
  currentMonth = signal<Date>(new Date());
  today = signal<Date>(new Date());

  readonly weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  monthLabel = computed(() => {
    const month = String(this.currentMonth().getMonth() + 1).padStart(2, '0');
    const year = this.currentMonth().getFullYear();
    return `Tháng ${month}, ${year}`;
  });

  daysInMonth = computed(() => {
    const monthDate = this.currentMonth();
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: Array<{ date: Date; dateStr: string; isCurrentMonth: boolean; isDisabled: boolean; isToday: boolean; isSelected: boolean }> = [];

    // Align Monday as the first day of the grid
    const startDayOfWeek = firstDay.getDay(); 
    const emptyCells = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = emptyCells - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push(this.createDayObj(d, false));
    }

    const totalDays = lastDay.getDate();
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push(this.createDayObj(d, true));
    }

    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i);
      days.push(this.createDayObj(d, false));
    }

    return days;
  });

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isOpen.update(v => !v);
    
    // Reset view month to currently selected value (if any) or today
    const currentVal = this.value();
    if (currentVal) {
      this.currentMonth.set(new Date(currentVal));
    } else {
      this.currentMonth.set(new Date());
    }
  }

  prevMonth(event: Event) {
    event.stopPropagation();
    const date = new Date(this.currentMonth());
    date.setMonth(date.getMonth() - 1);
    this.currentMonth.set(date);
  }

  nextMonth(event: Event) {
    event.stopPropagation();
    const date = new Date(this.currentMonth());
    date.setMonth(date.getMonth() + 1);
    this.currentMonth.set(date);
  }

  selectDay(dateStr: string, isDisabled: boolean, event: Event) {
    event.stopPropagation();
    if (isDisabled) return;
    this.value.set(dateStr);
    this.isOpen.set(false);
  }

  formatDateStr(val: string): string {
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length !== 3) return val;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  private createDayObj(d: Date, isCurrentMonth: boolean) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const minVal = this.min();
    let isDisabled = false;
    if (minVal) {
      isDisabled = dateStr < minVal;
    }

    const todayDate = new Date();
    const isToday = d.getDate() === todayDate.getDate() &&
                    d.getMonth() === todayDate.getMonth() &&
                    d.getFullYear() === todayDate.getFullYear();

    const isSelected = this.value() === dateStr;

    return {
      date: d,
      dateStr,
      isCurrentMonth,
      isDisabled,
      isToday,
      isSelected
    };
  }
}
