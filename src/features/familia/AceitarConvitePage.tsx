import { Alert, Button, Card, Result, Space, Spin, Tag, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { aceitarConvite, obterConvite, type ConviteDetalhePublicoResponse } from './familia-api';
import { useIsAuthenticated } from '../../store/auth-store';
import { getApiErrorMessage } from '../../services/http/api-error';

export function AceitarConvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();

  const [convite, setConvite] = useState<ConviteDetalhePublicoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [aceitando, setAceitando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aceito, setAceito] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    obterConvite(token)
      .then(setConvite)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAceitar = useCallback(async () => {
    if (!token) {
      return;
    }

    setAceitando(true);
    try {
      await aceitarConvite(token);
      setAceito(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setAceitando(false);
    }
  }, [token]);

  if (loading) {
    return (
      <div className="login-page">
        <Spin size="large" />
      </div>
    );
  }

  if (aceito) {
    return (
      <div className="login-page">
        <Card className="login-page__card">
          <Result
            status="success"
            title={`Você agora faz parte de ${convite?.nomeFamilia ?? 'uma família'}!`}
            subTitle="Faça login novamente para carregar os dados compartilhados da família."
            extra={
              <Button type="primary" onClick={() => navigate('/login', { replace: true })}>
                Ir para o login
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="login-page">
      <Card className="login-page__card">
        <Space direction="vertical" orientation="vertical" size={20} style={{ width: '100%' }}>
          <div>
            <Typography.Text className="login-page__eyebrow">Convite de família</Typography.Text>
            <Typography.Title level={2} style={{ marginTop: 8, marginBottom: 8 }}>
              {convite ? `Junte-se a ${convite.nomeFamilia}` : 'Convite'}
            </Typography.Title>
            {convite ? (
              <Typography.Paragraph type="secondary">
                Convite para <strong>{convite.emailConvidado}</strong> como{' '}
                <Tag color="green">{convite.papel}</Tag>
              </Typography.Paragraph>
            ) : null}
          </div>

          {error ? <Alert type="error" showIcon message="Convite indisponível" description={error} /> : null}

          {convite && !convite.valido ? (
            <Alert type="warning" showIcon message="Este convite expirou ou já foi utilizado." />
          ) : null}

          {convite?.valido ? (
            isAuthenticated ? (
              <Button type="primary" size="large" loading={aceitando} onClick={() => void handleAceitar()}>
                Aceitar convite
              </Button>
            ) : (
              <Alert
                type="info"
                showIcon
                message="Entre primeiro"
                description="Faça login com a sua conta Google e abra este link novamente para aceitar o convite."
                action={
                  <Button
                    type="primary"
                    onClick={() => navigate('/login', { state: { from: `/convite/${token}` } })}
                  >
                    Fazer login
                  </Button>
                }
              />
            )
          ) : null}
        </Space>
      </Card>
    </div>
  );
}
