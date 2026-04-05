# Progress Log - Frontend

## Ultima fase concluida
- Fase 9: fechamento do MVP concluido com README atualizado, documentacao local minima, validacao final e consolidacao do quality gate local.

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
- A fase 6 substituiu o placeholder de `dashboard` por uma tela operacional real, consumindo `GET /dashboard/resumo` e `GET /dashboard/fluxo-caixa` com estados de loading, erro e retry.
- O dashboard passou a consolidar cards, listas de contas vencidas/a vencer, movimentacoes recentes e tabela de fluxo diario sem criar uma rota extra fora do `/dashboard` canonico.
- A formatacao de datas do dashboard foi feita manualmente a partir de strings `yyyy-MM-dd` para evitar deslocamentos por fuso horario em `Date` do navegador e nos testes.
- A fase 7 substituiu os placeholders de `importacoes-whatsapp` por telas reais de listagem e detalhe, mantendo `conciliacao` como o unico placeholder restante para a fase 8.
- Os contratos novos do backend passaram a ser refletidos em `types/importacoes-whatsapp.ts` e no cliente HTTP dedicado `importacoes-whatsapp-api.ts`, evitando misturar a revisao de importacao com os modulos financeiros ja consolidados.
- A tela de listagem passou a expor busca, status, confianca da extracao e pendencias de revisao, enquanto a tela de detalhe mostra texto bruto, metadados do arquivo, payload sugerido e acoes de confirmar, rejeitar e reprocessar.
- O frontend desta fase trata confirmacao e rejeicao como revisao humana da sugestao, sem prometer efetivacao automatica de lancamento financeiro antes das fases seguintes.
- A fase 8 substituiu o ultimo placeholder restante por uma pagina real de `conciliacao`, mantendo a navegacao administrativa consistente com as fases anteriores e sem criar rotas fora do fluxo canonico.
- Os contratos do backend foram refletidos em `types/conciliacao.ts` e no cliente HTTP dedicado `conciliacao-api.ts`, desacoplando a conciliacao dos modulos de movimentacao e importacao.
- A tela de conciliacao foi desenhada para operacao assistida: lista o item de extrato confirmado, mostra candidatas sugeridas e permite confirmar o vinculo diretamente pela grade, sem automatizar conciliacao em segundo plano.
- O estado local da linha conciliada e a mensagem de ultima acao confirmada evitam roundtrip extra imediato sem perder compatibilidade com uma futura tela mais rica de conciliacao.
- O quality gate local do frontend passou a considerar o custo atual da suite com Ant Design e coverage, com aumento explicito dos timeouts de testes mais pesados para reduzir flakiness sem afrouxar thresholds de cobertura.
- A fase 9 nao adicionou regra de negocio; consolidou a documentacao operacional do MVP e deixou a validacao de build/test/coverage refletida no README e no documento de fechamento.

## Pendencias nao criticas
- configurar secrets reais de SonarQube/SonarCloud no CI para ativar o quality gate remoto.
- reduzir o bundle inicial quando novos modulos forem adicionados, preferencialmente com code-splitting por rota.
