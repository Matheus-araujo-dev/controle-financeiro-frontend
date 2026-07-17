import { render, screen, fireEvent } from '@testing-library/react';
import { DuplicateAlertModal } from './DuplicateAlertModal';
import type { DuplicateItemSummary } from '../financial-rules';

function makeDuplicate(overrides: Partial<DuplicateItemSummary> = {}): DuplicateItemSummary {
  return {
    id: 'dup-1',
    descricao: 'Aluguel sede',
    pessoaNome: 'Imobiliária XYZ',
    dataVencimento: '2026-07-20',
    valorLiquido: 2500,
    statusCodigo: 'PENDENTE',
    statusNome: 'Pendente',
    ...overrides
  };
}

describe('DuplicateAlertModal', () => {
  it('renders nothing when open is false', () => {
    const { container } = render(
      <DuplicateAlertModal open={false} loading={false} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders dialog when open is true', () => {
    render(
      <DuplicateAlertModal open={true} loading={false} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByText('Lançamento similar encontrado')).toBeInTheDocument();
  });

  it('shows singular message when exactly 1 duplicate', () => {
    render(
      <DuplicateAlertModal
        open={true}
        loading={false}
        duplicates={[makeDuplicate()]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText(/Já existe um lançamento com a mesma descrição/)).toBeInTheDocument();
  });

  it('shows plural message when more than 1 duplicate', () => {
    render(
      <DuplicateAlertModal
        open={true}
        loading={false}
        duplicates={[makeDuplicate(), makeDuplicate({ id: 'dup-2' })]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText(/Existem 2 lançamentos similares/)).toBeInTheDocument();
  });

  it('shows duplicate item details', () => {
    render(
      <DuplicateAlertModal
        open={true}
        loading={false}
        duplicates={[makeDuplicate({ descricao: 'Fornecedor ABC', pessoaNome: 'Fornecedor Beta' })]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText('Fornecedor ABC')).toBeInTheDocument();
    expect(screen.getByText('Fornecedor Beta')).toBeInTheDocument();
  });

  it('shows LIQUIDADA status with primary colors', () => {
    const { container } = render(
      <DuplicateAlertModal
        open={true}
        loading={false}
        duplicates={[makeDuplicate({ statusCodigo: 'LIQUIDADA', statusNome: 'Liquidada' })]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const badge = container.querySelector('.text-primary.bg-primary\\/10');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Liquidada');
  });

  it('shows VENCIDA status with error colors', () => {
    const { container } = render(
      <DuplicateAlertModal
        open={true}
        loading={false}
        duplicates={[makeDuplicate({ statusCodigo: 'VENCIDA', statusNome: 'Vencida' })]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const badge = container.querySelector('.text-error.bg-error\\/10');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Vencida');
  });

  it('shows PENDENTE status with warning colors', () => {
    const { container } = render(
      <DuplicateAlertModal
        open={true}
        loading={false}
        duplicates={[makeDuplicate({ statusCodigo: 'PENDENTE', statusNome: 'Pendente' })]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const badge = container.querySelector('.text-warning.bg-warning\\/10');
    expect(badge).toBeInTheDocument();
  });

  it('calls onConfirm when "Criar mesmo assim" is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <DuplicateAlertModal open={true} loading={false} duplicates={[]} onConfirm={onConfirm} onCancel={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Criar mesmo assim' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Cancelar is clicked', () => {
    const onCancel = vi.fn();
    render(
      <DuplicateAlertModal open={true} loading={false} duplicates={[]} onConfirm={vi.fn()} onCancel={onCancel} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('renders loading state on confirm button when loading=true', () => {
    render(
      <DuplicateAlertModal open={true} loading={true} duplicates={[]} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    expect(cancelBtn).toBeDisabled();
  });

  it('renders empty duplicates list when no duplicates provided', () => {
    render(
      <DuplicateAlertModal open={true} loading={false} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('shows formatted date for duplicate', () => {
    render(
      <DuplicateAlertModal
        open={true}
        loading={false}
        duplicates={[makeDuplicate({ dataVencimento: '2026-07-20' })]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText(/Venc\./)).toBeInTheDocument();
  });
});
