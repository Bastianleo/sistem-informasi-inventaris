"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface TablePaginationProps {
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  page,
  pageCount,
  totalItems,
  pageSize,
  onPageChange,
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Menampilkan <span className="font-medium text-foreground">{start}</span>
        –<span className="font-medium text-foreground">{end}</span> dari{" "}
        <span className="font-medium text-foreground">{totalItems}</span> data
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="size-4" />
          Sebelumnya
        </Button>
        <span className="text-sm text-muted-foreground">
          Halaman {page} / {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
        >
          Selanjutnya
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
