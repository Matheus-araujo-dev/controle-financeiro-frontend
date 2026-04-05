# Progress Log - Frontend

## Ultima fase concluida
- Fase 5: recorrencia concluida com configuracao da serie dentro das telas financeiras existentes e acoes de geracao, pausa, encerramento e alteracao futura.

## Decisoes locais
- O bootstrap foi feito manualmente, sem template Vite gerado, para manter a estrutura exatamente alinhada ao workspace.
- As fases 0 e 1 foram revalidadas neste ciclo com build, coverage e manutencao do threshold local do Vitest.
- O app shell foi ajustado para trocar os placeholders da fase 2 por telas reais de listagem e formulario, mantendo placeholders apenas para as fases seguintes.
- O quality gate local foi reforcado com threshold de coverage no Vitest, alem da preparacao para Sonar no CI.
- A validacao local de build e testes precisa rodar fora do sandbox porque Vite/Vitest precisam spawnar o loader de configuracao.
- A protecao de rota ficou preparada por store de auth e modo configuravel via `VITE_AUTH_MODE`, sem exigir login real nesta fase.
- A fase 2 foi concentrada em shells genericos de cadastro e configuracao por modulo para reduzir duplicacao e manter a cobertura sustentavel.
- A fase 3 reaproveitou o shell generico para o nucleo financeiro, mas adicionou comportamento proprio para rateio, calculo de valor liquido e acoes `liquidar` e `cancelar`.
- Os contratos do backend passaram a ser refletidos em `types`, `services` HTTP, `module-config`, schemas e rotas reais, substituindo os placeholders da fase 3.
- O setup global de testes ganhou `ResizeObserver` mock para manter os componentes do Ant Design validaveis em ambiente `jsdom`.
- A fase 4 substituiu o placeholder de `faturas` por telas reais de listagem e detalhe, refletindo os contratos de agrupamento, itens e pagamento vindos do backend.
- O frontend passou a expor a rastreabilidade da fatura tambem nas movimentacoes, com `faturaCartaoId` incorporado aos tipos financeiros.
- O fluxo de pagamento da fatura ficou isolado na tela de detalhe, com recarga do estado da propria fatura apos a acao para manter a coerencia da visao economica versus caixa.
- A fase 5 manteve a recorrencia dentro das telas de contas a pagar e contas a receber, evitando criar um modulo fora das rotas canonicamente previstas.
- Os `types`, `services` HTTP e `module-config` financeiros passaram a refletir `Recorrencia`, inclusive os endpoints de alterar futuras, gerar ocorrencias, pausar e encerrar.
- O formulario financeiro ganhou secao de recorrencia e card de acoes da serie, enquanto a validacao local passou a bloquear a combinacao de recorrencia com parcelamento.

## Pendencias nao criticas
- configurar secrets reais de SonarQube/SonarCloud no CI para ativar o quality gate remoto.
- reduzir o bundle inicial quando novos modulos forem adicionados, preferencialmente com code-splitting por rota.
