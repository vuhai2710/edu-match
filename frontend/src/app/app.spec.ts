import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { routes } from './app.routes';
import { ProfileBootstrapService } from './core/auth/profile-bootstrap';

describe('App', () => {
  it('creates the application shell', () => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        { provide: ProfileBootstrapService, useValue: { bootstrap: vi.fn() } },
      ],
    });

    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
