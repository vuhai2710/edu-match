import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { NotificationDto } from '../../../api/generated/client/models';
import { NotificationsService } from '../../../api/generated/client/services';
import { getApiErrorMessage } from '../../../core/http/api-error';
import { formatDateTime, notificationRoute } from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-notification-center-page',
  imports: [],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h1 class="font-display text-2xl font-black text-slate-900">Thông báo</h1>
          <p class="text-sm text-slate-500 mt-1">{{ unreadCount() }} thông báo chưa đọc</p>
        </div>
        <button (click)="markAllRead()" [disabled]="isWorking()" class="text-sm font-bold text-duo-blue hover:underline disabled:opacity-50">
          Đánh dấu đã đọc tất cả
        </button>
      </div>

      <div class="flex gap-2">
        @for (tab of tabs; track tab.label) {
          <button (click)="setFilter(tab.value)"
                  [class]="filter() === tab.value
                    ? 'bg-duo-blue text-white border-b-2 border-duo-blue-dark'
                    : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'"
                  class="px-4 py-2 rounded-xl text-sm font-bold transition-colors">
            {{ tab.label }}
          </button>
        }
      </div>

      @if (errorMessage()) {
        <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">{{ errorMessage() }}</p>
      }

      <div class="space-y-3">
        @for (noti of notifications(); track noti.id) {
          <button (click)="openNotification(noti)"
                  class="tactile-card p-4 w-full text-left flex items-start gap-4 transition-all"
                  [class.border-l-4]="!noti.isRead"
                  [class.border-l-duo-blue]="!noti.isRead">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 bg-blue-100 text-duo-blue font-black">
              !
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-extrabold text-sm text-slate-900 truncate">{{ noti.title }}</h3>
                @if (!noti.isRead) {
                  <span class="w-2 h-2 rounded-full bg-duo-blue shrink-0"></span>
                }
              </div>
              <p class="text-sm text-slate-500 mt-1 line-clamp-2">{{ noti.content }}</p>
              <div class="flex items-center justify-between mt-2">
                <span class="text-xs text-slate-400">{{ dateTime(noti.createdAt) }}</span>
                @if (!noti.isRead) {
                  <span class="text-xs font-bold text-duo-blue">Cần đọc</span>
                }
              </div>
            </div>
          </button>
        }

        @if (!notifications().length) {
          <div class="text-center py-12">
            <p class="font-extrabold text-slate-700">Không có thông báo nào</p>
            <p class="text-sm text-slate-500 mt-1">Thay đổi bộ lọc để xem thêm</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class NotificationCenterPage implements OnInit {
  notifications = signal<NotificationDto[]>([]);
  unreadCount = signal(0);
  filter = signal<boolean | null>(null);
  isWorking = signal(false);
  errorMessage = signal('');

  readonly tabs = [
    { label: 'Tất cả', value: null },
    { label: 'Chưa đọc', value: false },
    { label: 'Đã đọc', value: true },
  ];

  private readonly notificationsApi = inject(NotificationsService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.loadNotifications();
  }

  setFilter(value: boolean | null): void {
    this.filter.set(value);
    void this.loadNotifications();
  }

  async openNotification(notification: NotificationDto): Promise<void> {
    if (!notification.isRead && notification.id) {
      await this.markRead(notification.id);
    }
    await this.router.navigateByUrl(notificationRoute(notification));
  }

  async markAllRead(): Promise<void> {
    this.isWorking.set(true);
    try {
      await firstValueFrom(this.notificationsApi.markAllNotificationsAsRead());
      await this.loadNotifications();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không đánh dấu được thông báo.'));
    } finally {
      this.isWorking.set(false);
    }
  }

  dateTime(value?: Date | null): string {
    return formatDateTime(value);
  }

  private async markRead(id: number): Promise<void> {
    try {
      await firstValueFrom(this.notificationsApi.markNotificationAsRead(id));
    } catch {
      return;
    }
  }

  private async loadNotifications(): Promise<void> {
    this.errorMessage.set('');
    try {
      const [listResponse, countResponse] = await Promise.all([
        firstValueFrom(this.notificationsApi.getNotifications(this.filter() ?? undefined, 1, 30, undefined, 'createdAt', 'desc')),
        firstValueFrom(this.notificationsApi.getUnreadNotificationCount()),
      ]);
      this.notifications.set(listResponse.data?.items ?? []);
      this.unreadCount.set(countResponse.data ?? 0);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được thông báo.'));
    }
  }
}
