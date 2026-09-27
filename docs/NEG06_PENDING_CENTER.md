# NEG-06 — Central de pendências

Base: fechamento mensal publicado, frontend c0deda70b732d9ba0a943bf2e24b9f51b85d278c e backend 95978d2948d7b3ac28b25a08d446a93a017a8bca.

Necessidade: reunir compromissos vencidos/próximos e revisões de importações numa fila com ação direta na origem. APIs atuais são reutilizadas; não há entidade, migration ou contrato novo.

TDD: 14 testes iniciais falharam por módulos ausentes, depois passaram. Seis regressões adicionais reproduziram IDs duplicados entre páginas, metadados inválidos e valores não finitos, corrigidos antes da integração. 21 testes focados verdes.

Aceite: saldo restante, sete dias incluindo hoje, exclusão de quitadas/canceladas/EM_FATURA, revisão sem valor de dívida, paginação completa, erro/ausência distintos, cache por sessão/espaço, filtro persistido na URL, abertura da origem, desktop/mobile sem overflow. Título único fornecido pelo layout.

Rollback: reverter o commit de implementação, sem migração ou alteração financeira. Flag VITE_PRODUCT_PENDING_ENABLED=false oculta menu e redireciona rota; exige rebuild/redeploy. Baseline imutável é o SHA acima.

Gates completos e publicação: em andamento; esta nota não atesta conclusão.

Validação local em 27/09/2026: lint sem erros (avisos preexistentes), contracts:check, typecheck, build, security:audit (zero vulnerabilidades) e pwa:check aprovados. Cobertura global: statements 85,58%, branches 80,32%, functions 82,09%, lines 87,77%. Playwright: 8 testes desktop/mobile aprovados, com APIs simuladas no cenário da central; não comprova jornada financeira real em produção. Dois testes adicionais de isolamento/flag aprovados, totalizando 23 testes focados. CI irá reexecutar a suíte com esses testes.
