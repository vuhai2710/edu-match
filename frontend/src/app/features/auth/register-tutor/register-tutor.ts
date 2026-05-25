import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MascotComponent } from '../../../shared/components/mascot/mascot';

@Component({
  selector: 'app-register-tutor-page',
  imports: [FormsModule, RouterLink, MascotComponent],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div class="w-full max-w-lg space-y-6">
        <div class="text-center">
          <app-mascot type="tutorWand" [size]="80" />
          <h1 class="mt-4 font-display text-3xl font-black text-slate-900">Đăng ký Gia sư</h1>
          <p class="mt-1 text-slate-500">Chia sẻ kiến thức, tạo thu nhập bền vững! 🧙</p>
        </div>

        <!-- Progress bar -->
        <div class="flex items-center gap-2 px-2">
          <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full bg-duo-blue rounded-full transition-all duration-500" [style.width.%]="progress()"></div>
          </div>
          <span class="text-xs font-bold text-slate-400">{{ progress() }}%</span>
        </div>

        <div class="tactile-card p-6 sm:p-8 space-y-4">
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">👤 Họ và tên</label>
              <input type="text" [(ngModel)]="fullName" placeholder="Nguyễn Văn B" class="tactile-input w-full text-sm font-semibold" />
            </div>
            <div>
              <label class="block text-sm font-extrabold text-slate-700 mb-1.5">📧 Email</label>
              <input type="email" [(ngModel)]="email" placeholder="email@example.com" class="tactile-input w-full text-sm font-semibold" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">🔒 Mật khẩu</label>
            <input type="password" [(ngModel)]="password" placeholder="Tối thiểu 8 ký tự" class="tactile-input w-full text-sm font-semibold" />
          </div>

          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-2">📚 Môn dạy (chọn nhiều)</label>
            <div class="flex flex-wrap gap-2">
              @for (subject of allSubjects; track subject) {
                <button (click)="toggleSubject(subject)" type="button"
                        [class]="selectedSubjects().includes(subject)
                          ? 'bg-duo-blue text-white border-duo-blue-dark border-b-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-colors'
                          : 'bg-white border-2 border-slate-200 px-3 py-1.5 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-colors'">
                  {{ subject }}
                </button>
              }
            </div>
          </div>

          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">💰 Học phí / giờ (VNĐ)</label>
            <input type="number" [(ngModel)]="hourlyRate" placeholder="200000" class="tactile-input w-full text-sm font-semibold" />
          </div>

          <div>
            <label class="block text-sm font-extrabold text-slate-700 mb-1.5">📝 Giới thiệu bản thân</label>
            <textarea [(ngModel)]="bio" rows="3" placeholder="Kinh nghiệm, phương pháp giảng dạy..."
                      class="tactile-input w-full text-sm font-semibold resize-none"></textarea>
          </div>

          <label class="flex items-start gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" [(ngModel)]="agreeTerms" class="mt-0.5 w-5 h-5 rounded accent-[#58cc02]" />
            <span>Tôi đồng ý với Điều khoản & Chính sách của EduMatch</span>
          </label>

          <button [disabled]="!agreeTerms" class="tactile-button-green w-full py-3.5 rounded-2xl text-base font-extrabold uppercase disabled:opacity-50 disabled:cursor-not-allowed">
            ✨ Hoàn tất đăng ký
          </button>
        </div>

        <p class="text-center text-sm text-slate-500">
          Đã có tài khoản? <a routerLink="/auth/login" class="font-extrabold text-[#58cc02] hover:underline">Đăng nhập</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterTutorPage {
  fullName = '';
  email = '';
  password = '';
  hourlyRate: number | null = null;
  bio = '';
  agreeTerms = false;
  selectedSubjects = signal<string[]>([]);

  readonly allSubjects = ['Toán học', 'Vật lý', 'Hóa học', 'Tiếng Anh', 'Ngữ văn', 'Sinh học', 'Lập trình', 'IELTS'];

  toggleSubject(s: string) {
    const current = this.selectedSubjects();
    this.selectedSubjects.set(current.includes(s) ? current.filter(x => x !== s) : [...current, s]);
  }

  progress() {
    let p = 0;
    if (this.fullName) p += 15;
    if (this.email) p += 15;
    if (this.password.length >= 8) p += 15;
    if (this.selectedSubjects().length > 0) p += 20;
    if (this.hourlyRate) p += 15;
    if (this.bio) p += 10;
    if (this.agreeTerms) p += 10;
    return Math.min(p, 100);
  }
}
