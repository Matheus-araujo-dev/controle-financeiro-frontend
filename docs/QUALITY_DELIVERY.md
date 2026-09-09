# Entregas de qualidade e segurança — setembro de 2026

## Regra de conclusão

Cada etapa passa por develop, aguarda CI verde para o commit publicado, promove para
main e aguarda novamente. Cobertura mínima 80% permanece obrigatória. Não reduzir
thresholds, excluir código de produto ou ignorar testes para liberar uma entrega.

## Etapa CI-01 — Reprodutibilidade e evidência de cobertura

Necessidade: npm install --no-save permite resolução variável; o job Sonar não
recebia os secrets definidos em outro job nem o lcov produzido nos testes.

Mudanças: npm ci nas instalações, artifact obrigatório de coverage/lcov.info,
Sonar depende do job test e recebe suas próprias variáveis e o artifact do mesmo run.
Sem configuração Sonar, o gate local de testes/cobertura continua obrigatório; não
se declara que um scan remoto ocorreu quando os secrets não estão configurados.

Validação prévia: npm ci --dry-run --ignore-scripts confirmou lockfile consistente.
A branch inicial contém também a correção de estabilidade 434258d (pool forks e
thresholds 80% nas quatro métricas), ainda não presente em origin/develop.

Estado: implementação pronta; aguardando develop e main verdes. Execuções e SHAs
serão registrados na continuação deste documento após confirmação remota.

## Próximas etapas autorizadas

- Segurança de sessão/cache/CSP: SECURITY_IMPLEMENTATION.md.
- Relatórios/paginação/URL/estados: REPORTS_IMPLEMENTATION.md.
- Contratos OpenAPI e tipos reproduzíveis, preservando builds independentes.
- Arquitetura/documentação e plataforma conforme plano do workspace.