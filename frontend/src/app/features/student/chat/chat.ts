import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ConversationSummaryDto, MessageDto } from '../../../api/generated/client/models';
import { ChatService } from '../../../api/generated/client/services';
import { SessionService } from '../../../core/auth/session';
import { getApiErrorMessage } from '../../../core/http/api-error';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import { formatDateTime } from '../../../shared/utils/api-ui';

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
              <div class="w-10 h-10 rounded-full bg-duo-blue text-white flex items-center justify-center font-black shrink-0">
                {{ initials(conversation.partnerName) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="font-extrabold text-sm text-slate-900 truncate">{{ conversation.partnerName }}</p>
                  @if ((conversation.unreadCount ?? 0) > 0) {
                    <span class="w-5 h-5 bg-duo-red text-white text-[10px] font-black rounded-full flex items-center justify-center shrink-0">
                      {{ conversation.unreadCount }}
                    </span>
                  }
                </div>
                <p class="text-xs text-slate-400 truncate mt-0.5">{{ conversation.lastMessage }}</p>
              </div>
            </button>
          }
        </div>
      </aside>

      <div class="flex-1 flex flex-col">
        @if (activeConversation(); as conversation) {
          <div class="p-4 border-b-2 border-slate-100 flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-duo-blue text-white flex items-center justify-center font-black">
              {{ initials(conversation.partnerName) }}
            </div>
            <div>
              <p class="font-extrabold text-sm text-slate-900">{{ conversation.partnerName }}</p>
              <p class="text-xs text-slate-500 font-bold">{{ conversation.partnerRole || 'Người dùng' }}</p>
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

          <div class="p-4 border-t-2 border-slate-100">
            <div class="rounded-2xl bg-slate-50 border-2 border-slate-100 px-4 py-3 text-sm font-bold text-slate-500">
              Gửi tin nhắn sẽ được bật ở phase SignalR. REST hiện chỉ hỗ trợ danh sách và lịch sử chat.
            </div>
          </div>
        } @else {
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <app-mascot type="eduLogo" [size]="100" />
              <p class="mt-4 font-extrabold text-slate-700">Chọn cuộc trò chuyện</p>
              <p class="text-sm text-slate-500 mt-1">Danh sách chat được tải từ API REST.</p>
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
export class ChatPage implements OnInit {
  protected readonly session = inject(SessionService);
  searchQuery = '';
  conversations = signal<ConversationSummaryDto[]>([]);
  messages = signal<MessageDto[]>([]);
  activePartnerId = signal<number | null>(null);
  errorMessage = signal('');

  private readonly chatApi = inject(ChatService);
  private readonly route = inject(ActivatedRoute);

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
  }

  async selectConversation(partnerId?: number): Promise<void> {
    if (!partnerId) return;
    this.activePartnerId.set(partnerId);
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(this.chatApi.getChatHistory(partnerId, 1, 30));
      this.messages.set(response.data ?? []);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được lịch sử chat.'));
    }
  }

  initials(name?: string | null): string {
    if (!name) return '?';
    return name.split(' ').slice(-2).map((part) => part[0]).join('').toUpperCase();
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
}
