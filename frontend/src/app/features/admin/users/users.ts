import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { UserDto, UserRole, TutorApprovalStatus } from '../../../api/generated/client/models';
import { UsersService, AdminService } from '../../../api/generated/client/services';
import { ApiErrorDetails, getApiErrorDetails } from '../../../core/http/api-error';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { formatDate, userRoleLabel } from '../../../shared/utils/api-ui';
import { SessionService } from '../../../core/auth/session';

type ActiveFilter = 'all' | 'active' | 'inactive' | 'pending_approval' | 'rejected';

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
          @for (tab of activeTabs(); track tab.label) {
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
                   placeholder="Tìm theo tên, email, SĐT hoặc mã..."
                   class="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-duo-blue outline-none" />
          </div>
        </div>
      </div>

      @if (errorDetails()) {
        <app-error-banner [details]="errorDetails()" />
      }

      <div class="tactile-card overflow-hidden relative transition-opacity duration-200" [class.opacity-50]="isLoading()" [class.pointer-events-none]="isLoading()">
        <!-- Mobile View: Card List -->
        <div class="block md:hidden divide-y divide-slate-100">
          @for (user of users(); track user.id) {
            <div class="p-4 flex flex-col gap-3">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  @if (user.avatarUrl && !avatarErrors()[user.id!]) {
                    <img [src]="user.avatarUrl" [alt]="user.fullName || ''"
                         referrerpolicy="no-referrer"
                         (error)="handleAvatarError(user.id!)"
                         class="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                  } @else {
                    <div class="w-10 h-10 rounded-full bg-duo-blue text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {{ initials(user.fullName) }}
                    </div>
                  }
                  <div class="min-w-0">
                    <p class="font-extrabold text-slate-900 truncate">{{ user.fullName || 'Không rõ' }}</p>
                    <p class="text-xs text-slate-500">{{ subtitle(user) }}</p>
                  </div>
                </div>
                <!-- Status & Role Badges -->
                <div class="flex flex-col items-end gap-1 shrink-0">
                  <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-black text-slate-700">{{ roleLabel(user.role) }}</span>
                  @if (user.isActive) {
                    <span class="rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-black text-duo-green border border-green-100">Active</span>
                  } @else {
                    <span class="rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-black text-duo-red border border-red-100">Locked</span>
                  }
                </div>
              </div>

              <!-- Email and other details -->
              <div class="text-xs text-slate-600 flex items-center justify-between">
                <span>Email:</span>
                <span class="font-bold text-slate-800 break-all select-all">{{ user.email || '—' }}</span>
              </div>

              <!-- Actions -->
              <div class="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                <div class="flex gap-3">
                  @if (user.id !== session.user()?.id) {
                    <a [routerLink]="['/admin/chat']" [queryParams]="{ partnerId: user.id }" class="text-duo-green font-bold text-xs hover:underline">Nhắn tin</a>
                  }
                  <a [routerLink]="['/admin/users', user.id]" class="text-duo-blue font-bold text-xs hover:underline">Xem chi tiết</a>
                </div>
                
                @if (user.role === userRole.Tutor && user.tutorApprovalStatus === tutorApprovalStatus.Pending) {
                  <div class="flex gap-2">
                    <button (click)="approveTutor(user.tutorId)" [disabled]="isActionRunning()"
                            class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] uppercase rounded-lg border-b-2 border-emerald-700 hover:brightness-105 active:border-b-0 active:translate-y-[2px] disabled:opacity-50 transition-all cursor-pointer">
                      Duyệt
                    </button>
                    <button (click)="rejectTutor(user.tutorId)" [disabled]="isActionRunning()"
                            class="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-[10px] uppercase rounded-lg border-b-2 border-rose-700 hover:brightness-105 active:border-b-0 active:translate-y-[2px] disabled:opacity-50 transition-all cursor-pointer">
                      Từ chối
                    </button>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Desktop View: Table -->
        <div class="overflow-x-auto hidden md:block">
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
                    <div class="flex flex-col gap-1 items-start">
                      @if (user.isActive) {
                        <span class="rounded-full bg-green-50 px-3.5 py-1 text-xs font-black text-duo-green border border-green-100">Đang hoạt động</span>
                      } @else {
                        <span class="rounded-full bg-red-50 px-3.5 py-1 text-xs font-black text-duo-red border border-red-100">Đã khóa</span>
                      }
                      
                      @if (user.role === userRole.Tutor && user.tutorApprovalStatus) {
                        @if (user.tutorApprovalStatus === tutorApprovalStatus.Pending) {
                          <span class="rounded-full bg-amber-50 px-3.5 py-1 text-xs font-black text-amber-600 border border-amber-100">Chờ phê duyệt</span>
                        } @else if (user.tutorApprovalStatus === tutorApprovalStatus.Rejected) {
                          <span class="rounded-full bg-rose-50 px-3.5 py-1 text-xs font-black text-rose-600 border border-rose-100">Bị từ chối</span>
                        } @else if (user.tutorApprovalStatus === tutorApprovalStatus.Approved) {
                          <span class="rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-black text-emerald-600 border border-emerald-100">Đã duyệt hồ sơ</span>
                        }
                      }
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-2.5">
                      @if (user.id !== session.user()?.id) {
                        <a [routerLink]="['/admin/chat']" [queryParams]="{ partnerId: user.id }" class="text-duo-green font-bold text-xs hover:underline">Nhắn tin</a>
                      }
                      <a [routerLink]="['/admin/users', user.id]" class="text-duo-blue font-bold text-xs hover:underline mr-1">Xem chi tiết</a>
                      @if (user.role === userRole.Tutor && user.tutorApprovalStatus === tutorApprovalStatus.Pending) {
                        <button (click)="approveTutor(user.tutorId)" [disabled]="isActionRunning()"
                                class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] uppercase rounded-lg border-b-2 border-emerald-700 hover:brightness-105 active:border-b-0 active:translate-y-[2px] disabled:opacity-50 transition-all cursor-pointer">
                          Duyệt
                        </button>
                        <button (click)="rejectTutor(user.tutorId)" [disabled]="isActionRunning()"
                                class="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-[10px] uppercase rounded-lg border-b-2 border-rose-700 hover:brightness-105 active:border-b-0 active:translate-y-[2px] disabled:opacity-50 transition-all cursor-pointer">
                          Từ chối
                        </button>
                      }
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
  isActionRunning = signal(false);
  errorDetails = signal<ApiErrorDetails | null>(null);

  protected readonly userRole = UserRole;
  protected readonly tutorApprovalStatus = TutorApprovalStatus;

  readonly roleTabs: Array<{ label: string; role: UserRole | null }> = [
    { label: 'Tất cả', role: null },
    { label: 'Học viên', role: UserRole.Student },
    { label: 'Gia sư', role: UserRole.Tutor },
    { label: 'Quản trị viên', role: UserRole.Admin },
  ];

  activeTabs = computed(() => {
    const tabs: Array<{ label: string; value: ActiveFilter }> = [
      { label: 'Tất cả trạng thái', value: 'all' },
      { label: 'Đang hoạt động', value: 'active' },
      { label: 'Đã khóa', value: 'inactive' },
    ];
    if (this.activeRole() === UserRole.Tutor) {
      tabs.push(
        { label: 'Chờ phê duyệt', value: 'pending_approval' },
        { label: 'Đã từ chối', value: 'rejected' },
      );
    }
    return tabs;
  });

  private readonly usersApi = inject(UsersService);
  private readonly adminApi = inject(AdminService);
  protected readonly session = inject(SessionService);
  private readonly route = inject(ActivatedRoute);
  private searchDebounce?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    const roleParam = params['role'];
    const statusParam = params['status'];

    if (roleParam === 'Tutor') {
      this.activeRole.set(UserRole.Tutor);
    } else if (roleParam === 'Student') {
      this.activeRole.set(UserRole.Student);
    } else if (roleParam === 'Admin') {
      this.activeRole.set(UserRole.Admin);
    }

    if (statusParam === 'Pending') {
      this.activeFilter.set('pending_approval');
    } else if (statusParam === 'Rejected') {
      this.activeFilter.set('rejected');
    } else if (statusParam === 'Active') {
      this.activeFilter.set('active');
    } else if (statusParam === 'Inactive') {
      this.activeFilter.set('inactive');
    }

    void this.loadUsers();
  }

  setRole(role: UserRole | null): void {
    this.activeRole.set(role);
    if (role !== UserRole.Tutor && (this.activeFilter() === 'pending_approval' || this.activeFilter() === 'rejected')) {
      this.activeFilter.set('all');
    }
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
      let isActive: boolean | undefined = undefined;
      let approvalStatus: TutorApprovalStatus | undefined = undefined;

      if (this.activeFilter() === 'active') {
        isActive = true;
      } else if (this.activeFilter() === 'inactive') {
        isActive = false;
      } else if (this.activeFilter() === 'pending_approval') {
        approvalStatus = TutorApprovalStatus.Pending;
      } else if (this.activeFilter() === 'rejected') {
        approvalStatus = TutorApprovalStatus.Rejected;
      }

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
          approvalStatus,
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

  async approveTutor(tutorId?: number): Promise<void> {
    if (!tutorId) return;
    this.isActionRunning.set(true);
    try {
      await firstValueFrom(this.adminApi.approveTutor(tutorId));
      void this.loadUsers();
    } catch (error) {
      console.error('[admin/users] approve failed', error);
      alert('Không thể phê duyệt gia sư: ' + (getApiErrorDetails(error).message || 'Lỗi không xác định'));
    } finally {
      this.isActionRunning.set(false);
    }
  }

  async rejectTutor(tutorId?: number): Promise<void> {
    if (!tutorId) return;
    this.isActionRunning.set(true);
    try {
      await firstValueFrom(this.adminApi.rejectTutor(tutorId));
      void this.loadUsers();
    } catch (error) {
      console.error('[admin/users] reject failed', error);
      alert('Không thể từ chối gia sư: ' + (getApiErrorDetails(error).message || 'Lỗi không xác định'));
    } finally {
      this.isActionRunning.set(false);
    }
  }
}


