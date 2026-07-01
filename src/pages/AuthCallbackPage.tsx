import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { loginWithGoogle } from '../services/http/auth-api';
import { useAuthStore } from '../store/auth-store';
import { notify } from '../store/notification-store';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const applyTokenResponse = useAuthStore(s => s.applyTokenResponse);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.substring(1));
    const idToken = hash.get('id_token');
    const error = hash.get('error');
    const from = sessionStorage.getItem('google_redirect_from') ?? '/dashboard';
    sessionStorage.removeItem('google_redirect_from');
    sessionStorage.removeItem('google_nonce');

    if (error || !idToken) {
      notify('error', 'Falha no login', error ?? 'Não foi possível autenticar com o Google.');
      navigate('/login', { replace: true });
      return;
    }

    loginWithGoogle(idToken)
      .then(tokens => {
        applyTokenResponse(tokens);
        navigate(from, { replace: true });
      })
      .catch(() => {
        notify('error', 'Falha no login', 'Não foi possível autenticar com o Google. Tente novamente.');
        navigate('/login', { replace: true });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <Spin size="large" />
    </div>
  );
}
