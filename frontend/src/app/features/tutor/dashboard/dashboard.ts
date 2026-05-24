import { Component } from '@angular/core';

@Component({
  selector: 'app-tutor-dashboard-page',
  template: `
    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="card p-6">
        <p class="eyebrow">Tutor</p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-950">Dashboard shell</h2>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          Ready for tutor dashboard metrics and profile sections backed by
          <code>GET /api/Dashboard/tutor</code> and tutor profile endpoints.
        </p>
      </article>
      <article class="card p-6">
        <p class="eyebrow">Core flows</p>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          Incoming learning requests, schedule proposals, applications, and active
          classes fit into this shell without structural changes.
        </p>
      </article>
      <article class="card p-6">
        <p class="eyebrow">Profile</p>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          The backend already exposes update-my-profile and CV endpoints for later form
          implementation.
        </p>
      </article>
      <article class="card p-6">
        <p class="eyebrow">Notifications</p>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          Realtime hub placeholders are configured, but the messaging UI is deferred to
          the next phase.
        </p>
      </article>
    </section>
  `,
})
export class TutorDashboardPage {}
