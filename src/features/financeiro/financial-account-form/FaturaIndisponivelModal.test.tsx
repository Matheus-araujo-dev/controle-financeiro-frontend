import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FaturaIndisponivelModal } from './FaturaIndisponivelModal';

describe('FaturaIndisponivelModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <FaturaIndisponivelModal open={false} loading={false} message={null} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal content when open with a message', () => {
    render(
      <FaturaIndisponivelModal
        open
        loading={false}
        message="Fatura de julho já foi fechada."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText('Fatura de julho já foi fechada.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Incluir na próxima fatura' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Descartar' })).toBeInTheDocument();
  });

  it('shows default message when message prop is null', () => {
    render(
      <FaturaIndisponivelModal open loading={false} message={null} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByText(/A fatura desta competência já está fechada/)).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    render(<FaturaIndisponivelModal open loading={false} message={null} onConfirm={onConfirm} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Incluir na próxima fatura' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onCancel when Descartar is clicked', async () => {
    const onCancel = vi.fn();
    render(<FaturaIndisponivelModal open loading={false} message={null} onConfirm={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Descartar' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('disables both buttons when loading', () => {
    render(
      <FaturaIndisponivelModal open loading message={null} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: 'Descartar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Incluir na próxima fatura' })).toBeDisabled();
  });
});
