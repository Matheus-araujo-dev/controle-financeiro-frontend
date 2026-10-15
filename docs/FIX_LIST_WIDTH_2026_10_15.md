# Correção de largura das listas — 2026-10-15

O limite de 1560 px da entrega anterior deixou um vazio à direita em monitores largos. Removido somente esse limite, mantendo tipografia, espaçamento, filtros e dashboard. Listas agora ocupam 100% da largura disponível; nenhum dado, cálculo ou contrato mudou.

Base: 55e375a2ef649fb5b03cf51b59ae65f558ccba6e. Mudança isolada em codex/fix-listas-largura. Rollback: reverter apenas o commit desta correção, passando pelos gates develop/main. Isso volta ao limite anterior, portanto só usar se houver regressão específica. Não reverter outros commits nem restaurar o deployment inteiro.

Verificação de navegador antes da correção: em viewport 2485x1279, lista media 1560 px e havia 2197 px disponíveis; asserção falhou. Depois deve ocupar os 2197 px, sem overflow do documento. Verificar também 1440x1000 e 390x844.
