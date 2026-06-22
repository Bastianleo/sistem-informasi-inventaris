"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, Bell, PackageX } from "lucide-react";

import { useProducts } from "@/hooks/use-inventory";
import { getStockStatus } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Dasbor",
    description: "Ringkasan kondisi inventaris Anda",
  },
  "/products": {
    title: "Produk",
    description: "Kelola data produk dan stok",
  },
  "/categories": {
    title: "Kategori",
    description: "Kelompokkan produk berdasarkan kategori",
  },
  "/suppliers": {
    title: "Supplier",
    description: "Kelola data pemasok barang",
  },
  "/stock": {
    title: "Stok Masuk/Keluar",
    description: "Catat dan pantau mutasi stok",
  },
};

export function SiteHeader() {
  const pathname = usePathname();
  const { products } = useProducts();

  const current = pageTitles[pathname] ?? {
    title: "Stokly",
    description: "",
  };

  const lowStock = products.filter((p) => getStockStatus(p) !== "aman");

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-1 flex-col">
        <h1 className="text-sm font-semibold leading-none">{current.title}</h1>
        {current.description && (
          <p className="hidden text-xs text-muted-foreground sm:block">
            {current.description}
          </p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-4" />
            {lowStock.length > 0 && (
              <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-destructive" />
            )}
            <span className="sr-only">Notifikasi</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Notifikasi Stok</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {lowStock.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              Semua stok dalam kondisi aman.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {lowStock.slice(0, 8).map((p) => {
                const status = getStockStatus(p);
                return (
                  <DropdownMenuItem
                    key={p.id}
                    className="flex items-start gap-2"
                  >
                    {status === "habis" ? (
                      <PackageX className="mt-0.5 size-4 text-destructive" />
                    ) : (
                      <AlertTriangle className="mt-0.5 size-4 text-amber-500" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-tight">
                        {p.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sisa stok: {p.stock} {p.unit}
                      </p>
                    </div>
                    <Badge
                      variant={status === "habis" ? "destructive" : "warning"}
                      className="mt-0.5"
                    >
                      {status === "habis" ? "Habis" : "Menipis"}
                    </Badge>
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ModeToggle />
    </header>
  );
}
