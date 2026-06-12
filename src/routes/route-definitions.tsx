import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { formasPagamentoModuleConfig, pessoasModuleConfig } from '../features/cadastros/module-config';
import { contasPagarModuleConfig, contasReceberModuleConfig } from '../features/financeiro/module-config';

const MasterDataFormPage = lazy(() => import('../features/cadastros/MasterDataFormPage').then((m) => ({ default: m.MasterDataFormPage })));
const MasterDataListPage = lazy(() => import('../features/cadastros/MasterDataListPage').then((m) => ({ default: m.MasterDataListPage })));
const ContasBancariasFormPage = lazy(() => import('../features/cadastros/ContasBancariasFormPage').then((m) => ({ default: m.ContasBancariasFormPage })));
const ContasBancariasListPage = lazy(() => import('../features/cadastros/ContasBancariasListPage').then((m) => ({ default: m.ContasBancariasListPage })));
const CartoesFormPage = lazy(() => import('../features/cadastros/CartoesFormPage').then((m) => ({ default: m.CartoesFormPage })));
const CartoesListPage = lazy(() => import('../features/cadastros/CartoesListPage').then((m) => ({ default: m.CartoesListPage })));
const ContasGerenciaisFormPage = lazy(() => import('../features/cadastros/ContasGerenciaisFormPage').then((m) => ({ default: m.ContasGerenciaisFormPage })));
const ContasGerenciaisListPage = lazy(() => import('../features/cadastros/ContasGerenciaisListPage').then((m) => ({ default: m.ContasGerenciaisListPage })));
const ComprasPlanejadasListPage = lazy(() => import('../features/compras-planejadas/ComprasPlanejadasListPage').then((m) => ({ default: m.ComprasPlanejadasListPage })));
const NovaCompraPlanejadaPage = lazy(() => import('../features/compras-planejadas/NovaCompraPlanejadaPage').then((m) => ({ default: m.NovaCompraPlanejadaPage })));
const RealizarCompraPlanejadaPage = lazy(() => import('../features/compras-planejadas/RealizarCompraPlanejadaPage').then((m) => ({ default: m.RealizarCompraPlanejadaPage })));
const ConciliacaoPage = lazy(() => import('../features/conciliacao/ConciliacaoPage').then((m) => ({ default: m.ConciliacaoPage })));
const FinancialAccountFormPage = lazy(() => import('../features/financeiro/FinancialAccountFormPage').then((m) => ({ default: m.FinancialAccountFormPage })));
const FinancialAccountListPage = lazy(() => import('../features/financeiro/FinancialAccountListPage').then((m) => ({ default: m.FinancialAccountListPage })));
const FaturaDetailPage = lazy(() => import('../features/financeiro/FaturaDetailPage').then((m) => ({ default: m.FaturaDetailPage })));
const FaturasPage = lazy(() => import('../features/financeiro/FaturasPage').then((m) => ({ default: m.FaturasPage })));
const MovimentacoesPage = lazy(() => import('../features/financeiro/MovimentacoesPage').then((m) => ({ default: m.MovimentacoesPage })));
const ImportacaoWhatsappDetailPage = lazy(() => import('../features/importacoes-whatsapp/ImportacaoWhatsappDetailPage').then((m) => ({ default: m.ImportacaoWhatsappDetailPage })));
const ImportacoesWhatsappPage = lazy(() => import('../features/importacoes-whatsapp/ImportacoesWhatsappPage').then((m) => ({ default: m.ImportacoesWhatsappPage })));
const RecurrenceListPage = lazy(() => import('../features/financeiro/RecurrenceListPage'));

export const placeholderRouteObjects: RouteObject[] = [];

export const supportRegistryRouteObjects: RouteObject[] = [
  {
    path: 'pessoas',
    element: <MasterDataListPage config={pessoasModuleConfig} />,
    handle: {
      title: 'Pessoas'
    }
  },
  {
    path: 'pessoas/novo',
    element: <MasterDataFormPage config={pessoasModuleConfig} />,
    handle: {
      title: 'Nova pessoa'
    }
  },
  {
    path: 'pessoas/:id',
    element: <MasterDataFormPage config={pessoasModuleConfig} />,
    handle: {
      title: 'Detalhe de pessoa'
    }
  },
  {
    path: 'formas-pagamento',
    element: <MasterDataListPage config={formasPagamentoModuleConfig} />,
    handle: {
      title: 'Formas de pagamento'
    }
  },
  {
    path: 'formas-pagamento/novo',
    element: <MasterDataFormPage config={formasPagamentoModuleConfig} />,
    handle: {
      title: 'Nova forma de pagamento'
    }
  },
  {
    path: 'formas-pagamento/:id',
    element: <MasterDataFormPage config={formasPagamentoModuleConfig} />,
    handle: {
      title: 'Detalhe de forma de pagamento'
    }
  },
  {
    path: 'contas-bancarias',
    element: <ContasBancariasListPage />,
    handle: {
      title: 'Contas bancarias'
    }
  },
  {
    path: 'contas-bancarias/novo',
    element: <ContasBancariasFormPage />,
    handle: {
      title: 'Nova conta bancaria'
    }
  },
  {
    path: 'contas-bancarias/:id',
    element: <ContasBancariasFormPage />,
    handle: {
      title: 'Detalhe de conta bancaria'
    }
  },
  {
    path: 'cartoes',
    element: <CartoesListPage />,
    handle: {
      title: 'Cartoes'
    }
  },
  {
    path: 'cartoes/novo',
    element: <CartoesFormPage />,
    handle: {
      title: 'Novo cartao'
    }
  },
  {
    path: 'cartoes/:id',
    element: <CartoesFormPage />,
    handle: {
      title: 'Detalhe de cartao'
    }
  },
  {
    path: 'contas-gerenciais',
    element: <ContasGerenciaisListPage />,
    handle: {
      title: 'Contas gerenciais'
    }
  },
  {
    path: 'contas-gerenciais/novo',
    element: <ContasGerenciaisFormPage />,
    handle: {
      title: 'Nova conta gerencial'
    }
  },
  {
    path: 'contas-gerenciais/:id',
    element: <ContasGerenciaisFormPage />,
    handle: {
      title: 'Detalhe de conta gerencial'
    }
  }
];

export const comprasPlanejadasRouteObjects: RouteObject[] = [
  {
    index: true,
    element: <ComprasPlanejadasListPage />,
    handle: {
      title: 'Planejador de compras'
    }
  },
  {
    path: 'nova',
    element: <NovaCompraPlanejadaPage />,
    handle: {
      title: 'Nova compra planejada'
    }
  },
  {
    path: ':id',
    element: <NovaCompraPlanejadaPage />,
    handle: {
      title: 'Detalhe de compra planejada'
    }
  },
  {
    path: ':id/realizar',
    element: <RealizarCompraPlanejadaPage />,
    handle: {
      title: 'Realizar compra planejada'
    }
  }
];

export const financialRouteObjects: RouteObject[] = [
  {
    path: 'contas-pagar',
    element: <FinancialAccountListPage config={contasPagarModuleConfig} />,
    handle: {
      title: 'Contas a pagar'
    }
  },
  {
    path: 'contas-pagar/nova',
    element: <FinancialAccountFormPage config={contasPagarModuleConfig} />,
    handle: {
      title: 'Nova conta a pagar'
    }
  },
  {
    path: 'contas-pagar/:id',
    element: <FinancialAccountFormPage config={contasPagarModuleConfig} />,
    handle: {
      title: 'Detalhe de conta a pagar'
    }
  },
  {
    path: 'contas-receber',
    element: <FinancialAccountListPage config={contasReceberModuleConfig} />,
    handle: {
      title: 'Contas a receber'
    }
  },
  {
    path: 'contas-receber/nova',
    element: <FinancialAccountFormPage config={contasReceberModuleConfig} />,
    handle: {
      title: 'Nova conta a receber'
    }
  },
  {
    path: 'contas-receber/:id',
    element: <FinancialAccountFormPage config={contasReceberModuleConfig} />,
    handle: {
      title: 'Detalhe de conta a receber'
    }
  },
  {
    path: 'movimentacoes',
    element: <MovimentacoesPage />,
    handle: {
      title: 'Movimentacoes'
    }
  },
  {
    path: 'faturas',
    element: <FaturasPage />,
    handle: {
      title: 'Faturas'
    }
  },
  {
    path: 'faturas/:id',
    element: <FaturaDetailPage />,
    handle: {
      title: 'Detalhe de fatura'
    }
  },
  {
    path: 'importacoes-whatsapp',
    element: <ImportacoesWhatsappPage />,
    handle: {
      title: 'Importacoes WhatsApp'
    }
  },
  {
    path: 'importacoes-whatsapp/:id',
    element: <ImportacaoWhatsappDetailPage />,
    handle: {
      title: 'Revisao da importacao'
    }
  },
  {
    path: 'conciliacao',
    element: <ConciliacaoPage />,
    handle: {
      title: 'Conciliacao'
    }
  },
  {
    path: 'recorrencias',
    element: <RecurrenceListPage />,
    handle: {
      title: 'Gestao de recorrencias'
    }
  }
];
