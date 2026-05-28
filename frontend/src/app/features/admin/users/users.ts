import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { UserDto, UserRole } from '../../../api/generated/client/models';
import { UsersService } from '../../../api/generated/client/services';
import { ApiErrorDetails, getApiErrorDetails } from '../../../core/http/api-error';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { formatDate, userRoleLabel } from '../../../shared/utils/api-ui';
import { SessionService } from '../../../core/auth/session';

type ActiveFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-admin-users-page',
  imports: [ErrorBannerComponent, FormsModule, RouterLink, PaginationComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display text-2xl font-black text-slate-900">Quản lý người dùng</h1>
        <p class="text-sm text-slate-500 mt-1">Theo dõi học viên, gia sư và quản trị viên trong hệ thống.</p>
      </div>

      <div class="space-y-3">
        <div class="flex flex-wrap gap-2">
          @for (tab of roleTabs; track tab.label) {
            <button (click)="setRole(tab.role)"
                    [class]="activeRole() === tab.role
                      ? 'bg-duo-green text-white border-b-2 border-duo-green-dark'
                      : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'"
                    class="px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap">
              {{ tab.label }}
            </button>
          }
        </div>

        <div class="flex flex-wrap items-center gap-2">
          @for (tab of activeTabs; track tab.label) {
            <button (click)="setActive(tab.value)"
                    [class]="activeFilter() === tab.value
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap">
              {{ tab.label }}
            </button>
          }
 
          <div class="flex-1 min-w-[200px]">
            <input type="text"
                   [(ngModel)]="searchTerm"
                   (ngModelChange)="onSearchChange()"
                   placeholder="Tìm theo tên hoặc email..."
                   class="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-duo-blue outline-none" />
          </div>
        </div>
      </div>

      @if (errorDetails()) {
        <app-error-banner [details]="errorDetails()" />
      }

      <div class="tactile-card overflow-hidden relative transition-opacity duration-200" [class.opacity-50]="isLoading()" [class.pointer-events-none]="isLoading()">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 border-b-2 border-slate-100">
              <tr>
                <th class="px-4 py-3 text-left font-extrabold text-slate-600">Người dùng</th>
                <th class="px-4 py-3 text-left font-extrabold text-slate-600">Email</th>
                <th class="px-4 py-3 text-left font-extrabold text-slate-600">Vai trò</th>
                <th class="px-4 py-3 text-left font-extrabold text-slate-600">Trạng thái</th>
                <th class="px-4 py-3 text-right font-extrabold text-slate-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr class="border-b border-slate-100 hover:bg-slate-50">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      @if (user.avatarUrl && !avatarErrors()[user.id!]) {
                        <img [src]="user.avatarUrl" [alt]="user.fullName || ''"
                             referrerpolicy="no-referrer"
                             (error)="handleAvatarError(user.id!)"
                             class="w-9 h-9 rounded-full object-cover border border-slate-200" />
                      } @else {
                        <div class="w-9 h-9 rounded-full bg-duo-blue text-white flex items-center justify-center font-bold text-xs">
                          {{ initials(user.fullName) }}
                        </div>
                      }
                      <div>
                        <p class="font-extrabold text-slate-900">{{ user.fullName || 'Không rõ' }}</p>
                        <p class="text-xs text-slate-500">{{ subtitle(user) }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ user.email || '—' }}</td>
                  <td class="px-4 py-3">
                    <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{{ roleLabel(user.role) }}</span>
                  </td>
                  <td class="px-4 py-3">
                    @if (user.isActive) {
                      <span class="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-duo-green">Đang hoạt động</span>
                    } @else {
                      <span class="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-duo-red">Đã khóa</span>
                    }
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-3">
                      @if (user.id !== session.user()?.id) {
                        <a [routerLink]="['/admin/chat']" [queryParams]="{ partnerId: user.id }" class="text-duo-green font-bold text-xs hover:underline">Nhắn tin</a>
                      }
                      <a [routerLink]="['/admin/users', user.id]" class="text-duo-blue font-bold text-xs hover:underline">Xem chi tiết</a>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (!isLoading() && !users().length) {
          <div class="p-8 text-center">
            <p class="font-extrabold text-slate-800">Không có người dùng nào</p>
            <p class="text-sm text-slate-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        }
      </div>

      <app-pagination [page]="page()"
                      [pageSize]="pageSize()"
                      [totalCount]="totalCount()"
                      itemsName="người dùng"
                      (pageChange)="onPageChange($event)"
                      (pageSizeChange)="onPageSizeChange($event)" />
    </div>
  `,
})
export class AdminUsersPage implements OnInit {
  users = signal<UserDto[]>([]);
  avatarErrors = signal<Record<number | string, boolean>>({});

  handleAvatarError(userId: string | number): void {
    this.avatarErrors.update((prev) => ({ ...prev, [userId]: true }));
  }

  activeRole = signal<UserRole | null>(null);
  activeFilter = signal<ActiveFilter>('all');
  searchTerm = '';
  page = signal(1);
  pageSize = signal(5);
  totalCount = signal(0);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));
  isLoading = signal(false);
  errorDetails = signal<ApiErrorDetails | null>(null);

  readonly roleTabs: Array<{ label: string; role: UserRole | null }> = [
    { label: 'Tất cả', role: null },
    { label: 'Học viên', role: UserRole.Student },
    { label: 'Gia sư', role: UserRole.Tutor },
    { label: 'Quản trị viên', role: UserRole.Admin },
  ];

  readonly activeTabs: Array<{ label: string; value: ActiveFilter }> = [
    { label: 'Tất cả trạng thái', value: 'all' },
    { label: 'Đang hoạt động', value: 'active' },
    { label: 'Đã khóa', value: 'inactive' },
  ];

  private readonly usersApi = inject(UsersService);
  protected readonly session = inject(SessionService);
  private searchDebounce?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    void this.loadUsers();
  }

  setRole(role: UserRole | null): void {
    this.activeRole.set(role);
    this.page.set(1);
    void this.loadUsers();
  }

  setActive(value: ActiveFilter): void {
    this.activeFilter.set(value);
    this.page.set(1);
    void this.loadUsers();
  }

  onSearchChange(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.page.set(1);
      void this.loadUsers();
    }, 400);
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    void this.loadUsers();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.page.set(1);
    void this.loadUsers();
  }

  roleLabel(role?: UserRole | null): string {
    return userRoleLabel(role);
  }

  initials(name?: string | null): string {
    if (!name) return '?';
    return name.split(' ').slice(-2).map((s) => s[0]).join('').toUpperCase();
  }

  subtitle(user: UserDto): string {
    const code = (user as { code?: string | null }).code;
    if (code) return code;
    if (user.role === UserRole.Admin) return `Quản trị viên #${user.id}`;
    return `Người dùng #${user.id}`;
  }

  date(value?: Date | null): string {
    return formatDate(value);
  }

  private async loadUsers(): Promise<void> {
    this.isLoading.set(true);
    this.errorDetails.set(null);
    try {
      const isActive =
        this.activeFilter() === 'all' ? undefined : this.activeFilter() === 'active';
      const search = this.searchTerm.trim() || undefined;
      const response = await firstValueFrom(
        this.usersApi.getUsers(
          this.activeRole() ?? undefined,
          isActive,
          this.page(),
          this.pageSize(),
          search,
          'createdAt',
          'desc',
        ),
      );
      this.users.set(response.data?.items ?? []);
      this.totalCount.set(response.data?.totalCount ?? 0);
    } catch (error) {
      console.error('[admin/users] load failed', error);
      this.errorDetails.set(getApiErrorDetails(error, 'Không tải được danh sách người dùng.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}


