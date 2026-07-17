import { render, screen } from '@testing-library/react';
import { DashboardRealizadoVsPlanejado } from './DashboardRealizadoVsPlanejado';
import type { DashboardContaGerencialResumoItem } from '../../../types/dashboard';
import type { OrcamentoCompetencia } from '../../../types/orcamento';

function makeContaGerencial(overrides: Partial<DashboardContaGerencialResumoItem> = {}): DashboardContaGerencialResumoItem {
  return {
    contaGerencialId: 'cg-1',
    codigo: '1',
    descricao: 'Despesa Operacional',
    tipo: 'Despesa',
    valorTotal: 1000,
    quantidadeLancamentos: 2,
    ultimaDataLancamento: '2026-07-01',
    ...overrides
  };
}

function makeOrcamento(overrides: Partial<OrcamentoCompetencia> = {}): OrcamentoCompetencia {
  return {
    competencia: '2026-07',
    totalMeta: 5000,
    totalRealizado: 3000,
    percentualConsumido: 60,
    possuiEstouro: false,
    itens: [],
    ...overrides
  };
}

describe('DashboardRealizadoVsPlanejado', () => {
  it('renders empty state when no expense accounts', () => {
    render(<DashboardRealizadoVsPlanejado contasGerenciais={[]} orcamento={undefined} />);
    expect(screen.getByText('Sem despesas no período.')).toBeInTheDocument();
  });

  it('filters only Despesa accounts', () => {
    const contas = [
      makeContaGerencial({ contaGerencialId: 'cg-1', tipo: 'Despesa', descricao: 'Despesa A' }),
      makeContaGerencial({ contaGerencialId: 'cg-2', tipo: 'Receita', descricao: 'Receita B' })
    ];
    render(<DashboardRealizadoVsPlanejado contasGerenciais={contas} orcamento={undefined} />);
    expect(screen.getByText('Despesa A')).toBeInTheDocument();
    expect(screen.queryByText('Receita B')).not.toBeInTheDocument();
  });

  it('shows config metas tip when items have no meta', () => {
    const contas = [makeContaGerencial()];
    render(<DashboardRealizadoVsPlanejado contasGerenciais={contas} orcamento={undefined} />);
    expect(screen.getByText(/Configure metas em/i)).toBeInTheDocument();
    expect(screen.getByText('Orçamento')).toBeInTheDocument();
  });

  it('does not show config metas tip when all items have meta', () => {
    const contas = [makeContaGerencial({ contaGerencialId: 'cg-1', valorTotal: 500 })];
    const orcamento = makeOrcamento({
      itens: [{ metaId: 'm1', contaGerencialId: 'cg-1', contaPaiId: null, contaGerencialCodigo: '1', contaGerencialDescricao: 'Despesa', valorMeta: 1000, valorRealizado: 500, percentualConsumido: 50, estourado: false, aceitaLancamentos: true }]
    });
    render(<DashboardRealizadoVsPlanejado contasGerenciais={contas} orcamento={orcamento} />);
    expect(screen.queryByText(/Configure metas em/i)).not.toBeInTheDocument();
  });

  it('renders progress bar with primary color when pct < 80', () => {
    const contas = [makeContaGerencial({ contaGerencialId: 'cg-1', valorTotal: 500 })];
    const orcamento = makeOrcamento({
      itens: [{ metaId: 'm1', contaGerencialId: 'cg-1', contaPaiId: null, contaGerencialCodigo: '1', contaGerencialDescricao: 'Despesa', valorMeta: 1000, valorRealizado: 500, percentualConsumido: 50, estourado: false, aceitaLancamentos: true }]
    });
    const { container } = render(<DashboardRealizadoVsPlanejado contasGerenciais={contas} orcamento={orcamento} />);
    expect(container.querySelector('.bg-primary')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders progress bar with warning color when pct >= 80 and <= 100', () => {
    const contas = [makeContaGerencial({ contaGerencialId: 'cg-1', valorTotal: 850 })];
    const orcamento = makeOrcamento({
      itens: [{ metaId: 'm1', contaGerencialId: 'cg-1', contaPaiId: null, contaGerencialCodigo: '1', contaGerencialDescricao: 'Despesa', valorMeta: 1000, valorRealizado: 850, percentualConsumido: 85, estourado: false, aceitaLancamentos: true }]
    });
    const { container } = render(<DashboardRealizadoVsPlanejado contasGerenciais={contas} orcamento={orcamento} />);
    expect(container.querySelector('.bg-warning')).toBeInTheDocument();
    expect(container.querySelector('.text-warning')).toBeInTheDocument();
  });

  it('renders progress bar with error color when pct > 100', () => {
    const contas = [makeContaGerencial({ contaGerencialId: 'cg-1', valorTotal: 1500 })];
    const orcamento = makeOrcamento({
      itens: [{ metaId: 'm1', contaGerencialId: 'cg-1', contaPaiId: null, contaGerencialCodigo: '1', contaGerencialDescricao: 'Despesa', valorMeta: 1000, valorRealizado: 1500, percentualConsumido: 150, estourado: true, aceitaLancamentos: true }]
    });
    const { container } = render(<DashboardRealizadoVsPlanejado contasGerenciais={contas} orcamento={orcamento} />);
    expect(container.querySelector('.bg-error')).toBeInTheDocument();
    expect(container.querySelector('.text-error')).toBeInTheDocument();
  });

  it('renders fallback bar (no meta) for item without meta', () => {
    const contas = [makeContaGerencial({ contaGerencialId: 'cg-1' })];
    render(<DashboardRealizadoVsPlanejado contasGerenciais={contas} orcamento={undefined} />);
    expect(screen.getByText('Despesa Operacional')).toBeInTheDocument();
    expect(screen.queryByText(/\d+%$/)).not.toBeInTheDocument();
  });

  it('shows meta value next to realized amount', () => {
    const contas = [makeContaGerencial({ contaGerencialId: 'cg-1', valorTotal: 500 })];
    const orcamento = makeOrcamento({
      itens: [{ metaId: 'm1', contaGerencialId: 'cg-1', contaPaiId: null, contaGerencialCodigo: '1', contaGerencialDescricao: 'Despesa', valorMeta: 1000, valorRealizado: 500, percentualConsumido: 50, estourado: false, aceitaLancamentos: true }]
    });
    render(<DashboardRealizadoVsPlanejado contasGerenciais={contas} orcamento={orcamento} />);
    expect(screen.getByText(/\/.*R\$/)).toBeInTheDocument();
  });

  it('slices to top 6 expenses sorted descending by value', () => {
    const contas = Array.from({ length: 8 }, (_, i) =>
      makeContaGerencial({ contaGerencialId: `cg-${i}`, descricao: `Despesa ${i}`, valorTotal: i * 100 })
    );
    render(<DashboardRealizadoVsPlanejado contasGerenciais={contas} orcamento={undefined} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(6);
    expect(screen.getByText('Despesa 7')).toBeInTheDocument();
    expect(screen.queryByText('Despesa 0')).not.toBeInTheDocument();
    expect(screen.queryByText('Despesa 1')).not.toBeInTheDocument();
  });

  it('ignores orcamento items with null valorMeta', () => {
    const contas = [makeContaGerencial({ contaGerencialId: 'cg-1', valorTotal: 500 })];
    const orcamento = makeOrcamento({
      itens: [{ metaId: null, contaGerencialId: 'cg-1', contaPaiId: null, contaGerencialCodigo: '1', contaGerencialDescricao: 'Despesa', valorMeta: null, valorRealizado: 500, percentualConsumido: null, estourado: false, aceitaLancamentos: true }]
    });
    render(<DashboardRealizadoVsPlanejado contasGerenciais={contas} orcamento={orcamento} />);
    expect(screen.getByText(/Configure metas em/i)).toBeInTheDocument();
  });

  it('handles undefined orcamento gracefully', () => {
    const contas = [makeContaGerencial()];
    render(<DashboardRealizadoVsPlanejado contasGerenciais={contas} orcamento={undefined} />);
    expect(screen.getByText('Despesa Operacional')).toBeInTheDocument();
  });

  it('caps progress bar width at 100% when over 100', () => {
    const contas = [makeContaGerencial({ contaGerencialId: 'cg-1', valorTotal: 2000 })];
    const orcamento = makeOrcamento({
      itens: [{ metaId: 'm1', contaGerencialId: 'cg-1', contaPaiId: null, contaGerencialCodigo: '1', contaGerencialDescricao: 'Despesa', valorMeta: 1000, valorRealizado: 2000, percentualConsumido: 200, estourado: true, aceitaLancamentos: true }]
    });
    const { container } = render(<DashboardRealizadoVsPlanejado contasGerenciais={contas} orcamento={orcamento} />);
    const bar = container.querySelector('.bg-error') as HTMLElement;
    expect(bar?.style.width).toBe('100%');
  });
});
