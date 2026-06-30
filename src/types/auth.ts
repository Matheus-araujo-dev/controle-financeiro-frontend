export type AuthMode = 'disabled' | 'development' | 'jwt' | 'google';

export type FamiliaResumo = {
  id: string;
  nome: string;
  papel: string;
};

export type AuthUser = {
  userId: string;
  displayName: string;
  email?: string;
  avatarUrl?: string | null;
  familia?: FamiliaResumo | null;
};

export type AuthTokens = {
  accessToken: string;
  expiresAtUtc: string;
  refreshToken?: string; // vazio quando backend usa HttpOnly Cookie
};

export type UsuarioAutenticadoResponse = {
  id: string;
  email: string;
  nome: string;
  avatarUrl: string | null;
  familia: FamiliaResumo;
};

export type AuthTokenResponse = AuthTokens & {
  usuario: UsuarioAutenticadoResponse;
};
