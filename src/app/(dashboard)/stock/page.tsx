"use client";

import * as React from "react";
import {
  ArrowDownCircle,
  ArrowLeftRight,
  ArrowUpCircle,
  History,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { useMovements, useProducts, useRevalidate, PRODUCTS_KEY, MOVEMENTS_KEY } from "@/hooks/use-inventory";
import { useCurrentUser } from "@/hooks/use-current-user";
import { createMovement, deleteMovement } from "@/lib/api-client";
import { type MovementType, type StockMovement } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/empty-state";
import { TablePagination } from "@/components/table-pagination";
import { StatCard } from "@/components/stat-card";

const PAGE_SIZE = 8;

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

type FormState = {
  type: MovementType;
  productId: string;
  quantity: string;
  date: string;
  reference: string;
  note: string;
};

function buildEmptyForm(type: MovementType): FormState {
  return {
    type,
    productId: "",
    quantity: "",
    date: todayInputValue(),
    reference: "",
    note: "",
  };
}

export default function StockPage() {
  const { user } = useCurrentUser();
  const { products, isLoading: productsLoading } = useProducts();
  const { movements, isLoading: movementsLoading } = useMovements();
  const revalidate = useRevalidate();
  const isLoading = productsLoading || movementsLoading;

  const [tab, setTab] = React.useState<"in" | "out" | "all">("in");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(buildEmptyForm("in"));
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<StockMovement | null>(
    null
  );
  const [deleting, setDeleting] = React.useState(false);

  const productById = React.useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  const sortedMovements = React.useMemo(
    () =>
      [...movements].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [movements]
  );

  const filtered = React.useMemo(() => {
    return sortedMovements.filter((m) => {
      const matchesTab = tab === "all" || m.type === tab;
      if (!matchesTab) return false;
      if (!search) return true;
      const product = productById(m.productId);
      const q = search.toLowerCase();
      return (
        product?.name.toLowerCase().includes(q) ||
        product?.sku.toLowerCase().includes(q) ||
        m.reference?.toLowerCase().includes(q) ||
        m.note?.toLowerCase().includes(q)
      );
    });
  }, [sortedMovements, tab, search, productById]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset to first page when filters change
    setPage(1);
  }, [tab, search]);

  const todayStats = React.useMemo(() => {
    const today = todayInputValue();
    const todays = movements.filter((m) => m.date.slice(0, 10) === today);
    const totalIn = todays
      .filter((m) => m.type === "in")
      .reduce((sum, m) => sum + m.quantity, 0);
    const totalOut = todays
      .filter((m) => m.type === "out")
      .reduce((sum, m) => sum + m.quantity, 0);
    return { count: todays.length, totalIn, totalOut };
  }, [movements]);

  function openCreate(type: MovementType) {
    setForm(buildEmptyForm(type));
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.productId) {
      setFormError("Pilih produk terlebih dahulu.");
      return;
    }

    const quantity = Number(form.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFormError("Jumlah harus berupa angka lebih dari 0.");
      return;
    }

    if (!form.date) {
      setFormError("Tanggal wajib diisi.");
      return;
    }

    setSubmitting(true);
    const result = await createMovement({
      productId: form.productId,
      type: form.type,
      quantity,
      date: new Date(`${form.date}T09:00:00`).toISOString(),
      reference: form.reference.trim() || undefined,
      note: form.note.trim() || undefined,
    });
    setSubmitting(false);

    if (!result.success) {
      setFormError(result.message ?? "Gagal menyimpan mutasi stok.");
      return;
    }

    await revalidate([PRODUCTS_KEY, MOVEMENTS_KEY]);
    toast.success(
      form.type === "in" ? "Stok masuk dicatat" : "Stok keluar dicatat",
      { description: `${productById(form.productId)?.name} · ${quantity} unit` }
    );
    setDialogOpen(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteMovement(deleteTarget.id);
    setDeleting(false);

    if (result.success) {
      await revalidate([PRODUCTS_KEY, MOVEMENTS_KEY]);
      toast.success("Mutasi dihapus dan stok dikembalikan");
    } else {
      toast.error(result.message ?? "Gagal menghapus mutasi.");
    }
    setDeleteTarget(null);
  }

  const selectedProduct = productById(form.productId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Mutasi Hari Ini"
          value={todayStats.count.toString()}
          icon={ArrowLeftRight}
          hint="Jumlah transaksi tercatat"
        />
        <StatCard
          label="Unit Masuk Hari Ini"
          value={todayStats.totalIn.toString()}
          icon={ArrowDownCircle}
          accent="success"
        />
        <StatCard
          label="Unit Keluar Hari Ini"
          value={todayStats.totalOut.toString()}
          icon={ArrowUpCircle}
          accent="destructive"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Riwayat Mutasi Stok</CardTitle>
            <CardDescription>
              Catat dan pantau setiap pergerakan stok masuk maupun keluar
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openCreate("out")}>
              <ArrowUpCircle className="size-4" />
              Stok Keluar
            </Button>
            <Button onClick={() => openCreate("in")}>
              <ArrowDownCircle className="size-4" />
              Stok Masuk
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TabsList>
                <TabsTrigger value="in">
                  <ArrowDownCircle className="size-4" />
                  Stok Masuk
                </TabsTrigger>
                <TabsTrigger value="out">
                  <ArrowUpCircle className="size-4" />
                  Stok Keluar
                </TabsTrigger>
                <TabsTrigger value="all">
                  <History className="size-4" />
                  Semua
                </TabsTrigger>
              </TabsList>
              <div className="relative sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari produk, referensi, catatan..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value={tab} className="mt-0">
              {filtered.length === 0 ? (
                <EmptyState
                  icon={ArrowLeftRight}
                  title="Belum ada mutasi"
                  description="Catat stok masuk atau keluar untuk mulai melacak riwayat."
                />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead>Referensi</TableHead>
                        <TableHead>Dicatat oleh</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageItems.map((m) => {
                        const product = productById(m.productId);
                        return (
                          <TableRow key={m.id}>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                              {formatDate(m.date)}
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">
                                {product?.name ?? "Produk dihapus"}
                              </p>
                              {m.note && (
                                <p className="text-xs text-muted-foreground">
                                  {m.note}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={m.type === "in" ? "success" : "destructive"}
                              >
                                {m.type === "in" ? "Masuk" : "Keluar"}
                              </Badge>
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right font-semibold tabular-nums",
                                m.type === "in" ? "text-success" : "text-destructive"
                              )}
                            >
                              {m.type === "in" ? "+" : "-"}
                              {m.quantity} {product?.unit ?? ""}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {m.reference || "—"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {m.by}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                  >
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setDeleteTarget(m)}
                                  >
                                    <Trash2 className="size-4" />
                                    Hapus &amp; kembalikan stok
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <TablePagination
                    page={currentPage}
                    pageCount={pageCount}
                    totalItems={filtered.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog Catat Mutasi */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                Catat {form.type === "in" ? "Stok Masuk" : "Stok Keluar"}
              </DialogTitle>
              <DialogDescription>
                {form.type === "in"
                  ? "Tambahkan stok dari pembelian, retur, atau penyesuaian."
                  : "Kurangi stok karena penjualan, kerusakan, atau penyesuaian."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Tipe Mutasi</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={form.type === "in" ? "default" : "outline"}
                    onClick={() => setForm({ ...form, type: "in" })}
                  >
                    <ArrowDownCircle className="size-4" />
                    Stok Masuk
                  </Button>
                  <Button
                    type="button"
                    variant={form.type === "out" ? "default" : "outline"}
                    onClick={() => setForm({ ...form, type: "out" })}
                  >
                    <ArrowUpCircle className="size-4" />
                    Stok Keluar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productId">Produk</Label>
                <Select
                  value={form.productId}
                  onValueChange={(v) => setForm({ ...form, productId: v })}
                >
                  <SelectTrigger id="productId" className="w-full">
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.sku} — {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProduct && (
                  <p className="text-xs text-muted-foreground">
                    Stok saat ini:{" "}
                    <span className="font-medium text-foreground">
                      {selectedProduct.stock} {selectedProduct.unit}
                    </span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    Jumlah {selectedProduct ? `(${selectedProduct.unit})` : ""}
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Nomor Referensi (opsional)</Label>
                <Input
                  id="reference"
                  value={form.reference}
                  onChange={(e) =>
                    setForm({ ...form, reference: e.target.value })
                  }
                  placeholder={form.type === "in" ? "PO-2055" : "SO-3037"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Catatan (opsional)</Label>
                <Textarea
                  id="note"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Contoh: Restock dari supplier / Penjualan toko"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Dicatat oleh:{" "}
                <span className="font-medium text-foreground">
                  {user?.name ?? "Pengguna"}
                </span>
              </p>

              {formError && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formError}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Simpan Mutasi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi Hapus */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus mutasi ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Stok produk{" "}
              <span className="font-medium">
                {deleteTarget && productById(deleteTarget.productId)?.name}
              </span>{" "}
              akan dikembalikan seperti sebelum mutasi ini dicatat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
