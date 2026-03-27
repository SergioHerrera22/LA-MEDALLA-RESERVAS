import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Home, Lock } from "lucide-react";
import { supabase } from "../lib/supabase";
import { toast, Toaster } from "sonner";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Ingrese su correo y contraseña");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase!.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error(
          "Credenciales incorrectas. Verifique su correo y contraseña.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Toaster position="top-center" richColors />

      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-gradient-to-r from-green-800 to-emerald-700 p-4 rounded-2xl shadow-lg">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Cabañas La Medalla
          </h1>
          <p className="text-sm text-gray-500">
            Ingrese sus credenciales para continuar
          </p>
        </div>

        <Card className="p-6 shadow-lg border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Correo electrónico</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="admin@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Contraseña</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 font-semibold rounded-xl"
            >
              <Lock className="w-4 h-4" />
              {isLoading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-gray-400">
          Acceso restringido · Solo personal autorizado
        </p>
      </div>
    </div>
  );
}
