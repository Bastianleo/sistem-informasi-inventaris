"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowUpRight,
  Boxes,
  PackageX,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
} from "recharts";

import { useCategories, useMovements, useProducts } from "@/hooks/use-inventory";
import { getStockStatus } from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const trendConfig: ChartConfig = {
  in: { label: "Stok Masuk", color: "var(--chart-2)" },
  out: { label: "Stok Keluar", color: "var(--chart-1)" },
};

const DAY_LABEL = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
});

function buildTrend(
  movements: { date: string; type: "in" | "out"; quantity: number }[],
  days: number
) {
  const buckets = new Map<string, { date: string; in: number; out: number }>();
  const order: string[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { date: DAY_LABEL.format(d), in: 0, out: 0 });
    order.push(key);
  }

  for (const m of movements) {
    const key = m.date.slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (m.type === "in") bucket.in += m.quantity;
    else bucket.out += m.quantity;
  }

  return order.map((key) => buckets.get(key)!);
}

const CATEGORY_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

export default function DashboardPage() {
  const { products, isLoading: productsLoading } = useProducts();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { movements, isLoading: movementsLoading } = useMovements();
  const isLoading = productsLoading || categoriesLoading || movementsLoading;

  const stats = React.useMemo(() => {
    const totalProducts = products.length;
    const totalStockValue = products.reduce(
      (sum, p) => sum + p.stock * p.costPrice,
      0
    );
    const lowStock = products.filter((p) => getStockStatus(p) === "menipis");
    const outOfStock = products.filter((p) => getStockStatus(p) === "habis");

    const today = new Date().toISOString().slice(0, 10);
    const todayMovements = movements.filter((m) => m.date.slice(0, 10) === today);

    return {
      totalProducts,
      totalStockValue,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      todayMovementsCount: todayMovements.length,
    };
  }, [products, movements]);

  const trendData = React.useMemo(() => buildTrend(movements, 14), [movements]);

  const categoryData = React.useMemo(() => {
    return categories
      .map((c, idx) => {
        const value = products
          .filter((p) => p.categoryId === c.id)
          .reduce((sum, p) => sum + p.stock, 0);
        return { name: c.name, value, fill: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] };
      })
      .filter((c) => c.value > 0);
  }, [categories, products]);

  const attentionProducts = React.useMemo(() => {
    return products
      .filter((p) => getStockStatus(p) !== "aman")
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6);
  }, [products]);

  const recentMovements = React.useMemo(() => {
    return [...movements]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [movements]);

  function productName(id: string) {
    return products.find((p) => p.id === id)?.name ?? "Produk dihapus";
  }

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Produk"
          value={stats.totalProducts.toString()}
          icon={Boxes}
          hint={`${categories.length} kategori aktif`}
        />
        <StatCard
          label="Nilai Stok"
          value={formatCurrency(stats.totalStockValue)}
          icon={Wallet}
          hint="Berdasarkan harga modal"
        />
        <StatCard
          label="Stok Menipis"
          value={stats.lowStockCount.toString()}
          icon={AlertTriangle}
          accent="warning"
          hint="Perlu segera direstok"
        />
        <StatCard
          label="Stok Habis"
          value={stats.outOfStockCount.toString()}
          icon={PackageX}
          accent="destructive"
          hint="Tidak tersedia untuk dijual"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tren Stok Masuk &amp; Keluar</CardTitle>
            <CardDescription>14 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendConfig} className="h-64 w-full">
              <AreaChart data={trendData} margin={{ left: 0, right: 12 }}>
                <defs>
                  <linearGradient id="fillIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="fillOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={1}
                />
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <Area
                  dataKey="in"
                  type="monotone"
                  fill="url(#fillIn)"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="out"
                  type="monotone"
                  fill="url(#fillOut)"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: "var(--chart-2)" }} />
                Stok Masuk
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: "var(--chart-1)" }} />
                Stok Keluar
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Stok per Kategori</CardTitle>
            <CardDescription>Jumlah unit tersedia</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <EmptyState icon={Boxes} title="Belum ada data stok" />
            ) : (
              <>
                <ChartContainer config={{}} className="mx-auto h-52 w-full max-w-52">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      strokeWidth={4}
                    >
                      {categoryData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {categoryData.map((c) => (
                    <span key={c.name} className="flex items-center gap-1.5 truncate">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: c.fill }}
                      />
                      <span className="truncate text-muted-foreground">{c.name}</span>
                    </span>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Mutasi Stok Terbaru</CardTitle>
              <CardDescription>6 transaksi terakhir</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/stock">
                Lihat semua
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentMovements.length === 0 ? (
              <EmptyState icon={Boxes} title="Belum ada mutasi stok" />
            ) : (
              <div className="divide-y">
                {recentMovements.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 py-3">
                    {m.type === "in" ? (
                      <ArrowDownCircle className="size-5 shrink-0 text-success" />
                    ) : (
                      <ArrowUpCircle className="size-5 shrink-0 text-destructive" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {productName(m.productId)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.note ?? (m.type === "in" ? "Stok masuk" : "Stok keluar")} ·{" "}
                        {formatDate(m.date)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        m.type === "in" ? "text-success" : "text-destructive"
                      )}
                    >
                      {m.type === "in" ? "+" : "-"}
                      {m.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Perlu Perhatian</CardTitle>
              <CardDescription>Stok menipis &amp; habis</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/products">
                Kelola
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {attentionProducts.length === 0 ? (
              <EmptyState
                icon={Boxes}
                title="Semua stok aman"
                description="Tidak ada produk yang perlu direstok saat ini."
              />
            ) : (
              <div className="divide-y">
                {attentionProducts.map((p) => {
                  const status = getStockStatus(p);
                  return (
                    <div key={p.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Sisa {p.stock} {p.unit} · min. {p.minStock}
                        </p>
                      </div>
                      <Badge variant={status === "habis" ? "destructive" : "warning"}>
                        {status === "habis" ? "Habis" : "Menipis"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
