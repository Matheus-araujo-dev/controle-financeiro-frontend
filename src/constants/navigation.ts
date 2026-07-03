export type NavItem = {
  key: string;
  label: string;
  icon?: string;
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
      { key: '/orcamento', label: 'Orcamento' },
      { key: '/relatorios', label: 'Relatorios' }
    ]
  },
  {
    key: 'lancamentos',
    label: 'Lancamentos',
    items: [
      { key: '/movimentacoes', label: 'Movimentacoes', aliases: ['/contas-pagar', '/contas-receber'] },
      { key: '/recorrencias', label: 'Recorrencias' },
      { key: '/faturas', label: 'Faturas' },
      { key: '/faturas/importar', label: 'Importar fatura CSV' },
      { key: '/importacoes-whatsapp', label: 'Importacoes WhatsApp' }
    ]
  },
  {
    key: 'cadastros',
    label: 'Cadastros',
    items: [
      { key: '/pessoas', label: 'Pessoas' },
      { key: '/formas-pagamento', label: 'Formas de pagamento' },
      { key: '/contas-bancarias', label: 'Contas bancarias' },
      { key: '/cartoes', label: 'Cartoes' },
      { key: '/contas-gerenciais', label: 'Contas gerenciais' },
      { key: '/compras-planejadas', label: 'Planejador de compras' }
    ]
  },
  {
    key: 'agente',
    label: 'Agente IA',
    items: [
      { key: '/agente/chat', label: 'Chat financeiro' },
      { key: '/agente/whatsapp', label: 'Vinculo WhatsApp' }
    ]
  },
  {
    key: 'conta',
    label: 'Conta',
    items: [
      { key: '/familia', label: 'Espacos' }
    ]
  }
];

export const navigationItems = navigationStructure.flatMap(g => g.items);
