import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, startWith } from 'rxjs';

import { SessionService } from '../../core/auth/session';

interface WorkspaceArea {
  title: string;
  description: string;
  links: Array<{ label: string; href: string }>;
}

const AREAS: Record<string, WorkspaceArea> = {
  student: {
    title: 'Không gian học viên',
    description:
      'Dành cho dashboard, tutor requests, applications, classes, notifications và payment status.',
    links: [
      { label: 'Dashboard', href: '/student/dashboard' },
      { label: 'Thanh toán', href: '/payment/success' },
    ],
  },
  tutor: {
    title: 'Không gian gia sư',
    description:
      'Dành cho dashboard, profile, incoming requests, schedule proposals và classes.',
    links: [
      { label: 'Dashboard', href: '/tutor/dashboard' },
      { label: 'Trang chủ', href: '/' },
    ],
  },
  admin: {
    title: 'Không gian quản trị',
    description:
      'Dành cho moderation, dashboards, approvals, payments và cancellation handling.',
    links: [
      { label: 'Dashboard', href: '/admin/dashboard' },
      { label: 'Trang chủ', href: '/' },
    ],
  },
};

@Component({
  selector: 'app-workspace-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-screen bg-[var(--app-bg)] text-slate-900">
      <div class="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside class="card-muted flex h-fit flex-col gap-6 p-6">
          <div>
            <p class="eyebrow">Protected area</p>
            <h1 class="mt-3 text-2xl font-semibold text-slate-950">{{ area().title }}</h1>
            <p class="mt-3 text-sm leading-6 text-slate-600">{{ area().description }}</p>
          </div>

          <div class="rounded-3xl border border-white/60 bg-white/80 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Session
            </p>
            <p class="mt-3 text-lg font-semibold text-slate-950">
              {{ session.user()?.fullName ?? 'Chưa đồng bộ hồ sơ' }}
            </p>
            <p class="mt-1 text-sm text-slate-600">
              {{ session.user()?.email ?? 'Bootstrap sẽ lấy hồ sơ khi có token hợp lệ.' }}
            </p>
          </div>

          <nav class="grid gap-2">
            @for (link of area().links; track link.href) {
              <a
                class="nav-link w-full justify-between"
                [routerLink]="link.href"
                routerLinkActive="nav-link-active"
              >
                <span>{{ link.label }}</span>
                <span aria-hidden="true">→</span>
              </a>
            }
          </nav>
        </aside>

        <main class="flex min-h-[70vh] flex-col gap-6">
          <div class="card p-6">
            <p class="eyebrow">Role-aware shell</p>
            <p class="mt-3 text-sm leading-6 text-slate-600">
              <code>AuthGuard</code> and <code>RoleGuard</code> gate this section before any feature screen is loaded.
            </p>
          </div>

          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class WorkspaceShellComponent {
  protected readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly navigation = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
    ),
  );

  protected readonly area = computed(() => {
    this.navigation();
    const segment = this.router.url.split('/').filter(Boolean)[0] ?? 'student';
    return AREAS[segment] ?? AREAS['student'];
  });
}
