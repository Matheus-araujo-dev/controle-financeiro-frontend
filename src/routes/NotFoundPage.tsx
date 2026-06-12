import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Result
      status="404"
      title="Rota não encontrada"
      subTitle="A base administrativa já está pronta, mas esta página ainda não existe."
      extra={
        <Button type="primary">
          <Link to="/dashboard">Voltar ao dashboard</Link>
        </Button>
      }
    />
  );
}
