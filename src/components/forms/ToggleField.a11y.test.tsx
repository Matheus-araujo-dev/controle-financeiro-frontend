import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { ToggleField } from './FormPrimitives';

expect.extend(matchers);

describe('ToggleField — acessibilidade', () => {
  it('expõe role switch com aria-checked e aria-label', () => {
    render(<ToggleField checked={false} onChange={() => {}} label="Ativo" />);
    const sw = screen.getByRole('switch', { name: 'Ativo' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  it('reflete o estado marcado em aria-checked', () => {
    render(<ToggleField checked onChange={() => {}} label="Ativo" />);
    expect(screen.getByRole('switch', { name: 'Ativo' })).toHaveAttribute('aria-checked', 'true');
  });

  it('dispara onChange ao clicar', async () => {
    const onChange = vi.fn();
    render(<ToggleField checked={false} onChange={onChange} label="Ativo" />);
    await userEvent.click(screen.getByRole('switch', { name: 'Ativo' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('não tem violações de acessibilidade (axe)', async () => {
    const { container } = render(<ToggleField checked onChange={() => {}} label="Notificações por e-mail" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
