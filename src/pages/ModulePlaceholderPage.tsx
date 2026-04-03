import { Result, Tag } from 'antd';

type ModulePlaceholderPageProps = {
  title: string;
  summary: string;
  phase: number;
};

export function ModulePlaceholderPage({ title, summary, phase }: ModulePlaceholderPageProps) {
  return (
    <Result
      status="info"
      title={title}
      subTitle={summary}
      extra={<Tag color="gold">Previsto para a fase {phase}</Tag>}
    />
  );
}
