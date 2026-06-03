import { Component, model, input, signal, computed, ElementRef, HostListener } from '@angular/core';

@Component({
  selector: 'app-tactile-select',
  standalone: true,
  imports: [],
  template: `
    <div class="relative w-full" [class.opacity-50]="disabled()" [class.pointer-events-none]="disabled()">
      <!-- Trigger button -->
      <div 
        (click)="toggleDropdown($event)"
        class="tactile-input w-full text-sm font-semibold bg-white pl-4 pr-10 py-2.5 cursor-pointer select-none flex items-center justify-between min-h-[46px]"
        [class.border-duo-blue]="isOpen()"
        [class.border-b-duo-blue-dark]="isOpen()"
        [class.bg-slate-50]="disabled()"
      >
        <span [class.text-slate-400]="!selectedValueLabel()" class="truncate pr-4">
          {{ selectedValueLabel() || placeholder() }}
        </span>
        
        <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5" (click)="$event.stopPropagation()">
          <!-- Clear Button -->
          @if (clearable() && value() !== defaultValue() && !disabled()) {
            <button
              type="button"
              (click)="clear($event)"
              class="text-slate-400 hover:text-slate-600 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              ✕
            </button>
          }
          <!-- Arrow Icon -->
          <svg 
            (click)="toggleDropdown($event)"
            class="w-4 h-4 text-slate-400 transition-transform duration-200 cursor-pointer" 
            [class.rotate-180]="isOpen()"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            stroke-width="2.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <!-- Dropdown Popup - Always renders downwards -->
      @if (isOpen()) {
        <div 
          class="absolute z-50 mt-2 left-0 right-0 bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-2xl shadow-xl overflow-hidden"
        >
          <div class="max-h-60 overflow-y-auto w-full">
            @if (placeholder() && showPlaceholderOption()) {
              <div 
                (click)="selectOption(null)"
                class="px-4 py-2.5 text-sm font-semibold cursor-pointer transition-colors border-b border-slate-100"
                [class]="(value() === null || value() === undefined)
                  ? 'bg-slate-50 text-slate-500'
                  : 'text-slate-500 hover:bg-slate-50'"
              >
                {{ placeholder() }}
              </div>
            }
            @for (option of options(); track getOptionValue(option)) {
              <div 
                (click)="selectOption(option)"
                class="px-4 py-2.5 text-sm font-semibold cursor-pointer transition-colors"
                [class]="value() === getOptionValue(option)
                  ? 'bg-duo-blue text-white hover:bg-duo-blue-dark'
                  : 'text-slate-700 hover:bg-slate-50'"
              >
                {{ getOptionLabel(option) }}
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class TactileSelectComponent {
  value = model<any>(null);
  options = input<readonly any[]>([]);
  valueKey = input<string>('');
  labelKey = input<string>('');
  placeholder = input<string>('');
  disabled = input<boolean>(false);
  clearable = input<boolean>(false);
  defaultValue = input<any>(null);
  showPlaceholderOption = input<boolean>(true);

  isOpen = signal(false);

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    if (this.disabled()) return;
    this.isOpen.update(v => !v);
  }

  selectOption(option: any) {
    if (option === null) {
      this.value.set(this.defaultValue());
    } else {
      this.value.set(this.getOptionValue(option));
    }
    this.isOpen.set(false);
  }

  clear(event: Event) {
    event.stopPropagation();
    this.value.set(this.defaultValue());
    this.isOpen.set(false);
  }

  getOptionValue(option: any): any {
    if (option === null || option === undefined) return null;
    if (typeof option !== 'object') return option;
    const key = this.valueKey();
    return key ? option[key] : option;
  }

  getOptionLabel(option: any): string {
    if (option === null || option === undefined) return '';
    if (typeof option !== 'object') return String(option);
    const key = this.labelKey();
    return key ? String(option[key]) : String(option);
  }

  selectedValueLabel = computed(() => {
    const val = this.value();
    if (val === null || val === undefined) return '';
    const found = this.options().find(opt => this.getOptionValue(opt) === val);
    return found ? this.getOptionLabel(found) : '';
  });
}
