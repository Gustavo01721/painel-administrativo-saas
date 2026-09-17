import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { currency } from "@/lib/pizza-data";
import { usePizza } from "@/lib/pizza-store";

const tooltipStyle = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "var(--color-foreground)",
};

const axis = { stroke: "var(--color-muted-foreground)", fontSize: 11 };

function Vazio({ children }: { children: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
      {children}
    </div>
  );
}

export function VendasPorHoraChart() {
  const { analytics } = usePizza();
  const data = analytics.porHora;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Vendas por horário</h2>
          <p className="text-xs text-muted-foreground">Identifique os picos de movimento</p>
        </div>
        <span className="rounded-md bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
          Pico às {analytics.pico}
        </span>
      </div>
      {data.length === 0 ? (
        <Vazio>Sem pedidos no período selecionado</Vazio>
      ) : (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="hora" tickLine={false} axisLine={false} {...axis} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                {...axis}
                tickFormatter={(v: number) => `R$${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name) => (name === "receita" ? currency(v) : `${v} pedidos`)}
              />
              <Area
                type="monotone"
                dataKey="receita"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#gradReceita)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function VendasPorDiaChart() {
  const { analytics } = usePizza();

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">Receita por dia da semana</h2>
        <p className="text-xs text-muted-foreground">Total vs. parcela vinda de promoções</p>
      </div>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={analytics.porDia} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="dia" tickLine={false} axisLine={false} {...axis} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              {...axis}
              tickFormatter={(v: number) => `R$${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip
              cursor={{ fill: "var(--color-surface-hover)" }}
              contentStyle={tooltipStyle}
              formatter={(v: number) => currency(v)}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar
              name="Receita total"
              dataKey="receita"
              fill="var(--color-primary)"
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              name="Via promoções"
              dataKey="promo"
              fill="var(--color-success)"
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const cores = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
];

export function BordasChart() {
  const { analytics } = usePizza();
  const data = analytics.bordasAdicionais;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-foreground">Bordas adicionais</h2>
        <p className="text-xs text-muted-foreground">Distribuição das pizzas do período</p>
      </div>
      {data.length === 0 ? (
        <Vazio>Sem pizzas no período</Vazio>
      ) : (
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="pedidos"
                nameKey="nome"
                cx="50%"
                cy="45%"
                innerRadius={48}
                outerRadius={78}
                paddingAngle={3}
                isAnimationActive={false}
              >
                {data.map((_entry: { nome: string }, i: number) => (
                  <Cell
                    key={i}
                    fill={cores[i % cores.length]}
                    stroke="var(--color-card)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v} pizzas`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function InteiraMeioChart() {
  const { analytics } = usePizza();
  const data = [
    { nome: "Pizza inteira", pedidos: analytics.inteiras },
    { nome: "Meio a meio", pedidos: analytics.metades },
  ];
  const total = data.reduce((s, d) => s + d.pedidos, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-foreground">Inteira vs. meio a meio</h2>
        <p className="text-xs text-muted-foreground">Como os clientes montam as pizzas</p>
      </div>
      {total === 0 ? (
        <Vazio>Sem pizzas no período</Vazio>
      ) : (
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="pedidos"
                nameKey="nome"
                cx="50%"
                cy="45%"
                outerRadius={78}
                paddingAngle={3}
                isAnimationActive={false}
              >
                {data.map((_entry, i) => (
                  <Cell key={i} fill={cores[i]} stroke="var(--color-card)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v} pizzas`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
