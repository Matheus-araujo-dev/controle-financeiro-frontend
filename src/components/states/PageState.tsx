import { Result, Spin, Typography } from 'antd';

type PageStateProps =
  | {
      state: 'loading';
      title?: string;
    }
  | {
      state: 'empty' | 'error';
      title: string;
      subtitle: string;
    };

export function PageState(props: PageStateProps) {
  if (props.state === 'loading') {
    return (
      <div className="page-state page-state--loading" data-testid="page-state-loading">
        <Spin size="large" />
        <Typography.Text>{props.title ?? 'Carregando...'}</Typography.Text>
      </div>
    );
  }

  return (
    <Result
      data-testid={`page-state-${props.state}`}
      status={props.state === 'error' ? 'error' : 'info'}
      title={props.title}
      subTitle={props.subtitle}
    />
  );
}
