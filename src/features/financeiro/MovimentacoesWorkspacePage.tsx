import { useNavigate } from 'react-router-dom';
import { ArrowDownOutlined, ArrowUpOutlined, SwapOutlined } from '@ant-design/icons';

import { FinancialAccountListPage } from './FinancialAccountListPage';
import { MovimentacoesPage } from './MovimentacoesPage';
import { contasPagarModuleConfig, contasReceberModuleConfig } from './module-config';

export type MovimentacoesTab = 'pagar' | 'receber' | 'extrato';

type TabMeta = {
  key: MovimentacoesTab;
  label: string;
  icon: React.ReactNode;
  route: string;
  title: string;
  description: string;
};

const tabs: TabMeta[] = [
  {
    key: 'pagar',
    label: 'A pagar',
    icon: <ArrowUpOutlined />,
    route: '/contas-pagar',
    title: 'Contas a pagar',
    description: 'Gerenciamento de obrigações e fluxo de saída.'
  },
  {
    key: 'receber',
    label: 'A receber',
    icon: <ArrowDownOutlined />,
    route: '/contas-receber',
    title: 'Contas a receber',
    description: 'Gerenciamento de recebíveis e fluxo de entrada.'
  },
  {
    key: 'extrato',
    label: 'Extrato',
    icon: <SwapOutlined />,
    route: '/movimentacoes',
    title: 'Extrato de Movimentações',
    description: 'Histórico realizado de entradas e saídas, incluindo lançamentos avulsos e faturas.'
  }
];

export function MovimentacoesWorkspacePage({ initialTab }: { initialTab: MovimentacoesTab }) {
  const navigate = useNavigate();
  const activeTab = tabs.find((tab) => tab.key === initialTab) ?? tabs[0];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Tabs */}
      <div className="flex w-full gap-2 rounded-2xl bg-surface-container-low p-1.5 border border-white/5 sm:w-fit">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => navigate(tab.route)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all sm:flex-none ${
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/40'
                  : 'text-on-surface-variant hover:text-white border border-transparent'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab.key === 'pagar' && (
        <FinancialAccountListPage key="pagar" config={contasPagarModuleConfig} />
      )}
      {activeTab.key === 'receber' && (
        <FinancialAccountListPage key="receber" config={contasReceberModuleConfig} />
      )}
      {activeTab.key === 'extrato' && <MovimentacoesPage key="extrato" />}
    </div>
  );
}
