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
Primeira execução develop 34350834119 falhou em npm ci: faltavam @emnapi/core e @emnapi/runtime. Lockfile regenerado com npm 10.9.8 em diretório sem node_modules; nenhuma versão existente de pacote foi alterada. A validação dry-run anterior no Windows não detectou a divergência do runner Linux.

## CI-01 concluído operacionalmente

- develop: 6d8e8cb63d6d968e4e407a6934fc6b29e548314b, execução 34351077627 verde.
- Promoção: https://github.com/Matheus-araujo-dev/controle-financeiro-frontend/pull/391.
- main: 57d723c0c763509b4a2ec98c99ed2716b987d15a, execução 34382769666 verde.
- Testes/coverage foram executados. Scan remoto Sonar foi pulado por configuração ausente, sem substituir o gate local obrigatório.

## Validação integrada — 10/09/2026

Instalação reproduzível com npm ci concluída. Contratos gerados, auditoria de produção (zero vulnerabilidades, sem exceções), lint (zero erros) e build passaram. React Router atualizado para 7.18.3. O script quality:gate usa npm run coverage, com os quatro thresholds de 80% definidos em vitest.config.ts, removendo opções CLI incompatíveis.

Suíte completa: 1.256 testes em 127 arquivos, todos aprovados. Cobertura: statements 86,44%, branches 80,86%, funções 84,05%, linhas 88,36%. O teste de exportação de faturas carrega o módulo durante os imports, evitando consumir o timeout de execução na compilação inicial; as assertions de XLSX/PDF foram preservadas.

A conclusão operacional desta entrega depende das pipelines develop e main verdes. Avisos preexistentes de lint e tamanho de chunks não foram suprimidos. O scan Sonar continua dependendo de configuração externa; não equivale aos gates executados.
