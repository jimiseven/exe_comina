import { useState, useEffect } from "react";
import {
  Users,
  Wallet,
  Package,
  ShieldCheck,
  Database,
  LogOut,
  HardHat,
  Calendar,
  Radio,
  ChevronRight,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Key
} from "lucide-react";
import { Modulo, Usuario } from "./types";
import { erpApi } from "./services/api";
import { LoginView } from "./components/LoginView";
import { RRHHView } from "./modules/rrhh/RRHHView";
import { NominaView } from "./modules/nomina/NominaView";
import { AlmacenView } from "./modules/almacen/AlmacenView";
import { SeguridadView } from "./modules/seguridad/SeguridadView";
import { RespaldoView } from "./modules/respaldo/RespaldoView";
import { Modal } from "./components/Modal";

const ROLE_MODULES: Record<string, Modulo[]> = {
  ADMIN: ["RRHH", "NOMINA", "ALMACEN", "SEGURIDAD", "RESPALDO"],
  "Administrador General": ["RRHH", "NOMINA", "ALMACEN", "SEGURIDAD", "RESPALDO"],
  ALMACEN: ["ALMACEN", "RESPALDO"],
  Almacenero: ["ALMACEN", "RESPALDO"],
  "Encargado de Almacén": ["ALMACEN", "RESPALDO"],
  NOMINA: ["RRHH", "NOMINA"],
  "Operador de Nómina": ["RRHH", "NOMINA"],
  "Responsable de Planillas": ["RRHH", "NOMINA"],
  SUPERVISOR: ["RRHH", "SEGURIDAD"],
  "Supervisor SSOMA": ["RRHH", "SEGURIDAD"],
  Auditor: ["RRHH", "SEGURIDAD"],
};

function getModulosPermitidos(rol?: string): Modulo[] {
  if (!rol) return ["RRHH", "NOMINA", "ALMACEN", "SEGURIDAD", "RESPALDO"];
  return ROLE_MODULES[rol] || ["RRHH", "NOMINA", "ALMACEN", "SEGURIDAD", "RESPALDO"];
}

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(() => erpApi.getCurrentUser());
  const [moduloActivo, setModuloActivo] = useState<Modulo>("RRHH");
  const [dbStatus, setDbStatus] = useState<string>("Iniciando SQLite WAL...");
  const [horaActual, setHoraActual] = useState<string>("");
  const [sidebarColapsado, setSidebarColapsado] = useState<boolean>(
    () => localStorage.getItem("proyjimp_sidebar_collapsed") === "true"
  );

  // Modal para cambio de contraseña personal
  const [modalPasswordOpen, setModalPasswordOpen] = useState(false);
  const [passActual, setPassActual] = useState("");
  const [passNueva, setPassNueva] = useState("");
  const [passConfirmar, setPassConfirmar] = useState("");
  const [passMensaje, setPassMensaje] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);

  const modulosPermitidos = getModulosPermitidos(usuario?.rol);

  useEffect(() => {
    if (usuario && !modulosPermitidos.includes(moduloActivo)) {
      setModuloActivo(modulosPermitidos[0] || "RRHH");
    }
  }, [usuario, modulosPermitidos, moduloActivo]);

  const toggleSidebar = () => {
    setSidebarColapsado((prev) => {
      const next = !prev;
      localStorage.setItem("proyjimp_sidebar_collapsed", String(next));
      return next;
    });
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMensaje(null);
    if (!passActual || !passNueva) {
      setPassMensaje({ tipo: "err", texto: "Debe ingresar la contraseña actual y la nueva." });
      return;
    }
    if (passNueva.length < 4) {
      setPassMensaje({ tipo: "err", texto: "La nueva contraseña debe tener al menos 4 caracteres." });
      return;
    }
    if (passNueva !== passConfirmar) {
      setPassMensaje({ tipo: "err", texto: "La nueva contraseña y su confirmación no coinciden." });
      return;
    }
    if (!usuario) return;

    try {
      await erpApi.cambiarPasswordPersonal(usuario.id, passActual, passNueva);
      setPassMensaje({ tipo: "ok", texto: "¡Contraseña actualizada exitosamente!" });
      setTimeout(() => {
        setModalPasswordOpen(false);
        setPassActual("");
        setPassNueva("");
        setPassConfirmar("");
        setPassMensaje(null);
      }, 1200);
    } catch (err: unknown) {
      setPassMensaje({ tipo: "err", texto: err instanceof Error ? err.message : String(err) });
    }
  };

  useEffect(() => {
    // Inicializar SQLite
    erpApi.initDb().then((status) => {
      setDbStatus(status);
    });

    const updateClock = () => {
      const now = new Date();
      setHoraActual(
        now.toLocaleDateString("es-BO", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (confirm("¿Estás seguro de cerrar la sesión de trabajo en esta terminal minera?")) {
      await erpApi.logout();
      setUsuario(null);
    }
  };

  // Si no hay usuario autenticado, mostrar la pantalla de Login
  if (!usuario) {
    return <LoginView onLoginSuccess={(u) => setUsuario(u)} />;
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      {/* 1. SIDEBAR IZQUIERDO FIJO INDUSTRIAL (EXPANDIBLE / COLAPSABLE) */}
      <aside
        className={`${
          sidebarColapsado ? "w-20" : "w-64"
        } bg-slate-900 border-r border-slate-800/90 flex flex-col justify-between shrink-0 z-20 shadow-2xl transition-all duration-300 ease-in-out`}
      >
        <div>
          {/* Header del ERP */}
          <div
            className={`p-4 border-b border-slate-800/80 bg-slate-900/95 flex ${
              sidebarColapsado ? "flex-col items-center gap-2.5" : "items-center justify-between"
            }`}
          >
            <div
              className={`flex items-center gap-3 cursor-pointer ${
                sidebarColapsado ? "justify-center" : ""
              }`}
              onClick={toggleSidebar}
              title={sidebarColapsado ? "Clic para expandir menú" : "Clic para minimizar menú"}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0 hover:scale-105 transition-transform">
                <HardHat className="w-6 h-6 stroke-[2.2]" />
              </div>
              {!sidebarColapsado && (
                <div className="min-w-0 flex-1">
                  <h1 className="font-extrabold text-lg text-slate-100 tracking-tight leading-none truncate">
                    ProyJimP
                  </h1>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider truncate">
                      ERP Minero • Bolivia
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={toggleSidebar}
              title={sidebarColapsado ? "Expandir barra lateral" : "Minimizar barra lateral"}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
            >
              {sidebarColapsado ? (
                <PanelLeftOpen className="w-4 h-4 text-amber-400" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Menú de Navegación Principal */}
          <div className={`${sidebarColapsado ? "p-2" : "p-3"} space-y-4`}>
            <div>
              {!sidebarColapsado ? (
                <p className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider px-3 mb-2">
                  Módulos de Faena
                </p>
              ) : (
                <div className="w-8 h-px bg-slate-800 mx-auto my-2" />
              )}

              <nav className="space-y-1.5">
                {/* RRHH */}
                {modulosPermitidos.includes("RRHH") && (
                  <button
                    onClick={() => setModuloActivo("RRHH")}
                    title="RRHH (Personal Minero y Legajos)"
                    className={`w-full flex items-center ${
                      sidebarColapsado ? "justify-center px-0 py-3" : "justify-between px-3.5 py-2.5"
                    } rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                      moduloActivo === "RRHH"
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className={`flex items-center ${sidebarColapsado ? "justify-center" : "gap-3"}`}>
                      <Users className={`${sidebarColapsado ? "w-5 h-5" : "w-4 h-4"} shrink-0`} />
                      {!sidebarColapsado && <span>RRHH (Personal)</span>}
                    </div>
                    {!sidebarColapsado && moduloActivo === "RRHH" && (
                      <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                  </button>
                )}

                {/* Nómina */}
                {modulosPermitidos.includes("NOMINA") && (
                  <button
                    onClick={() => setModuloActivo("NOMINA")}
                    title="Nómina y Pagos (Sueldos y Descuentos en Bs.)"
                    className={`w-full flex items-center ${
                      sidebarColapsado ? "justify-center px-0 py-3" : "justify-between px-3.5 py-2.5"
                    } rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                      moduloActivo === "NOMINA"
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className={`flex items-center ${sidebarColapsado ? "justify-center" : "gap-3"}`}>
                      <Wallet className={`${sidebarColapsado ? "w-5 h-5" : "w-4 h-4"} shrink-0`} />
                      {!sidebarColapsado && <span>Nómina y Pagos (Bs.)</span>}
                    </div>
                    {!sidebarColapsado && moduloActivo === "NOMINA" && (
                      <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                  </button>
                )}

                {/* Almacén */}
                {modulosPermitidos.includes("ALMACEN") && (
                  <button
                    onClick={() => setModuloActivo("ALMACEN")}
                    title="Almacén (Kardex y Control de Existencias)"
                    className={`w-full flex items-center ${
                      sidebarColapsado ? "justify-center px-0 py-3" : "justify-between px-3.5 py-2.5"
                    } rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                      moduloActivo === "ALMACEN"
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className={`flex items-center ${sidebarColapsado ? "justify-center" : "gap-3"}`}>
                      <Package className={`${sidebarColapsado ? "w-5 h-5" : "w-4 h-4"} shrink-0`} />
                      {!sidebarColapsado && <span>Almacén (Kardex)</span>}
                    </div>
                    {!sidebarColapsado && moduloActivo === "ALMACEN" && (
                      <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                  </button>
                )}

                {/* Seguridad */}
                {modulosPermitidos.includes("SEGURIDAD") && (
                  <button
                    onClick={() => setModuloActivo("SEGURIDAD")}
                    title="Seguridad, Control de Usuarios y Auditoría"
                    className={`w-full flex items-center ${
                      sidebarColapsado ? "justify-center px-0 py-3" : "justify-between px-3.5 py-2.5"
                    } rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                      moduloActivo === "SEGURIDAD"
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className={`flex items-center ${sidebarColapsado ? "justify-center" : "gap-3"}`}>
                      <ShieldCheck className={`${sidebarColapsado ? "w-5 h-5" : "w-4 h-4"} shrink-0`} />
                      {!sidebarColapsado && <span>Seguridad & Auditoría</span>}
                    </div>
                    {!sidebarColapsado && moduloActivo === "SEGURIDAD" && (
                      <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                  </button>
                )}

                {/* Respaldo */}
                {modulosPermitidos.includes("RESPALDO") && (
                  <button
                    onClick={() => setModuloActivo("RESPALDO")}
                    title="Base de Datos y Respaldo Transaccional"
                    className={`w-full flex items-center ${
                      sidebarColapsado ? "justify-center px-0 py-3" : "justify-between px-3.5 py-2.5"
                    } rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                      moduloActivo === "RESPALDO"
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className={`flex items-center ${sidebarColapsado ? "justify-center" : "gap-3"}`}>
                      <Database className={`${sidebarColapsado ? "w-5 h-5" : "w-4 h-4"} shrink-0`} />
                      {!sidebarColapsado && <span>BD - Respaldo</span>}
                    </div>
                    {!sidebarColapsado && moduloActivo === "RESPALDO" && (
                      <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                  </button>
                )}
              </nav>
            </div>
          </div>
        </div>

        {/* Footer del Sidebar con Datos del Usuario y Cierre de Sesión */}
        <div className={`${sidebarColapsado ? "p-2" : "p-3.5"} border-t border-slate-800/80 space-y-2.5 bg-slate-900/90`}>
          {!sidebarColapsado ? (
            <div className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                  <span>SQLite WAL</span>
                </div>
                <span className="font-mono text-[10px] text-amber-400 font-bold">Bs. BOB</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate font-mono">
                {dbStatus}
              </p>
            </div>
          ) : (
            <div
              className="flex items-center justify-center p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-emerald-400"
              title={`SQLite WAL Activo: ${dbStatus}`}
            >
              <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
            </div>
          )}

          <button
            onClick={handleLogout}
            title={`Cerrar Sesión (${usuario.username})`}
            className={`w-full flex items-center justify-center ${
              sidebarColapsado ? "p-2.5" : "gap-2 px-3 py-2.5"
            } rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer border border-rose-500/20`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarColapsado && <span>Cerrar Sesión ({usuario.username})</span>}
          </button>
        </div>
      </aside>

      {/* 2. PANEL CENTRAL (DINÁMICO) */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 min-w-0">
        {/* Barra Superior con Estado, Turno y Datos del Usuario Activo */}
        <header className="h-16 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 bg-slate-900/40 backdrop-blur-md z-10 gap-3">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base lg:text-lg font-extrabold text-slate-100 tracking-tight flex items-center gap-2 truncate">
              {moduloActivo === "RRHH" && "Recursos Humanos y Planilla de Legajos (Bolivia)"}
              {moduloActivo === "NOMINA" && "Nómina Salarial y Control de Descuentos (Bs.)"}
              {moduloActivo === "ALMACEN" && "Kardex de Almacén: Control de Existencias"}
              {moduloActivo === "SEGURIDAD" && "Auditoría de Acciones y Trazabilidad"}
              {moduloActivo === "RESPALDO" && "Mantenimiento y Respaldo Transaccional"}
              <span className="hidden md:inline-block px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-400 font-mono font-bold shrink-0">
                Moneda: Bolivianos (Bs.)
              </span>
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
              {moduloActivo === "RRHH" && "Gestión de personal minero, Cédulas de Identidad (CI) y SSOMA"}
              {moduloActivo === "NOMINA" && "Cálculo en moneda nacional, anticipos y descuentos por reposición"}
              {moduloActivo === "ALMACEN" && "Seguimiento de inventario, stock crítico y despachos a bocamina"}
              {moduloActivo === "SEGURIDAD" && "Registro cronológico inmutable de operaciones y sesiones"}
              {moduloActivo === "RESPALDO" && "Copias de seguridad atómicas frente a cortes eléctricos"}
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 font-medium bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-mono">{horaActual}</span>
            </div>

            <div
              onClick={() => {
                setPassActual("");
                setPassNueva("");
                setPassConfirmar("");
                setPassMensaje(null);
                setModalPasswordOpen(true);
              }}
              className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-slate-800 cursor-pointer group hover:opacity-90"
              title="Clic para cambiar su contraseña personal de acceso"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-100 group-hover:text-amber-400 transition-colors flex items-center justify-end gap-1.5">
                  <span>{usuario.nombre_completo}</span>
                  <Key className="w-3 h-3 text-slate-500 group-hover:text-amber-400" />
                </p>
                <p className="text-[10px] text-amber-400 font-medium">
                  {usuario.rol} • Unidad Minera
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-extrabold text-xs shadow-inner group-hover:border-amber-400 transition-colors">
                {usuario.avatar_iniciales || <UserCheck className="w-5 h-5" />}
              </div>
            </div>
          </div>
        </header>

        {/* Contenido Dinámico de la Vista */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1700px] mx-auto w-full">
            {moduloActivo === "RRHH" && <RRHHView />}
            {moduloActivo === "NOMINA" && <NominaView />}
            {moduloActivo === "ALMACEN" && <AlmacenView />}
            {moduloActivo === "SEGURIDAD" && <SeguridadView />}
            {moduloActivo === "RESPALDO" && <RespaldoView />}
          </div>
        </main>
      </div>

      {/* MODAL: CAMBIO DE CONTRASEÑA PERSONAL */}
      <Modal
        isOpen={modalPasswordOpen}
        onClose={() => {
          setModalPasswordOpen(false);
          setPassMensaje(null);
        }}
        title="Cambiar Contraseña Personal"
        subtitle={`Terminal de acceso: ${usuario.username} (${usuario.nombre_completo})`}
        icon={<Key className="w-5 h-5 text-amber-500" />}
        maxWidth="md"
      >
        <form onSubmit={handleCambiarPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Contraseña Actual *
            </label>
            <input
              type="password"
              required
              value={passActual}
              onChange={(e) => setPassActual(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nueva Contraseña *
            </label>
            <input
              type="password"
              required
              value={passNueva}
              onChange={(e) => setPassNueva(e.target.value)}
              placeholder="Mínimo 4 caracteres"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Confirmar Nueva Contraseña *
            </label>
            <input
              type="password"
              required
              value={passConfirmar}
              onChange={(e) => setPassConfirmar(e.target.value)}
              placeholder="Repita la nueva contraseña"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {passMensaje && (
            <div
              className={`p-3 rounded-xl text-xs ${
                passMensaje.tipo === "ok"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
              }`}
            >
              {passMensaje.texto}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setModalPasswordOpen(false);
                setPassMensaje(null);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-md cursor-pointer"
            >
              Actualizar Contraseña
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
