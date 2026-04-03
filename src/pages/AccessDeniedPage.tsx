import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';

export function AccessDeniedPage() {
  return (
    <Result
      status="403"
      title="Acesso negado"
      subTitle="A protecao de rota ja esta preparada, mas a autenticacao ainda nao foi habilitada nesta fase."
      extra={
        <Button type="primary">
          <Link to="/dashboard">Voltar ao dashboard</Link>
        </Button>
      }
    />
  );
}
