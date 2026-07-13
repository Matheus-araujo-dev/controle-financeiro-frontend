import { render, act } from '@testing-library/react';
import { App as AntdApp } from 'antd';
import { NotificationCenter } from './NotificationCenter';
import { useNotificationStore, notify } from '../../store/notification-store';

function renderCenter() {
  const utils = render(
    <AntdApp>
      <NotificationCenter />
    </AntdApp>
  );
  // Escopa ao container do componente — o toast do AntD é renderizado em portal (document.body).
  const polite = utils.container.querySelector('[aria-live="polite"]') as HTMLElement;
  const assertive = utils.container.querySelector('[aria-live="assertive"]') as HTMLElement;
  return { ...utils, polite, assertive };
}

describe('NotificationCenter — regiões live', () => {
  afterEach(() => {
    useNotificationStore.getState().clear();
  });

  it('renderiza as regiões live polite e assertive', () => {
    const { polite, assertive } = renderCenter();
    expect(polite).toBeInTheDocument();
    expect(assertive).toBeInTheDocument();
  });

  it('anuncia sucesso na região polite', () => {
    const { polite } = renderCenter();
    act(() => notify('success', 'Salvo', 'Tudo certo'));
    expect(polite).toHaveTextContent('Salvo. Tudo certo');
  });

  it('anuncia erro na região assertive', () => {
    const { assertive } = renderCenter();
    act(() => notify('error', 'Falhou'));
    expect(assertive).toHaveTextContent('Falhou');
  });
});
