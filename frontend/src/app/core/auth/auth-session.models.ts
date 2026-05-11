import { UserDto } from '../../generated';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: UserDto | null;
}
