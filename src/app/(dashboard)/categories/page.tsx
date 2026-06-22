"use client";

import * as React from "react";
import { Loader2, MoreHorizontal, Pencil, Plus, Search, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useCategories, useProducts } from "@/hooks/use-inventory";
import { createCategory, deleteCategory, updateCategory } from "@/lib/api-client";
import { type Category } from "@/lib/types";

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

type FormState = { name: string; description: string };
const emptyForm: FormState = { name: "", description: "" };

export default function CategoriesPage() {
  const { categories, isLoading, mutate } = useCategories();
  const { products } = useProducts();

  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Category | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const productCount = React.useCallback(
    (categoryId: string) =>
      products.filter((p) => p.categoryId === categoryId).length,
    [products]
  );

  const filtered = React.useMemo(() => {
    if (!search) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [categories, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset to first page when search changes
    setPage(1);
  }, [search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setForm({ name: category.name, description: category.description });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const result = editing
      ? await updateCategory(editing.id, form)
      : await createCategory(form);

    setSubmitting(false);

    if (!result.success) {
      setFormError(result.message ?? "Gagal menyimpan kategori.");
      return;
    }

    await mutate();
    toast.success(editing ? "Kategori diperbarui" : "Kategori ditambahkan", {
      description: form.name,
    });
    setDialogOpen(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteCategory(deleteTarget.id);
    setDeleting(false);

    if (result.success) {
      await mutate();
      toast.success("Kategori dihapus", { description: deleteTarget.name });
    } else {
      toast.error(result.message ?? "Gagal menghapus kategori.");
    }
    setDeleteTarget(null);
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
            <CardTitle>Daftar Kategori</CardTitle>
            <CardDescription>
              {filtered.length} dari {categories.length} kategori
            </CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Tambah Kategori
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari kategori..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Tags}
              title="Kategori tidak ditemukan"
              description="Coba ubah kata kunci pencarian, atau tambahkan kategori baru."
              action={
                <Button size="sm" onClick={openCreate}>
                  <Plus className="size-4" />
                  Tambah kategori
                </Button>
              }
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Kategori</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-right">Jumlah Produk</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.description || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{productCount(c.id)} produk</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(c)}>
                              <Pencil className="size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(c)}
                            >
                              <Trash2 className="size-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
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

      {/* Dialog Tambah/Edit Kategori */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Kategori" : "Tambah Kategori Baru"}
              </DialogTitle>
              <DialogDescription>
                Kategori membantu mengelompokkan produk agar lebih mudah dicari.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Kategori</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Elektronik"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Penjelasan singkat tentang kategori ini"
                />
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
                {editing ? "Simpan Perubahan" : "Tambah Kategori"}
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
            <AlertDialogTitle>Hapus kategori ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategori <span className="font-medium">{deleteTarget?.name}</span>{" "}
              akan dihapus permanen. Kategori yang masih dipakai produk tidak
              dapat dihapus.
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
