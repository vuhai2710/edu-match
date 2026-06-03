import { Component, input } from '@angular/core';

import { ApiErrorDetails } from '../../../core/http/api-error';

@Component({
  selector: 'app-error-banner',
  template: `
    @if (details(); as d) {
      <div class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3">
        <div class="flex items-start gap-2">
          <span class="text-duo-red font-black text-sm shrink-0">⚠</span>
          <p class="text-sm font-bold text-duo-red flex-1">{{ d.message }}</p>
        </div>
      </div>
    }
  `,
})
export class ErrorBannerComponent {
  readonly details = input<ApiErrorDetails | null>(null);
}
