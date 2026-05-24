import { SessionService } from './session';
import { LoginResponseDto, UserRole } from './session.models';

describe('SessionService', () => {
  const mockLogin: LoginResponseDto = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: {
      id: 21,
      fullName: 'Edu Match Student',
      email: 'student@gmail.com',
      role: UserRole.Student,
      isActive: true,
    },
  };

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores tokens and user from login response', () => {
    const service = new SessionService();
    service.bootstrapFromLogin(mockLogin);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.accessToken()).toBe('access-token');
    expect(service.user()?.role).toBe(UserRole.Student);
  });

  it('rehydrates from localStorage', () => {
    window.localStorage.setItem(
      'edumatch.session.tokens',
      JSON.stringify({
        accessToken: 'persisted-access',
        refreshToken: 'persisted-refresh',
      }),
    );
    window.localStorage.setItem(
      'edumatch.session.user',
      JSON.stringify({
        id: 7,
        fullName: 'Persisted Tutor',
        email: 'tutor@gmail.com',
        role: UserRole.Tutor,
        isActive: true,
      }),
    );

    const service = new SessionService();

    expect(service.isAuthenticated()).toBe(true);
    expect(service.refreshToken()).toBe('persisted-refresh');
    expect(service.user()?.fullName).toBe('Persisted Tutor');
  });

  it('clears session state and storage', () => {
    const service = new SessionService();
    service.bootstrapFromLogin(mockLogin);
    service.clear();

    expect(service.tokens()).toBeNull();
    expect(service.user()).toBeNull();
    expect(window.localStorage.getItem('edumatch.session.tokens')).toBeNull();
    expect(window.localStorage.getItem('edumatch.session.user')).toBeNull();
  });
});
