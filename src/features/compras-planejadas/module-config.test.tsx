import { render, screen } from '@testing-library/react';
import { comprasPlanejadasModuleConfig } from './module-config';
import { cadastrosApi } from '../../services/http/cadastros-api';
import { comprasPlanejadasApi } from '../../services/http/compras-planejadas-api';

vi.mock('../../services/http/cadastros-api', () => ({
  cadastrosApi: {
    pessoas: {
      listar: vi.fn()
    },
    contasGerenciais: {
      listar: vi.fn()
    }
  }
}));

vi.mock('../../services/http/compras-planejadas-api', () => ({
  comprasPlanejadasApi: {
    listar: vi.fn(),
    obterPorId: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    realizar: vi.fn()
  }
}));

describe('compras planejadas module config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps detail payloads to form values and loads options', async () => {
    expect(
      comprasPlanejadasModuleConfig.toFormValues({
        id: 'cp-1',
        titulo: 'Notebook novo',
        descricao: null,
        valorEstimado: 4500,
        dataDesejada: '2026-11-20',
        prioridade: 'Alta',
        status: 'Planejada',
        parcelavel: true,
        quantidadeParcelasDesejada: 10,
        contaGerencialId: 'cg-1',
        contaGerencialDescricao: 'Tecnologia',
        responsavelId: 'p-1',
        responsavelNome: 'Michelle',
        link: 'https://loja.exemplo.com/produto/notebook',
        contaPagarGeradaId: null,
        convertidaEmContaPagarEmUtc: null,
        observacao: null,
        createdAtUtc: '',
        updatedAtUtc: ''
      })
    ).toEqual({
      titulo: 'Notebook novo',
      descricao: '',
      valorEstimado: 4500,
      dataDesejada: '2026-11-20',
      prioridade: 'Alta',
      status: 'Planejada',
      parcelavel: true,
      quantidadeParcelasDesejada: 10,
      contaGerencialId: 'cg-1',
      responsavelId: 'p-1',
      link: 'https://loja.exemplo.com/produto/notebook',
      observacao: ''
    });

    vi.mocked(cadastrosApi.contasGerenciais.listar).mockResolvedValue({
      items: [
        {
          id: 'cg-2',
          codigo: 'DES.02.04',
          descricao: 'Lanches e delivery',
          tipo: 'Despesa',
          contaPaiId: 'cg-parent',
          contaPaiDescricao: 'Despesas',
          ativo: true,
          aceitaLancamentos: true
        },
        { id: 'cg-parent', codigo: 'DESP', descricao: 'Despesas', tipo: 'Despesa', contaPaiId: null, contaPaiDescricao: null, ativo: true, aceitaLancamentos: false },
        {
          id: 'cg-1',
          codigo: 'DES.10.01',
          descricao: 'Tecnologia',
          tipo: 'Despesa',
          contaPaiId: 'cg-parent',
          contaPaiDescricao: 'Despesas',
          ativo: true,
          aceitaLancamentos: true
        }
      ],
      page: 1,
      pageSize: 100,
      totalItems: 3,
      totalPages: 1
    } as never);

    vi.mocked(cadastrosApi.pessoas.listar).mockResolvedValue({
      items: [{ id: 'p-1', nome: 'Michelle', tipoPessoa: 'Fisica', cpfCnpj: null, email: null, telefone: null, ativo: true }],
      page: 1,
      pageSize: 100,
      totalItems: 1,
      totalPages: 1
    } as never);

    const contaField = comprasPlanejadasModuleConfig.fields.find((field) => field.name === 'contaGerencialId');
    const responsavelField = comprasPlanejadasModuleConfig.fields.find((field) => field.name === 'responsavelId');

    await expect(contaField?.loadOptions?.()).resolves.toEqual([
      { label: 'DES.02.04 - Lanches e delivery', value: 'cg-2' },
      { label: 'DES.10.01 - Tecnologia', value: 'cg-1' }
    ]);
    await expect(responsavelField?.loadOptions?.()).resolves.toEqual([{ label: 'Michelle', value: 'p-1' }]);
    expect(cadastrosApi.contasGerenciais.listar).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'Despesa', aceitaLancamentos: true }));
  });

  it('exposes row actions for realizing or viewing the payable account', () => {
    const editarAction = comprasPlanejadasModuleConfig.rowActions?.find((action) => action.key === 'editar');
    const realizarAction = comprasPlanejadasModuleConfig.rowActions?.find((action) => action.key === 'realizar');
    const verAction = comprasPlanejadasModuleConfig.rowActions?.find((action) => action.key === 'ver-conta-pagar');

    const compraPendente = {
      id: 'cp-1',
      titulo: 'Notebook novo',
      valorEstimado: 4500,
      dataDesejada: '2026-11-20',
      prioridade: 'Alta',
      status: 'Planejada',
      parcelavel: true,
      quantidadeParcelasDesejada: 10,
      contaGerencialId: 'cg-1',
      contaGerencialDescricao: 'Tecnologia',
      responsavelId: 'p-1',
      responsavelNome: 'Michelle',
      link: null,
      contaPagarGeradaId: null,
      convertidaEmContaPagarEmUtc: null
    } as const;

    const compraConvertida = {
      ...compraPendente,
      status: 'Comprada',
      contaPagarGeradaId: 'cpagar-1',
      convertidaEmContaPagarEmUtc: '2026-04-08T12:00:00Z'
    } as const;

    expect(editarAction?.isVisible?.(compraPendente)).toBe(true);
    expect(editarAction?.href?.(compraPendente)).toBe('/compras-planejadas/cp-1');
    expect(editarAction?.isVisible?.(compraConvertida)).toBe(false);

    expect(realizarAction?.isVisible?.(compraPendente)).toBe(true);
    expect(realizarAction?.href?.(compraPendente)).toBe('/compras-planejadas/cp-1/realizar');
    expect(realizarAction?.isVisible?.(compraConvertida)).toBe(false);

    expect(verAction?.isVisible?.(compraPendente)).toBe(false);
    expect(verAction?.isVisible?.(compraConvertida)).toBe(true);
    expect(verAction?.href?.(compraConvertida)).toBe('/contas-pagar/cpagar-1');
  });

  it('indica fatura do cartao quando a compra foi realizada sem conta a pagar operacional', () => {
    const colunaContaPagar = comprasPlanejadasModuleConfig.columns.find((column) => column.key === 'contaPagarGeradaId');

    const tagPlanejada = colunaContaPagar?.render?.(null, {
      id: 'cp-1',
      titulo: 'Notebook novo',
      valorEstimado: 4500,
      dataDesejada: '2026-11-20',
      prioridade: 'Alta',
      status: 'Planejada',
      parcelavel: true,
      quantidadeParcelasDesejada: 10,
      contaGerencialId: 'cg-1',
      contaGerencialDescricao: 'Tecnologia',
      responsavelId: 'p-1',
      responsavelNome: 'Michelle',
      link: null,
      contaPagarGeradaId: null,
      convertidaEmContaPagarEmUtc: null
    } as never, 0);

    const tagCompradaNoCartao = colunaContaPagar?.render?.(null, {
      id: 'cp-2',
      titulo: 'Cadeira',
      valorEstimado: 6000,
      dataDesejada: '2026-11-20',
      prioridade: 'Alta',
      status: 'Comprada',
      parcelavel: true,
      quantidadeParcelasDesejada: 10,
      contaGerencialId: 'cg-1',
      contaGerencialDescricao: 'Tecnologia',
      responsavelId: 'p-1',
      responsavelNome: 'Michelle',
      link: null,
      contaPagarGeradaId: null,
      convertidaEmContaPagarEmUtc: null
    } as never, 0);

    render(
      <div>
        <div data-testid="planejada">{tagPlanejada as never}</div>
        <div data-testid="comprada-cartao">{tagCompradaNoCartao as never}</div>
      </div>
    );

    expect(screen.getByTestId('planejada')).toHaveTextContent('Pendente');
    expect(screen.getByTestId('comprada-cartao')).toHaveTextContent('Fatura do cart');
  });

  it('opens the listing filtered by planned status by default', () => {
    expect(comprasPlanejadasModuleConfig.defaultFilters).toMatchObject({
      page: 1,
      pageSize: 20,
      status: 'Planejada'
    });
  });

  it('executes list, create and update through the http service', async () => {
    vi.mocked(comprasPlanejadasApi.criar).mockResolvedValue({} as never);
    vi.mocked(comprasPlanejadasApi.atualizar).mockResolvedValue({} as never);

    const payload = {
      titulo: 'Notebook novo',
      descricao: 'Troca de equipamento',
      valorEstimado: 4500,
      dataDesejada: '2026-11-20',
      prioridade: 'Alta' as const,
      status: 'Planejada' as const,
      parcelavel: true,
      quantidadeParcelasDesejada: 10,
      contaGerencialId: 'cg-1',
      responsavelId: 'p-1',
      link: 'https://loja.exemplo.com/produto/notebook',
      observacao: 'Aguardar Black Friday'
    };

    await comprasPlanejadasModuleConfig.create(payload);
    await comprasPlanejadasModuleConfig.update('cp-1', payload);

    expect(comprasPlanejadasApi.criar).toHaveBeenCalledWith(payload);
    expect(comprasPlanejadasApi.atualizar).toHaveBeenCalledWith('cp-1', payload);
  });
});
