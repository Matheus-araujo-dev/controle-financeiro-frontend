import { Alert, Button, Card, Form, Input, Space, Spin, Typography } from 'antd';
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
      callback: (response) => onCredential(response.credential)
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'filled_black',
      size: 'large',
      width: 320,
      text: 'signin_with',
      locale: 'pt-BR'
    });
  }, [scriptReady, onCredential]);

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
    <div className="login-page">
      <Card className="login-page__card" variant="outlined">
        <Space direction="vertical" orientation="vertical" size={20} style={{ width: '100%' }}>
          <div>
            <Typography.Text className="login-page__eyebrow">
              {googleEnabled ? 'Acesso' : 'Acesso local'}
            </Typography.Text>
            <Typography.Title level={2} style={{ marginTop: 8, marginBottom: 8 }}>
              Entrar no Controle Financeiro
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {googleEnabled
                ? 'Entre com a sua conta Google para acessar as finanças da sua família.'
                : 'No ambiente local, a autenticação usa o header de desenvolvimento da API. Informe o usuário que deseja assumir nesta sessão.'}
            </Typography.Paragraph>
          </div>

          {googleEnabled ? (
            <Space direction="vertical" orientation="vertical" size={12} style={{ width: '100%', alignItems: 'center' }}>
              {!googleClientId ? (
                <Alert
                  type="error"
                  showIcon
                  message="Google Client ID não configurado"
                  description="Defina VITE_GOOGLE_CLIENT_ID no ambiente do frontend."
                />
              ) : null}
              <Spin spinning={googleLoading || (!scriptReady && !!googleClientId)}>
                <div ref={buttonRef} />
              </Spin>
            </Space>
          ) : (
            <>
              {mode === 'jwt' ? (
                <Alert
                  type="warning"
                  showIcon
                  message="Modo JWT/Auth0 ativo"
                  description="O frontend foi aberto em modo JWT. Nesta sessão local, use o modo development para autenticar pelo header de desenvolvimento."
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
                  <Space>
                    <Button type="primary" htmlType="submit">
                      Entrar
                    </Button>
                    <Typography.Text type="secondary">Destino após login: {from}</Typography.Text>
                  </Space>
                </Form.Item>
              </Form>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
}
