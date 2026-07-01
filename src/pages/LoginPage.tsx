import { Alert, Button, Form, Input, Spin } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useAuthMode, useCurrentUser } from '../store/auth-store';
import { loginWithGoogle } from '../services/http/auth-api';
import { notify } from '../store/notification-store';

type LoginFormValues = {
  userId: string;
  displayName: string;
};

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

function useGoogleSignIn(onCredential: (idToken: string) => void, enabled: boolean) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const onCredentialRef = useRef(onCredential);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  });

  useEffect(() => {
    if (!enabled || !googleClientId) {
      return;
    }

    if (window.google?.accounts) {
      setScriptReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => setScriptReady(true);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [enabled]);

  useEffect(() => {
    if (!scriptReady || !buttonRef.current || !window.google?.accounts) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => onCredentialRef.current(response.credential)
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'filled_black',
      size: 'large',
      width: 320,
      text: 'signin_with',
      locale: 'pt-BR'
    });
  }, [scriptReady]);

  return { buttonRef, scriptReady };
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = useAuthMode();
  const signIn = useAuthStore((state) => state.signIn);
  const applyTokenResponse = useAuthStore((state) => state.applyTokenResponse);
  const currentUser = useCurrentUser();
  const [googleLoading, setGoogleLoading] = useState(false);

  const from = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from && state.from !== '/login' ? state.from : '/dashboard';
  }, [location.state]);

  const handleGoogleCredential = async (idToken: string) => {
    setGoogleLoading(true);
    try {
      const tokens = await loginWithGoogle(idToken);
      applyTokenResponse(tokens);
      navigate(from, { replace: true });
    } catch {
      notify('error', 'Falha no login', 'Não foi possível autenticar com o Google. Tente novamente.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const googleEnabled = mode === 'google';
  const { buttonRef, scriptReady } = useGoogleSignIn(handleGoogleCredential, googleEnabled);

  const initialValues: LoginFormValues = {
    userId: currentUser?.userId ?? 'matheus',
    displayName: currentUser?.displayName ?? 'Matheus'
  };

  const handleFinish = (values: LoginFormValues) => {
    signIn({
      userId: values.userId.trim(),
      displayName: values.displayName.trim()
    });
    navigate(from, { replace: true });
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
              ) : null}
              <Spin spinning={googleLoading || (!scriptReady && !!googleClientId)}>
                <div ref={buttonRef} />
              </Spin>
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
