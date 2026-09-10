# Segurança de sessão e PWA — implementação de 2026-09-08

## Necessidade

O mesmo cache React Query e o cache persistente `api-cache` eram compartilhados entre sessões. Logout, troca de usuário ou de workspace podiam deixar dados anteriores disponíveis. Uma renovação JWT iniciada antes do logout também podia restaurar a sessão antiga. A CSP permitia execução `unsafe-eval`, scripts inline e conexão a qualquer subdomínio Railway.

## Implementação

- `SessionQueryProvider` mantém um QueryClient por identidade/workspace. A mudança cancela consultas, limpa queries/mutações antigas e remonta os componentes para apagar estado local privado. Callbacks tardios de mutações conservam apenas referência ao client aposentado.
- A revisão de sessão em `auth-store` muda somente na mudança de identidade/workspace. Renovação normal do token preserva cache e estado da tela.
- Interceptors HTTP descartam respostas emitidas em outra revisão de sessão. Refresh concorrente continua compartilhando uma chamada; refresh antigo não restaura usuário anterior nem encerra a sessão nova.
- Workbox deixa de ter estratégia de cache para `/api/`. Na ativação, `clear-api-cache.js` exclui o cache legado. Assets estáticos e fontes continuam disponíveis pelo PWA.
- O worker gerado incorpora `push-handler.js`, preservando o handler de notificações que antes existia somente em `public/sw.js`.
- A CSP é gerada por ambiente com a origem exata de `VITE_API_BASE_URL`; desenvolvimento mantém conexões locais de Vite. Produção não contém curingas Railway, `unsafe-eval` ou scripts inline. Google OAuth continua permitido. Estilos inline permanecem necessários ao Ant Design e ao tema.

## Validação

TDD aplicado: regressões demonstradas antes da implementação para isolamento de queries, refresh antigo e estado local persistindo A→B. Testes cobrem logout, usuário/workspace diferentes, resultado tardio, refresh concorrente e compatibilidade dos formatos `workspace`/`familia`.

- 71 testes passaram em 11 arquivos de sessão, HTTP, login, callback, layout, rotas protegidas e CSP.
- Cobertura focal da implementação: linhas 100%; statements 97,65%; funções 95%; branches 84,21%. Gate mínimo 80% mantido.
- ESLint dos arquivos alterados e build Vite/PWA passaram. Worker compilado contém os imports de limpeza/push e não contém `NetworkFirst` nem `api-cache`.
- A cobertura global e os pipelines DEVELOP→main são validados pelo integrador. Esta etapa somente será considerada concluída após ambos verdes, conforme autorização do usuário.

## Operação e limites

`VITE_API_BASE_URL` continua obrigatório terminar em `/api/v1`; alterar a variável exige rebuild/redeploy para alinhar Axios e CSP. Um build local com `.env.local` apontando localhost permite somente essa origem exata. A implantação deve usar a URL HTTPS de produção documentada.

A limpeza persistente ocorre quando o novo service worker é ativado. Navegadores que ainda não atualizaram o aplicativo executam o código da versão anterior até a atualização. A inspeção do build e os testes unitários não substituem smoke tests OAuth/Push com credenciais reais.

## Revisão final de concorrência e desenvolvimento

Foram reproduzidas e corrigidas duas regressões em testes focais: a CSP de desenvolvimento agora permite o preâmbulo inline do React Refresh, exclusivamente nesse ambiente; produção continua sem scripts inline e nenhum ambiente libera `unsafe-eval`. O interceptor de requisição preserva a revisão original em retries e cancela a operação caso a sessão mude antes de o interceptor assíncrono executar. O teste simula essa janela e confirma que a segunda mutação não chega ao adapter HTTP.

## Auditoria de dependências — correção de falso positivo do gate

A revisão de 2026-09-10 identificou que `security:audit` invocava `audit-ci` sem `--config`. A versão instalada não descobre `.audit-ci.json` automaticamente e tem todas as severidades desabilitadas por padrão. Por isso uma execução anterior passou com `metadata.total = 14` e `advisories = {}`: esse resultado não comprovava ausência de vulnerabilidades. A chave `omit` do arquivo também não era uma opção reconhecida pelo audit-ci.

A correção faz `security:audit` carregar explicitamente `.audit-ci.json`, usa `moderate: true` para reprovar severidades moderada/alta/crítica e `skip-dev: true` para auditar dependências de produção. A allowlist foi esvaziada. `react-router-dom` e `react-router` foram atualizados no lockfile para 7.18.3, eliminando GHSA-qwww-vcr4-c8h2. Antes da atualização, `npm audit --omit=dev --json` identificou 2 entradas high decorrentes desse único advisory; o cenário RSC não era utilizado pela SPA, mas a atualização elimina a necessidade de exceção.

A validação posterior com `audit-ci --config .audit-ci.json --report-type full` passou e reportou zero vulnerabilidades em todas as severidades. A auditoria independente `npm audit --omit=dev --json` confirmou total zero. Esses resultados são da política de produção e do lockfile atualizado; não significam ausência de advisories em ferramentas de desenvolvimento. A atualização inicial foi feita com `--package-lock-only --ignore-scripts` para preservar a suíte em execução. O integrador sincroniza `node_modules` com `npm ci` e repete os gates com as dependências reais antes de promover para DEVELOP/main.
