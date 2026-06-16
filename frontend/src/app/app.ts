import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ProfileBootstrapService } from './core/auth/profile-bootstrap';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly profileBootstrap = inject(ProfileBootstrapService);

  constructor() {
    queueMicrotask(() => void this.profileBootstrap.bootstrap());
  }
}
