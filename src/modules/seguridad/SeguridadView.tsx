import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  History,
  Database,
  Eye,
  Lock,
  UserPlus,
  Users,
  Pencil,
  Trash2,
  KeyRound,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { AuditoriaLog, Usuario } from "../../types";
import { erpApi } from "../../services/api";
import { Modal } from "../../components/Modal";

export const SeguridadView: React.FC = () => {
  const [subVista, setSubVista] = useState<"USUARIOS" | "AUDITORIA">("USUARIOS");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [search, setSearch] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState("TODOS");
  const [accionFiltro, setAccionFiltro] = useState("TODOS");

  // Modales
  const [selectedLog, setSelectedLog] = useState<AuditoriaLog | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);

  // Form State para Usuario
  const initialUserForm = {
    id: 0,
    username: "",
    password: "",
    confirmPassword: "",
    nombre_completo: "",
    rol: "Supervisor SSOMA" as Usuario["rol"],
    estado_activo: 1,
  };
  const [userForm, setUserForm] = useState(initialUserForm);

  const loadData = async () => {
    const [usersData, logsData] = await Promise.all([
      erpApi.getUsuarios(),
      erpApi.getAuditoriaLogs()
    ]);
    setUsuarios(usersData);
    setLogs(logsData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentUserSession = erpApi.getCurrentUser();

  // Abrir Modal de Creación
  const handleOpenCreateUser = () => {
    setIsEditingUser(false);
    setUserForm(initialUserForm);
    setIsUserModalOpen(true);
  };

  // Abrir Modal de Edición
  const handleOpenEditUser = (u: Usuario) => {
    setIsEditingUser(true);
    setUserForm({
      id: u.id,
      username: u.username,
      password: "",
      confirmPassword: "",
      nombre_completo: u.nombre_completo,
      rol: u.rol,
      estado_activo: u.estado_activo,
    });
    setIsUserModalOpen(true);
  };

  // Guardar (Crear o Editar)
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditingUser && (!userForm.password || userForm.password.length < 6)) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (userForm.password && userForm.password !== userForm.confirmPassword) {
      alert("Las contraseñas ingresadas no coinciden.");
      return;
    }

    try {
      if (isEditingUser) {
        await erpApi.updateUsuario({
          id: userForm.id,
          username: userForm.username,
          password: userForm.password || undefined,
          nombre_completo: userForm.nombre_completo,
          rol: userForm.rol,
          estado_activo: userForm.estado_activo,
        });
        alert(`Usuario '${userForm.username}' actualizado correctamente.`);
      } else {
        await erpApi.addUsuario({
          username: userForm.username,
          password: userForm.password,
          nombre_completo: userForm.nombre_completo,
          rol: userForm.rol,
        });
        alert(`Nuevo usuario '${userForm.username}' creado con éxito.`);
      }

      setIsUserModalOpen(false);
      setUserForm(initialUserForm);
      loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Ocurrió un error al procesar el usuario.");
      }
    }
  };

  // Eliminar Usuario
  const handleDeleteUser = async (u: Usuario) => {
    if (confirm(`¿Estás seguro de eliminar permanentemente la cuenta de '${u.username}' (${u.nombre_completo})?`)) {
      try {
        await erpApi.deleteUsuario(u.id);
        alert(`Usuario '${u.username}' eliminado exitosamente.`);
        loadData();
      } catch (err: unknown) {
        if (err instanceof Error) {
          alert(err.message);
        }
      }
    }
  };

  // Alternar Estado Activo / Inactivo
  const handleToggleEstadoUser = async (u: Usuario) => {
    if (currentUserSession && currentUserSession.id === u.id) {
      alert("No puedes desactivar tu propia cuenta activa.");
      return;
    }

    const nuevoEstado = u.estado_activo === 1 ? 0 : 1;
    const msg = nuevoEstado === 1 ? `¿Reactivar acceso a '${u.username}'?` : `¿Desactivar acceso a '${u.username}'?`;

    if (confirm(msg)) {
      try {
        await erpApi.updateUsuario({
          id: u.id,
          username: u.username,
          nombre_completo: u.nombre_completo,
          rol: u.rol,
          estado_activo: nuevoEstado,
        });
        loadData();
      } catch (err: unknown) {
        if (err instanceof Error) {
          alert(err.message);
        }
      }
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      log.usuario.toLowerCase().includes(search.toLowerCase()) ||
      (log.detalles && log.detalles.toLowerCase().includes(search.toLowerCase())) ||
      log.modulo.toLowerCase().includes(search.toLowerCase());
    const matchModulo = moduloFiltro === "TODOS" || log.modulo === moduloFiltro;
    const matchAccion = accionFiltro === "TODOS" || log.accion === accionFiltro;
    return matchSearch && matchModulo && matchAccion;
  });

  return (
    <div className="space-y-6">
      {/* 1. KPIS GENERALES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-inner-card hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Usuarios Autorizados</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-100 mt-2 font-mono">{usuarios.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">Cuentas con acceso a la Unidad Minera</span>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-inner-card hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bitácora de Auditoría</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-blue-400 mt-2 font-mono">{logs.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">Eventos inmutables en auditoria_logs</span>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-inner-card hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Seguridad Transaccional</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2 font-mono">SQLite WAL</p>
          <span className="text-xs text-emerald-400/80 mt-1 block">Trazabilidad inalterable ante cortes de luz</span>
        </div>
      </div>

      {/* 2. SELECTOR DE SUB-VISTAS (USUARIOS VS AUDITORÍA) */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-full sm:w-auto">
          <button
            onClick={() => setSubVista("USUARIOS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              subVista === "USUARIOS"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Control de Usuarios y Accesos ({usuarios.length})
          </button>
          <button
            onClick={() => setSubVista("AUDITORIA")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              subVista === "AUDITORIA"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Bitácora de Auditoría ({logs.length})
          </button>
        </div>

        {subVista === "USUARIOS" && (
          <button
            onClick={handleOpenCreateUser}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg shadow-amber-500/10 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            Crear Nuevo Usuario
          </button>
        )}
      </div>

      {/* 3. VISTA 1: GESTIÓN DE USUARIOS */}
      {subVista === "USUARIOS" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-100">Usuarios con Acceso a la Unidad Minera</h3>
              <p className="text-xs text-slate-400">Puedes crear, modificar roles, actualizar contraseñas o revocar accesos.</p>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold">
              Unidad Minera Local
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Usuario</th>
                  <th className="px-5 py-4">Nombre Completo</th>
                  <th className="px-5 py-4">Rol / Permiso</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4">Último Acceso</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {usuarios.map((u) => {
                  const isCurrent = currentUserSession?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-xs text-amber-500">
                        #{u.id}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-100 text-xs">
                            {u.username}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold">
                              Tu Sesión
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-200 text-xs">
                        {u.nombre_completo}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60 font-medium">
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {u.estado_activo === 1 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                            <XCircle className="w-3.5 h-3.5" /> Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-400">
                        {u.ultimo_acceso || "Nunca"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleEstadoUser(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                              u.estado_activo === 1
                                ? "bg-slate-800 hover:bg-slate-700 text-rose-400"
                                : "bg-slate-800 hover:bg-slate-700 text-emerald-400"
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                            title={u.estado_activo === 1 ? "Desactivar Acceso" : "Reactivar Acceso"}
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white transition-colors cursor-pointer"
                            title="Modificar Usuario y Contraseña"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={isCurrent || u.id === 1}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title={
                              isCurrent
                                ? "No puedes eliminar tu propia cuenta"
                                : u.id === 1
                                ? "No se puede eliminar la cuenta principal"
                                : "Eliminar Usuario"
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. VISTA 2: BITÁCORA DE AUDITORÍA */}
      {subVista === "AUDITORIA" && (
        <div className="space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative min-w-[260px] flex-1 sm:flex-initial">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por usuario o detalle..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <select
                value={moduloFiltro}
                onChange={(e) => setModuloFiltro(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 px-3 py-2 focus:outline-none focus:border-amber-500"
              >
                <option value="TODOS">Todos los Módulos</option>
                <option value="SISTEMA">SISTEMA</option>
                <option value="SEGURIDAD">SEGURIDAD (Login/Logout)</option>
                <option value="RRHH">RRHH</option>
                <option value="NOMINA">NOMINA</option>
                <option value="ALMACEN">ALMACEN</option>
                <option value="RESPALDO">RESPALDO</option>
              </select>

              <select
                value={accionFiltro}
                onChange={(e) => setAccionFiltro(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 px-3 py-2 focus:outline-none focus:border-amber-500"
              >
                <option value="TODOS">Todas las Acciones</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="INSERT">INSERT</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="BACKUP">BACKUP</option>
              </select>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Mostrando {filteredLogs.length} eventos
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-4">ID Evento</th>
                    <th className="px-5 py-4">Marca de Tiempo</th>
                    <th className="px-5 py-4">Usuario</th>
                    <th className="px-5 py-4">Módulo</th>
                    <th className="px-5 py-4">Acción</th>
                    <th className="px-5 py-4">Detalles Registrados</th>
                    <th className="px-5 py-4 text-right">Ver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredLogs.map((log) => (
                    <tr key={log.id_log} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-xs text-amber-500">
                        #{String(log.id_log).padStart(4, "0")}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                        {log.fecha_hora}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-200 text-xs">
                        {log.usuario}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 font-semibold">
                          {log.modulo}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wider ${
                            log.accion === "LOGIN" || log.accion === "INSERT"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : log.accion === "UPDATE"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : log.accion === "DELETE"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              : log.accion === "LOGOUT"
                              ? "bg-slate-500/10 text-slate-400 border-slate-500/30"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                          }`}
                        >
                          {log.accion}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-300 font-mono max-w-md truncate">
                        {log.detalles}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          title="Ver detalles completos del evento"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: CREAR / EDITAR USUARIO */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={isEditingUser ? `Modificar Cuenta de Usuario (#${userForm.id})` : "Crear Nuevo Usuario de Acceso"}
        subtitle="Configura credenciales y roles para la terminal minera"
        icon={<KeyRound className="w-5 h-5 text-amber-500" />}
        maxWidth="md"
      >
        <form onSubmit={handleSubmitUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre Completo del Trabajador / Operador *
            </label>
            <input
              required
              type="text"
              value={userForm.nombre_completo}
              onChange={(e) => setUserForm({ ...userForm, nombre_completo: e.target.value })}
              placeholder="Ej: Jimmy Peredo, Mario Choque..."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre de Usuario (Login) *
            </label>
            <input
              required
              type="text"
              value={userForm.username}
              onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              placeholder="Ej: jperedo, supervisor..."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Rol / Nivel de Acceso *
            </label>
            <select
              value={userForm.rol}
              onChange={(e) => setUserForm({ ...userForm, rol: e.target.value as Usuario["rol"] })}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="Administrador General">Administrador General (Control Total)</option>
              <option value="Supervisor SSOMA">Supervisor SSOMA (Seguridad y Personal)</option>
              <option value="Encargado de Almacén">Encargado de Almacén (Kardex e Ítems)</option>
              <option value="Operador de Nómina">Operador de Nómina (Cálculo Salarial)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isEditingUser ? "Nueva Contraseña (dejar en blanco para conservar la actual)" : "Contraseña de Acceso *"}
            </label>
            <input
              type="password"
              required={!isEditingUser}
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {(!isEditingUser || userForm.password) && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirmar Contraseña *
              </label>
              <input
                type="password"
                required
                value={userForm.confirmPassword}
                onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                placeholder="Repite la contraseña"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {isEditingUser && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Estado de la Cuenta</label>
              <select
                value={userForm.estado_activo}
                onChange={(e) => setUserForm({ ...userForm, estado_activo: parseInt(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value={1}>Activo (Permite Iniciar Sesión)</option>
                <option value={0}>Inactivo (Acceso Bloqueado)</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              {isEditingUser ? "Guardar Modificaciones" : "Crear Usuario"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. MODAL: DETALLES DE AUDITORÍA */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Detalle del Evento de Auditoría"
          subtitle={`Log ID #${selectedLog.id_log} • Registrado el ${selectedLog.fecha_hora}`}
          icon={<ShieldCheck className="w-5 h-5 text-amber-500" />}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <p><span className="text-slate-500">Módulo:</span> <span className="font-bold text-slate-200">{selectedLog.modulo}</span></p>
              <p><span className="text-slate-500">Acción:</span> <span className="font-mono font-bold text-amber-400">{selectedLog.accion}</span></p>
              <p><span className="text-slate-500">Operador:</span> <span className="text-slate-200">{selectedLog.usuario}</span></p>
              <p><span className="text-slate-500">Fecha y Hora:</span> <span className="font-mono text-slate-300">{selectedLog.fecha_hora}</span></p>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block mb-1">Descripción y Parámetros del Evento:</span>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-slate-300 whitespace-pre-wrap">
                {selectedLog.detalles}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
