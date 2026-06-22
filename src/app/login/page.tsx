"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Package,
} from "lucide-react";
import { toast } from "sonner";

import { loginRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Email dan kata sandi wajib diisi.");
      return;
    }

    setLoading(true);
    const result = await loginRequest({ email, password, remember });
    setLoading(false);

    if (!result.success) {
      setError(result.message ?? "Login gagal.");
      return;
    }

    toast.success("Berhasil masuk", {
      description: "Selamat datang kembali di Stokly.",
    });
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 sm:p-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Package className="size-5" />
            </span>
            <span className="text-lg font-semibold"></span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Masuk ke akun Anda
          </h2>
          <p className="text-sm text-muted-foreground">
            Masukkan email dan kata sandi untuk mengakses dasbor inventaris.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nama@stokly.id"
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Kata Sandi</Label>
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() =>
                  toast.info("Hubungi admin untuk mengatur ulang kata sandi.")
                }
              >
                Lupa kata sandi?
              </button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className="px-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!error}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(v) => setRemember(v === true)}
            />
            <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
              Ingat saya di perangkat ini
            </Label>
          </div>

          {error && (
            <p
              className={cn(
                "rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              )}
            >
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Memproses..." : "Masuk"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Inventaris Berbasis web Untuk mempermudah pengelolaan stok barang.
        </p>
      </div>
    </div>
  );
}