import type { RouteObject } from 'react-router-dom';
import { MasterDataFormPage } from '../features/cadastros/MasterDataFormPage';
import { MasterDataListPage } from '../features/cadastros/MasterDataListPage';
import { ConciliacaoPage } from '../features/conciliacao/ConciliacaoPage';
import {
  cartoesModuleConfig,
  contasBancariasModuleConfig,
  contasGerenciaisModuleConfig,
  formasPagamentoModuleConfig,
  pessoasModuleConfig
} from '../features/cadastros/module-config';
import { FinancialAccountFormPage } from '../features/financeiro/FinancialAccountFormPage';
import { FinancialAccountListPage } from '../features/financeiro/FinancialAccountListPage';
import { FaturaDetailPage } from '../features/financeiro/FaturaDetailPage';
import { FaturasPage } from '../features/financeiro/FaturasPage';
import { MovimentacoesPage } from '../features/financeiro/MovimentacoesPage';
import { ImportacaoWhatsappDetailPage } from '../features/importacoes-whatsapp/ImportacaoWhatsappDetailPage';
import { ImportacoesWhatsappPage } from '../features/importacoes-whatsapp/ImportacoesWhatsappPage';
import { contasPagarModuleConfig, contasReceberModuleConfig } from '../features/financeiro/module-config';
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
  }
];
