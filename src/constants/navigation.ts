export type NavItem = {
  key: string;
  label: string;
  icon?: string;
};

export type NavGroup = {
  key: string;
  label: string;
  items: NavItem[];
};

export const navigationStructure: NavGroup[] = [
  {
    key: 'geral',
    label: 'Geral',
    items: [
      { key: '/dashboard', label: 'Dashboard' },
      { key: '/orcamento', label: 'Orçamento' },
      { key: '/relatorios', label: 'Relatórios' }
    ]
  },
  {
    key: 'lancamentos',
    label: 'Lançamentos',
    items: [
      { key: '/contas-pagar', label: 'Contas a pagar' },
      { key: '/contas-receber', label: 'Contas a receber' },
      { key: '/recorrencias', label: 'Recorrências' },
      { key: '/movimentacoes', label: 'Movimentações' },
      { key: '/faturas', label: 'Faturas' },
      { key: '/importacoes-whatsapp', label: 'Importações WhatsApp' },
      { key: '/conciliacao', label: 'Conciliação' }
    ]
  },
  {
    key: 'cadastros',
    label: 'Cadastros',
    items: [
      { key: '/pessoas', label: 'Pessoas' },
      { key: '/formas-pagamento', label: 'Formas de pagamento' },
      { key: '/contas-bancarias', label: 'Contas bancárias' },
      { key: '/cartoes', label: 'Cartões' },
      { key: '/contas-gerenciais', label: 'Contas gerenciais' },
      { key: '/compras-planejadas', label: 'Planejador de compras' }
    ]
  },
  {
    key: 'conta',
    label: 'Conta',
    items: [
      { key: '/familia', label: 'Família' }
    ]
  }
];

// Para compatibilidade com quem usa o array flat
export const navigationItems = navigationStructure.flatMap(g => g.items);
