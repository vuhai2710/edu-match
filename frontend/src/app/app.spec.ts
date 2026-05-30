import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  it('creates the application shell', () => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    });

    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
