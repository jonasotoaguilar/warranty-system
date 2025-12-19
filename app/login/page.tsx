"use client";

import { login } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Mail,
  Lock,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");
  const [isPending, setIsPending] = useState(false);

  const handleAction = async (formData: FormData) => {
    setIsPending(true);
    try {
      await login(formData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12 transition-colors duration-500">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-xl mb-4">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Bienvenido de nuevo
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            Ingresa tus credenciales para acceder al sistema
          </p>
        </div>

        <div className="group relative">
          <div className="absolute -inset-1 rounded-2xl bg-linear-to-r from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 opacity-25 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200"></div>

          <div className="relative rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 backdrop-blur-xl">
            <form action={handleAction} className="space-y-6">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1"
                >
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="tu@email.com"
                    className="pl-10 h-11 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-zinc-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="pl-10 h-11 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-zinc-500 transition-all"
                  />
                </div>
              </div>

              {message && (
                <div className="flex items-start gap-3 p-4 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50 animate-in zoom-in-95 duration-300">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <p className="font-medium leading-relaxed">{message}</p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-3 p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/50 animate-shake">
                  <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="font-medium">
                    {error === "Invalid login credentials"
                      ? "Credenciales inválidas. Verifica tu correo y contraseña."
                      : error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 font-bold rounded-xl transition-all shadow-xl"
              >
                {isPending ? "Ingresando..." : "Ingresar al Panel"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                ¿No tienes cuenta?{" "}
                <Link
                  href="/register"
                  className="font-bold text-zinc-950 dark:text-zinc-50 hover:underline decoration-zinc-400 underline-offset-4"
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
