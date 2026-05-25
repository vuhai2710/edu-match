import { Component, signal, computed, ElementRef, viewChild, afterNextRender } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import { MASCOT_URLS } from '../../../shared/fixtures/mascot-urls';

interface ChatMessage {
  id: string;
  sender: 'user' | 'other';
  text: string;
  time: string;
}

interface ChatChannel {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  unread: number;
  messages: ChatMessage[];
}

@Component({
  selector: 'app-chat-page',
  imports: [FormsModule, MascotComponent],
  template: `
    <div class="flex gap-0 h-[calc(100vh-120px)] rounded-2xl overflow-hidden border-2 border-slate-100 bg-white">
      <!-- Channel Sidebar -->
      <aside class="w-72 border-r-2 border-slate-100 flex flex-col shrink-0 hidden md:flex">
        <div class="p-4 border-b border-slate-100">
          <h2 class="font-display text-lg font-black text-slate-900">💬 Tin nhắn</h2>
          <input type="text" [(ngModel)]="searchQuery" placeholder="Tìm kiếm..."
                 class="tactile-input w-full text-xs font-semibold mt-2" />
        </div>
        <div class="flex-1 overflow-y-auto">
          @for (ch of channels(); track ch.id) {
            <button (click)="selectChannel(ch.id)"
                    class="w-full text-left p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50"
                    [class.bg-blue-50]="activeChannelId() === ch.id">
              <img [src]="ch.avatar" [alt]="ch.name" referrerpolicy="no-referrer"
                   class="w-10 h-10 rounded-full object-cover border-2 border-slate-100 shrink-0" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="font-extrabold text-sm text-slate-900 truncate">{{ ch.name }}</p>
                  @if (ch.unread > 0) {
                    <span class="w-5 h-5 bg-duo-red text-white text-[10px] font-black rounded-full flex items-center justify-center shrink-0">
                      {{ ch.unread }}
                    </span>
                  }
                </div>
                <p class="text-xs text-slate-400 truncate mt-0.5">{{ ch.lastMessage }}</p>
              </div>
            </button>
          }
        </div>
      </aside>

      <!-- Chat Area -->
      <div class="flex-1 flex flex-col">
        @if (activeChannel(); as ch) {
          <!-- Header -->
          <div class="p-4 border-b-2 border-slate-100 flex items-center gap-3">
            <img [src]="ch.avatar" [alt]="ch.name" referrerpolicy="no-referrer"
                 class="w-9 h-9 rounded-full object-cover border-2 border-slate-100" />
            <div>
              <p class="font-extrabold text-sm text-slate-900">{{ ch.name }}</p>
              <p class="text-xs text-green-500 font-bold">🟢 Đang hoạt động</p>
            </div>
          </div>

          <!-- Messages -->
          <div class="flex-1 overflow-y-auto p-4 space-y-3" #messagesContainer>
            @for (msg of ch.messages; track msg.id) {
              <div class="flex" [class.justify-end]="msg.sender === 'user'">
                <div class="max-w-[75%] rounded-2xl px-4 py-2.5"
                     [class]="msg.sender === 'user'
                       ? 'bg-duo-blue text-white rounded-br-md'
                       : 'bg-slate-100 text-slate-800 rounded-bl-md'">
                  <p class="text-sm">{{ msg.text }}</p>
                  <p class="text-[10px] mt-1 text-right" [class]="msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'">
                    {{ msg.time }}
                  </p>
                </div>
              </div>
            }
            @if (isTyping()) {
              <div class="flex">
                <div class="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div class="flex gap-1">
                    <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay:0s"></span>
                    <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay:0.15s"></span>
                    <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay:0.3s"></span>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Input -->
          <div class="p-4 border-t-2 border-slate-100">
            <div class="flex gap-2">
              <input type="text" [(ngModel)]="messageInput" placeholder="Nhập tin nhắn..."
                     (keydown.enter)="sendMessage()"
                     class="tactile-input flex-1 text-sm font-semibold" />
              <button (click)="sendMessage()"
                      class="tactile-button-blue px-5 py-2 rounded-xl font-extrabold text-sm">
                Gửi ➤
              </button>
            </div>
          </div>
        } @else {
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <app-mascot type="eduLogo" [size]="100" />
              <p class="mt-4 font-extrabold text-slate-700">Chọn cuộc trò chuyện</p>
              <p class="text-sm text-slate-500 mt-1">Bắt đầu nhắn tin với gia sư hoặc học viên</p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class ChatPage {
  searchQuery = '';
  messageInput = '';
  activeChannelId = signal('ch-1');
  isTyping = signal(false);
  messagesContainer = viewChild<ElementRef>('messagesContainer');

  channels = signal<ChatChannel[]>([
    {
      id: 'ch-1', name: 'Nguyễn Minh Anh', avatar: MASCOT_URLS.femaleTutorMinhAnh,
      lastMessage: 'Buổi học hôm nay rất vui!', unread: 2,
      messages: [
        { id: 'm1', sender: 'other', text: 'Chào bạn! Mình là Minh Anh, gia sư Toán của bạn 😊', time: '14:00' },
        { id: 'm2', sender: 'user', text: 'Chào cô! Em muốn hỏi về lịch học tuần sau ạ', time: '14:05' },
        { id: 'm3', sender: 'other', text: 'Được chứ! Tuần sau mình có thể dạy thứ 3 và thứ 5 nhé', time: '14:08' },
        { id: 'm4', sender: 'other', text: 'Buổi học hôm nay rất vui!', time: '14:10' },
      ],
    },
    {
      id: 'ch-2', name: 'Thầy Hoài Nam', avatar: MASCOT_URLS.tutorMinhTriet,
      lastMessage: 'Nhớ làm bài tập trang 45 nhé!', unread: 0,
      messages: [
        { id: 'm5', sender: 'other', text: 'Nhớ làm bài tập trang 45 nhé!', time: '10:30' },
        { id: 'm6', sender: 'user', text: 'Dạ vâng thầy ạ!', time: '10:35' },
      ],
    },
    {
      id: 'ch-3', name: 'Hỗ trợ EduMatch', avatar: MASCOT_URLS.eduLogo,
      lastMessage: 'Cảm ơn bạn đã liên hệ!', unread: 1,
      messages: [
        { id: 'm7', sender: 'other', text: 'Chào bạn! Đây là kênh hỗ trợ EduMatch 🤖', time: '09:00' },
        { id: 'm8', sender: 'other', text: 'Cảm ơn bạn đã liên hệ!', time: '09:01' },
      ],
    },
  ]);

  activeChannel = computed(() => {
    return this.channels().find(c => c.id === this.activeChannelId()) ?? null;
  });

  selectChannel(id: string) {
    this.activeChannelId.set(id);
    this.channels.update(list =>
      list.map(c => c.id === id ? { ...c, unread: 0 } : c)
    );
  }

  sendMessage() {
    const text = this.messageInput.trim();
    if (!text) return;
    const chId = this.activeChannelId();
    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newMsg: ChatMessage = { id: `m-${Date.now()}`, sender: 'user', text, time };

    this.channels.update(list =>
      list.map(c => c.id === chId ? { ...c, messages: [...c.messages, newMsg], lastMessage: text } : c)
    );
    this.messageInput = '';

    // Simulate auto-response
    this.isTyping.set(true);
    setTimeout(() => {
      const reply: ChatMessage = {
        id: `m-${Date.now()}`, sender: 'other',
        text: 'Cảm ơn bạn! Mình sẽ phản hồi sớm nhé 😊',
        time: `${now.getHours()}:${(now.getMinutes() + 1).toString().padStart(2, '0')}`,
      };
      this.channels.update(list =>
        list.map(c => c.id === chId ? { ...c, messages: [...c.messages, reply], lastMessage: reply.text } : c)
      );
      this.isTyping.set(false);
    }, 1500);
  }
}
