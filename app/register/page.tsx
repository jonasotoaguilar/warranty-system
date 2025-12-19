"use client";

import { signup } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  UserPlus,
  Mail,
  Lock,
  Check,
  X,
  ShieldAlert,
} from "lucide-react";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);

  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  }, [password]);

  const strengthColor = useMemo(() => {
    if (passwordStrength <= 25) return "bg-red-500";
    if (passwordStrength <= 50) return "bg-orange-500";
    if (passwordStrength <= 75) return "bg-yellow-500";
    return "bg-emerald-500";
  }, [passwordStrength]);

  const strengthLabel = useMemo(() => {
    if (!password) return "";
    if (passwordStrength <= 25) return "Débil";
    if (passwordStrength <= 50) return "Media";
    if (passwordStrength <= 75) return "Fuerte";
    return "Muy Fuerte";
  }, [password, passwordStrength]);

  const handleAction = async (formData: FormData) => {
    setIsPending(true);
    try {
      await signup(formData);
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
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Crear Cuenta
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            Regístrate para gestionar tus servicios de garantía
          </p>
        </div>

        <div className="group relative">
          <div className="absolute -inset-1 rounded-2xl bg-linear-to-r from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 opacity-25 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200"></div>

          <div className="relative rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 backdrop-blur-xl">
            <form action={handleAction} className="space-y-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1"
                >
                  Nombre Completo
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Juan Pérez"
                    className="pl-10 h-11 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-zinc-500 transition-all"
                  />
                </div>
              </div>

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
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1"
                  >
                    Contraseña
                  </label>
                  {password && (
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${strengthColor.replace(
                        "bg-",
                        "text-"
                      )}`}
                    >
                      {strengthLabel}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-zinc-500 transition-all"
                  />
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2 space-y-2 animate-in fade-in duration-300">
                    <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ease-out ${strengthColor}`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        {password.length >= 8 ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <X className="h-3 w-3 text-zinc-300" />
                        )}
                        8+ caracteres
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/[A-Z]/.test(password) ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <X className="h-3 w-3 text-zinc-300" />
                        )}
                        Mayúscula
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/\d/.test(password) ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <X className="h-3 w-3 text-zinc-300" />
                        )}
                        Un número
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/[^A-Za-z0-9]/.test(password) ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <X className="h-3 w-3 text-zinc-300" />
                        )}
                        Símbolo
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/50 animate-shake">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <p className="font-medium">
                    {(() => {
                      if (error === "Email and password are required")
                        return "El correo y la contraseña son obligatorios.";
                      if (error === "User already registered")
                        return "Este correo ya se encuentra registrado.";
                      return error;
                    })()}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={
                  isPending || (password.length > 0 && passwordStrength < 50)
                }
                className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 font-bold rounded-xl transition-all shadow-xl disabled:opacity-50"
              >
                {isPending ? "Creando cuenta..." : "Crear mi Cuenta"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                ¿Ya tienes cuenta?{" "}
                <Link
                  href="/login"
                  className="font-bold text-zinc-950 dark:text-zinc-50 hover:underline decoration-zinc-400 underline-offset-4"
                >
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
            <ShieldCheck className="h-3 w-3" /> Sistema de Garantías Seguro
          </p>
        </div>
      </div>
    </div>
  );
}
