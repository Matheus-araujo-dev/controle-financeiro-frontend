# Plano de endurecimento e qualidade — setembro de 2026

## Objetivo e autorização

Implementar os achados da revisão de 08/09/2026 sem regressões, mantendo cobertura
mínima de 80% e os repositórios backend/frontend independentes. O usuário autorizou
implementação por agentes e promoção de cada entrega: develop verde, merge em main,
main verde. Nenhum item é concluído apenas por testes locais ou abertura de PR.

## Critérios comuns

- TDD para comportamentos relevantes, incluindo casos adversos e fluxos existentes.
- Não reduzir thresholds, excluir código de produto da cobertura ou ignorar falhas.
- Compilação, testes, cobertura e pipeline precisam passar para o SHA entregue.
- Mudanças de contrato atualizam OpenAPI, consumidores e testes juntos.
- Toda entrega registra commits, PRs, execuções e evidências nos repositórios.
- Falha na pipeline interrompe a promoção; corrigir e repetir antes de main.

## Atividades

| ID | Necessidade | Implementação/aceite | Estado |
| --- | --- | --- | --- |
| SEC-01 | Contexto sem workspace abre consultas globais | Tenant obrigatório; workers com escopo explícito; testes multi-tenant | Concluído — backend PR 152; develop e main verdes |
| SEC-02 | Dashboard admite importações de família vazia | Remover acesso implícito a legado e preservar dados por migração/escopo seguro | Concluído — backend PR 152; develop e main verdes |
| SEC-03 | API autenticada persiste em cache PWA compartilhado | Remover cache financeiro e limpar cache legado na atualização | Implementado; validação e promoção frontend pendentes |
| SEC-04 | Logout/troca deixa consultas e respostas antigas | Isolar cache por sessão/workspace e cancelar requisições anteriores | Implementado; validação e promoção frontend pendentes |
| SEC-05 | Refresh concorrente pode emitir duas sessões | Consumo atômico, teste de concorrência e resposta compatível | Concluído — backend PR 152; develop e main verdes |
| SEC-06 | CSP de produção permite eval e origens de desenvolvimento | Política restrita preservando OAuth e ambiente local | Implementado; validação e promoção frontend pendentes |
| REP-01 | Até 14 fontes carregadas em conjunto | Queries por aba/fonte, debounce, erros independentes e regressão de filtros | Implementado; validação e promoção frontend pendentes |
| REP-02 | Primeira página de 250 itens trunca relatórios | Paginação completa/totalização consistente e exportação sem omissões | Implementado; validação e promoção frontend pendentes |
| FIN-01 | Total a pagar pode incluir itens EmFatura | Reproduzir e corrigir duplicidade com teste fechamento/pagamento | Concluído — backend PR 152; develop e main verdes |
| PERF-01 | Dashboard materializa referências/histórico amplo | Consultas restritas e projeções sem mudança de resultado | Concluído — backend PR 152; develop e main verdes |
| UI-01 | Estado/filtros de relatório pouco rastreáveis | URL de aba/filtros e estados claros; regressão de navegação e acessibilidade | Implementado; validação e promoção frontend pendentes |
| ARCH-01 | Componentes grandes e limites de domínio inconsistentes | Extrair responsabilidades nos fluxos alterados sem nova arquitetura distribuída | Extrações implementadas nos fluxos alterados; promoção frontend pendente |
| API-01 | Tipos gerados exigidos mas ausentes | OpenAPI reproduzível, geração versionada, integração de types e verificação CI | OpenAPI e consumidores implementados; validação e promoção frontend pendentes |
| CI-01 | Sonar sem env/cobertura no job e instalação variável | Corrigir escopo/artifact, npm ci e manter gate local obrigatório | Concluído — frontend PR 391; develop e main verdes; Sonar condicionado aos secrets |
| DOC-01 | Documentação normativa contradiz implementação | Atualizar arquitetura, decisões e operação vigente | Revisão local atualizada em 10/09; promoção da documentação frontend pendente |
| PLATFORM-01 | .NET 9 encerra suporte em 10/11/2026 (fonte oficial abaixo) | Atualizar .NET 10 LTS, imagens/CI/pacotes compatíveis e validar migrations | Migração .NET 10 em develop (4921fd7); pipeline em andamento; main pendente |

## Ordem e limites

Priorizar isolamento/cache, consistência financeira/relatórios, contratos/CI,
otimização e plataforma. Medições de performance não serão inventadas. Mudanças
de índices dependem de evidências de consultas; preservar o monólito modular.
Não alterar credenciais, dados de produção ou configuração OAuth sem necessidade
concreta. Uma limitação externa será registrada como pendência, nunca como concluída.

## Base verificada antes da implementação

- Backend: build passou; 244 testes de domínio passaram.
- Frontend: TypeScript passou; suíte completa e cobertura serão executadas na entrega.
- Backend iniciou em develop (24ee30c); frontend em fix/test-stability-coverage-gates
  (434258d, uma correção de testes à frente de origin/develop).

## Evidências de entrega — atualização de 10/09/2026

As execuções abaixo identificam as entregas promovidas e os gates associados. Testes locais não substituem a aprovação das pipelines de develop e main.

| Entrega | Evidência | Resultado registrado |
| --- | --- | --- |
| Backend core | [PR 152](https://github.com/Matheus-araujo-dev/controle-financeiro-backend/pull/152); main `0e4fe2` | Merge promovido |
| Backend develop | [Pipeline 34419014915](https://github.com/Matheus-araujo-dev/controle-financeiro-backend/actions/runs/34419014915) | Verde |
| Backend main | [Pipeline 34438962177](https://github.com/Matheus-araujo-dev/controle-financeiro-backend/actions/runs/34438962177) | Todos os jobs verdes |
| Frontend CI develop | Commit `6d8e8cb`; [pipeline 34351077627](https://github.com/Matheus-araujo-dev/controle-financeiro-frontend/actions/runs/34351077627) | Verde |
| Frontend CI main | [PR 391](https://github.com/Matheus-araujo-dev/controle-financeiro-frontend/pull/391); main `57d723c`; [pipeline 34382769666](https://github.com/Matheus-araujo-dev/controle-financeiro-frontend/actions/runs/34382769666) | Verde; testes e cobertura executados; Sonar scan ignorado por secrets ausentes |

A entrega core cobre isolamento de workspace, recuperação segura de legado, refresh concorrente, integridade do resumo de faturas e otimização das consultas auxiliares. O fluxo financeiro também preserva obrigações canceladas ao reabrir faturas já pagas/estornadas, evitando apagar referências históricas.

Frontend de segurança, relatórios e contratos continua em validação. A execução global anterior teve **1.256 testes: 1.254 aprovados e 2 falhas**. Os testes de exportação de `FaturasPage` sofreram timeout de importação dinâmica (25 segundos) e contaminação posterior do DOM, deixando botões PDF duplicados. A correção para importação estática já foi aplicada e o novo gate está em andamento. A rodada anterior não atende ao aceite; aguardar o novo gate e ambas as pipelines antes de concluir. A aprovação do PR de CI não atesta a entrega dessas mudanças posteriores.

A integração .NET 10 chegou a develop no commit `4921fd7`; a [pipeline 34478977242](https://github.com/Matheus-araujo-dev/controle-financeiro-backend/actions/runs/34478977242) está aguardando resultado. A promoção a main e sua pipeline continuam pendentes. A revisão DOC-01 não equivale à publicação da documentação frontend. CI-01 corrige a passagem de cobertura e configuração do job Sonar; o scan externo continua dependendo dos secrets e não foi executado nas evidências acima.

## Plataforma: justificativa verificada

A [política oficial de suporte .NET da Microsoft](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core), consultada em 10/09/2026 e atualizada pela Microsoft em 08/09/2026, informa encerramento do suporte ao .NET 9 em **10/11/2026** e suporte ao .NET 10 LTS até **14/11/2028**. Portanto, a migração é preventiva; não se afirma que .NET 9 já esteja sem suporte. Esta fonte fundamenta o planejamento, mas não comprova o deploy do .NET 10.

## Revisão documental DOC-01

- Documento 03: PostgreSQL/SQLite e monólito modular preservados; stack atual e alvo futuro distinguidos.
- Documento 07: ciclo de faturas sem duplicidade, preservação histórica e exclusão de intenções de compra da previsão alinhados às regras implementadas.
- Documento 12: promoção develop → main, migrations/readiness e distinção entre instalação CI e configuração do provedor documentadas; OAuth, CORS e variáveis mantidos.
- Documento 15: autenticação atual e decisões substituídas explicitadas; tipos gerados com aliases de UI documentados sem prometer validação runtime.

Os arquivos `docs/` pertencem ao repositório raiz [controle-financeiro-infra](https://github.com/Matheus-araujo-dev/controle-financeiro-infra). Sua publicação exige entrega própria em develop e main. Os registros em `frontend/docs/` e `backend/docs/` pertencem aos respectivos repositórios independentes; nenhuma promoção publica automaticamente os outros dois.
