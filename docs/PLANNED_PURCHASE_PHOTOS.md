# Compra planejada — data opcional e fotos (01/10/2026)

Problema reproduzido: o formulário enviava dataDesejada vazia como string, embora o contrato DateOnly? aceite null. A conversão JSON falhava e o caminho $.dataDesejada não era associado ao campo; o botão desabilitado por isValid também impedia que a confirmação revelasse obrigatórios ausentes.

Correção: preservar data opcional em types e schema; normalizar branco para null na criação/edição HTTP e no formulário; identificar a opção na tela, validar datas informadas e apresentar erros de campo e aviso geral. Botão de confirmar permite solicitar a validação, bloqueando apenas durante envio. Nenhuma mudança no schema da API, entidade ou migration.

Fotos: seleção opcional de múltiplos JPEG/PNG/WEBP, até 10 MB por arquivo não vazio, com nomes e remoção antes do envio. Após criar a compra, usa POST /anexos/compras-planejadas/{id} existente. Sucessos saem da fila; falha mantém o ID salvo e apenas as fotos pendentes para reenvio, sem novo POST de compra. Campos da compra ficam travados após salvar; fotos pendentes podem ser substituídas ou removidas. Voltar após falha informa que a compra já foi salva. Nenhuma foto adicionada à listagem, conforme escopo do usuário.

TDD: sete falhas reproduzidas antes da correção (data vazia, obrigatórios, mensagens e fotos). 41 testes focados passaram; 14 E2E desktop/mobile aprovados com APIs simuladas, incluindo payload null e multipart de foto. Gates completos em andamento.

A mesma branch contém commit separado de segurança Axios 1.20.0, necessário porque a auditoria de produção bloqueou develop em 01/10. Atualização já validada com 1.432 testes, 12 E2E e cobertura acima de 80% antes das mudanças de formulário. Sem mudanças na configuração da auditoria.

Rollback: reverter commits frontend por develop/main; baseline de produção b3894af375e84d8e371cf5ec660fb8925408de44. Dados e anexos já salvos permanecem; não apagar arquivos ou registros para reverter a interface. Publicação aguarda gates e deploy verificado.

Validação global local: 1.448 testes aprovados, cobertura 85,75% statements, 80,59% branches, 82,15% functions e 87,94% lines. Após revisão visual, seletor em português e teste adicional do botão aprovados; build final e 14 E2E desktop/mobile verdes. Smoke visual do build final desktop/mobile aprovado com APIs simuladas. Lint sem erros (45 avisos existentes), contratos e tipos aprovados. Nenhuma alteração na listagem.
