# Listagens com padrão compartilhado — 2026-10-15

Base: cb42081f40fa9b50a3f3521d6b056cc95ca11163. Branch isolada codex/listas-padrao-compartilhado.

## Comportamento

AppDataTable concentra tipografia responsiva (16–20 px), cabeçalhos (12–14 px), espaçamentos e colunas técnicas com limites. A escala usa a largura do contêiner, inclusive em painéis e modais. Descrições e nomes dividem o espaço restante. Em celular, os cards já existentes passam a atender também as tabelas migradas. Em desktop estreito, rolagem fica restrita ao bloco da tabela.

Colunas podem declarar layout text/date/money/number/compact/status/actions. O padrão infere pelo key/dataIndex e mobileRole; largura explícita continua sendo respeitada. Não depender da posição ou do rótulo traduzido da coluna para distribuir largura. Evitar regras nth-child específicas de uma página.

ListSummaryCards também recebe o estilo comum dos totalizadores. Removido financial-list-layout.css e seu import; contas a pagar/receber usam o mesmo padrão das demais listagens.

## Inventário e migração

21 arquivos consumidores do AppDataTable cobrem cadastros, movimentos, contas, faturas, importação de fatura, recorrências, compras planejadas, conciliação, WhatsApp, relatórios, orçamento e dashboard, incluindo Planos e Investimentos.

Foram migradas três implementações próprias: ReportTable (nove tabelas de relatórios), comparativo de orçamento e composição diária do caixa. ReportTable permanece como adaptador dos dados de relatório, sem markup ou estilo de tabela próprio. Apenas AppDataTable declara a tag table em src/**/*.tsx de produção. Um teste de arquitetura verifica essa regra.

Listas de navegação, menus, cards de indicadores e gráficos não são tabelas e conservam seus componentes. HTML gerado para impressão/exportação é um documento independente da interface responsiva.

## Compatibilidade e validação

Sem contratos, cálculos financeiros, filtros ou mutations novos. Ordenação, paginação, ações e larguras explícitas preservadas. Testes do padrão comum, relatórios desktop/mobile, alertas e orçamento. A verificação inicial de layout falhou antes da implementação do módulo. Teste de orçamento confirmou os seis meses, média e máximo. Capturas de contas, pessoas, movimentos, faturas, relatórios e orçamento em 2485x1279, 1440x1000 e 390x844: nenhuma exceção JavaScript ou overflow horizontal do documento.

Quality gate local passou: auditoria, lint, build, 153 arquivos/1467 testes. Cobertura: statements86,02%, branches80,83%, funções82,54%, linhas88,14%. Contratos conferidos sem mudança de conteúdo; apenas LF normalizado no checkout Windows. Exigir develop verde, main verde, deployment por SHA e smoke antes do fechamento.

## Rollback

Mudança isolada na PR desta branch. Após integrar, reverter o commit de merge da implementação com git revert -m 1 <SHA do merge>, em branch a partir da versão vigente, passar pelos gates e publicar novamente. Se houver squash, reverter o SHA do squash sem -m. Isso restaura o padrão anterior, inclusive o CSS específico financeiro e as tabelas próprias anteriores, sem migrations ou alteração de dados. Não restaurar a main inteira e não usar force-push. Confirmar atualização dos assets na sessão/PWA após o deploy.

Painéis estreitos: ResizeObserver no componente comum alterna para cards quando a largura efetiva fica abaixo de 768 px, mesmo em desktop. O breakpoint de viewport mobile existente continua sendo respeitado. Teste TDD falhou antes da mudança e passou cobrindo estreitamento, expansão e limpeza do observer.


Listagens antes em cards próprios: Planos e Investimentos migrados para AppDataTable, preservando todos os campos, progresso, estados e botões existentes. Ações podem quebrar linha nos cards mobile. Os 56 testes dessas duas áreas passaram. O resumo do gate acima corresponde à fase comum inicial; a fase completa tem nova regressão e CI antes da publicação.

A implantação completa tem duas integrações: a base compartilhada (merge e601913d7057a2571435197b93d82eab1c9f100b, PR436) e o complemento de Planos/Investimentos (PR subsequente). Para rollback integral, reverter primeiro o merge do complemento e depois e601913 com git revert -m 1, em branch da versão vigente, antes dos gates develop/main. Reverter apenas o complemento conserva a base compartilhada. Não restaurar o deployment inteiro se houver alterações posteriores que devam permanecer.
