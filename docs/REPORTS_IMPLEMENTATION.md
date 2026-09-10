# Relatórios: confiabilidade, performance e navegação

## Necessidade

A tela disparava 14 fontes juntas e recarregava o conjunto ao mudar qualquer filtro. As listagens usavam apenas a primeira página (250 linhas; cartões 200), truncando análises e exportações em bases maiores. Uma falha em fonte não visível rejeitava todos os resultados. Busca diferida não impunha intervalo de rede. Aba e filtros se perdiam ao navegar.

## Implementação — 2026-09-08

- `use-report-data.ts`: queries independentes por fonte, somente fontes necessárias à aba ativa mais resumo global; filtros específicos na chave; identidade e workspace também integram a chave. Cache de 30 segundos permite compartilhar fontes sem recarregar tudo.
- `report-data.ts`: composição explícita de fontes por aba e leitura sequencial de todas as páginas usando `totalPages` e `totalItems` do contrato existente. Preserva summary do servidor. Falha de página posterior, total alterado durante leitura ou quantidade incompleta rejeitam a consulta, evitando exportação silenciosamente truncada.
- `use-report-search.ts`: debounce de 300 ms, cancelando temporizador substituído/desmontado.
- `use-report-url-state.ts`: aba e filtros na URL, mantendo parâmetros externos; voltar/avançar restaura aba. Valores inválidos de arrays, mês, aba e intervalos usam defaults. Alterar filtro substitui entrada atual para evitar histórico por caractere.
- `RelatoriosPage.tsx`: consulta extraída do componente, erro e loading limitados às fontes ativas, aviso explícito de dados incompletos e exportações desabilitadas durante carregamento, falha ou debounce. Botões de abas informam seleção por `aria-pressed`; atualização anuncia `role=status`.

## Compatibilidade e limites

Nenhum contrato HTTP, DTO ou regra financeira foi alterado. Todas as abas existentes permanecem disponíveis. Exportação continua no mesmo formato. As páginas posteriores seguem a ordenação já fornecida pela API; não representam snapshot transacional entre chamadas. Mudança de quantidade durante a leitura é detectada e exige atualizar. Endpoints agregados para históricos excepcionalmente grandes poderão substituir esta leitura sem modificar a apresentação.

Fixtures de testes que indicavam totais diferentes de seus próprios itens foram corrigidas para o contrato real; não foi relaxada a verificação de integridade.

## TDD e validação local

Testes novos de paginação e URL foram executados em vermelho antes dos respectivos módulos. O debounce também recebeu teste de regressão específico. Regressões cobrem 251 registros, falha em página posterior, paginação incompleta, fontes por aba, carregamento lazy, isolamento de falha e bloqueio de exportação, debounce e restauração de filtros.

- 79 testes de relatórios aprovados (6 arquivos).
- Cobertura do módulo: linhas 95,08%; statements 95,22%; funções 93,26%; branches 87,95% (todos acima de 80%).
- TypeScript sem erros; ESLint do módulo sem erros/avisos.
- Gate global e pipelines DEVELOP/main serão executados pelo coordenador. Esta atividade não é considerada concluída antes de main verde.
