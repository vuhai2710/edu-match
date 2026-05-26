import { Component, computed, input, signal } from '@angular/core';

import { ApiErrorDetails } from '../../../core/http/api-error';

@Component({
  selector: 'app-error-banner',
  template: `
    @if (details(); as d) {
      <div class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 space-y-2">
        <div class="flex items-start gap-2">
          <span class="text-duo-red font-black text-sm shrink-0">⚠</span>
          <p class="text-sm font-bold text-duo-red flex-1">{{ d.message }}</p>
          @if (hasTechnicalDetails()) {
            <button type="button"
                    (click)="expanded.set(!expanded())"
                    class="text-xs font-bold text-slate-500 hover:text-slate-700 underline shrink-0">
              {{ expanded() ? 'Ẩn' : 'Chi tiết kỹ thuật' }}
            </button>
          }
        </div>
        @if (expanded() && hasTechnicalDetails()) {
          <div class="rounded-lg bg-white border border-red-100 px-3 py-2 text-xs font-mono space-y-1 text-slate-700">
            @if (d.status != null) {
              <p><span class="font-bold">Status:</span> {{ d.status }}</p>
            }
            @if (d.errorCode) {
              <p><span class="font-bold">Code:</span> {{ d.errorCode }}</p>
            }
            @if (d.url) {
              <p class="break-all"><span class="font-bold">URL:</span> {{ d.url }}</p>
            }
          </div>
        }
      </div>
    }
  `,
})
export class ErrorBannerComponent {
  readonly details = input<ApiErrorDetails | null>(null);
  protected readonly expanded = signal(false);
  protected readonly hasTechnicalDetails = computed(() => {
    const d = this.details();
    if (!d) return false;
    return d.status != null || !!d.errorCode || !!d.url;
  });
}
