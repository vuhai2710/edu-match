import {
  Component,
  HostListener,
  Injector,
  OnInit,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { Subscription, filter, firstValueFrom, startWith } from 'rxjs';

import { AuthApiService } from '../../api/facades/auth-api';
import { NotificationsService } from '../../api/generated/client/services';
import { ApiResponse, UserRole } from '../../core/auth/session.models';
import { SessionService } from '../../core/auth/session';
import { SignalrService } from '../../core/realtime/signalr.service';
import { APP_ENV } from '../../core/config/app-env';

@Component({
  selector: 'app-workspace-shell',
  imports: [RouterLink, NgClass, RouterOutlet],
  template: `
    @if (activeSegment() === 'admin') {
      <div class="min-h-screen bg-slate-50 flex font-sans">
        <!-- Backdrop overlay for mobile drawer -->
        @if (isMobileMenuOpen()) {
          <div
            class="fixed inset-0 bg-slate-900/40 z-40 md:hidden transition-opacity duration-300"
            (click)="isMobileMenuOpen.set(false)"
          ></div>
        }

        <!-- Admin Sidebar -->
        <aside
          [class]="
            'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r-2 border-slate-100 transition-all duration-300 transform md:translate-x-0 md:static md:h-screen md:sticky md:top-0 md:shrink-0 ' +
            (isMobileMenuOpen() ? 'translate-x-0 w-64' : '-translate-x-full w-64') +
            ' ' +
            (isSidebarCollapsed() ? 'md:w-20' : 'md:w-64')
          "
        >
          <!-- Sidebar Brand Logo -->
          <div
            class="p-4 flex items-center justify-between h-[65px] shrink-0 bg-white"
          >
            <a
              [routerLink]="dashboardRoute()"
              class="flex items-center gap-2 group overflow-hidden"
            >
              <div
                class="w-9 h-9 rounded-xl bg-[#58cc02] flex items-center justify-center shadow-md border-b-3 border-[#4b9b04] shrink-0"
              >
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                  />
                </svg>
              </div>
              @if (!isSidebarCollapsed()) {
                <span
                  class="font-display font-bold text-xl text-[#58cc02] transition-opacity duration-200"
                  >EduMatch</span
                >
              }
            </a>
            <!-- Close button for mobile drawer -->
            <button
              (click)="isMobileMenuOpen.set(false)"
              class="p-1 rounded-lg hover:bg-slate-100 md:hidden text-slate-400"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Sidebar Navigation Menu links -->
          <nav class="flex-grow p-3 overflow-y-auto space-y-1">
            @for (link of areaLinks(); track link.href) {
              <a
                [routerLink]="link.href"
                [ngClass]="isActive(link.href) ? 'bg-[#d7ffb8] text-[#3f8f01] font-black border-b-2 border-[#b8f582] active' : ''"
                class="group flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 [&.active]:hover:bg-[#d7ffb8] transition-colors uppercase tracking-wide"
              >
                <!-- SVG Icon -->
                <div
                  class="w-5 h-5 shrink-0 flex items-center justify-center text-slate-400 group-hover:text-slate-600 group-[.active]:group-hover:text-[#3f8f01] group-[.active]:text-[#3f8f01] transition-colors"
                >
                  @switch (link.href) {
                    @case ('/admin/dashboard') {
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"
                        />
                      </svg>
                    }
                    @case ('/admin/users') {
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    }
                    @case ('/admin/subjects') {
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    }
                    @case ('/admin/deposit-policy') {
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    }
                    @case ('/admin/classes') {
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                        />
                      </svg>
                    }
                    @case ('/admin/cancellation-requests') {
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    }
                    @case ('/admin/payments') {
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    }
                  }
                </div>
                @if (!isSidebarCollapsed()) {
                  <span class="truncate transition-opacity duration-200">{{ link.label }}</span>
                }
              </a>
            }
          </nav>

          <!-- Sidebar Footer Desktop Toggle Button -->
          <div class="p-3 border-t-2 border-slate-100 hidden md:block shrink-0">
            <button
              (click)="toggleSidebar()"
              class="w-full flex items-center justify-center p-2.5 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
            >
              @if (isSidebarCollapsed()) {
                <!-- Arrow Right Icon -->
                <svg
                  class="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
              } @else {
                <!-- Arrow Left Icon -->
                <svg
                  class="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M11 19l-7-7 7-7M19 19l-7-7 7-7"
                  />
                </svg>
              }
            </button>
          </div>
        </aside>

        <!-- Main container (Header + Page content) -->
        <div class="flex-grow flex flex-col min-w-0">
          <!-- Header -->
          <header
            class="sticky top-0 z-30 w-full bg-white border-b-2 border-slate-100 px-4 py-2.5 shadow-sm h-[65px] flex items-center"
          >
            <div class="w-full flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 sm:gap-3 min-w-0">
                <!-- Mobile menu toggle button -->
                <button
                  (click)="isMobileMenuOpen.set(true)"
                  class="p-2 rounded-xl hover:bg-slate-100 md:hidden text-slate-500 shrink-0"
                >
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>

                <!-- Active Page Title -->
                <h1
                  class="font-display font-bold text-lg md:text-xl text-[#3c3c3c] tracking-wide truncate"
                >
                  {{ activeMenuName() }}
                </h1>
              </div>

              <!-- Profile, Notifications, Chat -->
              <div class="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <!-- Notifications Bell -->
                <a
                  [routerLink]="notificationsRoute()"
                  [ngClass]="isActive(notificationsRoute()) ? 'bg-[#d7ffb8] active' : ''"
                  class="group p-2 rounded-xl hover:bg-slate-100 [&.active]:hover:bg-[#d7ffb8] transition-colors relative"
                >
                  <svg
                    class="w-6 h-6 text-slate-400 group-[.active]:text-[#3f8f01] transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  @if (unreadCount() > 0) {
                    <span
                      class="absolute top-1 right-1 w-4 h-4 bg-[#ff4b4b] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white"
                    >
                      {{ unreadCount() }}
                    </span>
                  }
                </a>

                <!-- Chat Bubble -->
                <a
                  [routerLink]="chatRoute()"
                  [ngClass]="isActive(chatRoute()) ? 'bg-[#d7ffb8] active' : ''"
                  class="group p-2 rounded-xl hover:bg-slate-100 [&.active]:hover:bg-[#d7ffb8] transition-colors relative"
                >
                  <svg
                    class="w-6 h-6 text-slate-400 group-[.active]:text-[#3f8f01] transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  @if (unreadChatCount() > 0) {
                    <span
                      class="absolute top-1 right-1 w-4 h-4 bg-[#ff9600] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white"
                    >
                      {{ unreadChatCount() }}
                    </span>
                  }
                </a>

                <!-- Vertical divider -->
                <div class="h-6 w-[1.5px] bg-[#e1e9f1] mx-2"></div>

                <!-- Avatar & Profile Dropdown Button -->
                <div class="relative" (click)="$event.stopPropagation()">
                  <button
                    type="button"
                    (click)="showProfile.set(!showProfile())"
                    [attr.aria-expanded]="showProfile()"
                    aria-haspopup="menu"
                    class="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <!-- Circle Avatar wrapper -->
                    <div
                      class="w-10 h-10 rounded-full bg-[#f0f4f9] border border-[#e1e9f1] flex items-center justify-center shrink-0 overflow-hidden group-hover:border-[#c5d6e6] transition-colors"
                    >
                      @if (session.user()?.avatarUrl && !avatarError()) {
                        <img
                          [src]="session.user()?.avatarUrl"
                          alt="Avatar"
                          referrerpolicy="no-referrer"
                          (error)="avatarError.set(true)"
                          class="w-full h-full object-cover"
                        />
                      } @else {
                        <svg
                          class="w-6 h-6 text-[#58cc02]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <circle cx="11" cy="8" r="3.5" />
                          <path d="M4 19a7 7 0 0 1 12.5-4.5" />
                          <path d="M16 16l2.5 2.5 4.5-4.5" />
                        </svg>
                      }
                    </div>

                    <!-- User Info text -->
                    <div class="text-left hidden sm:block">
                      <div
                        class="font-extrabold text-sm text-[#3c3c3c] leading-tight group-hover:text-slate-900 transition-colors"
                      >
                        {{ session.user()?.fullName }}
                      </div>
                      <div
                        class="text-[10px] font-bold text-[#777777] uppercase tracking-wider mt-0.5"
                      >
                        {{ roleLabel() }}
                      </div>
                    </div>
                  </button>

                  <!-- Profile Dropdown overlay -->
                  @if (showProfile()) {
                    <div
                      class="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-xl border-2 border-slate-100 p-5 z-50"
                      role="menu"
                      (click)="$event.stopPropagation()"
                    >
                      <div class="text-center mb-3">
                        <!-- Circle Avatar inside dropdown -->
                        <div
                          class="w-16 h-16 mx-auto rounded-full bg-[#f0f4f9] border border-[#e1e9f1] flex items-center justify-center shrink-0 overflow-hidden"
                        >
                          @if (session.user()?.avatarUrl && !avatarError()) {
                            <img
                              [src]="session.user()?.avatarUrl"
                              alt="Avatar"
                              referrerpolicy="no-referrer"
                              (error)="avatarError.set(true)"
                              class="w-full h-full object-cover"
                            />
                          } @else {
                            <svg
                              class="w-10 h-10 text-[#58cc02]"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2.2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            >
                              <circle cx="11" cy="8" r="3.5" />
                              <path d="M4 19a7 7 0 0 1 12.5-4.5" />
                              <path d="M16 16l2.5 2.5 4.5-4.5" />
                            </svg>
                          }
                        </div>
                        <p class="mt-2 font-extrabold text-slate-900">
                          {{ session.user()?.fullName ?? 'Người dùng' }}
                        </p>
                        <p class="text-xs text-slate-500">{{ session.user()?.email ?? '' }}</p>
                      </div>
                      <div class="border-t border-slate-100 pt-3 grid gap-1">
                        <a
                          [routerLink]="settingsRoute()"
                          (click)="showProfile.set(false)"
                          class="block px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg"
                        >
                          Hồ sơ
                        </a>
                        <a
                          [routerLink]="dashboardRoute()"
                          (click)="showProfile.set(false)"
                          class="block px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg"
                        >
                          Trang chủ
                        </a>
                        <button
                          (click)="logout()"
                          class="w-full text-left px-3 py-2 text-sm font-bold text-duo-red hover:bg-red-50 rounded-lg"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </header>

          <!-- Main content area -->
          <main class="flex-grow w-full px-4 sm:px-6 py-6 md:py-8 overflow-y-auto">
            <router-outlet />
          </main>
        </div>
      </div>
    } @else {
      <div class="min-h-screen bg-slate-50 flex flex-col font-sans">
        <!-- Student & Tutor Mobile Sidebar Backdrop & Drawer -->
        @if ((activeSegment() === 'tutor' || activeSegment() === 'student') && isMobileMenuOpen()) {
          <div
            class="fixed inset-0 bg-slate-900/40 z-40 md:hidden transition-opacity duration-300"
            (click)="isMobileMenuOpen.set(false)"
          ></div>
        }
        @if (activeSegment() === 'tutor' || activeSegment() === 'student') {
          <aside
            [class]="
              'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r-2 border-slate-100 transition-all duration-300 transform md:hidden w-64 ' +
              (isMobileMenuOpen() ? 'translate-x-0' : '-translate-x-full')
            "
          >
            <div
              class="p-4 border-b-2 border-slate-100 flex items-center justify-between h-[65px] shrink-0"
            >
              <a [routerLink]="dashboardRoute()" class="flex items-center gap-2 group">
                <div
                  class="w-9 h-9 rounded-xl bg-[#58cc02] flex items-center justify-center shadow-md border-b-3 border-[#4b9b04]"
                >
                  <svg
                    class="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                    />
                  </svg>
                </div>
                <span class="font-display font-bold text-xl text-[#58cc02]">EduMatch</span>
              </a>
              <button
                (click)="isMobileMenuOpen.set(false)"
                class="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav class="flex-grow p-3 overflow-y-auto space-y-1">
              @for (link of areaLinks(); track link.href) {
                <a
                  [routerLink]="link.href"
                  [ngClass]="isActive(link.href) ? 'bg-[#d7ffb8] text-[#3f8f01] font-black border-b-2 border-[#b8f582] active' : ''"
                  class="group flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 [&.active]:hover:bg-[#d7ffb8] transition-colors uppercase tracking-wide"
                >
                  <div
                    class="w-5 h-5 shrink-0 flex items-center justify-center text-slate-400 group-hover:text-slate-600 group-[.active]:group-hover:text-[#3f8f01] group-[.active]:text-[#3f8f01] transition-colors"
                  >
                    @switch (link.href) {
                      @case ('/tutor/dashboard') {
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"
                          />
                        </svg>
                      }
                      @case ('/tutor/requests') {
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      }
                      @case ('/tutor/classes') {
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                          />
                        </svg>
                      }
                      @case ('/student/dashboard') {
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"
                          />
                        </svg>
                      }
                      @case ('/student/discover') {
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      }
                      @case ('/student/learning-requests') {
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      }
                      @case ('/student/classes') {
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                          />
                        </svg>
                      }
                      @case ('/student/payments') {
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      }
                    }
                  </div>
                  <span class="truncate">{{ link.label }}</span>
                </a>
              }
            </nav>
          </aside>
        }

        <header
          class="sticky top-0 z-40 w-full bg-white border-b-2 border-slate-100 px-4 py-2.5 shadow-sm"
        >
          <div class="max-w-7xl mx-auto flex items-center justify-between">
            <div class="flex items-center gap-1.5 sm:gap-3">
              @if (activeSegment() === 'tutor' || activeSegment() === 'student') {
                <button
                  (click)="isMobileMenuOpen.set(true)"
                  class="p-2 rounded-xl hover:bg-slate-100 md:hidden text-slate-500 shrink-0"
                >
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              }
              <a [routerLink]="dashboardRoute()" class="flex items-center gap-2 group">
                <div
                  class="w-9 h-9 rounded-xl bg-[#58cc02] flex items-center justify-center shadow-md border-b-3 border-[#4b9b04]"
                >
                  <svg
                    class="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                    />
                  </svg>
                </div>
                <span class="font-display font-bold text-xl text-[#58cc02]">EduMatch</span>
              </a>
            </div>

            <nav class="hidden md:flex items-center gap-1">
              @for (link of areaLinks(); track link.href) {
                <a
                  [routerLink]="link.href"
                  [ngClass]="isActive(link.href) ? 'bg-[#d7ffb8] text-[#3f8f01] font-black border-b-2 border-[#b8f582] active' : ''"
                  class="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 [&.active]:hover:bg-[#d7ffb8] transition-colors uppercase tracking-wide"
                >
                  {{ link.label }}
                </a>
              }
            </nav>

            <div class="flex items-center gap-3">
              <!-- Notifications Bell -->
              <a
                [routerLink]="notificationsRoute()"
                [ngClass]="isActive(notificationsRoute()) ? 'bg-[#d7ffb8] active' : ''"
                class="group p-2 rounded-xl hover:bg-slate-100 [&.active]:hover:bg-[#d7ffb8] transition-colors relative"
              >
                <svg
                  class="w-6 h-6 text-slate-400 group-[.active]:text-[#3f8f01] transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                @if (unreadCount() > 0) {
                  <span
                    class="absolute top-1 right-1 w-4 h-4 bg-[#ff4b4b] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white"
                  >
                    {{ unreadCount() }}
                  </span>
                }
              </a>

              <!-- Chat Bubble -->
              <a
                [routerLink]="chatRoute()"
                [ngClass]="isActive(chatRoute()) ? 'bg-[#d7ffb8] active' : ''"
                class="group p-2 rounded-xl hover:bg-slate-100 [&.active]:hover:bg-[#d7ffb8] transition-colors relative"
              >
                <svg
                  class="w-6 h-6 text-slate-400 group-[.active]:text-[#3f8f01] transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                @if (unreadChatCount() > 0) {
                  <span
                    class="absolute top-1 right-1 w-4 h-4 bg-[#ff9600] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white"
                  >
                    {{ unreadChatCount() }}
                  </span>
                }
              </a>

              <!-- Vertical divider -->
              <div class="h-6 w-[1.5px] bg-[#e1e9f1] mx-2"></div>

              <!-- Avatar & Profile Dropdown Button -->
              <div class="relative" (click)="$event.stopPropagation()">
                <button
                  type="button"
                  (click)="showProfile.set(!showProfile())"
                  [attr.aria-expanded]="showProfile()"
                  aria-haspopup="menu"
                  class="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <!-- Circle Avatar wrapper -->
                  <div
                    class="w-10 h-10 rounded-full bg-[#f0f4f9] border border-[#e1e9f1] flex items-center justify-center shrink-0 overflow-hidden group-hover:border-[#c5d6e6] transition-colors"
                  >
                    @if (session.user()?.avatarUrl && !avatarError()) {
                      <img
                        [src]="session.user()?.avatarUrl"
                        alt="Avatar"
                        referrerpolicy="no-referrer"
                        (error)="avatarError.set(true)"
                        class="w-full h-full object-cover"
                      />
                    } @else {
                      <svg
                        class="w-6 h-6 text-[#58cc02]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <circle cx="11" cy="8" r="3.5" />
                        <path d="M4 19a7 7 0 0 1 12.5-4.5" />
                        <path d="M16 16l2.5 2.5 4.5-4.5" />
                      </svg>
                    }
                  </div>

                  <!-- User Info text -->
                  <div class="text-left hidden sm:block">
                    <div
                      class="font-extrabold text-sm text-[#3c3c3c] leading-tight group-hover:text-slate-900 transition-colors"
                    >
                      {{ session.user()?.fullName }}
                    </div>
                    <div
                      class="text-[10px] font-bold text-[#777777] uppercase tracking-wider mt-0.5"
                    >
                      {{ roleLabel() }}
                    </div>
                  </div>
                </button>

                <!-- Profile Dropdown overlay -->
                @if (showProfile()) {
                  <div
                    class="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-xl border-2 border-slate-100 p-5 z-50"
                    role="menu"
                    (click)="$event.stopPropagation()"
                  >
                    <div class="text-center mb-3">
                      <!-- Circle Avatar inside dropdown -->
                      <div
                        class="w-16 h-16 mx-auto rounded-full bg-[#f0f4f9] border border-[#e1e9f1] flex items-center justify-center shrink-0 overflow-hidden"
                      >
                        @if (session.user()?.avatarUrl && !avatarError()) {
                          <img
                            [src]="session.user()?.avatarUrl"
                            alt="Avatar"
                            referrerpolicy="no-referrer"
                            (error)="avatarError.set(true)"
                            class="w-full h-full object-cover"
                          />
                        } @else {
                          <svg
                            class="w-10 h-10 text-[#58cc02]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <circle cx="11" cy="8" r="3.5" />
                            <path d="M4 19a7 7 0 0 1 12.5-4.5" />
                            <path d="M16 16l2.5 2.5 4.5-4.5" />
                          </svg>
                        }
                      </div>
                      <p class="mt-2 font-extrabold text-slate-900">
                        {{ session.user()?.fullName ?? 'Người dùng' }}
                      </p>
                      <p class="text-xs text-slate-500">{{ session.user()?.email ?? '' }}</p>
                    </div>
                    <div class="border-t border-slate-100 pt-3 grid gap-1">
                      <a
                        [routerLink]="settingsRoute()"
                        (click)="showProfile.set(false)"
                        class="block px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg"
                      >
                        Hồ sơ
                      </a>
                      <a
                        [routerLink]="dashboardRoute()"
                        (click)="showProfile.set(false)"
                        class="block px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg"
                      >
                        Trang chủ
                      </a>
                      <button
                        (click)="logout()"
                        class="w-full text-left px-3 py-2 text-sm font-bold text-duo-red hover:bg-red-50 rounded-lg"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </header>

        <main class="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8">
          <router-outlet />
        </main>

        @if (globalToast(); as toast) {
          <div class="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border-2 border-amber-500 border-b-4 bg-amber-50 p-4 text-sm font-extrabold text-amber-900 shadow-xl flex items-start gap-3 animate-pulse">
            <span class="text-lg">🔔</span>
            <div class="flex-1 space-y-1">
              <p class="font-extrabold text-sm">{{ toast.title }}</p>
              <p class="text-xs text-amber-700 font-bold">{{ toast.message }}</p>
            </div>
            <button (click)="globalToast.set(null)" class="text-amber-500 hover:text-amber-800 font-black ml-2 text-base leading-none">✕</button>
          </div>
        }
      </div>
    }
  `,
})
export class WorkspaceShellComponent implements OnInit, OnDestroy {
  protected readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly notificationsApi = inject(NotificationsService);
  private readonly authApi = inject(AuthApiService);
  private readonly injector = inject(Injector);
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENV);

  protected readonly globalToast = signal<{ title: string; message: string } | null>(null);
  protected readonly showProfile = signal(false);
  protected readonly avatarError = signal(false);
  protected readonly unreadCount = signal(0);
  protected readonly unreadChatCount = signal(0);
  protected readonly userRole = UserRole;

  protected readonly isSidebarCollapsed = signal<boolean>(
    localStorage.getItem('admin_sidebar_collapsed') === 'true',
  );
  protected readonly isMobileMenuOpen = signal<boolean>(false);

  private readonly navigation = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
    ),
  );

  protected readonly activeSegment = computed(() => {
    this.navigation();
    return this.router.url.split('/').filter(Boolean)[0] ?? 'student';
  });

  protected readonly activeMenuName = computed(() => {
    const url = this.router.url.split('?')[0].split('#')[0];
    if (url.includes('/settings')) return 'Hồ sơ';
    if (url.includes('/notifications')) return 'Thông báo';
    if (url.includes('/chat')) return 'Trò chuyện';

    const links = this.areaLinks();
    const match = links.find((l) => this.isActive(l.href));
    
    if (match) return match.label;
    
    const role = this.session.role();
    if (role === UserRole.Tutor) return 'Gia sư';
    if (role === UserRole.Admin) return 'Quản trị';
    return 'Học viên';
  });

  protected isActive(href: string): boolean {
    const url = this.router.url.split('?')[0].split('#')[0];
    if (href === '/admin/dashboard') return url === '/admin/dashboard' || url === '/admin';
    if (href === '/student/dashboard') return url === '/student/dashboard' || url === '/student';
    if (href === '/tutor/dashboard') return url === '/tutor/dashboard' || url === '/tutor';
    return url.startsWith(href);
  }

  private signalrSub?: Subscription;

  ngOnInit(): void {
    setTimeout(() => {
      void this.loadUnreadCount();
      void this.loadUnreadChatCount();
      this.startRealtimeSubscriptions();
    }, 0);
  }

  private startRealtimeSubscriptions(): void {
    const signalrService = this.injector.get(SignalrService);

    // Subscribe to real-time events
    this.signalrSub = signalrService.notification$.subscribe(() => {
      this.unreadCount.update((count) => count + 1);
    });

    this.signalrSub.add(
      signalrService.message$.subscribe((message) => {
        if (message.senderId !== this.session.user()?.id) {
          void this.loadUnreadChatCount();
        }
      }),
    );

    this.signalrSub.add(
      signalrService.messagesRead$.subscribe(() => {
        void this.loadUnreadChatCount();
      }),
    );

    this.signalrSub.add(
      signalrService.notificationUpdated$.subscribe((data) => {
        if (data.unreadCount !== undefined) {
          this.unreadCount.set(data.unreadCount);
        } else {
          void this.loadUnreadCount();
        }
      }),
    );

    this.signalrSub.add(
      signalrService.chatUnreadUpdated$.subscribe((data) => {
        this.unreadChatCount.update((current) => Math.max(0, current - data.count));
      }),
    );

    this.signalrSub.add(
      signalrService.depositPolicyUpdated$.subscribe((data) => {
        if (this.session.role() === UserRole.Student) {
          this.globalToast.set({
            title: 'Chính sách đặt cọc thay đổi',
            message: data.message || 'Chính sách đặt cọc đã được cập nhật.'
          });
          setTimeout(() => {
            if (this.globalToast()?.message === (data.message || 'Chính sách đặt cọc đã được cập nhật.')) {
              this.globalToast.set(null);
            }
          }, 8000);
        }
      })
    );

    this.signalrSub.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => {
          this.isMobileMenuOpen.set(false);
        }),
    );
  }

  ngOnDestroy(): void {
    this.signalrSub?.unsubscribe();
  }

  protected toggleSidebar(): void {
    const newVal = !this.isSidebarCollapsed();
    this.isSidebarCollapsed.set(newVal);
    localStorage.setItem('admin_sidebar_collapsed', String(newVal));
  }

  @HostListener('document:click')
  protected closeProfileDropdown(): void {
    this.showProfile.set(false);
  }

  protected readonly initials = computed(() => {
    const name = this.session.user()?.fullName;
    if (!name) return '?';
    return name
      .split(' ')
      .slice(-2)
      .map((s) => s[0])
      .join('')
      .toUpperCase();
  });

  protected readonly roleLabel = computed(() => {
    const role = this.session.role();
    if (role === UserRole.Student) return 'HỌC VIÊN';
    if (role === UserRole.Tutor) return 'GIA SƯ';
    if (role === UserRole.Admin) return 'QUẢN TRỊ';
    return '';
  });

  protected notificationsRoute(): string {
    const role = this.session.role();
    if (role === UserRole.Tutor) return '/tutor/notifications';
    if (role === UserRole.Admin) return '/admin/notifications';
    return '/student/notifications';
  }

  protected chatRoute(): string {
    const role = this.session.role();
    if (role === UserRole.Tutor) return '/tutor/chat';
    if (role === UserRole.Admin) return '/admin/chat';
    return '/student/chat';
  }

  protected readonly areaLinks = computed(() => {
    this.navigation();
    const segment = this.router.url.split('/').filter(Boolean)[0] ?? 'student';
    const links: Record<string, Array<{ label: string; href: string }>> = {
      student: [
        { label: 'Trang chủ', href: '/student/dashboard' },
        { label: 'Tìm gia sư', href: '/student/discover' },
        { label: 'Yêu cầu', href: '/student/learning-requests' },
        { label: 'Lớp học', href: '/student/classes' },
        { label: 'Thanh toán', href: '/student/payments' },
      ],
      tutor: [
        { label: 'Trang chủ', href: '/tutor/dashboard' },
        { label: 'Yêu cầu', href: '/tutor/requests' },
        { label: 'Lớp dạy', href: '/tutor/classes' },
      ],
      admin: [
        { label: 'Trang chủ', href: '/admin/dashboard' },
        { label: 'Người dùng', href: '/admin/users' },
        { label: 'Môn học', href: '/admin/subjects' },
        { label: 'Chính sách cọc', href: '/admin/deposit-policy' },
        { label: 'Lớp học', href: '/admin/classes' },
        { label: 'Yêu cầu hủy', href: '/admin/cancellation-requests' },
        { label: 'Thanh toán', href: '/admin/payments' },
      ],
    };
    return links[segment] ?? links['student'];
  });

  protected settingsRoute(): string {
    if (this.session.role() === UserRole.Student) return '/student/settings';
    if (this.session.role() === UserRole.Tutor) return '/tutor/settings';
    return '/admin/settings';
  }

  protected dashboardRoute(): string {
    if (this.session.role() === UserRole.Tutor) return '/tutor/dashboard';
    if (this.session.role() === UserRole.Admin) return '/admin/dashboard';
    return '/student/dashboard';
  }

  async logout(): Promise<void> {
    const refreshToken = this.session.refreshToken();
    try {
      if (refreshToken) {
        await firstValueFrom(this.authApi.logout({ refreshToken }));
      }
    } catch {
      // Local logout should still proceed if the token is already invalid.
    }
    this.session.clear();
    await this.router.navigateByUrl('/auth/login');
  }

  private async loadUnreadCount(): Promise<void> {
    try {
      const response = await firstValueFrom(this.notificationsApi.getUnreadNotificationCount());
      this.unreadCount.set(response.data ?? 0);
    } catch {
      this.unreadCount.set(0);
    }
  }

  private async loadUnreadChatCount(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<number>>(`${this.env.apiBaseUrl}/api/Chat/unread-count`),
      );
      this.unreadChatCount.set(response.data ?? 0);
    } catch {
      this.unreadChatCount.set(0);
    }
  }
}
