# Frontend - Controle Financeiro

[![CI](https://github.com/anomalyco/controle-financeiro/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/anomalyco/controle-financeiro/actions/workflows/frontend-ci.yml)
[![Coverage](https://codecov.io/gh/anomalyco/controle-financeiro/branch/main/graph/badge.svg?flag=frontend)](https://codecov.io/gh/anomalyco/controle-financeiro)

## Stack

| Categoria | Tecnologia |
|-----------|------------|
| Framework | React 19 + Vite |
| Linguagem | TypeScript |
| UI | Ant Design |
| Formulário | React Hook Form + Zod |
| Estado | Zustand |
| Rotas | React Router DOM |
| HTTP | Axios |
| Testes | Vitest + Testing Library |

## Scripts

```bash
npm install          # Instalar dependencias
npm run dev         # Servidor de desenvolvimento
npm run build       # Build de produção
npm run lint        # Análise estática
npm run test        # Testes unitários
npm run coverage    # Cobertura de testes
npm run quality:check  # Build + Coverage + Lint
npm run quality:gate   # Quality gate completo
npm run security:audit # Scanner de vulnerabilidades
npm run generate:types # Gera tipos do Swagger
```

## Estrutura

```
src/
├── components/      # Componentes reutilizáveis
├── constants/      # Constantes da aplicação
├── features/       # Funcionalidades por módulo
├── layouts/        # Layouts de página
├── routes/         # Definição de rotas
├── services/       # Serviços HTTP
├── store/          # Estado global (Zustand)
├── test/           # Utilitários de teste
└── types/         # Tipos TypeScript
    └── generated/ # Tipos gerados do Swagger
```

## Execucao Local

```bash
npm install
npm run dev
```

Configuracao:
- `.env.local` - Variáveis de ambiente (copiar de `.env.example`)
- API: `http://localhost:5000/api/v1`

## Rotas

- `/dashboard` - Dashboard executivo
- `/pessoas` - Cadastro de pessoas
- `/cartoes` - Cartões de crédito
- `/contas-bancarias` - Contas bancárias
- `/contas-gerenciais` - Contas gerenciais
- `/contas-pagar` - Contas a pagar
- `/contas-receber` - Contas a receber
- `/movimentacoes` - Movimentações
- `/faturas` - Faturas de cartão
- `/importacoes-whatsapp` - Importações WhatsApp
- `/conciliacao` - Conciliação

## Quality Gate

- Coverage mínimo: 80% linhas, 80% funções, 80% statements, 70% branches
- SonarQube integrado via GitHub Actions
- npm audit para vulnerabilidades