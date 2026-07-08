import type { RouteObject } from 'react-router-dom';
import { lazyWithRetry as lazy } from './lazy-with-retry';
import {
  cartoesModuleConfig,
  contasBancariasModuleConfig,
  contasGerenciaisModuleConfig,
  formasPagamentoModuleConfig,
  pessoasModuleConfig
} from '../features/cadastros/module-config';
import { contasPagarModuleConfig, contasReceberModuleConfig } from '../features/financeiro/module-config';

const MasterDataFormPage = lazy(() => import('../features/cadastros/MasterDataFormPage').then((m) => ({ default: m.MasterDataFormPage })));
const MasterDataListPage = lazy(() => import('../features/cadastros/MasterDataListPage').then((m) => ({ default: m.MasterDataListPage })));
const ComprasPlanejadasListPage = lazy(() => import('../features/compras-planejadas/ComprasPlanejadasListPage').then((m) => ({ default: m.ComprasPlanejadasListPage })));
const NovaCompraPlanejadaPage = lazy(() => import('../features/compras-planejadas/NovaCompraPlanejadaPage').then((m) => ({ default: m.NovaCompraPlanejadaPage })));
const RealizarCompraPlanejadaPage = lazy(() => import('../features/compras-planejadas/RealizarCompraPlanejadaPage').then((m) => ({ default: m.RealizarCompraPlanejadaPage })));
const FinancialAccountFormPage = lazy(() => import('../features/financeiro/FinancialAccountFormPage').then((m) => ({ default: m.FinancialAccountFormPage })));
const FaturaDetailPage = lazy(() => import('../features/financeiro/FaturaDetailPage').then((m) => ({ default: m.FaturaDetailPage })));
const FaturasPage = lazy(() => import('../features/financeiro/FaturasPage').then((m) => ({ default: m.FaturasPage })));
const MovimentacoesWorkspacePage = lazy(() => import('../features/financeiro/MovimentacoesWorkspacePage').then((m) => ({ default: m.MovimentacoesWorkspacePage })));
const ImportacaoWhatsappDetailPage = lazy(() => import('../features/importacoes-whatsapp/ImportacaoWhatsappDetailPage').then((m) => ({ default: m.ImportacaoWhatsappDetailPage })));
const ImportacoesWhatsappPage = lazy(() => import('../features/importacoes-whatsapp/ImportacoesWhatsappPage').then((m) => ({ default: m.ImportacoesWhatsappPage })));
const RecurrenceListPage = lazy(() => import('../features/financeiro/RecurrenceListPage'));
const RecurrenceDetailPage = lazy(() => import('../features/financeiro/RecurrenceDetailPage'));
const AgendaPage = lazy(() => import('../features/agenda/AgendaPage'));
const ImportarFaturaPage = lazy(() => import('../features/financeiro/ImportarFaturaPage').then((m) => ({ default: m.ImportarFaturaPage })));

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
    element: <MasterDataListPage config={contasBancariasModuleConfig} />,
    handle: {
      title: 'Contas bancárias'
    }
  },
  {
    path: 'contas-bancarias/novo',
    element: <MasterDataFormPage config={contasBancariasModuleConfig} />,
    handle: {
      title: 'Nova conta bancária'
    }
  },
  {
    path: 'contas-bancarias/:id',
    element: <MasterDataFormPage config={contasBancariasModuleConfig} />,
    handle: {
      title: 'Detalhe de conta bancária'
    }
  },
  {
    path: 'cartoes',
    element: <MasterDataListPage config={cartoesModuleConfig} />,
    handle: {
      title: 'Cartões'
    }
  },
  {
    path: 'cartoes/novo',
    element: <MasterDataFormPage config={cartoesModuleConfig} />,
    handle: {
      title: 'Novo cartão'
    }
  },
  {
    path: 'cartoes/:id',
    element: <MasterDataFormPage config={cartoesModuleConfig} />,
    handle: {
      title: 'Detalhe de cartão'
    }
  },
  {
    path: 'contas-gerenciais',
    element: <MasterDataListPage config={contasGerenciaisModuleConfig} />,
    handle: {
      title: 'Contas gerenciais'
    }
  },
  {
    path: 'contas-gerenciais/novo',
    element: <MasterDataFormPage config={contasGerenciaisModuleConfig} />,
    handle: {
      title: 'Nova conta gerencial'
    }
  },
  {
    path: 'contas-gerenciais/:id',
    element: <MasterDataFormPage config={contasGerenciaisModuleConfig} />,
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
    path: 'novo',
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
    element: <MovimentacoesWorkspacePage initialTab="pagar" />,
    handle: {
      title: 'Contas a pagar'
    }
  },
  {
    path: 'contas-pagar/novo',
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
    element: <MovimentacoesWorkspacePage initialTab="receber" />,
    handle: {
      title: 'Contas a receber'
    }
  },
  {
    path: 'contas-receber/novo',
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
    element: <MovimentacoesWorkspacePage initialTab="extrato" />,
    handle: {
      title: 'Movimentações'
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
    path: 'faturas/importar',
    element: <ImportarFaturaPage />,
    handle: {
      title: 'Importar fatura'
    }
  },
  {
    path: 'importacoes-whatsapp',
    element: <ImportacoesWhatsappPage />,
    handle: {
      title: 'Importações WhatsApp'
    }
  },
  {
    path: 'importacoes-whatsapp/:id',
    element: <ImportacaoWhatsappDetailPage />,
    handle: {
      title: 'Revisão da importação'
    }
  },
  {
    path: 'recorrencias',
    element: <RecurrenceListPage />,
    handle: {
      title: 'Gestão de recorrências'
    }
  },
  {
    path: 'recorrencias/:id',
    element: <RecurrenceDetailPage />,
    handle: {
      title: 'Detalhe de recorrência'
    }
  },
  {
    path: 'agenda',
    element: <AgendaPage />,
    handle: {
      title: 'Agenda financeira'
    }
  }
];
