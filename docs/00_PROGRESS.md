# Progress Log - Frontend

## Ultima fase concluida
- Fase 2: cadastros de apoio concluida com listas, formularios e integracao HTTP para pessoas, formas de pagamento, contas bancarias, cartoes e contas gerenciais.

## Decisoes locais
- O bootstrap foi feito manualmente, sem template Vite gerado, para manter a estrutura exatamente alinhada ao workspace.
- As fases 0 e 1 foram revalidadas neste ciclo com build, coverage e manutencao do threshold local do Vitest.
- O app shell foi ajustado para trocar os placeholders da fase 2 por telas reais de listagem e formulario, mantendo placeholders apenas para as fases seguintes.
- O quality gate local foi reforcado com threshold de coverage no Vitest, alem da preparacao para Sonar no CI.
- A validacao local de build e testes precisa rodar fora do sandbox porque Vite/Vitest precisam spawnar o loader de configuracao.
- A protecao de rota ficou preparada por store de auth e modo configuravel via `VITE_AUTH_MODE`, sem exigir login real nesta fase.
- A fase 2 foi concentrada em shells genericos de cadastro e configuracao por modulo para reduzir duplicacao e manter a cobertura sustentavel.

## Pendencias nao criticas
- configurar secrets reais de SonarQube/SonarCloud no CI para ativar o quality gate remoto.
- reduzir o bundle inicial quando novos modulos forem adicionados, preferencialmente com code-splitting por rota.
