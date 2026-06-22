"use client";

import * as React from "react";
import {
  Loader2,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { useProducts, useSuppliers } from "@/hooks/use-inventory";
import { createSupplier, deleteSupplier, updateSupplier } from "@/lib/api-client";
import { type Supplier } from "@/lib/types";

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

type FormState = {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
};

const emptyForm: FormState = {
  name: "",
  contactName: "",
  phone: "",
  email: "",
  address: "",
};

export default function SuppliersPage() {
  const { suppliers, isLoading, mutate } = useSuppliers();
  const { products } = useProducts();

  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Supplier | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Supplier | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const productCount = React.useCallback(
    (supplierId: string) =>
      products.filter((p) => p.supplierId === supplierId).length,
    [products]
  );

  const filtered = React.useMemo(() => {
    if (!search) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.contactName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }, [suppliers, search]);

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

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      contactName: supplier.contactName,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const result = editing
      ? await updateSupplier(editing.id, form)
      : await createSupplier(form);

    setSubmitting(false);

    if (!result.success) {
      setFormError(result.message ?? "Gagal menyimpan supplier.");
      return;
    }

    await mutate();
    toast.success(editing ? "Supplier diperbarui" : "Supplier ditambahkan", {
      description: form.name,
    });
    setDialogOpen(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteSupplier(deleteTarget.id);
    setDeleting(false);

    if (result.success) {
      await mutate();
      toast.success("Supplier dihapus", { description: deleteTarget.name });
    } else {
      toast.error(result.message ?? "Gagal menghapus supplier.");
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
            <CardTitle>Daftar Supplier</CardTitle>
            <CardDescription>
              {filtered.length} dari {suppliers.length} supplier
            </CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Tambah Supplier
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama, kontak, atau email..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Supplier tidak ditemukan"
              description="Coba ubah kata kunci pencarian, atau tambahkan supplier baru."
              action={
                <Button size="sm" onClick={openCreate}>
                  <Plus className="size-4" />
                  Tambah supplier
                </Button>
              }
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Supplier</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead className="text-right">Produk</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">{s.contactName}</div>
                        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="size-3" /> {s.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="size-3" /> {s.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-56 text-sm text-muted-foreground">
                        <span className="flex items-start gap-1">
                          <MapPin className="mt-0.5 size-3 shrink-0" />
                          {s.address}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{productCount(s.id)} produk</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(s)}>
                              <Pencil className="size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(s)}
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

      {/* Dialog Tambah/Edit Supplier */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Supplier" : "Tambah Supplier Baru"}
              </DialogTitle>
              <DialogDescription>
                Lengkapi data kontak supplier di bawah ini.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Nama Supplier</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: PT Sumber Elektronik Jaya"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">Nama Kontak</Label>
                <Input
                  id="contactName"
                  value={form.contactName}
                  onChange={(e) =>
                    setForm({ ...form, contactName: e.target.value })
                  }
                  placeholder="Nama PIC"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telepon</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0812xxxxxxx"
                  required
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nama@supplier.co.id"
                  required
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Alamat lengkap supplier"
                  required
                />
              </div>

              {formError && (
                <p className="col-span-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
                {editing ? "Simpan Perubahan" : "Tambah Supplier"}
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
            <AlertDialogTitle>Hapus supplier ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Supplier <span className="font-medium">{deleteTarget?.name}</span>{" "}
              akan dihapus permanen. Supplier yang masih dipakai produk tidak
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
