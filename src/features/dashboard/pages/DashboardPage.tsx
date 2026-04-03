import { Card, Col, Row, Space, Tag, Typography } from 'antd';
import { PageState } from '../../../components/states/PageState';

const bootstrapChecklist = [
  'Shell administrativo com rota protegida preparada',
  'Cliente HTTP base configurado para /api/v1',
  'Vitest + Testing Library + cobertura ativos',
  'Sonar e workflow separados do backend'
];

export function DashboardPage() {
  return (
    <Space direction={undefined} orientation="vertical" size={24} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="dashboard-card">
            <Typography.Text type="secondary">API Base URL</Typography.Text>
            <Typography.Title level={4}>
              {import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1'}
            </Typography.Title>
            <Tag color="processing">Bootstrap inicial</Tag>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="dashboard-card">
            <Typography.Text type="secondary">Cobertura</Typography.Text>
            <Typography.Title level={4}>Vitest + lcov</Typography.Title>
            <Tag color="success">Quality gate preparado</Tag>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="dashboard-card">
            <Typography.Text type="secondary">Proximo passo</Typography.Text>
            <Typography.Title level={4}>Cadastros de apoio</Typography.Title>
            <Tag color="default">Aguardando fase seguinte</Tag>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Estrutura inicial pronta">
            <Space direction={undefined} orientation="vertical" size={12}>
              {bootstrapChecklist.map((item) => (
                <Typography.Text key={item}>{item}</Typography.Text>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Estado padrao de tela">
            <PageState
              state="empty"
              title="Sem dados de negocio nesta fase"
              subtitle="A fase atual termina no bootstrap tecnico, sem popular dashboard real."
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
