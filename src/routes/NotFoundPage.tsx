import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Result
      status="404"
      title="Rota nao encontrada"
      subTitle="A base administrativa ja esta pronta, mas esta pagina ainda nao existe."
      extra={
        <Button type="primary">
          <Link to="/dashboard">Voltar ao dashboard</Link>
        </Button>
      }
    />
  );
}
