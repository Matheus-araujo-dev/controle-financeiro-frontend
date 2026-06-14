import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Input, Spin, Typography } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { SendOutlined, RobotOutlined, UserOutlined, ClearOutlined } from '@ant-design/icons';
import { agenteApi, type AgentePerguntarResponse } from '../../services/http/agente-api';
import { getApiErrorMessage } from '../../services/http/api-error';

const { Text } = Typography;

interface Mensagem {
  papel: 'user' | 'assistant';
  conteudo: string;
  tokensUsados?: number;
}

export function AgenteChatPage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [entrada, setEntrada] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [conversaId, setConversaId] = useState<string | undefined>();
  const [erro, setErro] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<TextAreaRef>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [mensagens, enviando]);

  const enviar = useCallback(async () => {
    const texto = entrada.trim();
    if (!texto || enviando) return;

    setEntrada('');
    setErro(null);
    setMensagens((prev) => [...prev, { papel: 'user', conteudo: texto }]);
    setEnviando(true);

    try {
      const res: AgentePerguntarResponse = await agenteApi.perguntar({
        mensagem: texto,
        conversaId,
      });
      setConversaId(res.conversaId);
      setMensagens((prev) => [
        ...prev,
        { papel: 'assistant', conteudo: res.resposta, tokensUsados: res.tokensUsados },
      ]);
    } catch (err) {
      setErro(getApiErrorMessage(err));
    } finally {
      setEnviando(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [entrada, enviando, conversaId]);

  const limpar = () => {
    setMensagens([]);
    setConversaId(undefined);
    setErro(null);
    setEntrada('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-outline-variant shrink-0">
        <div className="flex items-center gap-2">
          <RobotOutlined className="text-primary text-xl" />
          <span className="font-headline font-semibold text-on-surface text-base">
            Assistente Financeiro
          </span>
          {conversaId && (
            <span className="text-xs text-on-surface-variant font-mono">
              #{conversaId.slice(-6)}
            </span>
          )}
        </div>
        {mensagens.length > 0 && (
          <Button
            type="text"
            size="small"
            icon={<ClearOutlined />}
            onClick={limpar}
            className="text-on-surface-variant hover:text-on-surface"
          >
            Nova conversa
          </Button>
        )}
      </div>

      {/* Lista de mensagens */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        style={{ minHeight: 0 }}
      >
        {mensagens.length === 0 && !enviando && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-on-surface-variant">
            <RobotOutlined style={{ fontSize: 48, opacity: 0.3 }} />
            <p className="text-sm text-center max-w-sm">
              Olá! Sou seu assistente financeiro. Posso responder perguntas como:
            </p>
            <div className="flex flex-col gap-2 text-xs">
              {[
                '"Como estão as finanças esse mês?"',
                '"Quanto gastei em alimentação?"',
                '"Qual meu saldo atual?"',
                '"Liste as categorias disponíveis."',
              ].map((ex) => (
                <button
                  key={ex}
                  onClick={() => { setEntrada(ex.replace(/"/g, '')); inputRef.current?.focus(); }}
                  className="px-3 py-1.5 rounded border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors text-left"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensagens.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.papel === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                msg.papel === 'user'
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-primary-container text-on-primary-container'
              }`}
            >
              {msg.papel === 'user' ? <UserOutlined /> : <RobotOutlined />}
            </div>

            {/* Balão */}
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.papel === 'user'
                  ? 'bg-secondary-container text-on-secondary-container rounded-tr-sm'
                  : 'bg-surface-container text-on-surface rounded-tl-sm'
              }`}
            >
              {msg.conteudo}
              {msg.tokensUsados !== undefined && (
                <div className="mt-1 text-xs opacity-40 text-right">{msg.tokensUsados} tokens</div>
              )}
            </div>
          </div>
        ))}

        {enviando && (
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-sm">
              <RobotOutlined />
            </div>
            <div className="px-4 py-3 bg-surface-container rounded-2xl rounded-tl-sm">
              <Spin size="small" />
            </div>
          </div>
        )}

        {erro && (
          <div className="px-4 py-2.5 bg-error-container text-on-error-container rounded-xl text-sm">
            {erro}
          </div>
        )}
      </div>

      {/* Área de entrada */}
      <div className="shrink-0 px-6 py-3 border-t border-outline-variant">
        <div className="flex gap-2 items-end">
          <Input.TextArea
            ref={inputRef}
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Digite sua pergunta… (Enter para enviar, Shift+Enter para nova linha)"
            autoSize={{ minRows: 1, maxRows: 5 }}
            disabled={enviando}
            className="flex-1"
            style={{ resize: 'none' }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={enviar}
            loading={enviando}
            disabled={!entrada.trim()}
          >
            Enviar
          </Button>
        </div>
        <Text className="text-xs text-on-surface-variant mt-1 block">
          O agente só responde perguntas sobre as finanças da família.
        </Text>
      </div>
    </div>
  );
}
