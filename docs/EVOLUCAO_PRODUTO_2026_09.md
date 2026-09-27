# Evolução do produto — setembro/2026

O backlog completo e a análise de negócio estão nos documentos `docs/38_ANALISE_NEGOCIO_PRODUTO_WEB_PWA_2026_09.md` e `docs/39_STATUS_EVOLUCAO_PRODUTO_2026_09.md` do workspace.

## Onda 1 validada localmente

- **NEG-01:** orçamento, faturas e total por cartão seguem o mês selecionado no dashboard.
- **NEG-03:** o simulador não recomenda uma compra quando não há receita informada.
- **NEG-04:** o CI passa a executar smoke tests Playwright em desktop e mobile.
- **NEG-05:** o PWA passa a ter ícones PNG completos, inclusive maskable, e notificações deixam de apontar para arquivo inexistente.

## Validação obrigatória

- testes unitários e cobertura mínima de 80%;
- lint, contratos, typecheck, auditoria e build;
- validação automática do manifesto e dos ícones PWA;
- Playwright desktop e mobile;
- promoção por `develop` antes de `main`.

## Evidência local

- 1.386 testes unitários aprovados;
- cobertura de 85,51% statements, 80,17% branches, 82,07% functions e 87,63% lines;
- 6 testes Playwright aprovados em desktop e mobile;
- lint sem erros, contratos, auditoria, typecheck, build e checagem PWA aprovados.

## Onda 2 em desenvolvimento

- **NEG-02:** a tela usa o diagnóstico oficial do backend, mostra receitas, despesas, saldo e bloqueios e permite fechar ou reabrir a competência.
- **NEG-02, auditoria:** a reabertura exige justificativa; o servidor registra responsáveis, datas e o snapshot financeiro de cada fechamento.
- **NEG-07:** pendências, vencimentos, ausência de categoria, ausência de responsável e conciliações em revisão fazem parte do relatório calculado pelo backend.
- **Status:** implementação integrada e validada nos testes focados; quality gates completos e publicação ainda pendentes.
