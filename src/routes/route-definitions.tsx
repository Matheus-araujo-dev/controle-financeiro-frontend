import type { RouteObject } from 'react-router-dom';
import { ModulePlaceholderPage } from '../pages/ModulePlaceholderPage';

type PlaceholderRouteDefinition = {
  path: string;
  title: string;
  summary: string;
  phase: number;
};

const placeholderRoutes: PlaceholderRouteDefinition[] = [
  { path: 'pessoas', title: 'Pessoas', summary: 'Cadastro base previsto para a fase 2.', phase: 2 },
  { path: 'pessoas/nova', title: 'Nova pessoa', summary: 'Formulario previsto para a fase 2.', phase: 2 },
  { path: 'pessoas/:id', title: 'Detalhe de pessoa', summary: 'Edicao prevista para a fase 2.', phase: 2 },
  { path: 'formas-pagamento', title: 'Formas de pagamento', summary: 'Cadastro base previsto para a fase 2.', phase: 2 },
  { path: 'formas-pagamento/novo', title: 'Nova forma de pagamento', summary: 'Formulario previsto para a fase 2.', phase: 2 },
  { path: 'contas-bancarias', title: 'Contas bancarias', summary: 'Cadastro base previsto para a fase 2.', phase: 2 },
  { path: 'cartoes', title: 'Cartoes', summary: 'Cadastro base previsto para a fase 2.', phase: 2 },
  { path: 'contas-gerenciais', title: 'Contas gerenciais', summary: 'Cadastro base previsto para a fase 2.', phase: 2 },
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
