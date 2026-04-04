# Frontend - Controle Financeiro

Frontend administrativo do sistema de controle financeiro, alinhado ate a `Fase 2` do workspace.

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
- cobertura lcov + Sonar

## Estrutura

```text
src/
  app/
  components/
  constants/
  features/dashboard/
  layouts/
  routes/
  services/
  store/
  styles/
  test/
  types/
```

## Comandos

```powershell
npm install
npm run build
npm run test
npm run coverage
```

## Configuração local

- copiar `.env.example` para `.env.local` quando quiser trocar a base URL da API
- valor padrao: `http://localhost:5000/api/v1`
- auth de tela pode ser preparada por `VITE_AUTH_MODE=development` ou `VITE_AUTH_MODE=jwt`

## Qualidade

- coverage em `coverage/lcov.info`
- workflow próprio em `.github/workflows/ci.yml`
- Sonar preparado via `SONAR_TOKEN` e `SONAR_HOST_URL`

## Escopo desta entrega

- shell administrativo
- layout base
- rota `/dashboard`
- rotas reais da fase 2 para cadastros de apoio
- cliente HTTP com interceptors
- store base de shell, auth e notificacoes
- tabela padrao e shell de formulario
- guard de rota preparado
- estados padrao de tela
- testes e cobertura desde o bootstrap
- types e services HTTP espelhados com os contratos do backend para os cadastros de apoio
