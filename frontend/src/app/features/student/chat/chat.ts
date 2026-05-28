import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';

import { ConversationSummaryDto, MessageDto } from '../../../api/generated/client/models';
import { ChatService, UsersService } from '../../../api/generated/client/services';
import { SessionService } from '../../../core/auth/session';
import { SignalrService } from '../../../core/realtime/signalr.service';
import { getApiErrorMessage } from '../../../core/http/api-error';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import { formatDateTime } from '../../../shared/utils/api-ui';

export interface ChatConversation extends ConversationSummaryDto {
  isTemporary?: boolean;
}

@Component({
  selector: 'app-chat-page',
  imports: [FormsModule, MascotComponent],
  template: `
    <div class="flex gap-0 h-[calc(100vh-120px)] rounded-2xl overflow-hidden border-2 border-slate-100 bg-white">
      <aside class="w-72 border-r-2 border-slate-100 flex flex-col shrink-0 hidden md:flex">
        <div class="p-4 border-b border-slate-100">
          <h2 class="font-display text-lg font-black text-slate-900">Tin nhắn</h2>
          <input type="text" [(ngModel)]="searchQuery" placeholder="Tìm kiếm..."
                 class="tactile-input w-full text-xs font-semibold mt-2" />
        </div>
        <div class="flex-1 overflow-y-auto">
          @for (conversation of filteredConversations(); track conversation.partnerId) {
            <button (click)="selectConversation(conversation.partnerId)"
                    class="w-full text-left p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50"
                    [class.bg-blue-50]="activePartnerId() === conversation.partnerId">
              @if (conversation.partnerAvatar) {
                <img [src]="conversation.partnerAvatar" class="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-100" />
              } @else {
                <div class="w-10 h-10 rounded-full bg-duo-blue text-white flex items-center justify-center font-black shrink-0 text-sm">
                  {{ initials(conversation.partnerName) }}
                </div>
              }
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="font-extrabold text-sm text-slate-900 truncate">{{ conversation.partnerName }}</p>
                  @if ((conversation.unreadCount ?? 0) > 0) {
                    <span class="w-5 h-5 bg-duo-red text-white text-[10px] font-black rounded-full flex items-center justify-center shrink-0">
                      {{ conversation.unreadCount }}
                    </span>
                  }
                </div>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-extrabold text-slate-600">
                    {{ getRoleLabel(conversation.partnerRole) }}
                  </span>
                  @if (conversation.partnerCode) {
                    <span class="text-[10px] font-extrabold text-slate-400">
                      #{{ conversation.partnerCode }}
                    </span>
                  }
                </div>
                <p class="text-xs text-slate-400 truncate mt-1">{{ conversation.lastMessage }}</p>
              </div>
            </button>
          }
        </div>
      </aside>

      <div class="flex-1 flex flex-col">
        @if (activeConversation(); as conversation) {
          <div class="p-4 border-b-2 border-slate-100 flex items-center gap-3">
            @if (conversation.partnerAvatar) {
              <img [src]="conversation.partnerAvatar" class="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-100" />
            } @else {
              <div class="w-9 h-9 rounded-full bg-duo-blue text-white flex items-center justify-center font-black shrink-0 text-xs">
                {{ initials(conversation.partnerName) }}
              </div>
            }
            <div>
              <div class="flex items-center gap-2">
                <p class="font-extrabold text-sm text-slate-900">{{ conversation.partnerName }}</p>
                @if (conversation.partnerCode) {
                  <span class="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-extrabold text-slate-500">
                    #{{ conversation.partnerCode }}
                  </span>
                }
              </div>
              <p class="text-xs text-slate-500 font-bold">{{ getRoleLabel(conversation.partnerRole) }}</p>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            @for (message of messages(); track message.id) {
              <div class="flex" [class.justify-end]="message.senderId === session.user()?.id">
                <div class="max-w-[75%] rounded-2xl px-4 py-2.5"
                     [class]="message.senderId === session.user()?.id
                       ? 'bg-duo-blue text-white rounded-br-md'
                       : 'bg-slate-100 text-slate-800 rounded-bl-md'">
                  <p class="text-sm">{{ message.content }}</p>
                  <p class="text-[10px] mt-1 text-right" [class]="message.senderId === session.user()?.id ? 'text-blue-200' : 'text-slate-400'">
                    {{ dateTime(message.createdAt) }}
                  </p>
                </div>
              </div>
            }
            @if (!messages().length) {
              <div class="text-center py-12 text-sm font-bold text-slate-500">Chưa có tin nhắn.</div>
            }
          </div>

          <div class="p-4 border-t-2 border-slate-100 flex gap-3 items-center">
            <textarea [(ngModel)]="newMessageContent" (keydown.enter)="onEnterKey($event)"
                      placeholder="Nhập tin nhắn..."
                      class="tactile-input flex-1 min-h-[44px] max-h-[120px] resize-none py-2.5 px-4 text-xs font-semibold"
                      [disabled]="isSending()"></textarea>
            <button (click)="sendMessage()" [disabled]="!newMessageContent.trim() || isSending()"
                    class="tactile-button-blue px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all">
              Gửi ➔
            </button>
          </div>
        } @else {
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <app-mascot type="eduLogo" [size]="100" />
              <p class="mt-4 font-extrabold text-slate-700">Chọn cuộc trò chuyện</p>
              @if (errorMessage()) {
                <p class="text-sm text-duo-red font-bold mt-3">{{ errorMessage() }}</p>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class ChatPage implements OnInit, OnDestroy {
  protected readonly session = inject(SessionService);
  searchQuery = '';
  conversations = signal<ChatConversation[]>([]);
  messages = signal<MessageDto[]>([]);
  activePartnerId = signal<number | null>(null);
  errorMessage = signal('');

  // Input states
  newMessageContent = '';
  isSending = signal(false);

  private readonly chatApi = inject(ChatService);
  private readonly usersService = inject(UsersService);
  private readonly route = inject(ActivatedRoute);
  private readonly signalrService = inject(SignalrService);

  private signalrSub?: Subscription;

  activeConversation = computed(() =>
    this.conversations().find((conversation) => conversation.partnerId === this.activePartnerId()) ?? null,
  );

  filteredConversations = computed(() => {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.conversations();
    return this.conversations().filter((conversation) =>
      `${conversation.partnerName ?? ''} ${conversation.lastMessage ?? ''}`.toLowerCase().includes(query),
    );
  });

  ngOnInit(): void {
    void this.loadConversations();

    // Listen to real-time chat messages
    this.signalrSub = this.signalrService.message$.subscribe((message) => {
      const currentPartnerId = this.activePartnerId();
      if (
        currentPartnerId &&
        ((message.senderId === currentPartnerId && message.receiverId === this.session.user()?.id) ||
         (message.senderId === this.session.user()?.id && message.receiverId === currentPartnerId))
      ) {
        this.messages.update((list) => [...list, message]);
        // If message is from partner, mark it as read immediately
        if (message.senderId === currentPartnerId) {
          void this.signalrService.markAsRead(currentPartnerId);
        }
      }

      this.updateConversationSummary(message);
    });

    // Listen to read receipt signals
    this.signalrSub.add(
      this.signalrService.messagesRead$.subscribe((data) => {
        if (data.readBy === this.activePartnerId()) {
          this.conversations.update((list) =>
            list.map((c) => (c.partnerId === data.readBy ? { ...c, unreadCount: 0 } : c))
          );
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.signalrSub?.unsubscribe();
  }

  async selectConversation(partnerId?: number): Promise<void> {
    if (!partnerId) return;
    this.activePartnerId.set(partnerId);
    this.errorMessage.set('');

    // Pre-emptively add a placeholder conversation if it does not exist, so the UI instantly switches to the chat view
    const exists = this.conversations().some((c) => c.partnerId === partnerId);
    if (!exists) {
      const tempPlaceholder: ChatConversation = {
        partnerId: partnerId,
        partnerName: 'Đang tải...',
        lastMessage: 'Chưa có tin nhắn',
        unreadCount: 0,
        isTemporary: true
      };
      this.conversations.update((list) => [tempPlaceholder, ...list]);
      // Load actual user details asynchronously
      void this.loadAndAddTemporaryConversation(partnerId);
    }

    try {
      const response = await firstValueFrom(this.chatApi.getChatHistory(partnerId, 1, 30));
      this.messages.set(response.data ?? []);
      // Mark as read in backend using SignalR
      void this.signalrService.markAsRead(partnerId);

      // Retrieve the current conversation's unreadCount before clearing it, and emit it optimistically
      const conv = this.conversations().find(c => c.partnerId === partnerId);
      const unreadCountInConv = conv?.unreadCount ?? 0;
      if (unreadCountInConv > 0) {
        this.signalrService.chatUnreadUpdated$.next({ readByPartnerId: partnerId, count: unreadCountInConv });
      }

      // Reset unread count locally
      this.conversations.update((list) =>
        list.map((c) => (c.partnerId === partnerId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được lịch sử chat.'));
    }
  }

  async sendMessage(): Promise<void> {
    const content = this.newMessageContent.trim();
    if (!content || !this.activePartnerId()) return;

    this.isSending.set(true);
    try {
      await this.signalrService.sendMessage(this.activePartnerId()!, content);
      this.newMessageContent = '';
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không gửi được tin nhắn.'));
    } finally {
      this.isSending.set(false);
    }
  }

  onEnterKey(event: Event): void {
    event.preventDefault();
    void this.sendMessage();
  }

  initials(name?: string | null): string {
    if (!name) return '?';
    return name.split(' ').slice(-2).map((part) => part[0]).join('').toUpperCase();
  }

  getRoleLabel(role?: string | null): string {
    if (role === 'Student') return 'Học viên';
    if (role === 'Tutor') return 'Gia sư';
    if (role === 'Admin') return 'Quản trị viên';
    return role || 'Người dùng';
  }

  dateTime(value?: Date | null): string {
    return formatDateTime(value);
  }

  private async loadConversations(): Promise<void> {
    try {
      const response = await firstValueFrom(this.chatApi.getConversations());
      this.conversations.set(response.data ?? []);
      const partnerId = Number(this.route.snapshot.queryParamMap.get('partnerId'));
      const initialPartner = partnerId || this.conversations()[0]?.partnerId;
      if (initialPartner) {
        await this.selectConversation(initialPartner);
      }
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được danh sách chat.'));
    }
  }

  private async loadAndAddTemporaryConversation(partnerId: number): Promise<void> {
    try {
      const userResponse = await firstValueFrom(this.usersService.getUserById(partnerId));
      const user = userResponse.data;
      if (user) {
        this.conversations.update((list) =>
          list.map((c) =>
            c.partnerId === partnerId
              ? {
                  ...c,
                  partnerName: user.fullName,
                  partnerAvatar: user.avatarUrl,
                  partnerRole: user.role,
                  partnerCode: user.code,
                  isTemporary: false,
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error('Failed to load user details for temporary conversation', err);
      // Fallback: set a generic name if loading fails
      this.conversations.update((list) =>
        list.map((c) =>
          c.partnerId === partnerId && c.partnerName === 'Đang tải...'
            ? { ...c, partnerName: `Người dùng #${partnerId}`, isTemporary: false }
            : c
        )
      );
    }
  }

  private updateConversationSummary(message: MessageDto): void {
    this.conversations.update((list) => {
      const partnerId = message.senderId === this.session.user()?.id ? message.receiverId : message.senderId;
      if (!partnerId) return list;
      const index = list.findIndex((c) => c.partnerId === partnerId);
      const isFromActivePartner = partnerId === this.activePartnerId();
      const isIncoming = message.senderId !== this.session.user()?.id;

      if (index !== -1) {
        const updated = { ...list[index] };
        updated.lastMessage = message.content;
        updated.lastMessageAt = message.createdAt;
        if (isIncoming && !isFromActivePartner) {
          updated.unreadCount = (updated.unreadCount ?? 0) + 1;
        }

        const newList = [...list];
        newList.splice(index, 1);
        return [updated, ...newList];
      } else {
        // If not in the list (first message), dynamically add it!
        const tempPlaceholder: ChatConversation = {
          partnerId: partnerId,
          partnerName: 'Đang tải...',
          lastMessage: message.content,
          lastMessageAt: message.createdAt,
          unreadCount: isIncoming && !isFromActivePartner ? 1 : 0,
          isTemporary: true
        };
        // Load profile details asynchronously
        void this.loadAndAddTemporaryConversation(partnerId);
        return [tempPlaceholder, ...list];
      }
    });
  }
}
