import { Injectable, inject, signal, effect } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Subject } from 'rxjs';

import { MessageDto, NotificationDto } from '../../api/generated/client/models';
import { SessionService } from '../auth/session';
import { APP_ENV } from '../config/app-env';

@Injectable({ providedIn: 'root' })
export class SignalrService {
  private readonly env = inject(APP_ENV);
  private readonly session = inject(SessionService);

  private notificationConnection: HubConnection | null = null;
  private chatConnection: HubConnection | null = null;

  // Subjects for other services/components to subscribe to
  readonly notification$ = new Subject<NotificationDto>();
  readonly message$ = new Subject<MessageDto>();
  readonly messagesRead$ = new Subject<{ readBy: number }>();
  readonly notificationUpdated$ = new Subject<{ unreadCount?: number }>();
  readonly chatUnreadUpdated$ = new Subject<{ readByPartnerId: number; count: number }>();

  // Connection status signals
  readonly notificationConnected = signal(false);
  readonly chatConnected = signal(false);

  constructor() {
    // Automatically manage connection based on authentication state
    effect(() => {
      const isAuthenticated = this.session.isAuthenticated();
      const token = this.session.accessToken();

      if (isAuthenticated && token) {
        void this.startConnections(token);
      } else {
        void this.stopConnections();
      }
    });
  }

  private async startConnections(token: string): Promise<void> {
    await Promise.all([
      this.startNotificationConnection(token),
      this.startChatConnection(token),
    ]);
  }

  private async stopConnections(): Promise<void> {
    await Promise.all([
      this.stopNotificationConnection(),
      this.stopChatConnection(),
    ]);
  }

  private async startNotificationConnection(token: string): Promise<void> {
    if (this.notificationConnection) {
      await this.stopNotificationConnection();
    }

    const url = `${this.env.hubBaseUrl}${this.env.realtime.notifications}`;
    this.notificationConnection = new HubConnectionBuilder()
      .withUrl(url, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    this.notificationConnection.on('ReceiveNotification', (notification: NotificationDto) => {
      this.notification$.next(notification);
    });

    try {
      await this.notificationConnection.start();
      this.notificationConnected.set(true);
      console.log('SignalR: Notification hub connected');
    } catch (err) {
      console.error('SignalR: Failed to connect to Notification hub', err);
    }

    this.notificationConnection.onclose(() => {
      this.notificationConnected.set(false);
    });
  }

  private async stopNotificationConnection(): Promise<void> {
    if (!this.notificationConnection) return;
    try {
      await this.notificationConnection.stop();
    } catch (err) {
      console.error('SignalR: Error stopping Notification hub connection', err);
    } finally {
      this.notificationConnection = null;
      this.notificationConnected.set(false);
    }
  }

  private async startChatConnection(token: string): Promise<void> {
    if (this.chatConnection) {
      await this.stopChatConnection();
    }

    const url = `${this.env.hubBaseUrl}${this.env.realtime.chat}`;
    this.chatConnection = new HubConnectionBuilder()
      .withUrl(url, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    this.chatConnection.on('ReceiveMessage', (message: MessageDto) => {
      this.message$.next(message);
    });

    this.chatConnection.on('MessagesRead', (data: { readBy: number }) => {
      this.messagesRead$.next(data);
    });

    try {
      await this.chatConnection.start();
      this.chatConnected.set(true);
      console.log('SignalR: Chat hub connected');
    } catch (err) {
      console.error('SignalR: Failed to connect to Chat hub', err);
    }

    this.chatConnection.onclose(() => {
      this.chatConnected.set(false);
    });
  }

  private async stopChatConnection(): Promise<void> {
    if (!this.chatConnection) return;
    try {
      await this.chatConnection.stop();
    } catch (err) {
      console.error('SignalR: Error stopping Chat hub connection', err);
    } finally {
      this.chatConnection = null;
      this.chatConnected.set(false);
    }
  }

  // Invocation methods
  async sendMessage(receiverId: number, content: string): Promise<void> {
    if (!this.chatConnection || !this.chatConnected()) {
      throw new Error('Kết nối chat chưa được thiết lập.');
    }
    await this.chatConnection.invoke('SendMessage', { receiverId, content });
  }

  async markAsRead(partnerId: number): Promise<void> {
    if (!this.chatConnection || !this.chatConnected()) {
      return;
    }
    await this.chatConnection.invoke('MarkAsRead', partnerId);
  }
}
