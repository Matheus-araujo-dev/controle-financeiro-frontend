export type AuthMode = 'disabled' | 'development' | 'jwt';

export type AuthUser = {
  userId: string;
  displayName: string;
};
