import type { RouteObject } from 'react-router-dom';
import { MasterDataFormPage } from '../features/cadastros/MasterDataFormPage';
import { MasterDataListPage } from '../features/cadastros/MasterDataListPage';
import {
  cartoesModuleConfig,
  contasBancariasModuleConfig,
  contasGerenciaisModuleConfig,
  formasPagamentoModuleConfig,
  pessoasModuleConfig
} from '../features/cadastros/module-config';
import { ModulePlaceholderPage } from '../pages/ModulePlaceholderPage';

type PlaceholderRouteDefinition = {
  path: string;
  title: string;
  summary: string;
  phase: number;
};

const placeholderRoutes: PlaceholderRouteDefinition[] = [
  { path: 'contas-pagar', title: 'Contas a pagar', summary: 'Modulo previsto para a fase 3.', phase: 3 },
  { path: 'contas-pagar/nova', title: 'Nova conta a pagar', summary: 'Formulario previsto para a fase 3.', phase: 3 },
  { path: 'contas-pagar/:id', title: 'Detalhe de conta a pagar', summary: 'Edicao prevista para a fase 3.', phase: 3 },
  { path: 'contas-receber', title: 'Contas a receber', summary: 'Modulo previsto para a fase 3.', phase: 3 },
  { path: 'contas-receber/nova', title: 'Nova conta a receber', summary: 'Formulario previsto para a fase 3.', phase: 3 },
  { path: 'contas-receber/:id', title: 'Detalhe de conta a receber', summary: 'Edicao prevista para a fase 3.', phase: 3 },
  { path: 'movimentacoes', title: 'Movimentacoes', summary: 'Modulo previsto para a fase 3.', phase: 3 },
  { path: 'faturas', title: 'Faturas', summary: 'Modulo previsto para a fase 4.', phase: 4 },
  { path: 'faturas/:id', title: 'Detalhe de fatura', summary: 'Visao detalhada prevista para a fase 4.', phase: 4 },
  { path: 'importacoes-whatsapp', title: 'Importacoes WhatsApp', summary: 'Modulo previsto para a fase 7.', phase: 7 },
  { path: 'importacoes-whatsapp/:id', title: 'Detalhe da importacao', summary: 'Revisao prevista para a fase 7.', phase: 7 },
  { path: 'conciliacao', title: 'Conciliacao', summary: 'Modulo previsto para a fase 8.', phase: 8 }
];

export const placeholderRouteObjects: RouteObject[] = placeholderRoutes.map((route) => ({
  path: route.path,
  element: <ModulePlaceholderPage title={route.title} summary={route.summary} phase={route.phase} />,
  handle: {
    title: route.title
  }
}));

export const supportRegistryRouteObjects: RouteObject[] = [
  {
    path: 'pessoas',
    element: <MasterDataListPage config={pessoasModuleConfig} />,
    handle: {
      title: 'Pessoas'
    }
  },
  {
    path: 'pessoas/nova',
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
      title: 'Contas bancarias'
    }
  },
  {
    path: 'contas-bancarias/novo',
    element: <MasterDataFormPage config={contasBancariasModuleConfig} />,
    handle: {
      title: 'Nova conta bancaria'
    }
  },
  {
    path: 'contas-bancarias/:id',
    element: <MasterDataFormPage config={contasBancariasModuleConfig} />,
    handle: {
      title: 'Detalhe de conta bancaria'
    }
  },
  {
    path: 'cartoes',
    element: <MasterDataListPage config={cartoesModuleConfig} />,
    handle: {
      title: 'Cartoes'
    }
  },
  {
    path: 'cartoes/novo',
    element: <MasterDataFormPage config={cartoesModuleConfig} />,
    handle: {
      title: 'Novo cartao'
    }
  },
  {
    path: 'cartoes/:id',
    element: <MasterDataFormPage config={cartoesModuleConfig} />,
    handle: {
      title: 'Detalhe de cartao'
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
