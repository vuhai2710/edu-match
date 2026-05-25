import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import { INITIAL_TUTORS } from '../../../shared/fixtures/mock-data';

@Component({
  selector: 'app-discover-tutors-page',
  imports: [FormsModule, RouterLink, MascotComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display text-2xl md:text-3xl font-black text-slate-900">🔍 Khám phá Gia sư</h1>
        <p class="text-slate-500 mt-1">Tìm gia sư phù hợp nhất cho bạn</p>
      </div>

      <!-- Search + Filters -->
      <div class="space-y-3">
        <input type="text" [(ngModel)]="searchQuery" placeholder="Tìm theo tên, môn học..."
               class="tactile-input w-full text-sm font-semibold" />
        <div class="flex flex-wrap gap-2">
          <button (click)="activeSubject.set('')"
                  [class]="!activeSubject() ? 'bg-duo-blue text-white border-b-2 border-duo-blue-dark' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'"
                  class="px-3 py-1.5 rounded-xl text-sm font-bold transition-colors">
            Tất cả
          </button>
          @for (s of subjects; track s) {
            <button (click)="activeSubject.set(s)"
                    [class]="activeSubject() === s ? 'bg-duo-blue text-white border-b-2 border-duo-blue-dark' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'"
                    class="px-3 py-1.5 rounded-xl text-sm font-bold transition-colors">
              {{ s }}
            </button>
          }
        </div>
      </div>

      <!-- Results -->
      @if (filteredTutors().length > 0) {
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (tutor of filteredTutors(); track tutor.id) {
            <a [routerLink]="['/student/tutor', tutor.id]" class="tactile-card p-5 hover:shadow-lg transition-all group">
              <div class="flex items-center gap-3 mb-3">
                <img [src]="tutor.avatar" [alt]="tutor.name" referrerpolicy="no-referrer"
                     class="w-14 h-14 rounded-full object-cover border-2 border-slate-100" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1">
                    <h3 class="font-extrabold text-slate-900 truncate group-hover:text-duo-blue transition-colors">{{ tutor.name }}</h3>
                    @if (tutor.isTop) {
                      <span class="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">⭐ Top</span>
                    }
                  </div>
                  <p class="text-sm text-slate-500">{{ tutor.subject }}</p>
                </div>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="flex items-center gap-1 text-amber-600 font-bold">
                  ⭐ {{ tutor.rating }}
                </span>
                <span class="font-extrabold text-duo-green">
                  {{ formatPrice(tutor.hourlyRate) }}/h
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-2 line-clamp-2">{{ tutor.bio }}</p>
            </a>
          }
        </div>
      } @else {
        <div class="text-center py-12">
          <app-mascot type="sadMagnifier" [size]="120" />
          <p class="mt-4 font-extrabold text-slate-700">Không tìm thấy gia sư nào 😢</p>
          <p class="text-sm text-slate-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      }
    </div>
  `,
})
export class DiscoverTutorsPage {
  searchQuery = '';
  activeSubject = signal('');
  readonly subjects = ['Toán học', 'Vật lý', 'Tiếng Anh', 'Ngữ văn', 'Lập trình'];

  readonly filteredTutors = computed(() => {
    let result = INITIAL_TUTORS;
    const sub = this.activeSubject();
    if (sub) result = result.filter(t => t.subjects.includes(sub));
    const q = this.searchQuery.toLowerCase().trim();
    if (q) result = result.filter(t => t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q));
    return result;
  });

  formatPrice(n: number) {
    return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
  }
}
