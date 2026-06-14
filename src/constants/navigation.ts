export type NavItem = {
  key: string;
  label: string;
  icon?: string;
  // Rotas adicionais que devem destacar este item no menu (ex.: abas que mudam a URL).
  aliases?: string[];
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
      { key: '/movimentacoes', label: 'Movimentações', aliases: ['/contas-pagar', '/contas-receber'] },
      { key: '/recorrencias', label: 'Recorrências' },
      { key: '/faturas', label: 'Faturas' },
      { key: '/faturas/importar', label: 'Importar fatura CSV' },
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
    key: 'agente',
    label: 'Agente IA',
    items: [
      { key: '/agente/chat', label: 'Chat financeiro' },
      { key: '/agente/whatsapp', label: 'Vínculo WhatsApp' }
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
