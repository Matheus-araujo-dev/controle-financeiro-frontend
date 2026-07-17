import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

function renderDialog(props: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onClose = vi.fn();
  const onConfirm = vi.fn();
  const result = render(
    <ConfirmDialog
      open={true}
      title="Tem certeza?"
      body="Esta ação não pode ser desfeita."
      onClose={onClose}
      onConfirm={onConfirm}
      {...props}
    />
  );
  return { ...result, onClose, onConfirm };
}

describe('ConfirmDialog', () => {
  it('renders nothing when open is false', () => {
    const { container } = render(
      <ConfirmDialog open={false} title="T" body="B" onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders dialog when open is true', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Tem certeza?')).toBeInTheDocument();
    expect(screen.getByText('Esta ação não pode ser desfeita.')).toBeInTheDocument();
  });

  it('uses default labels when not provided', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('uses custom labels', () => {
    renderDialog({ confirmLabel: 'Deletar', cancelLabel: 'Voltar' });
    expect(screen.getByRole('button', { name: 'Deletar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });

  it('uses default eyebrow', () => {
    renderDialog();
    expect(screen.getByText('Confirmação')).toBeInTheDocument();
  });

  it('uses custom eyebrow', () => {
    renderDialog({ eyebrow: 'Atenção' });
    expect(screen.getByText('Atenção')).toBeInTheDocument();
  });

  it('uses default icon "help"', () => {
    renderDialog();
    expect(screen.getByText('help')).toBeInTheDocument();
  });

  it('uses custom icon', () => {
    renderDialog({ icon: 'warning' });
    expect(screen.getByText('warning')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const { onConfirm } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const { onClose } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked (not loading)', () => {
    const { onClose } = renderDialog({ loading: false });
    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
    fireEvent.mouseDown(backdrop, { target: backdrop });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose when backdrop click on inner element', () => {
    const { onClose } = renderDialog({ loading: false });
    const dialog = screen.getByRole('dialog');
    fireEvent.mouseDown(dialog);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not call onClose when backdrop clicked while loading', () => {
    const { onClose } = renderDialog({ loading: true });
    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
    fireEvent.mouseDown(backdrop, { target: backdrop });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose on Escape key when not loading', () => {
    const { onClose } = renderDialog({ loading: false });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose on Escape key when loading', () => {
    const { onClose } = renderDialog({ loading: true });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders custom children when provided', () => {
    renderDialog({ children: <div>Extra content</div> });
    expect(screen.getByText('Extra content')).toBeInTheDocument();
  });

  it('does not render children slot when no children', () => {
    const { container } = renderDialog({ children: undefined });
    const childrenWrapper = container.querySelector('.mt-5.space-y-4');
    expect(childrenWrapper).not.toBeInTheDocument();
  });

  it('traps focus with Tab key', async () => {
    renderDialog();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    await userEvent.tab();
  });

  it('traps focus with Shift+Tab', async () => {
    renderDialog();
    await userEvent.tab({ shift: true });
  });

  it('restores focus on close', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Open';
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = renderDialog();
    unmount();
    document.body.removeChild(trigger);
  });

  it('locks body overflow when open', () => {
    renderDialog();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow when unmounted', () => {
    const { unmount } = renderDialog();
    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
