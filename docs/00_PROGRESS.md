# Progress Log - Frontend

## Ultima fase concluida
- Fase 1: fundacao tecnica do frontend concluida com shell administrativo, guard de rota, shared UI, build, testes e coverage.

## Decisoes locais
- O bootstrap foi feito manualmente, sem template Vite gerado, para manter a estrutura exatamente alinhada ao workspace.
- O app shell foi estendido com rotas placeholder das fases seguintes, sem adiantar modulos de negocio nem contratos nao implementados.
- O quality gate local foi reforcado com threshold de coverage no Vitest, alem da preparacao para Sonar no CI.
- A validacao local de build e testes precisa rodar fora do sandbox porque Vite/Vitest precisam spawnar o loader de configuracao.
- A protecao de rota ficou preparada por store de auth e modo configuravel via `VITE_AUTH_MODE`, sem exigir login real nesta fase.

## Pendencias nao criticas
- configurar secrets reais de SonarQube/SonarCloud no CI para ativar o quality gate remoto.
- reduzir o bundle inicial quando novos modulos forem adicionados, preferencialmente com code-splitting por rota.
