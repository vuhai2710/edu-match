import { UserDto } from '../../../api/generated';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: UserDto | null;
}
