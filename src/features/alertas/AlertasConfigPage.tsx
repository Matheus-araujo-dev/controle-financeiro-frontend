import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { PageState } from '../../components/states/PageState';
import { alertasApi } from '../../services/http/alertas-api';
import { notify } from '../../store/notification-store';
import { getApiErrorMessage } from '../../services/http/api-error';
import type { ConfiguracaoNotificacao } from '../../types/alertas';

// ── Push subscription helpers ─────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });
}

// ── Toggle component ──────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
  label,
  description
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-2">
      <div className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`h-6 w-11 rounded-full transition-colors ${
            checked ? 'bg-emerald-500' : 'bg-surface-variant'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <div
            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-on-surface">{label}</p>
        {description && <p className="text-xs text-on-surface-variant">{description}</p>}
      </div>
    </label>
  );
}

// ── Number input ──────────────────────────────────────────────────────────────

function DaysInput({
  value,
  onChange,
  disabled,
  label
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="min-w-0 flex-1 text-sm text-on-surface-variant">{label}</label>
      <input
        type="number"
        min={1}
        max={30}
        value={value}
        onChange={e => onChange(Math.max(1, Math.min(30, Number(e.target.value))))}
        disabled={disabled}
        className="w-20 rounded-lg border border-outline/30 bg-surface-container px-3 py-1.5 text-center text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
      />
      <span className="shrink-0 text-xs text-on-surface-variant">dias</span>
    </div>
  );
}

// ── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  children,
  badge
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="rounded-2xl border border-outline/10 bg-surface-container-low p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10">
          <span className="material-symbols-outlined text-xl text-emerald-500">{icon}</span>
        </div>
        <div>
          <h2 className="font-semibold text-on-surface">{title}</h2>
          {badge && (
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AlertasConfigPage() {
  const qc = useQueryClient();
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [activePushEndpoint, setActivePushEndpoint] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  const { data: config, isLoading, isError } = useQuery({
    queryKey: ['alertas-configuracao'],
    queryFn: alertasApi.configuracao.obter
  });

  const { data: vapidKey } = useQuery({
    queryKey: ['alertas-vapid-key'],
    queryFn: alertasApi.push.obterVapidKey,
    retry: false
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['alertas-push-subscriptions'],
    queryFn: alertasApi.push.listarSubscriptions,
    enabled: pushSupported
  });

  const [form, setForm] = useState<ConfiguracaoNotificacao>({
    emailAtivo: false,
    emailDestinatario: null,
    emailVencimento: true,
    emailDiasAntecedencia: 3,
    emailLimiteCategoria: false,
    pushAtivo: false,
    pushVencimento: true,
    pushDiasAntecedencia: 1,
    pushLimiteCategoria: false
  });

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setPushSupported(supported);
    if (supported) setPushPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!pushSupported) return;
    navigator.serviceWorker.getRegistration('/sw.js').then(reg => {
      if (!reg) return;
      reg.pushManager.getSubscription().then(sub => {
        setActivePushEndpoint(sub?.endpoint ?? null);
      });
    });
  }, [pushSupported]);

  const saveMutation = useMutation({
    mutationFn: () => alertasApi.configuracao.salvar(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alertas-configuracao'] });
      notify('success', 'Configuração salva', 'Preferências de notificação atualizadas.');
    },
    onError: err => notify('error', 'Erro ao salvar', getApiErrorMessage(err))
  });

  const removePushMutation = useMutation({
    mutationFn: (id: string) => alertasApi.push.removerSubscription(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alertas-push-subscriptions'] })
  });

  async function handleSubscribePush() {
    if (!vapidKey?.publicKey) {
      notify('error', 'Push não disponível', 'Chave VAPID não configurada no servidor.');
      return;
    }
    const permission = await Notification.requestPermission();
    setPushPermission(permission);
    if (permission !== 'granted') {
      notify('warning', 'Permissão negada', 'Ative as notificações nas configurações do navegador.');
      return;
    }
    setSubscribing(true);
    try {
      const sub = await subscribeToPush(vapidKey.publicKey);
      if (!sub) {
        notify('error', 'Erro', 'Push não suportado neste navegador.');
        return;
      }
      const subJson = sub.toJSON();
      await alertasApi.push.registrarSubscription({
        endpoint: sub.endpoint,
        p256dh: subJson.keys?.p256dh ?? '',
        auth: subJson.keys?.auth ?? ''
      });
      setActivePushEndpoint(sub.endpoint);
      setForm(f => ({ ...f, pushAtivo: true }));
      qc.invalidateQueries({ queryKey: ['alertas-push-subscriptions'] });
      notify('success', 'Push ativado', 'Você receberá notificações neste navegador.');
    } catch (err) {
      notify('error', 'Erro ao ativar push', getApiErrorMessage(err));
    } finally {
      setSubscribing(false);
    }
  }

  async function handleUnsubscribePush() {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    const sub = await reg?.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    setActivePushEndpoint(null);
    setForm(f => ({ ...f, pushAtivo: false }));
    const match = subscriptions?.find(s => s.endpoint === sub?.endpoint);
    if (match) removePushMutation.mutate(match.id);
  }

  const patch = (partial: Partial<ConfiguracaoNotificacao>) => setForm(f => ({ ...f, ...partial }));

  if (isLoading) return <PageState variant="loading" />;
  if (isError) return <PageState variant="error" title="Erro ao carregar configurações" />;

  const pushEnabled = pushSupported && pushPermission === 'granted' && !!activePushEndpoint;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Email */}
      <SectionCard icon="email" title="Notificações por e-mail">
        <Toggle
          checked={form.emailAtivo}
          onChange={v => patch({ emailAtivo: v })}
          label="Ativar alertas por e-mail"
          description="Envio diário com as suas contas a vencer e alertas de orçamento"
        />
        {form.emailAtivo && (
          <div className="mt-3 space-y-3 pl-14">
            <div>
              <label className="mb-1 block text-xs font-medium text-on-surface-variant">
                E-mail destinatário
              </label>
              <input
                type="email"
                value={form.emailDestinatario ?? ''}
                onChange={e => patch({ emailDestinatario: e.target.value })}
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-outline/30 bg-surface-container px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <Toggle
              checked={form.emailVencimento}
              onChange={v => patch({ emailVencimento: v })}
              label="Alerta de vencimento"
              description="Aviso de contas a pagar com antecedência configurável"
            />
            {form.emailVencimento && (
              <DaysInput
                value={form.emailDiasAntecedencia}
                onChange={v => patch({ emailDiasAntecedencia: v })}
                label="Antecedência"
              />
            )}
            <Toggle
              checked={form.emailLimiteCategoria}
              onChange={v => patch({ emailLimiteCategoria: v })}
              label="Alerta de limite de orçamento"
              description="Aviso quando uma categoria atingir 90% do orçamento mensal"
            />
          </div>
        )}
      </SectionCard>

      {/* Web Push */}
      <SectionCard
        icon="notifications"
        title="Notificações push"
        badge={pushEnabled ? 'Ativado neste navegador' : undefined}
      >
        {!pushSupported ? (
          <p className="text-sm text-on-surface-variant">
            Seu navegador não suporta Web Push. Use um navegador moderno como Chrome ou Firefox.
          </p>
        ) : (
          <>
            {!pushEnabled ? (
              <div className="flex items-start gap-3 py-2">
                <span className="material-symbols-outlined mt-0.5 text-xl text-on-surface-variant">
                  notifications_off
                </span>
                <div className="flex-1">
                  <p className="text-sm text-on-surface">Push não ativado neste navegador</p>
                  <p className="text-xs text-on-surface-variant">
                    Ative para receber alertas instantâneos de vencimento e orçamento.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubscribePush}
                  loading={subscribing}
                  disabled={subscribing}
                >
                  Ativar
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 py-2">
                  <span className="material-symbols-outlined text-xl text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  <p className="flex-1 text-sm text-on-surface">Push ativado neste navegador</p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleUnsubscribePush}
                  >
                    Desativar
                  </Button>
                </div>
                <Toggle
                  checked={form.pushVencimento}
                  onChange={v => patch({ pushVencimento: v })}
                  label="Alerta de vencimento"
                  description="Notificação push com contas prestes a vencer"
                />
                {form.pushVencimento && (
                  <div className="pl-14">
                    <DaysInput
                      value={form.pushDiasAntecedencia}
                      onChange={v => patch({ pushDiasAntecedencia: v })}
                      label="Antecedência"
                    />
                  </div>
                )}
                <Toggle
                  checked={form.pushLimiteCategoria}
                  onChange={v => patch({ pushLimiteCategoria: v })}
                  label="Alerta de limite de orçamento"
                  description="Notificação push ao atingir 90% do orçamento de uma categoria"
                />
              </>
            )}
          </>
        )}
      </SectionCard>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={saveMutation.isPending}
        >
          Salvar configurações
        </Button>
      </div>
    </div>
  );
}
