# Correção de largura das listas — 2026-10-15

O limite de 1560 px da entrega anterior deixou um vazio à direita em monitores largos. Removido somente esse limite, mantendo tipografia, espaçamento, filtros e dashboard. Listas agora ocupam 100% da largura disponível; nenhum dado, cálculo ou contrato mudou.

Base: 55e375a2ef649fb5b03cf51b59ae65f558ccba6e. Mudança isolada em codex/fix-listas-largura. Rollback: reverter apenas o commit desta correção, passando pelos gates develop/main. Isso volta ao limite anterior, portanto só usar se houver regressão específica. Não reverter outros commits nem restaurar o deployment inteiro.

Verificação de navegador antes da correção: em viewport 2485x1279, lista media 1560 px e havia 2197 px disponíveis; asserção falhou. Depois deve ocupar os 2197 px, sem overflow do documento. Verificar também 1440x1000 e 390x844.

Complemento responsivo: colunas técnicas com limites explícitos e colunas de descrição/pessoas proporcionais ao espaço restante. Texto principal cresce de 16 até 20 px conforme a largura real da lista; cabeçalhos de 12 até 14 px; valores dos totalizadores de 22 até 28 px. Cards mobile preservados. Em desktop estreito, a tabela conserva largura mínima legível com rolagem apenas no contêiner, sem alargar a página.

Validação local: lint/build e regressão completa passaram; cobertura statements 85,76%, branches 80,58%, funções 82,16%, linhas 87,95%. Capturas com 2485x1279, 1440x1000 e 390x844 sem overflow da página. Build repetido após os ajustes CSS finais.
