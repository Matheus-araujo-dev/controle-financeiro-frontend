# Revisão de vínculos sugeridos por IA — 2026-10-29

A revisão aplica sugestões automáticas de campos sem descartar preferências anteriores. Exibe justificativa, conta candidata e diferença de valor. O botão Usar sugestão escolhe o vínculo para revisão; diferenças continuam exigindo aceite específico. Sugestões ambíguas não são confirmadas automaticamente. Escolhas salvas são preservadas.

Sugerir com IA atualiza candidatos e campos; salvar mantém os metadados no rascunho. Sem conta candidata, a presença de contas compatíveis impede classificar automaticamente o item como novo. O upload informa que analisa possíveis vínculos.

Tipos gerados a partir do Swagger do backend; a sincronização também incorpora campos que já existiam no runtime mas estavam ausentes do snapshot frontend. Contrato de sugestão mantém os campos novos opcionais.

Validação: 1.469 testes da suíte completa aprovados; cobertura de linhas 87,37%, branches 80,12%, funções 81,82%, statements 85,14%. 31 testes focados de conciliação aprovados após os ajustes finais. Build e typecheck aprovados; lint sem erros, com 45 avisos existentes. Testes de integração do provedor LLM real e smoke em produção não realizados.

Base imutável: 4c08d3348fba5f70402823ab8e2768090ade19f0. Publicar somente junto com backend compatível após CI em develop e main; backend atual tem erros preexistentes e permanece bloqueado. Rollback por revert do commit e redeploy do artefato anterior, preservando dados. Nenhuma publicação em produção feita neste trabalho.

## Integracao com develop em 2026-10-29

A entrega incorpora a refatoracao de pagador/recebedor ja presente no backend e corrige contratos, seletores, filtros de relatorios e testes que ainda usavam campos antigos. O ambiente E2E foi fixado em Ubuntu 24.04, compativel com a versao instalada do Playwright. Nenhuma verificacao foi desativada.

Validacao desta integracao: 46 testes direcionados passaram; suite completa, cobertura e CI devem ser consultados no PR #455. Os numeros anteriores acima pertencem a base anterior a integracao e nao comprovam esta revisao. Promover somente apos CI verde em develop e main, em conjunto com backend #215.

Rollback da integracao: reverter o merge desta entrega e republicar o artefato anterior compativel. A refatoracao de dados ja existente no backend nao deve ser desfeita isoladamente por este frontend.
