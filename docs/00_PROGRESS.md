# Progress Log - Frontend

## Ultima fase concluida
- Fase 0: bootstrap estrutural do frontend concluido com build, testes e coverage.

## Decisoes locais
- O bootstrap foi feito manualmente, sem template Vite gerado, para manter a estrutura exatamente alinhada ao workspace.
- O app shell foi limitado a `/dashboard` e pagina 404, sem adiantar modulos de negocio.
- O quality gate local foi reforcado com threshold de coverage no Vitest, alem da preparacao para Sonar no CI.
- A validacao local de build e testes precisa rodar fora do sandbox porque Vite/Vitest precisam spawnar o loader de configuracao.

## Pendencias nao criticas
- configurar secrets reais de SonarQube/SonarCloud no CI para ativar o quality gate remoto.
- reduzir o bundle inicial quando novos modulos forem adicionados, preferencialmente com code-splitting por rota.
