import { Component, computed, EventEmitter, input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-slate-100">
      <!-- Left Side: Display Stats & Page Size Dropdown -->
      <div class="flex items-center justify-between w-full sm:w-auto text-sm text-slate-500 font-bold gap-2">
        <span class="text-xs sm:text-sm whitespace-nowrap">
          <span class="hidden sm:inline">Hiển thị </span>
          <span class="text-slate-800 font-extrabold">{{ startItem() }} - {{ endItem() }}</span>
          trong
          <span class="text-slate-800 font-extrabold">{{ totalCount() }}</span>
          <span class="hidden sm:inline"> {{ itemsName() }}</span>
        </span>

        <div class="flex items-center gap-1.5 shrink-0">
          <span class="text-xs text-slate-400 font-semibold">Hiển thị:</span>
          <select [ngModel]="pageSize()" 
                  (ngModelChange)="changePageSize($event)" 
                  class="tactile-select-compact">
            @for (size of pageSizeOptions(); track size) {
              <option [value]="size">{{ size }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Right Side: Tactile Page Navigation Buttons -->
      @if (totalPages() > 1) {
        <!-- Mobile view: simple pagination on 1 line -->
        <div class="flex items-center justify-between w-full sm:hidden gap-2">
          <button type="button" 
                  [disabled]="page() <= 1"
                  (click)="selectPage(page() - 1)"
                  class="pagination-btn pagination-btn-outline px-4 py-1.5 text-xs font-bold grow justify-center">
            ◀ TRƯỚC
          </button>
          
          <span class="text-xs font-extrabold text-slate-700 whitespace-nowrap px-2">
            {{ page() }} / {{ totalPages() }}
          </span>

          <button type="button"
                  [disabled]="page() >= totalPages()"
                  (click)="selectPage(page() + 1)"
                  class="pagination-btn pagination-btn-outline px-4 py-1.5 text-xs font-bold grow justify-center">
            SAU ▶
          </button>
        </div>

        <!-- Desktop view: numeric pagination -->
        <div class="hidden sm:flex items-center gap-1.5 flex-wrap">
          <!-- Previous Button -->
          <button type="button" 
                  [disabled]="page() <= 1"
                  (click)="selectPage(page() - 1)"
                  class="pagination-btn pagination-btn-outline group shrink-0">
            <span class="text-[10px] mr-1 group-hover:-translate-x-0.5 transition-transform">◀</span> TRƯỚC
          </button>

          <!-- Page Numbers -->
          @for (p of pages(); track $index) {
            @if (p === '...') {
              <span class="px-2 text-slate-400 font-extrabold select-none">...</span>
            } @else {
              <button type="button"
                      (click)="selectPage(p)"
                      [class.pagination-btn-active]="p === page()"
                      [class.pagination-btn-outline]="p !== page()"
                      class="pagination-btn pagination-btn-number shrink-0">
                {{ p }}
              </button>
            }
          }

          <!-- Next Button -->
          <button type="button"
                  [disabled]="page() >= totalPages()"
                  (click)="selectPage(page() + 1)"
                  class="pagination-btn pagination-btn-outline group shrink-0">
            SAU <span class="text-[10px] ml-1 group-hover:translate-x-0.5 transition-transform">▶</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .pagination-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 36px;
      padding: 0 12px;
      border-radius: 12px;
      font-family: 'Fredoka', 'Nunito', ui-sans-serif, system-ui, sans-serif;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.05em;
      transition: all 0.1s ease;
      user-select: none;
      border: 2px solid #e2e8f0;
      box-sizing: border-box;
      outline: none;
    }

    .pagination-btn-number {
      padding: 0;
      width: 36px;
    }

    /* Inactive Outline Buttons */
    .pagination-btn-outline {
      background-color: #ffffff;
      color: #475569;
      border-color: #e2e8f0;
      border-bottom-width: 4px;
      border-bottom-color: #cbd5e1;
    }
    .pagination-btn-outline:hover:not(:disabled) {
      border-color: #cbd5e1;
      background-color: #f8fafc;
    }
    .pagination-btn-outline:active:not(:disabled) {
      border-bottom-width: 2px;
      transform: translateY(2px);
    }

    /* Active Green Buttons */
    .pagination-btn-active {
      background-color: #58cc02;
      color: #ffffff;
      border-color: #58cc02;
      border-bottom-width: 4px;
      border-bottom-color: #3f9f01;
    }
    .pagination-btn-active:hover {
      filter: brightness(1.05);
    }
    .pagination-btn-active:active {
      border-bottom-width: 2px;
      transform: translateY(2px);
    }

    /* Disabled button styles */
    .pagination-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none !important;
      border-bottom-width: 2px !important;
      background-color: #f1f5f9;
      color: #94a3b8;
      border-color: #e2e8f0;
    }

    /* Compact Select Dropdown */
    .tactile-select-compact {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 36px;
      min-width: 65px;
      padding: 0 8px;
      border-radius: 12px;
      font-family: 'Fredoka', 'Nunito', ui-sans-serif, system-ui, sans-serif;
      font-weight: 800;
      font-size: 13px;
      color: #475569;
      background-color: #ffffff;
      border: 2px solid #e2e8f0;
      border-bottom-width: 4px;
      border-bottom-color: #cbd5e1;
      outline: none;
      cursor: pointer;
      box-sizing: border-box;
      transition: all 0.1s ease;
    }
    .tactile-select-compact:focus {
      border-color: #1cb0f6;
      border-bottom-color: #1899d6;
    }
  `]
})
export class PaginationComponent {
  // Inputs
  readonly page = input<number>(1);
  readonly pageSize = input<number>(5);
  readonly totalCount = input<number>(0);
  readonly itemsName = input<string>('gia sư');

  // Outputs
  @Output() readonly pageChange = new EventEmitter<number>();
  @Output() readonly pageSizeChange = new EventEmitter<number>();

  // Options
  readonly pageSizeOptions = input<number[]>([5, 10, 15, 20]);

  // Computeds for record status
  protected readonly startItem = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  });

  protected readonly endItem = computed(() => {
    return Math.min(this.page() * this.pageSize(), this.totalCount());
  });

  protected readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize()));
  });

  // Intelligent page numbers pagination list
  protected readonly pages = computed(() => {
    const current = this.page();
    const total = this.totalPages();

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const result: Array<number | '...'> = [];
    result.push(1);

    if (current <= 4) {
      result.push(2, 3, 4, 5, '...', total);
    } else if (current >= total - 3) {
      result.push('...', total - 4, total - 3, total - 2, total - 1, total);
    } else {
      result.push('...', current - 1, current, current + 1, '...', total);
    }

    return result;
  });

  // Emits page change
  selectPage(targetPage: number | '...'): void {
    if (typeof targetPage === 'number' && targetPage >= 1 && targetPage <= this.totalPages() && targetPage !== this.page()) {
      this.pageChange.emit(targetPage);
    }
  }

  // Emits page size change
  changePageSize(newSize: string | number): void {
    const size = typeof newSize === 'string' ? parseInt(newSize, 10) : newSize;
    if (size && this.pageSizeOptions().includes(size) && size !== this.pageSize()) {
      this.pageSizeChange.emit(size);
    }
  }
}
