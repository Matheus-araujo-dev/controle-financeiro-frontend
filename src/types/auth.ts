export type AuthMode = 'disabled' | 'development' | 'jwt' | 'google';

export type WorkspaceResumo = {
  id: string;
  nome: string;
  papel: string;
};

export type FamiliaResumo = WorkspaceResumo;

export type AuthUser = {
  userId: string;
  displayName: string;
  email?: string;
  avatarUrl?: string | null;
  workspace?: WorkspaceResumo | null;
  familia?: FamiliaResumo | null;
};

export type AuthTokens = {
  accessToken: string;
  expiresAtUtc: string;
  refreshToken?: string;
};

export type UsuarioAutenticadoResponse = {
  id: string;
  email: string;
  nome: string;
  avatarUrl: string | null;
  workspace: WorkspaceResumo;
  familia: FamiliaResumo;
};

export type AuthTokenResponse = AuthTokens & {
  usuario: UsuarioAutenticadoResponse;
};
