import type * as Api from './generated/api';
import type { ApiContract } from './api-contract';

export type AuthMode = 'disabled' | 'development' | 'jwt' | 'google';

export type WorkspaceResumo = ApiContract<Api.WorkspaceResumoResponse>;

export type FamiliaResumo = WorkspaceResumo;

export type AuthUser = {
  userId: string;
  displayName: string;
  email?: string;
  avatarUrl?: string | null;
  workspace?: WorkspaceResumo | null;
  familia?: FamiliaResumo | null;
};

export type AuthTokens = ApiContract<Pick<Api.AuthTokenResponse, 'accessToken' | 'expiresAtUtc' | 'refreshToken'>, never, 'refreshToken'>;

export type UsuarioAutenticadoResponse = Omit<ApiContract<Api.UsuarioAutenticadoResponse, 'avatarUrl'>, 'workspace' | 'familia'> & {
  workspace?: WorkspaceResumo | null;
  familia?: FamiliaResumo | null;
};

export type AuthTokenResponse = AuthTokens & {
  usuario: UsuarioAutenticadoResponse;
};
