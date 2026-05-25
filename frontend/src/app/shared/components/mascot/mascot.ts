import { Component, input } from '@angular/core';
import { MASCOT_URLS, MascotType } from '../../fixtures/mascot-urls';

@Component({
  selector: 'app-mascot',
  template: `
    <div class="inline-flex justify-center items-center" [class]="className()">
      <img
        [src]="url()"
        [alt]="'Mascot ' + type()"
        [width]="size()"
        [height]="size()"
        referrerpolicy="no-referrer"
        class="animate-float select-none pointer-events-none object-contain max-w-full mix-blend-multiply"
      />
    </div>
  `,
})
export class MascotComponent {
  readonly type = input.required<MascotType>();
  readonly size = input(120);
  readonly className = input('');

  protected url() {
    return MASCOT_URLS[this.type()];
  }
}
