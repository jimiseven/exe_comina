import React, { useState, useEffect } from "react";
import { HardHat, Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, KeyRound, AlertCircle } from "lucide-react";
import { erpApi } from "../services/api";
import { Usuario } from "../types";

interface LoginViewProps {
  onLoginSuccess: (user: Usuario) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<Usuario[]>([]);

  useEffect(() => {
    erpApi.getUsuarios().then(setUsuariosDisponibles);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await erpApi.login(username, password);
      onLoginSuccess(user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al autenticar. Verifica las credenciales.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none font-sans">
      {/* Atmósfera industrial */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Contenedor Principal */}
      <div className="w-full max-w-md z-10 space-y-6">
        {/* Cabecera y Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 items-center justify-center text-slate-950 shadow-2xl shadow-amber-500/30">
            <HardHat className="w-9 h-9 stroke-[2.3]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">ProyJimP</h1>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mt-1">
              ERP Administrativo Minero • Unidad Minera
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Acceso a Terminal Local Transaccional (100% Offline)
            </p>
          </div>
        </div>

        {/* Tarjeta de Formulario */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-7 shadow-2xl shadow-black/80 space-y-5 backdrop-blur-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-500" />
              Control de Acceso
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
              Bs. Bolivianos
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Usuario */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre de Usuario
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin, supervisor..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botón de Entrada */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-xl text-sm shadow-xl shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Validando Credenciales...</span>
              ) : (
                <>
                  <span>Ingresar al Sistema Minero</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Cuentas autorizadas registradas */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block text-center">
              Cuentas Registradas en el Sistema:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {usuariosDisponibles.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickFill(u.username, u.password || "admin123")}
                  className={`p-2 rounded-xl bg-slate-950 border text-left transition-all cursor-pointer group ${
                    username.toLowerCase() === u.username.toLowerCase()
                      ? "border-amber-500/80 shadow-md shadow-amber-500/10"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <p className="font-bold text-slate-200 group-hover:text-amber-400 truncate text-[11px]">
                    {u.nombre_completo}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {u.username}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Informativo de Seguridad */}
        <div className="flex items-center justify-center gap-4 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" /> SQLite WAL Local
          </span>
          <span>•</span>
          <span>Unidad Minera</span>
          <span>•</span>
          <span>Cero Pérdida de Datos</span>
        </div>
      </div>
    </div>
  );
};
