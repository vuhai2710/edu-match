import { Component } from '@angular/core';

@Component({
  selector: 'app-student-dashboard-page',
  template: `
    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="card p-6">
        <p class="eyebrow">Student</p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-950">Dashboard shell</h2>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          Connected to the route guard stack and ready for dashboard statistics from
          <code>GET /api/Dashboard/student</code>.
        </p>
      </article>
      <article class="card p-6">
        <p class="eyebrow">Next API slices</p>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          Tutor requests, applications, classes, notifications, and deposit status.
        </p>
      </article>
      <article class="card p-6">
        <p class="eyebrow">Realtime</p>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          SignalR hub endpoints are already present in the app environment for future
          notification and chat integration.
        </p>
      </article>
      <article class="card p-6">
        <p class="eyebrow">Payments</p>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          The payment callback routes exist now, so the student payment loop can be
          wired incrementally without changing routing contracts.
        </p>
      </article>
    </section>
  `,
})
export class StudentDashboardPage {}
