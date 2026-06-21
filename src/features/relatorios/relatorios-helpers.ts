import type { RecorrenciaListItem } from '../../types/financeiro';
import type { PagedFinanceiro } from '../../types/financeiro';
import {
  MAX_REPORT_ROWS,
  origemLabels,
  statusLabels,
  type ReportKey,
  type ReportState
} from './relatorios-config';
import type { ReportWorkbookDefinition } from './report-export';

export function getCurrentReferenceMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthRange(referenceMonth: string) {
  const [year, month] = referenceMonth.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

export function emptyPaged<T, TSummary = unknown>(summary?: TSummary): PagedFinanceiro<T, TSummary> {
  return {
    items: [],
    page: 1,
    pageSize: MAX_REPORT_ROWS,
    totalItems: 0,
    totalPages: 0,
    summary: summary as TSummary
  };
}

export function daysOverdue(date: string) {
  const due = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86_400_000));
}

export function agingBucket(days: number) {
  if (days <= 7) return 'Até 7 dias';
  if (days <= 15) return '8 a 15 dias';
  if (days <= 30) return '16 a 30 dias';
  return 'Acima de 30 dias';
}

export function getRecorrenciaTipoLabel(tipo: RecorrenciaListItem['contaOrigemTipo']) {
  return tipo === 'ContaPagar' ? 'A pagar' : 'A receber';
}

export function exportarPdf() {
  window.print();
}

export function buildInadimplenciaRows(data: ReportState) {
  const pagar =
    data.contasPagarVencidas?.items.map((item) => ({
      id: item.id,
      tipo: 'A pagar',
      descricao: item.descricao,
      pessoa: item.recebedorNome,
      vencimento: item.dataVencimento,
      valor: item.valorLiquido,
      status: item.statusNome,
      dias: daysOverdue(item.dataVencimento)
    })) ?? [];

  const receber =
    data.contasReceberVencidas?.items.map((item) => ({
      id: item.id,
      tipo: 'A receber',
      descricao: item.descricao,
      pessoa: item.pagadorNome,
      vencimento: item.dataVencimento,
      valor: item.valorLiquido,
      status: item.statusNome,
      dias: daysOverdue(item.dataVencimento)
    })) ?? [];

  return [...pagar, ...receber].sort((a, b) => b.dias - a.dias || a.vencimento.localeCompare(b.vencimento));
}

export function buildExportDefinition(
  activeReport: ReportKey,
  referenceMonth: string,
  data: ReportState
): ReportWorkbookDefinition {
  const filters: Array<[string, string]> = [['Mês de referência', referenceMonth]];

  if (activeReport === 'responsaveis') {
    return {
      title: 'Relatório por responsáveis',
      filename: `relatorio-responsaveis-${referenceMonth}`,
      sheets: [
        {
          name: 'Responsáveis',
          title: 'Relatório por responsáveis',
          filters,
          rows:
            data.responsaveis?.itens.map((item) => ({
              Responsável: item.responsavelNome,
              Despesas: item.totalDespesas,
              'Despesas cartão': item.totalDespesasCartao,
              Receitas: item.totalReceitas,
              Saldo: item.saldoLiquido,
              Lançamentos: item.quantidadeLancamentos
            })) ?? []
        }
      ]
    };
  }

  if (activeReport === 'contas-gerenciais') {
    return {
      title: 'Relatório por contas gerenciais',
      filename: `relatorio-contas-gerenciais-${referenceMonth}`,
      sheets: [
        {
          name: 'Contas gerenciais',
          title: 'Relatório por contas gerenciais',
          filters,
          rows:
            data.contasGerenciais?.itens.map((item) => ({
              Código: item.codigo ?? '',
              Descrição: item.descricao,
              Tipo: item.tipo,
              Valor: item.valorTotal,
              Lançamentos: item.quantidadeLancamentos,
              'Última movimentação': item.ultimaDataLancamento
            })) ?? []
        }
      ]
    };
  }

  if (activeReport === 'fluxo-caixa') {
    return {
      title: 'Relatório de fluxo de caixa',
      filename: `relatorio-fluxo-caixa-${referenceMonth}`,
      sheets: [
        {
          name: 'Fluxo de caixa',
          title: 'Relatório de fluxo de caixa',
          filters,
          rows:
            data.fluxoCaixa?.itens.map((item) => ({
              Data: item.data,
              'Saldo inicial': item.saldoInicial,
              Entradas: item.entradasPrevistas,
              Saídas: item.saidasPrevistas,
              'Saldo final': item.saldoFinalPrevisto,
              Risco: item.riscoSaldoNegativo ? 'Saldo negativo' : 'Normal'
            })) ?? []
        }
      ]
    };
  }

  if (activeReport === 'previsoes') {
    return {
      title: 'Relatório de previsões',
      filename: `relatorio-previsoes-${referenceMonth}`,
      sheets: [
        {
          name: 'Previsões',
          title: 'Relatório de previsões',
          filters,
          rows:
            data.previsoes?.itens.map((item) => ({
              Data: item.data,
              Origem: origemLabels[item.origem],
              Status: statusLabels[item.status],
              Tipo: item.tipoMovimentacao,
              Itens: item.quantidadeItens,
              Valor: item.valorTotal
            })) ?? []
        }
      ]
    };
  }

  if (activeReport === 'inadimplencia') {
    return {
      title: 'Relatório de inadimplência',
      filename: `relatorio-inadimplencia-${referenceMonth}`,
      sheets: [
        {
          name: 'Inadimplência',
          title: 'Relatório de inadimplência',
          filters,
          rows: buildInadimplenciaRows(data).map((item) => ({
            Tipo: item.tipo,
            Descrição: item.descricao,
            Pessoa: item.pessoa,
            Vencimento: item.vencimento,
            'Dias em atraso': item.dias,
            Faixa: agingBucket(item.dias),
            Status: item.status,
            Valor: item.valor
          }))
        }
      ]
    };
  }

  if (activeReport === 'faturas') {
    return {
      title: 'Relatório de faturas',
      filename: `relatorio-faturas-${referenceMonth}`,
      sheets: [
        {
          name: 'Faturas',
          title: 'Relatório de faturas',
          filters,
          rows:
            data.faturas?.items.map((item) => ({
              Cartão: item.cartaoNome,
              Competência: item.competencia,
              Fechamento: item.dataFechamento,
              Vencimento: item.dataVencimento,
              Status: item.statusNome,
              Itens: item.quantidadeItens,
              Valor: item.valorTotal
            })) ?? []
        }
      ]
    };
  }

  if (activeReport === 'recorrencias') {
    return {
      title: 'Relatório de recorrências',
      filename: `relatorio-recorrencias-${referenceMonth}`,
      sheets: [
        {
          name: 'Recorrências',
          title: 'Relatório de recorrências',
          filters,
          rows:
            data.recorrencias?.items.map((item) => ({
              Tipo: getRecorrenciaTipoLabel(item.contaOrigemTipo),
              Descrição: item.descricao,
              Pessoa: item.pessoaNome,
              Responsável: item.responsavelNome ?? '',
              Valor: item.valorLiquido,
              Início: item.dataInicio,
              Fim: item.dataFim ?? '',
              Dia: item.diaOrdemMensal,
              Ativa: item.ativa ? 'Sim' : 'Não'
            })) ?? []
        }
      ]
    };
  }

  if (activeReport === 'compras') {
    return {
      title: 'Relatório de compras planejadas',
      filename: `relatorio-compras-planejadas-${referenceMonth}`,
      sheets: [
        {
          name: 'Compras planejadas',
          title: 'Relatório de compras planejadas',
          filters,
          rows:
            data.compras?.items.map((item) => ({
              Título: item.titulo,
              Responsável: item.responsavelNome,
              'Conta gerencial': item.contaGerencialDescricao,
              Prioridade: item.prioridade,
              Status: item.status,
              'Data desejada': item.dataDesejada ?? '',
              Parcelável: item.parcelavel ? 'Sim' : 'Não',
              Parcelas: item.quantidadeParcelasDesejada ?? '',
              Valor: item.valorEstimado,
              Link: item.link ?? ''
            })) ?? []
        }
      ]
    };
  }

  return {
    title: 'Relatório financeiro geral',
    filename: `relatorio-geral-${referenceMonth}`,
    sheets: [
      {
        name: 'Contas vencidas',
        title: 'Relatório financeiro geral',
        filters,
        rows:
          data.resumo?.contasVencidas.map((item) => ({
            Descrição: item.descricao,
            Pessoa: item.pessoaNome,
            Vencimento: item.dataVencimento,
            Status: item.statusNome,
            Valor: item.valor
          })) ?? []
      },
      {
        name: 'Movimentações recentes',
        title: 'Movimentações recentes',
        filters,
        rows:
          data.resumo?.movimentacoesRecentes.map((item) => ({
            Data: item.dataMovimentacao,
            Tipo: item.tipo,
            Natureza: item.natureza,
            Observação: item.observacao ?? '',
            Valor: item.valor
          })) ?? []
      }
    ]
  };
}
