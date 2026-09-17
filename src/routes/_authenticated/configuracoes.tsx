import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PizzaPage } from "@/components/pizza/dashboard-shell";
import { usePizza } from "@/lib/pizza-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

type Motoboy = { id: string; nome: string; whatsapp: string; ativo: boolean };

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Painel Administrativo" },
      {
        name: "description",
        content: "Dados do estabelecimento, taxa de entrega, metas e automações de cupons.",
      },
      { property: "og:title", content: "Configurações — Painel Administrativo" },
      {
        property: "og:description",
        content: "Ajuste operação, metas comerciais e disparos automáticos de promoções.",
      },
    ],
  }),
  component: ConfiguracoesPage,
});

const automacoes = [
  {
    key: "cupomInativos",
    label: "Cupom para clientes inativos",
    desc: "Envia cupom por WhatsApp após 30 dias sem pedidos.",
  },
  {
    key: "cupomAniversario",
    label: "Cupom de aniversário",
    desc: "Brinde automático no mês do aniversário do cliente.",
  },
  {
    key: "whatsappCarrinho",
    label: "Recuperação de carrinho",
    desc: "Cupom de 10% após 40 min de carrinho abandonado.",
  },
  {
    key: "alertaPico",
    label: "Alerta de pico de pedidos",
    desc: "Notifica a gerência quando a fila da cozinha cresce.",
  },
  {
    key: "resumoDiario",
    label: "Resumo diário por e-mail",
    desc: "Fechamento do caixa enviado todo dia às 23h59.",
  },
];

function ConfiguracoesPage() {
  const { settings, saveSettings } = usePizza();
  const [form, setForm] = useState(settings);
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [novoMotoboy, setNovoMotoboy] = useState({ nome: "", whatsapp: "" });

  useEffect(() => {
    void supabase
      .from("motoboys" as any)
      .select("id,nome,whatsapp,ativo")
      .order("nome")
      .then(({ data }) => setMotoboys((data ?? []) as Motoboy[]));
  }, []);

  const adicionarMotoboy = async () => {
    if (!novoMotoboy.nome.trim() || !novoMotoboy.whatsapp.trim()) {
      toast.error("Informe o nome e o WhatsApp do motoboy");
      return;
    }
    const { data, error } = await supabase
      .from("motoboys" as any)
      .insert({ nome: novoMotoboy.nome.trim(), whatsapp: novoMotoboy.whatsapp.trim(), ativo: true })
      .select("id,nome,whatsapp,ativo")
      .single();
    if (error || !data) { toast.error(error?.message ?? "Não foi possível adicionar"); return; }
    setMotoboys((prev) => [...prev, data as Motoboy].sort((a, b) => a.nome.localeCompare(b.nome)));
    setNovoMotoboy({ nome: "", whatsapp: "" });
    toast.success("Motoboy adicionado");
  };

  const alternarMotoboy = async (motoboy: Motoboy) => {
    const ativo = !motoboy.ativo;
    setMotoboys((prev) => prev.map((item) => item.id === motoboy.id ? { ...item, ativo } : item));
    const { error } = await supabase.from("motoboys" as any).update({ ativo }).eq("id", motoboy.id);
    if (error) { setMotoboys((prev) => prev.map((item) => item.id === motoboy.id ? motoboy : item)); toast.error(error.message); }
  };

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <PizzaPage
      title="Configurações do estabelecimento"
      subtitle="Dados da loja, operação, metas e automações."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Dados da pizzaria</h2>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do estabelecimento</Label>
              <Input id="nome" value={form.nome} onChange={(e) => set("nome", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resp">Responsável</Label>
              <Input
                id="resp"
                value={form.responsavel}
                onChange={(e) => set("responsavel", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tel">Telefone</Label>
                <Input
                  id="tel"
                  value={form.telefone}
                  onChange={(e) => set("telefone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappMotoboy">WhatsApp do Motoboy</Label>
                <Input
                  id="whatsappMotoboy"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={form.whatsappMotoboy}
                  onChange={(e) => set("whatsappMotoboy", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Endereço</Label>
              <Input
                id="end"
                value={form.endereco}
                onChange={(e) => set("endereco", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Operação e metas</h2>
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="taxa">Taxa de entrega (R$)</Label>
                <Input
                  id="taxa"
                  type="number"
                  step="0.5"
                  value={form.taxaEntrega}
                  onChange={(e) => set("taxaEntrega", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempo">Tempo de preparo (min)</Label>
                <Input
                  id="tempo"
                  type="number"
                  value={form.tempoPreparo}
                  onChange={(e) => set("tempoPreparo", Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="meta">Meta de faturamento (R$)</Label>
                <Input
                  id="meta"
                  type="number"
                  value={form.metaFaturamento}
                  onChange={(e) => set("metaFaturamento", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket">Meta de ticket médio (R$)</Label>
                <Input
                  id="ticket"
                  type="number"
                  value={form.metaTicket}
                  onChange={(e) => set("metaTicket", Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Loja aceitando pedidos</p>
                <p className="text-xs text-muted-foreground">
                  Desligue para pausar o delivery imediatamente.
                </p>
              </div>
              <Switch checked={form.aberto} onCheckedChange={(v) => set("aberto", v)} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Motoboys</h2>
        <p className="text-xs text-muted-foreground">Cadastre vários entregadores para receber e assumir pedidos.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="Nome do motoboy" value={novoMotoboy.nome} onChange={(e) => setNovoMotoboy((v) => ({ ...v, nome: e.target.value }))} />
          <Input type="tel" placeholder="WhatsApp" value={novoMotoboy.whatsapp} onChange={(e) => setNovoMotoboy((v) => ({ ...v, whatsapp: e.target.value }))} />
          <Button onClick={adicionarMotoboy}>Adicionar</Button>
        </div>
        <div className="mt-4 divide-y divide-border rounded-lg border border-border">
          {motoboys.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhum motoboy cadastrado.</p>}
          {motoboys.map((motoboy) => (
            <div key={motoboy.id} className="flex items-center justify-between gap-4 p-4">
              <div><p className="text-sm font-medium text-foreground">{motoboy.nome}</p><p className="text-xs text-muted-foreground">{motoboy.whatsapp}</p></div>
              <Switch checked={motoboy.ativo} onCheckedChange={() => void alternarMotoboy(motoboy)} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Bot de Mensagens</h2>
        <p className="text-xs text-muted-foreground">
          Controle o bot automático de atendimento via WhatsApp.
        </p>
        <div className="mt-5">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">Bot de Mensagens</p>
                {form.botMensagens && (
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                    ATIVO 100%
                  </span>
                )}
                {!form.botMensagens && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    DESLIGADO
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Quando ligado, o bot responde automaticamente 100% das mensagens dos clientes no WhatsApp.
              </p>
            </div>
            <Switch
              checked={form.botMensagens}
              onCheckedChange={(v) => set("botMensagens", v)}
            />
          </div>
          {form.botMensagens && (
            <div className="mt-3 rounded-lg border border-success/20 bg-success/5 p-3">
              <p className="text-xs font-medium text-success">
                O bot está 100% ativo e respondendo todas as mensagens automaticamente.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Automações de promoções</h2>
        <p className="text-xs text-muted-foreground">
          Campanhas disparadas automaticamente pelo sistema
        </p>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {automacoes.map((a) => (
            <div
              key={a.key}
              className="flex items-center justify-between gap-4 rounded-lg border border-border p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </div>
              <Switch
                checked={!!form.automations[a.key]}
                onCheckedChange={(v) => set("automations", { ...form.automations, [a.key]: v })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setForm(settings);
            toast.info("Alterações descartadas");
          }}
        >
          Descartar
        </Button>
        <Button
          onClick={() => {
            saveSettings(form);
            toast.success("Configurações salvas");
          }}
        >
          Salvar alterações
        </Button>
      </div>
    </PizzaPage>
  );
}
