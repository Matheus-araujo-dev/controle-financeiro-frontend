# Frontend - Controle Financeiro

Frontend administrativo do sistema de controle financeiro, consolidado no fechamento do MVP e alinhado ate a `Fase 9` do workspace.

## Status do MVP

Entregas concluídas no frontend:

- shell administrativo com layout, guard de rota, cliente HTTP e estados padrao
- cadastros de apoio com listagem, filtros e formularios
- contas a pagar e contas a receber com acoes de negocio
- movimentacoes e faturas
- recorrencia nas telas financeiras
- dashboard executivo e fluxo de caixa
- revisao de importacoes WhatsApp/OCR
- conciliacao manual assistida

## Stack

- React 19
- Vite
- TypeScript
- Ant Design
- React Router DOM
- Axios
- React Hook Form + Zod
- Zustand
- Vitest + Testing Library
- lcov + SonarQube/SonarCloud

## Estrutura

```text
src/
  components/
  constants/
  features/
  layouts/
  routes/
  services/
  store/
  test/
  types/
docs/
  00_PROGRESS.md
  00_BOOTSTRAP_FRONTEND.md
  01_ESTRATEGIA_DE_TESTES_FRONTEND.md
  02_MVP_FECHAMENTO.md
```

## Rotas entregues

- `/dashboard`
- `/pessoas`
- `/formas-pagamento`
- `/contas-bancarias`
- `/cartoes`
- `/contas-gerenciais`
- `/contas-pagar`
- `/contas-receber`
- `/movimentacoes`
- `/faturas`
- `/importacoes-whatsapp`
- `/conciliacao`

## Como rodar

```powershell
npm install
npm run build
npm run test
npm run coverage
npm run quality:check
```

## Configuracao local

- copiar `.env.example` para `.env.local` quando quiser trocar a base URL da API
- valor padrao da API: `http://localhost:5000/api/v1`
- auth de desenvolvimento pode ser preparada por `VITE_AUTH_MODE=development` ou `VITE_AUTH_MODE=jwt`

## Qualidade e quality gate

- coverage em `coverage/lcov.info`
- workflow proprio em [`.github/workflows/ci.yml`](D:\Projetos\controle-financeiro\frontend\.github\workflows\ci.yml)
- Sonar preparado em [`sonar-project.properties`](D:\Projetos\controle-financeiro\frontend\sonar-project.properties)
- o workflow aguarda o quality gate com `sonar.qualitygate.wait=true` quando `SONAR_TOKEN` e `SONAR_HOST_URL` estiverem configurados

## Validacao local recomendada

```powershell
npm run build
npm run coverage
```

## Documentacao local

- progresso e decisoes: [`docs/00_PROGRESS.md`](D:\Projetos\controle-financeiro\frontend\docs\00_PROGRESS.md)
- fechamento do MVP: [`docs/02_MVP_FECHAMENTO.md`](D:\Projetos\controle-financeiro\frontend\docs\02_MVP_FECHAMENTO.md)

## Pendencias nao criticas

- configurar secrets reais de SonarQube/SonarCloud no CI para transformar o quality gate remoto em bloqueio efetivo
- reduzir bundle inicial com code-splitting por rota se o produto crescer alem do MVP
