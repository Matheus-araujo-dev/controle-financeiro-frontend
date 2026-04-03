# Frontend - Controle Financeiro

Bootstrap inicial do frontend administrativo do sistema de controle financeiro, alinhado a `Fase 0` do workspace.

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

## Qualidade

- coverage em `coverage/lcov.info`
- workflow próprio em `.github/workflows/ci.yml`
- Sonar preparado via `SONAR_TOKEN` e `SONAR_HOST_URL`

## Escopo desta entrega

- shell administrativo
- layout base
- rota `/dashboard`
- cliente HTTP inicial
- store base
- estados padrao de tela
- testes e cobertura desde o bootstrap
