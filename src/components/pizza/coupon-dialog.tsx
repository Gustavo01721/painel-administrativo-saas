import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import {
  couponTypeLabel,
  diasSemana,
  posicaoLabel,
  type BannerPosicao,
  type Coupon,
  type CouponType,
} from "@/lib/pizza-data";
import { usePizza } from "@/lib/pizza-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type FormState = Omit<Coupon, "id" | "usos" | "receitaGerada" | "descontoConcedido">;

const emptyForm = (): FormState => {
  const now = new Date();
  const fim = new Date();
  fim.setDate(fim.getDate() + 30);
  const iso = (d: Date) =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return {
    codigo: "",
    descricao: "",
    tipo: "percentual",
    valor: 10,
    brinde: "",
    minimo: 60,
    limiteTotal: 100,
    limitePorCliente: 1,
    canal: "todos",
    dias: [],
    inicio: iso(now),
    fim: iso(fim),
    ativo: true,
    bannerUrl: null,
    bannerPath: null,
    posicao: "banner_topo",
  };
};

export function CouponDialog({ trigger, coupon }: { trigger: ReactNode; coupon?: Coupon }) {
  const { addCoupon, updateCoupon, coupons, uploadBanner } = usePizza();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [enviando, setEnviando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setForm(coupon ? { ...coupon } : emptyForm());
  }, [open, coupon]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleDia = (d: number) =>
    setForm((f) => ({
      ...f,
      dias: f.dias.includes(d) ? f.dias.filter((x) => x !== d) : [...f.dias, d].sort(),
    }));

  const escolherArquivo = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Envie um arquivo de imagem (JPG, PNG ou WEBP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem precisa ter no máximo 5 MB");
      return;
    }
    setEnviando(true);
    const res = await uploadBanner(file);
    setEnviando(false);
    if (res) {
      setForm((f) => ({ ...f, bannerUrl: res.url, bannerPath: res.path }));
      toast.success("Banner enviado");
    }
  };

  const submit = async () => {
    const codigo = form.codigo.trim().toUpperCase().replace(/\s+/g, "");
    if (codigo.length < 3) return toast.error("Informe um código com pelo menos 3 caracteres");
    if (coupons.some((c) => c.codigo === codigo && c.id !== coupon?.id))
      return toast.error(`O cupom ${codigo} já existe`);
    if (form.tipo === "percentual" && (form.valor <= 0 || form.valor > 90))
      return toast.error("Percentual deve ficar entre 1% e 90%");
    if (form.tipo === "fixo" && form.valor <= 0) return toast.error("Informe o valor do desconto");
    if (form.tipo === "brinde" && !form.brinde.trim()) return toast.error("Descreva o item brinde");
    if (new Date(form.fim) <= new Date(form.inicio))
      return toast.error("A expiração deve ser depois do início");

    setSalvando(true);
    try {
      if (coupon) {
        await updateCoupon(coupon.id, { ...form, codigo });
        toast.success(`Cupom ${codigo} atualizado`);
      } else {
        await addCoupon({ ...form, codigo });
        toast.success(`Cupom ${codigo} criado e publicado no site`);
      }
      setOpen(false);
    } catch {
      /* erro já notificado pelo store */
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{coupon ? `Editar ${coupon.codigo}` : "Novo cupom / promoção"}</DialogTitle>
          <DialogDescription>
            Defina o desconto, o banner exibido no site, as regras de uso e a validade da campanha.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código do cupom</Label>
              <Input
                id="codigo"
                value={form.codigo}
                onChange={(e) => set("codigo", e.target.value.toUpperCase())}
                placeholder="PIZZA10"
                className="font-mono uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de desconto</Label>
              <Select value={form.tipo} onValueChange={(v) => set("tipo", v as CouponType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(couponTypeLabel) as CouponType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {couponTypeLabel[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Chamada exibida no site</Label>
            <Input
              id="descricao"
              value={form.descricao}
              placeholder="10% OFF em qualquer pizza acima de R$ 60"
              onChange={(e) => set("descricao", e.target.value)}
            />
          </div>

          {form.tipo === "percentual" && (
            <div className="space-y-2">
              <Label htmlFor="valor">Percentual de desconto (%)</Label>
              <Input
                id="valor"
                type="number"
                min={1}
                max={90}
                value={form.valor}
                onChange={(e) => set("valor", Number(e.target.value))}
              />
            </div>
          )}
          {form.tipo === "fixo" && (
            <div className="space-y-2">
              <Label htmlFor="valor">Valor do desconto (R$)</Label>
              <Input
                id="valor"
                type="number"
                min={1}
                step="0.5"
                value={form.valor}
                onChange={(e) => set("valor", Number(e.target.value))}
              />
            </div>
          )}
          {form.tipo === "brinde" && (
            <div className="space-y-2">
              <Label htmlFor="brinde">Item brinde</Label>
              <Input
                id="brinde"
                value={form.brinde}
                placeholder="Borda recheada grátis"
                onChange={(e) => set("brinde", e.target.value)}
              />
            </div>
          )}
          {form.tipo === "frete" && (
            <p className="rounded-lg border border-border bg-surface-hover px-3 py-2.5 text-xs text-muted-foreground">
              A taxa de entrega será zerada automaticamente nos pedidos elegíveis.
            </p>
          )}

          {/* --------------------------- banner visual --------------------------- */}
          <div className="rounded-xl border border-border p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Banner da promoção no site
            </p>
            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <div className="flex h-24 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-surface-hover">
                {form.bannerUrl ? (
                  <img
                    src={form.bannerUrl}
                    alt={`Banner do cupom ${form.codigo || "novo"}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImagePlus className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void escolherArquivo(e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={enviando}
                    onClick={() => fileRef.current?.click()}
                  >
                    {enviando ? (
                      <Loader2 className="mr-1.5 size-4 animate-spin" />
                    ) : (
                      <ImagePlus className="mr-1.5 size-4" />
                    )}
                    Enviar imagem
                  </Button>
                  {form.bannerUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setForm((f) => ({ ...f, bannerUrl: null, bannerPath: null }))}
                    >
                      <Trash2 className="mr-1.5 size-4" /> Remover
                    </Button>
                  )}
                </div>
                <Input
                  value={form.bannerUrl ?? ""}
                  placeholder="ou cole a URL da imagem"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bannerUrl: e.target.value || null, bannerPath: null }))
                  }
                />
                <div className="space-y-1.5">
                  <Label className="text-xs">Onde aparece</Label>
                  <Select
                    value={form.posicao}
                    onValueChange={(v) => set("posicao", v as BannerPosicao)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(posicaoLabel) as BannerPosicao[]).map((p) => (
                        <SelectItem key={p} value={p}>
                          {posicaoLabel[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Regras e condições
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="minimo">Pedido mínimo (R$)</Label>
                <Input
                  id="minimo"
                  type="number"
                  min={0}
                  value={form.minimo}
                  onChange={(e) => set("minimo", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limite">Limite total de usos</Label>
                <Input
                  id="limite"
                  type="number"
                  min={0}
                  value={form.limiteTotal}
                  onChange={(e) => set("limiteTotal", Number(e.target.value))}
                />
                <p className="text-[11px] text-muted-foreground">0 = ilimitado</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="porCliente">Usos por cliente</Label>
                <Input
                  id="porCliente"
                  type="number"
                  min={1}
                  value={form.limitePorCliente}
                  onChange={(e) => set("limitePorCliente", Number(e.target.value))}
                />
                <p className="text-[11px] text-muted-foreground">Validado por telefone</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Aplicação</Label>
                <Select
                  value={form.canal}
                  onValueChange={(v) => set("canal", v as FormState["canal"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Delivery e retirada</SelectItem>
                    <SelectItem value="delivery">Apenas delivery</SelectItem>
                    <SelectItem value="retirada">Apenas retirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dias válidos</Label>
                <div className="flex flex-wrap gap-1.5">
                  {diasSemana.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDia(d.value)}
                      className={cn(
                        "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        form.dias.includes(d.value)
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border text-muted-foreground hover:bg-surface-hover",
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {form.dias.length === 0
                    ? "Nenhum selecionado = válido todos os dias"
                    : "Válido só nos dias marcados"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inicio">Início da validade</Label>
              <Input
                id="inicio"
                type="datetime-local"
                value={form.inicio}
                onChange={(e) => set("inicio", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fim">Expiração</Label>
              <Input
                id="fim"
                type="datetime-local"
                value={form.fim}
                onChange={(e) => set("fim", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} disabled={salvando || enviando}>
            {salvando && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            {coupon ? "Salvar alterações" : "Criar cupom"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
