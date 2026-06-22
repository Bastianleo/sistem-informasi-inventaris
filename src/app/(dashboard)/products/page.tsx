"use client";

import * as React from "react";
import {
  Boxes,
  Loader2,
  ListFilter,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { useCategories, useProducts, useSuppliers } from "@/hooks/use-inventory";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  type ProductInput,
} from "@/lib/api-client";
import { getStockStatus, type Product } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

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

const PAGE_SIZE = 8;
const UNITS = ["pcs", "box", "lusin", "set", "rim", "roll", "unit"];

type FormState = {
  name: string;
  sku: string;
  categoryId: string;
  supplierId: string;
  unit: string;
  costPrice: string;
  sellPrice: string;
  stock: string;
  minStock: string;
  description: string;
};

const emptyForm: FormState = {
  name: "",
  sku: "",
  categoryId: "",
  supplierId: "",
  unit: "pcs",
  costPrice: "",
  sellPrice: "",
  stock: "0",
  minStock: "5",
  description: "",
};

export default function ProductsPage() {
  const { products, isLoading: productsLoading, mutate } = useProducts();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { suppliers, isLoading: suppliersLoading } = useSuppliers();
  const isLoading = productsLoading || categoriesLoading || suppliersLoading;

  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [supplierFilter, setSupplierFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Product | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "—";
  const supplierName = (id: string) =>
    suppliers.find((s) => s.id === id)?.name ?? "—";

  const filtered = React.useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || p.categoryId === categoryFilter;
      const matchesSupplier =
        supplierFilter === "all" || p.supplierId === supplierFilter;
      const matchesStatus =
        statusFilter === "all" || getStockStatus(p) === statusFilter;
      return matchesSearch && matchesCategory && matchesSupplier && matchesStatus;
    });
  }, [products, search, categoryFilter, supplierFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset to first page when filters change
    setPage(1);
  }, [search, categoryFilter, supplierFilter, statusFilter]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? "",
      supplierId: suppliers[0]?.id ?? "",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      unit: product.unit,
      costPrice: String(product.costPrice),
      sellPrice: String(product.sellPrice),
      stock: String(product.stock),
      minStock: String(product.minStock),
      description: product.description ?? "",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.categoryId || !form.supplierId) {
      setFormError("Kategori dan supplier wajib dipilih.");
      return;
    }

    const costPrice = Number(form.costPrice);
    const sellPrice = Number(form.sellPrice);
    const minStock = Number(form.minStock);
    const stock = Number(form.stock);

    if ([costPrice, sellPrice, minStock, stock].some((n) => Number.isNaN(n) || n < 0)) {
      setFormError("Pastikan semua nilai angka valid dan tidak negatif.");
      return;
    }

    const payload: ProductInput = {
      name: form.name,
      sku: form.sku,
      categoryId: form.categoryId,
      supplierId: form.supplierId,
      unit: form.unit,
      costPrice,
      sellPrice,
      minStock,
      description: form.description.trim() || undefined,
    };

    setSubmitting(true);
    const result = editing
      ? await updateProduct(editing.id, payload)
      : await createProduct({ ...payload, stock });
    setSubmitting(false);

    if (!result.success) {
      setFormError(result.message ?? "Gagal menyimpan produk.");
      return;
    }

    await mutate();
    toast.success(editing ? "Produk diperbarui" : "Produk ditambahkan", {
      description: form.name,
    });
    setDialogOpen(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteProduct(deleteTarget.id);
    setDeleting(false);

    if (result.success) {
      await mutate();
      toast.success("Produk dihapus", { description: deleteTarget.name });
    } else {
      toast.error(result.message ?? "Gagal menghapus produk.");
    }
    setDeleteTarget(null);
  }

  const hasActiveFilters =
    search || categoryFilter !== "all" || supplierFilter !== "all" || statusFilter !== "all";

  function resetFilters() {
    setSearch("");
    setCategoryFilter("all");
    setSupplierFilter("all");
    setStatusFilter("all");
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Daftar Produk</CardTitle>
            <CardDescription>
              {filtered.length} dari {products.length} produk
            </CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Tambah Produk
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau SKU..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Supplier</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <ListFilter className="size-4 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="aman">Aman</SelectItem>
                <SelectItem value="menipis">Menipis</SelectItem>
                <SelectItem value="habis">Habis</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Reset
              </Button>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="Produk tidak ditemukan"
              description="Coba ubah kata kunci atau filter pencarian Anda."
              action={
                hasActiveFilters ? (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Hapus filter
                  </Button>
                ) : (
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="size-4" />
                    Tambah produk pertama
                  </Button>
                )
              }
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Stok</TableHead>
                    <TableHead className="text-right">Harga Beli</TableHead>
                    <TableHead className="text-right">Harga Jual</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((p) => {
                    const status = getStockStatus(p);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {p.sku}
                        </TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {categoryName(p.categoryId)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {supplierName(p.supplierId)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="tabular-nums">
                              {p.stock} {p.unit}
                            </span>
                            <Badge
                              variant={
                                status === "habis"
                                  ? "destructive"
                                  : status === "menipis"
                                  ? "warning"
                                  : "success"
                              }
                            >
                              {status === "habis"
                                ? "Habis"
                                : status === "menipis"
                                ? "Menipis"
                                : "Aman"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(p.costPrice)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(p.sellPrice)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(p)}>
                                <Pencil className="size-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleteTarget(p)}
                              >
                                <Trash2 className="size-4" />
                                Hapus
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
        </CardContent>
      </Card>

      {/* Dialog Tambah/Edit Produk */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Produk" : "Tambah Produk Baru"}
              </DialogTitle>
              <DialogDescription>
                Lengkapi detail produk di bawah ini.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="name">Nama Produk</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Contoh: Mouse Wireless Silent Click"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="AKS-001"
                    className="uppercase"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Satuan</Label>
                  <Select
                    value={form.unit}
                    onValueChange={(v) => setForm({ ...form, unit: v })}
                  >
                    <SelectTrigger id="unit" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Kategori</Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(v) => setForm({ ...form, categoryId: v })}
                  >
                    <SelectTrigger id="categoryId" className="w-full">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Supplier</Label>
                  <Select
                    value={form.supplierId}
                    onValueChange={(v) => setForm({ ...form, supplierId: v })}
                  >
                    <SelectTrigger id="supplierId" className="w-full">
                      <SelectValue placeholder="Pilih supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Harga Beli (Rp)</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    min={0}
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellPrice">Harga Jual (Rp)</Label>
                  <Input
                    id="sellPrice"
                    type="number"
                    min={0}
                    value={form.sellPrice}
                    onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">
                    {editing ? "Stok Saat Ini" : "Stok Awal"}
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    min={0}
                    value={form.stock}
                    disabled={!!editing}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                  {editing && (
                    <p className="text-xs text-muted-foreground">
                      Ubah stok melalui menu Stok Masuk/Keluar.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">Stok Minimum</Label>
                  <Input
                    id="minStock"
                    type="number"
                    min={0}
                    value={form.minStock}
                    onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Deskripsi (opsional)</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Catatan tambahan tentang produk ini"
                  />
                </div>
              </div>

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
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {editing ? "Simpan Perubahan" : "Tambah Produk"}
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
            <AlertDialogTitle>Hapus produk ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Produk <span className={cn("font-medium")}>{deleteTarget?.name}</span>{" "}
              beserta seluruh riwayat mutasi stoknya akan dihapus permanen. Tindakan
              ini tidak dapat dibatalkan.
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
