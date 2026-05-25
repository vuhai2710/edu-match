import { Component, signal } from '@angular/core';
import { INITIAL_NOTIFICATIONS } from '../../../shared/fixtures/mock-data';
import { NotificationItem } from '../../../shared/models/app.models';

@Component({
  selector: 'app-notification-center-page',
  imports: [],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-display text-2xl font-black text-slate-900">🔔 Thông báo</h1>
          <p class="text-sm text-slate-500 mt-1">{{ unreadCount() }} thông báo chưa đọc</p>
        </div>
        <button (click)="markAllRead()" class="text-sm font-bold text-duo-blue hover:underline">
          Đánh dấu đã đọc tất cả
        </button>
      </div>

      <!-- Filter Tabs -->
      <div class="flex gap-2">
        @for (tab of tabs; track tab.key) {
          <button (click)="activeTab.set(tab.key)"
                  [class]="activeTab() === tab.key
                    ? 'bg-duo-blue text-white border-b-2 border-duo-blue-dark'
                    : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'"
                  class="px-4 py-2 rounded-xl text-sm font-bold transition-colors">
            {{ tab.label }}
          </button>
        }
      </div>

      <!-- Notification List -->
      <div class="space-y-3">
        @for (noti of filteredNotifications(); track noti.id) {
          <div class="tactile-card p-4 flex items-start gap-4 transition-all"
               [class.border-l-4]="noti.isUnread"
               [class.border-l-duo-blue]="noti.isUnread">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                 [class]="noti.category === 'action' ? 'bg-blue-100'
                        : noti.category === 'news' ? 'bg-amber-100'
                        : 'bg-slate-100'">
              {{ noti.category === 'action' ? '⚡' : noti.category === 'news' ? '📰' : '⚙️' }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-extrabold text-sm text-slate-900 truncate">{{ noti.title }}</h3>
                @if (noti.isUnread) {
                  <span class="w-2 h-2 rounded-full bg-duo-blue shrink-0"></span>
                }
              </div>
              <p class="text-sm text-slate-500 mt-1 line-clamp-2">{{ noti.description }}</p>
              <div class="flex items-center justify-between mt-2">
                <span class="text-xs text-slate-400">{{ noti.timeAgo }}</span>
                @if (noti.isUnread) {
                  <button (click)="markRead(noti)" class="text-xs font-bold text-duo-blue hover:underline">
                    Đánh dấu đã đọc
                  </button>
                }
              </div>
            </div>
          </div>
        }

        @if (filteredNotifications().length === 0) {
          <div class="text-center py-12">
            <p class="text-4xl mb-3">📭</p>
            <p class="font-extrabold text-slate-700">Không có thông báo nào</p>
            <p class="text-sm text-slate-500 mt-1">Thay đổi bộ lọc để xem thêm</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class NotificationCenterPage {
  activeTab = signal<'all' | 'action' | 'read'>('all');
  notifications = signal<NotificationItem[]>([...INITIAL_NOTIFICATIONS]);

  readonly tabs = [
    { key: 'all' as const, label: '📋 Tất cả' },
    { key: 'action' as const, label: '⚡ Cần hành động' },
    { key: 'read' as const, label: '✅ Đã đọc' },
  ];

  filteredNotifications() {
    const tab = this.activeTab();
    const list = this.notifications();
    if (tab === 'action') return list.filter(n => n.category === 'action' && n.isUnread);
    if (tab === 'read') return list.filter(n => !n.isUnread);
    return list;
  }

  unreadCount() {
    return this.notifications().filter(n => n.isUnread).length;
  }

  markRead(noti: NotificationItem) {
    this.notifications.update(list =>
      list.map(n => n.id === noti.id ? { ...n, isUnread: false } : n)
    );
  }

  markAllRead() {
    this.notifications.update(list => list.map(n => ({ ...n, isUnread: false })));
  }
}
