# AGENTS.md — Frontend

## Missão
Construir um frontend administrativo consistente com os contratos da API, com formulários sólidos, grids funcionais e testes nos fluxos críticos.

## Não negociáveis
- refletir contratos do backend
- não inventar campos
- validar no cliente e exibir erro do servidor
- testes para hooks, utils e fluxos críticos
- cobertura desde o bootstrap
- quality gate respeitado
- tipos são gerados automaticamente via `npm run generate:types` a partir do Swagger do backend

## Prioridades
1. compatibilidade com a API
2. clareza de UX
3. robustez de formulário
4. previsibilidade dos estados de tela
5. testabilidade

## Workflow de tipos

Execute `npm run generate:types` após modificar DTOs no backend. Tipos gerados ficam em `src/types/generated/`. Mantenha em `src/types/` apenas tipos não-gerados (utils, hooks, constantes).
