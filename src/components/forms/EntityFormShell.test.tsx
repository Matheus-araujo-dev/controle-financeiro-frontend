import { render, screen } from '@testing-library/react';
import { EntityFormShell } from './EntityFormShell';

describe('EntityFormShell', () => {
  it('disables submit when the form is invalid', () => {
    render(
      <EntityFormShell
        title="Nova entidade"
        description="Formulario base."
        isValid={false}
      >
        <div>Campos</div>
      </EntityFormShell>
    );

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });

  it('shows loading state while submitting', () => {
    render(
      <EntityFormShell
        title="Nova entidade"
        description="Formulario base."
        isValid
        isSubmitting
      >
        <div>Campos</div>
      </EntityFormShell>
    );

    expect(screen.getByRole('button', { name: /Salvar/ })).toHaveClass('ant-btn-loading');
  });
});
