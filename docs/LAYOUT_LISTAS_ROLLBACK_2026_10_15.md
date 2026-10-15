# Listas mais legíveis e prioridade do dashboard — 2026-10-15

## Escopo

Contas a pagar e receber: área de conteúdo limitada a 1560 px em monitores largos para aproximar colunas; tipografia principal de 16 px; linhas com 8 px de padding vertical; nomes e descrições podem quebrar linha. Totalizadores e filtros acompanham a largura da lista. Mantidos todos os campos, ações e o layout mobile em cards. Estilos isolados em financial-list-layout.css, sem alterar AppDataTable globalmente.

Dashboard: KPIs e contas/faturas antes das análises, mantendo alerta de vencidas no topo. Rótulo corrigido para contas pendentes (não faturas). Sem alteração de cálculo, API, banco ou cadastro de pessoas.

## Baseline e rollback

Base imutável: 0ff2f38201a78694b32772fac464c9e828ba611c (main).
Branch isolada: codex/listas-legibilidade-rollback.

A entrega funcional fica em um commit próprio, cujo título é `fix(ui): compact financial lists and prioritize dashboard balances`.
Para reverter depois de integrar, criar uma branch de correção a partir da versão vigente e executar `git revert <SHA desse commit>`; se a integração tiver sido squash, usar o SHA do squash. Executar os gates e promover develop para main. Não usar reset/force-push e não restaurar main inteiro: isso descartaria mudanças posteriores.

Em incidente de produção, restaurar o deployment anterior confirmado no Vercel e também integrar o revert no Git para que o próximo deploy não reaplique o ajuste. Não há migration nem rollback de dados. No PWA, confirmar atualização do service worker e reabrir o aplicativo para verificar a versão restaurada.

Rollback parcial da densidade: remover o import de financial-list-layout.css e reverter as classes do wrapper/grid em FinancialAccountListPage.tsx. Para restaurar a ordem do dashboard, reverter DashboardPage.tsx. Preferir o revert integral para voltar exatamente à apresentação anterior.

## Validação

TDD: teste do rótulo contas pendentes falhou antes da correção. Regressão: 150 arquivos e 1457 testes passaram com --maxWorkers=2. A primeira execução irrestrita teve timeout em um teste de importação WhatsApp; a repetição completa passou sem mudar teste ou timeout. Cobertura: statements 85,78%; branches 80,57%; functions 82,19%; lines 87,97%. Lint, build, auditoria e contratos passaram. A checagem de contratos exigiu normalizar CRLF para LF no checkout Windows, sem diferença de conteúdo. Dependências locais reutilizadas; CI deve confirmar instalação pelo lockfile.
Capturas com dados fictícios em 2492x1069, 1440x1000 e 390x844. Sem exceções JavaScript e sem overflow horizontal do documento nos cenários verificados. A tabela larga passou a medir 1558 px em vez de ocupar toda a área disponível de 2236 px (incluindo padding do conteúdo). O mobile mantém os controles existentes; não foi validada instalação/offline de PWA nesta etapa.

Gates de publicação: CI da PR, develop verde, main verde, deploy Vercel por SHA e smoke. Não considerar a implementação publicada até concluir essas etapas.

