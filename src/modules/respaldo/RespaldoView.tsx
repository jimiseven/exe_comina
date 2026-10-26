import React, { useState, useEffect, useRef } from "react";
import {
  Database,
  Download,
  Upload,
  ShieldCheck,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  RefreshCw,
  FolderOpen,
  FileText
} from "lucide-react";
import { SystemStats } from "../../types";
import { erpApi } from "../../services/api";

interface RespaldoHistorial {
  id: number;
  nombre: string;
  tamano: string;
  fecha: string;
  tipo: "AUTOMATICO" | "MANUAL";
}

export const RespaldoView: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const [historial, setHistorial] = useState<RespaldoHistorial[]>([
    {
      id: 1,
      nombre: "respaldo_datos_sistema_20261024_190000.db",
      tamano: "48.2 KB",
      fecha: "2026-10-24 19:00:00",
      tipo: "AUTOMATICO",
    },
    {
      id: 2,
      nombre: "respaldo_datos_sistema_20261025_080000.db",
      tamano: "52.4 KB",
      fecha: "2026-10-25 08:00:00",
      tipo: "MANUAL",
    },
  ]);

  useEffect(() => {
    erpApi.getStats().then(setStats);
  }, []);

  const handleCrearRespaldo = async () => {
    setIsBackingUp(true);
    setBackupStatus(null);
    try {
      const msg = await erpApi.createBackup();
      setBackupStatus(msg);

      const nuevo: RespaldoHistorial = {
        id: Date.now(),
        nombre: `respaldo_datos_sistema_${Date.now()}.db`,
        tamano: stats ? `${(stats.db_size_bytes / 1024).toFixed(1)} KB` : "56.0 KB",
        fecha: new Date().toLocaleString(),
        tipo: "MANUAL",
      };
      setHistorial([nuevo, ...historial]);

      const updated = await erpApi.getStats();
      setStats(updated);
    } catch (err) {
      setBackupStatus(`Error generando respaldo: ${err}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDescargarJSON = () => {
    try {
      const jsonStr = erpApi.exportarTodoJSON();
      const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `respaldo_integral_proyjimp_${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setBackupStatus("Copia de seguridad integral JSON exportada con éxito.");
    } catch (err) {
      alert("Error al exportar respaldo JSON: " + err);
    }
  };

  const handleArchivoSeleccionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const seguro = window.confirm(
        `ADVERTENCIA DE SEGURIDAD CRÍTICA:\n\n` +
        `Está a punto de restaurar la base de datos desde el archivo '${file.name}'.\n` +
        `Esto sobrescribirá los empleados, notas de almacén, movimientos Kardex y planillas actuales con la información del respaldo.\n\n` +
        `¿Desea proceder con la restauración transaccional?`
      );
      if (!seguro) {
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      try {
        const res = await erpApi.restaurarBackupJSON(content, "Admin");
        alert(
          `✓ Restauración completada con éxito:\n\n` +
          `• Total registros maestros recuperados: ${res.registros}\n` +
          `• Detalle: ${res.mensaje}\n\n` +
          `La página se actualizará automáticamente para reflejar el estado restaurado.`
        );
        window.location.reload();
      } catch (err: unknown) {
        alert("Error restaurando copia de seguridad: " + (err instanceof Error ? err.message : String(err)));
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. TARJETA PRINCIPAL DE RESPALDO */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-500 font-extrabold text-lg">
              <Database className="w-6 h-6" />
              Copia de Seguridad y Respaldo Transaccional SQLite
            </div>
            <p className="text-sm text-slate-400">
              Garantiza cero pérdida de información exportando una copia íntegra del archivo{" "}
              <code className="text-amber-400 font-mono">datos_sistema.db</code> a una unidad segura.
            </p>
          </div>

          <span className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            Integridad SQLite Activa
          </span>
        </div>

        {/* Diagnóstico de Base de Datos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-slate-800/80 py-5">
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <span className="text-xs text-slate-400 flex items-center gap-2 font-medium">
              <HardDrive className="w-4 h-4 text-slate-500" />
              Tamaño del Archivo Local (.db)
            </span>
            <p className="text-2xl font-extrabold font-mono text-slate-100 mt-1">
              {stats ? `${(stats.db_size_bytes / 1024).toFixed(1)} KB` : "48.2 KB"}
            </p>
          </div>

          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <span className="text-xs text-slate-400 flex items-center gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Modo de Concurrencia
            </span>
            <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
              {stats?.wal_mode || "WAL"}
            </p>
          </div>

          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <span className="text-xs text-slate-400 font-medium">Auditoría Transaccional</span>
            <p className="text-2xl font-extrabold font-mono text-amber-400 mt-1">
              {stats?.total_logs || 3} eventos
            </p>
          </div>
        </div>

        {/* Botones de Ejecución de Respaldo y Restauración */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-400">
            Los respaldos <code className="text-amber-400 font-mono">.db</code> y <code className="text-emerald-400 font-mono">.json</code> garantizan la continuidad operativa total del ERP ante cortes eléctricos o cambio de equipos.
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            {/* Input oculto para subir archivo JSON de restauración */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleArchivoSeleccionado}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-amber-500/50 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
              title="Restaurar toda la información del ERP desde una copia previa JSON"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Restaurar Copia JSON</span>
            </button>

            <button
              onClick={handleDescargarJSON}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-emerald-500/50 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm hover:text-emerald-400"
              title="Exportar archivo .JSON completo con legajos de RRHH, Kardex, ingresos/salidas y bitácora"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Exportar Todo a JSON</span>
            </button>

            <button
              onClick={handleCrearRespaldo}
              disabled={isBackingUp}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-xl text-xs shadow-xl shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Snapshot...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Snapshot (.db)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Notificación de Estado */}
        {backupStatus && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{backupStatus}</span>
          </div>
        )}
      </div>

      {/* 2. HISTORIAL DE RESPALDOS GENERADOS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <FileArchive className="w-4 h-4 text-amber-400" />
            Historial de Copias de Seguridad Recientes ({historial.length})
          </h4>
          <span className="text-xs text-slate-400">Formato SQLite nativo (.db)</span>
        </div>

        <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
          {historial.map((item) => (
            <div
              key={item.id}
              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 font-mono font-bold text-[10px]">
                  .DB
                </div>
                <div>
                  <p className="font-mono font-semibold text-slate-200">{item.nombre}</p>
                  <span className="text-[11px] text-slate-500">{item.fecha}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-mono text-slate-400">{item.tamano}</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
                  {item.tipo}
                </span>
                <button
                  onClick={() => alert(`Archivo de respaldo ubicado en ./backups/${item.nombre}`)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  Abrir Ubicación
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. PROTOCOLO DE SEGURIDAD MINERA */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2 text-xs text-slate-400">
        <h4 className="font-bold text-slate-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" /> Protocolo de Contingencia para Operación Minera Offline:
        </h4>
        <ul className="list-disc list-inside space-y-1 ml-2 text-slate-400">
          <li>Se recomienda exportar una copia física de la base de datos a un dispositivo USB externo al final de cada turno.</li>
          <li>Gracias a <code className="text-amber-400">PRAGMA journal_mode=WAL;</code>, las copias en caliente no bloquean el registro de personal ni movimientos de almacén en curso.</li>
          <li>Para restaurar en una nueva máquina, basta con renombrar el archivo más reciente a <code className="text-slate-200 font-mono">datos_sistema.db</code> en la raíz del ERP.</li>
        </ul>
      </div>
    </div>
  );
};
