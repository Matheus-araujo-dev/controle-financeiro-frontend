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
      { key: '/orcamento', label: 'Orçamento' },
      { key: '/relatorios', label: 'Relatórios' },
      { key: '/agenda', label: 'Agenda' }
    ]
  },
  {
    key: 'lancamentos',
    label: 'Lançamentos',
    items: [
      { key: '/movimentacoes', label: 'Movimentações', aliases: ['/contas-pagar', '/contas-receber'] },
      { key: '/recorrencias', label: 'Recorrências' },
      { key: '/faturas', label: 'Faturas' },
      { key: '/importacoes-whatsapp', label: 'Importações WhatsApp' }
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
      { key: '/contas-gerenciais', label: 'Contas gerenciais' }
    ]
  },
  {
    key: 'planejamento',
    label: 'Planejamento',
    items: [
      { key: '/planos', label: 'Planos de poupança' },
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
      { key: '/familia', label: 'Espaços' }
    ]
  }
];

export const navigationItems = navigationStructure.flatMap(g => g.items);
