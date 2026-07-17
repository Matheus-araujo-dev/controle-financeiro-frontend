import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickAddModal } from './QuickAddModal';

const defaultProps = {
  open: true,
  title: 'Cadastro de Teste',
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  children: <input aria-label="campo" />
};

function renderModal(props?: Partial<typeof defaultProps>) {
  return render(<QuickAddModal {...defaultProps} {...props} />);
}

describe('QuickAddModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when open is false', () => {
    renderModal({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the dialog when open is true', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Cadastro de Teste')).toBeInTheDocument();
  });

  it('renders with default eyebrow and icon', () => {
    renderModal();
    expect(screen.getByText('Cadastro rápido')).toBeInTheDocument();
    expect(screen.getByText('add_circle')).toBeInTheDocument();
  });

  it('renders custom eyebrow and icon when provided', () => {
    renderModal({ eyebrow: 'Formulário', icon: 'edit' });
    expect(screen.getByText('Formulário')).toBeInTheDocument();
    expect(screen.getByText('edit')).toBeInTheDocument();
  });

  it('calls onSubmit when submit button is clicked', async () => {
    renderModal();
    await userEvent.click(screen.getByRole('button', { name: /confirmar cadastro/i }));
    expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked and form is not dirty', async () => {
    renderModal({ isDirty: false });
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows confirm close dialog when cancel is clicked with dirty form', async () => {
    renderModal({ isDirty: true });
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.getByText('Descartar dados não salvos?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continuar editando/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /descartar/i })).toBeInTheDocument();
  });

  it('hides confirm dialog and does NOT call onClose when "Continuar editando" is clicked', async () => {
    renderModal({ isDirty: true });
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    await userEvent.click(screen.getByRole('button', { name: /continuar editando/i }));
    expect(screen.queryByText('Descartar dados não salvos?')).not.toBeInTheDocument();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when "Descartar" is clicked after confirm close dialog appears', async () => {
    renderModal({ isDirty: true });
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    await userEvent.click(screen.getByRole('button', { name: /descartar/i }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders error message when error prop is provided', () => {
    renderModal({ error: 'Campo inválido' });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Campo inválido')).toBeInTheDocument();
  });

  it('does not render error alert when error is undefined', () => {
    renderModal({ error: undefined });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders custom submitLabel', () => {
    renderModal({ submitLabel: 'Salvar agora' });
    expect(screen.getByRole('button', { name: /salvar agora/i })).toBeInTheDocument();
  });

  it('shows "Salvando..." text when loading is true', () => {
    renderModal({ loading: true });
    expect(screen.getByText('Salvando...')).toBeInTheDocument();
  });

  it('disables submit button when loading is true', () => {
    renderModal({ loading: true });
    const submitButton = screen.getByRole('button', { name: /salvando/i });
    expect(submitButton).toBeDisabled();
  });

  it('disables submit button when submitDisabled is true', () => {
    renderModal({ submitDisabled: true });
    const submitButton = screen.getByRole('button', { name: /confirmar cadastro/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when not disabled and not loading', () => {
    renderModal({ submitDisabled: false, loading: false });
    const submitButton = screen.getByRole('button', { name: /confirmar cadastro/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('closes without confirm dialog when Escape is pressed and form is NOT dirty', () => {
    renderModal({ isDirty: false });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows confirm dialog when Escape is pressed and form IS dirty', () => {
    renderModal({ isDirty: true });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByText('Descartar dados não salvos?')).toBeInTheDocument();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('does NOT close when Escape is pressed while loading', () => {
    renderModal({ loading: true, isDirty: false });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('calls handleClose when backdrop is clicked and not loading', () => {
    renderModal({ isDirty: false });
    const backdrop = screen.getByRole('dialog').closest('div[class*="fixed"]');
    if (backdrop) {
      fireEvent.mouseDown(backdrop, { target: backdrop });
    }
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT close when backdrop click happens on a child element', () => {
    renderModal({ isDirty: false });
    // Clicking on the dialog itself (not the backdrop) should not close
    const dialog = screen.getByRole('dialog');
    fireEvent.mouseDown(dialog, { target: dialog });
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('renders children inside the dialog', () => {
    renderModal({ children: <input aria-label="nome" /> });
    expect(screen.getByLabelText('nome')).toBeInTheDocument();
  });

  it('does not render when open is toggled to false', () => {
    const { rerender } = render(<QuickAddModal {...defaultProps} open={true} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    rerender(<QuickAddModal {...defaultProps} open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
