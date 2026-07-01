import { Alert, Button, Form, Input } from 'antd';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useAuthMode, useCurrentUser } from '../store/auth-store';

type LoginFormValues = {
  userId: string;
  displayName: string;
};

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '';

function buildGoogleOAuthUrl(): string {
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), b =>
    b.toString(16).padStart(2, '0')
  ).join('');
  sessionStorage.setItem('google_nonce', nonce);

  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: `${window.location.origin}/auth/callback`,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = useAuthMode();
  const signIn = useAuthStore((state) => state.signIn);
  const currentUser = useCurrentUser();

  const from = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from && state.from !== '/login' ? state.from : '/dashboard';
  }, [location.state]);

  const handleGoogleLogin = () => {
    if (!googleClientId) return;
    sessionStorage.setItem('google_redirect_from', from);
    window.location.href = buildGoogleOAuthUrl();
  };

  const handleFinish = (values: LoginFormValues) => {
    signIn({
      userId: values.userId.trim(),
      displayName: values.displayName.trim()
    });
    navigate(from, { replace: true });
  };

  const googleEnabled = mode === 'google';

  const initialValues: LoginFormValues = {
    userId: currentUser?.userId ?? 'matheus',
    displayName: currentUser?.displayName ?? 'Matheus'
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Glow de fundo */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header neon */}
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary mb-3">
            Controle Financeiro
          </p>
          <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface mb-3">
            Bem-vindo{' '}
            <span className="text-primary" style={{ textShadow: '0 0 30px rgba(63,255,139,0.4)' }}>
              de volta
            </span>
          </h1>
          <p className="text-on-surface-variant text-sm">
            {googleEnabled
              ? 'Entre com sua conta Google para acessar as finanças da família.'
              : 'Ambiente local — informe o usuário para assumir nesta sessão.'}
          </p>
        </div>

        {/* Card de login */}
        <div className="bg-surface-container-low border border-white/5 rounded-3xl p-8 space-y-6">
          {googleEnabled ? (
            <div className="flex flex-col items-center gap-4">
              {!googleClientId ? (
                <Alert
                  type="error"
                  showIcon
                  message="Google Client ID não configurado"
                  description="Defina VITE_GOOGLE_CLIENT_ID no ambiente do frontend."
                  className="w-full"
                />
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center gap-3 w-full h-11 bg-white rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer select-none"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Entrar com Google
                </button>
              )}
              <p className="text-[11px] text-on-surface-variant text-center">
                Ao entrar, você concorda com os termos de uso da plataforma.
              </p>
            </div>
          ) : (
            <>
              {mode === 'jwt' ? (
                <Alert
                  type="warning"
                  showIcon
                  message="Modo JWT ativo"
                  description="Use o modo development para autenticar localmente."
                />
              ) : null}

              <Form<LoginFormValues>
                layout="vertical"
                initialValues={initialValues}
                onFinish={handleFinish}
                requiredMark={false}
              >
                <Form.Item
                  label="Usuário técnico"
                  name="userId"
                  rules={[
                    { required: true, message: 'Informe o usuário técnico.' },
                    { whitespace: true, message: 'Informe o usuário técnico.' }
                  ]}
                >
                  <Input autoComplete="username" placeholder="matheus" />
                </Form.Item>

                <Form.Item
                  label="Nome de exibição"
                  name="displayName"
                  rules={[
                    { required: true, message: 'Informe o nome de exibição.' },
                    { whitespace: true, message: 'Informe o nome de exibição.' }
                  ]}
                >
                  <Input autoComplete="name" placeholder="Matheus" />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit" block size="large">
                    Entrar
                  </Button>
                </Form.Item>
              </Form>
            </>
          )}
        </div>

        <p className="text-center text-[11px] text-on-surface-variant mt-6">
          Controle Financeiro Familiar — dados seguros e privados
        </p>
      </div>
    </div>
  );
}
