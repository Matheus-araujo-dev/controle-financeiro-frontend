# API-01 — contratos derivados do OpenAPI

## Necessidade

Os DTOs eram declarados manualmente no frontend, permitindo divergências silenciosas em campos, enums e nulabilidade. O contrato gerado agora serve como fonte das propriedades dos modelos consumidos pela aplicação, mantendo o backend e o frontend como repositórios independentes.

## Implementação

Mais de 100 declarações em `src/types/` passaram a derivar de `src/types/generated/api.ts`. O helper somente de tipos `ApiContract` preserva as expectativas existentes de campos presentes, campos opcionais e nulos, compensando a marcação ampla de propriedades opcionais do Swagger atual. Objetos aninhados usam os aliases locais derivados. Os filtros de tela, paginação genérica, estado de autenticação local, códigos de exibição mais restritos e compatibilidade legada continuam como modelos de UI.

Campos de detalhes e tokens também usam `Pick` do contrato gerado. Mudanças de tipo ou remoção de propriedades no OpenAPI passam a quebrar a compilação dos respectivos aliases/consumidores, em vez de manter uma definição manual desconectada.

O cruzamento encontrou uma divergência concreta em investimentos: `JsonStringEnumConverter` retorna nomes de enums, enquanto os selects e filtros existentes usam valores numéricos. O adapter HTTP normaliza respostas para esses valores numéricos, tanto em listagens como em operações individuais; continua aceitando o formato numérico legado. Os mapas são exaustivos em relação aos enums gerados. A estrutura dos formulários e os payloads numéricos aceitos pelo backend foram preservados.

## Validação

- Typecheck completo validado após primeira migração; repetido após refinamentos finais.
- TDD do adapter: o teste reproduziu `RendaFixa`/`Diaria` chegando como strings antes da correção; depois passou com valores UI 1/1. Cobre também respostas numéricas legadas e detalhe individual.
- Cobertura do adapter: 100% linhas, statements, funções e branches; mínimo 80% mantido.
- Testes existentes de tela, exportação e HTTP de investimentos executados como regressão.
- Gate global e promoção DEVELOP→main continuam sob responsabilidade do integrador. Nenhuma etapa é concluída antes das duas pipelines verdes.

## Escopo dos modelos locais

Aliases e refinamentos TypeScript não validam JSON em tempo de execução. Esta etapa mantém as garantias já existentes dos serviços; não introduz coerção global de dados nem altera significado de valores nulos. Campos extras de compatibilidade, como `contaVinculadaId`, permanecem explicitamente no modelo de UI, não no gerado. O arquivo gerado deve ser atualizado pelo script oficial, nunca editado manualmente.
