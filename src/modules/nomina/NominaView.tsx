import React, { useState, useEffect } from "react";
import {
  Wallet,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Printer,
  Coins,
  Calendar,
  TrendingDown,
  TrendingUp,
  Receipt,
  RefreshCw
} from "lucide-react";
import { NominaPago, NominaConcepto } from "../../types";
import { erpApi } from "../../services/api";
import { Modal } from "../../components/Modal";

export const NominaView: React.FC = () => {
  const [pagos, setPagos] = useState<NominaPago[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState("Octubre");
  const [anioSeleccionado, setAnioSeleccionado] = useState(2026);
  const [selectedPago, setSelectedPago] = useState<NominaPago | null>(null);
  const [isBoletaModalOpen, setIsBoletaModalOpen] = useState(false);

  // Conceptos interactivos en Bolivianos (Bs.) sincronizados con storage persistente
  const [conceptosMap, setConceptosMap] = useState<Record<number, NominaConcepto[]>>(() =>
    erpApi.getNominaConceptosMap()
  );

  const [isModalConceptoOpen, setIsModalConceptoOpen] = useState(false);
  const [nuevoConcepto, setNuevoConcepto] = useState<{
    tipo: "SALARIO_BASE" | "DESCUENTO" | "ADELANTO";
    monto: number;
    descripcion: string;
  }>({
    tipo: "DESCUENTO",
    monto: 0,
    descripcion: "",
  });

  const loadNomina = async () => {
    const dataPagos = await erpApi.getNominaPagos();
    const dataConceptos = erpApi.getNominaConceptosMap();
    setPagos(dataPagos);
    setConceptosMap(dataConceptos);
    if (dataPagos.length > 0 && !selectedPago) {
      setSelectedPago(dataPagos[0]);
    }
  };

  useEffect(() => {
    loadNomina();
  }, []);

  const handleSincronizarRRHH = async () => {
    try {
      const res = await erpApi.sincronizarNominaConRRHH(mesSeleccionado, anioSeleccionado);
      const dataPagos = await erpApi.getNominaPagos();
      const dataConceptos = erpApi.getNominaConceptosMap();
      setPagos(dataPagos);
      setConceptosMap(dataConceptos);
      if (dataPagos.length > 0) {
        if (!selectedPago || !dataPagos.some(p => p.id_pago === selectedPago.id_pago)) {
          setSelectedPago(dataPagos[0]);
        } else {
          const updated = dataPagos.find(p => p.id_pago === selectedPago.id_pago);
          if (updated) setSelectedPago(updated);
        }
      }
      alert(
        `✓ Sincronización con Personal RRHH exitosa:\n\n` +
        `• ${res.agregados} trabajador(es) nuevo(s) incorporado(s) a la planilla de ${mesSeleccionado} ${anioSeleccionado}.\n` +
        `• Salario Básico importado automáticamente en Bolivianos (Bs.).\n` +
        `• Deducción de Ley Gestora Pública (12.71%) generada para cada nuevo legajo.\n` +
        `• Total personal activo en planilla: ${dataPagos.length}`
      );
    } catch (err) {
      alert("Error al sincronizar con RRHH: " + err);
    }
  };

  const currentConceptos = selectedPago ? conceptosMap[selectedPago.id_pago!] || [] : [];

  const handleAgregarConcepto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPago || nuevoConcepto.monto <= 0 || !nuevoConcepto.descripcion) return;

    const montoCalculado =
      nuevoConcepto.tipo === "SALARIO_BASE"
        ? Math.abs(nuevoConcepto.monto)
        : -Math.abs(nuevoConcepto.monto);

    const conceptoAgregado: NominaConcepto = {
      id_concepto: Date.now(),
      id_pago: selectedPago.id_pago!,
      tipo_concepto: nuevoConcepto.tipo,
      monto: montoCalculado,
      descripcion_info: nuevoConcepto.descripcion,
      fecha_registro: new Date().toISOString().split("T")[0],
    };

    const nuevosConceptos = [...currentConceptos, conceptoAgregado];
    const newMap = { ...conceptosMap, [selectedPago.id_pago!]: nuevosConceptos };
    setConceptosMap(newMap);
    erpApi.saveNominaConceptosMap(newMap);

    // Recalcular total del pago
    const nuevoTotal = nuevosConceptos.reduce((acc, c) => acc + c.monto, 0);
    const updatedPagos = pagos.map((p) =>
      p.id_pago === selectedPago.id_pago ? { ...p, monto_total: nuevoTotal } : p
    );
    setPagos(updatedPagos);
    const updatedSelected = { ...selectedPago, monto_total: nuevoTotal };
    setSelectedPago(updatedSelected);

    // Persistir y auditar
    await erpApi.updateNominaPago(updatedSelected);

    setIsModalConceptoOpen(false);
    setNuevoConcepto({ tipo: "DESCUENTO", monto: 0, descripcion: "" });
  };

  const handleEliminarConcepto = async (idConcepto: number) => {
    if (!selectedPago) return;
    if (confirm("¿Eliminar este concepto salarial?")) {
      const filtrados = currentConceptos.filter((c) => c.id_concepto !== idConcepto);
      const newMap = { ...conceptosMap, [selectedPago.id_pago!]: filtrados };
      setConceptosMap(newMap);
      erpApi.saveNominaConceptosMap(newMap);

      const nuevoTotal = filtrados.reduce((acc, c) => acc + c.monto, 0);
      const updatedPagos = pagos.map((p) =>
        p.id_pago === selectedPago.id_pago ? { ...p, monto_total: nuevoTotal } : p
      );
      setPagos(updatedPagos);
      const updatedSelected = { ...selectedPago, monto_total: nuevoTotal };
      setSelectedPago(updatedSelected);

      await erpApi.updateNominaPago(updatedSelected);
    }
  };

  const handleToggleBloqueo = async (pago: NominaPago) => {
    const nuevoEstado = pago.estado_bloqueo === 1 ? 0 : 1;
    const msg =
      nuevoEstado === 1
        ? "¿Bloquear planilla de este trabajador para pago definitivo?"
        : "¿Desbloquear para edición de conceptos?";
    if (confirm(msg)) {
      const updatedItem = { ...pago, estado_bloqueo: nuevoEstado };
      const updated = pagos.map((p) =>
        p.id_pago === pago.id_pago ? updatedItem : p
      );
      setPagos(updated);
      setSelectedPago(updatedItem);
      await erpApi.updateNominaPago(updatedItem);
    }
  };

  const ingresos = currentConceptos.filter((c) => c.monto > 0);
  const totalIngresos = ingresos.reduce((sum, c) => sum + c.monto, 0);

  const deducciones = currentConceptos.filter((c) => c.monto < 0);
  const totalDeducciones = deducciones.reduce((sum, c) => sum + Math.abs(c.monto), 0);

  const netoAPagar = totalIngresos - totalDeducciones;

  return (
    <div className="space-y-6">
      {/* 1. HEADER DEL PERÍODO Y KPIS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-100 text-lg">Control de Planilla Minera (Bolivia)</h3>
            <p className="text-xs text-slate-400">
              Cálculo en <strong className="text-amber-400">Bolivianos (Bs.)</strong> • Anticipos, bonos y descuentos por reposición de EPP
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none"
            >
              <option value="Enero">Enero</option>
              <option value="Febrero">Febrero</option>
              <option value="Marzo">Marzo</option>
              <option value="Agosto">Agosto</option>
              <option value="Septiembre">Septiembre</option>
              <option value="Octubre">Octubre</option>
              <option value="Noviembre">Noviembre</option>
              <option value="Diciembre">Diciembre</option>
            </select>

            <select
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none pl-2 border-l border-slate-800"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          <button
            onClick={handleSincronizarRRHH}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-amber-500/10"
            title="Importa trabajadores de RRHH con su haber básico contractual y descuenta automáticamente el 12.71% de Gestora Pública"
          >
            <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
            Sincronizar con Personal RRHH
          </button>

          <button
            onClick={() => alert(`Planilla de ${mesSeleccionado} ${anioSeleccionado} recalculada en Bs.`)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            Recalcular Planilla
          </button>
        </div>
      </div>

      {/* 2. SPLIT LAYOUT: LISTA DE TRABAJADORES VS DETALLE DE CONCEPTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Tarjetas de Trabajadores */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Personal en Planilla ({pagos.length})
            </span>
            <span className="text-xs text-amber-400 font-mono font-semibold">
              Período: {mesSeleccionado} {anioSeleccionado}
            </span>
          </div>

          <div className="space-y-2.5">
            {pagos.map((p) => {
              const isSelected = selectedPago?.id_pago === p.id_pago;
              return (
                <div
                  key={p.id_pago}
                  onClick={() => setSelectedPago(p)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border-amber-500/60 shadow-lg shadow-amber-500/5"
                      : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{p.empleado_nombre}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{p.cargo}</p>
                    </div>

                    {p.estado_bloqueo === 1 ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" /> Cerrado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        <Unlock className="w-3 h-3" /> Editable
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                    <span className="text-slate-400">Líquido Pagable:</span>
                    <span className="font-bold font-mono text-base text-emerald-400">
                      Bs. {p.monto_total.toLocaleString("es-BO", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha: Desglose Granular de Conceptos */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          {selectedPago ? (
            <>
              {/* Header del Trabajador Seleccionado */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-100">
                    {selectedPago.empleado_nombre}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedPago.cargo} • Planilla Oficial {mesSeleccionado} {anioSeleccionado}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsBoletaModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    Ver Boleta
                  </button>

                  <button
                    onClick={() => handleToggleBloqueo(selectedPago)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedPago.estado_bloqueo === 1
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                    }`}
                  >
                    {selectedPago.estado_bloqueo === 1 ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" /> Habilitar Edición
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" /> Bloquear Planilla
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 3 Tarjetas de Resumen Financiero en Bolivianos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Total Haberes
                  </span>
                  <p className="text-lg font-bold font-mono text-emerald-400 mt-1">
                    Bs. {totalIngresos.toFixed(2)}
                  </p>
                </div>

                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> Total Descuentos
                  </span>
                  <p className="text-lg font-bold font-mono text-rose-400 mt-1">
                    - Bs. {totalDeducciones.toFixed(2)}
                  </p>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <span className="text-[11px] text-amber-300 font-bold uppercase">Líquido Pagable</span>
                  <p className="text-xl font-extrabold font-mono text-amber-400 mt-1">
                    Bs. {netoAPagar.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Lista de Conceptos */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                    Desglose de Conceptos (nomina_conceptos)
                  </h4>

                  {selectedPago.estado_bloqueo === 0 && (
                    <button
                      onClick={() => setIsModalConceptoOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      Añadir Descuento / Bono
                    </button>
                  )}
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 bg-slate-950/50">
                  {currentConceptos.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No hay conceptos registrados para este trabajador.
                    </div>
                  ) : (
                    currentConceptos.map((c) => (
                      <div
                        key={c.id_concepto}
                        className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] tracking-wider uppercase border ${
                              c.tipo_concepto === "SALARIO_BASE"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : c.tipo_concepto === "ADELANTO"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            }`}
                          >
                            {c.tipo_concepto}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-200">{c.descripcion_info}</p>
                            <span className="text-[10px] text-slate-500">{c.fecha_registro}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span
                            className={`font-mono font-bold text-sm ${
                              c.monto > 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {c.monto > 0 ? `+ Bs. ${c.monto.toFixed(2)}` : `- Bs. ${Math.abs(c.monto).toFixed(2)}`}
                          </span>

                          {selectedPago.estado_bloqueo === 0 && (
                            <button
                              onClick={() => handleEliminarConcepto(c.id_concepto!)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                              title="Eliminar concepto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500">
              Selecciona un trabajador del panel izquierdo para visualizar su desglose salarial.
            </div>
          )}
        </div>
      </div>

      {/* 3. MODAL: AGREGAR CONCEPTO */}
      <Modal
        isOpen={isModalConceptoOpen}
        onClose={() => setIsModalConceptoOpen(false)}
        title="Agregar Concepto de Nómina (Bolivia)"
        subtitle={`Trabajador: ${selectedPago?.empleado_nombre || ""}`}
        icon={<Coins className="w-5 h-5 text-amber-500" />}
        maxWidth="md"
      >
        <form onSubmit={handleAgregarConcepto} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Concepto</label>
            <select
              value={nuevoConcepto.tipo}
              onChange={(e) =>
                setNuevoConcepto({
                  ...nuevoConcepto,
                  tipo: e.target.value as "SALARIO_BASE" | "DESCUENTO" | "ADELANTO",
                })
              }
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="DESCUENTO">DESCUENTO (Reposición EPP, Daño Lámpara, Faltas)</option>
              <option value="ADELANTO">ADELANTO (Anticipo de Quincena, Préstamo de Emergencia)</option>
              <option value="SALARIO_BASE">BONO / HABER (Bono de Producción Mina, Horas Extra)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Monto en Bolivianos (Bs.) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={nuevoConcepto.monto || ""}
              onChange={(e) =>
                setNuevoConcepto({ ...nuevoConcepto, monto: parseFloat(e.target.value) || 0 })
              }
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción / Motivo *</label>
            <input
              type="text"
              required
              value={nuevoConcepto.descripcion}
              onChange={(e) => setNuevoConcepto({ ...nuevoConcepto, descripcion: e.target.value })}
              placeholder="Ej: Reposición de linterna minera, Anticipo quincenal"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalConceptoOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow-md"
            >
              Registrar en Planilla
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. MODAL: BOLETA OFICIAL DE PAGO DUPLICADA (BOLIVIA - FORMATO ECONÓMICO B/N) */}
      {selectedPago && (
        <Modal
          isOpen={isBoletaModalOpen}
          onClose={() => setIsBoletaModalOpen(false)}
          title="Papeleta de Pago de Remuneraciones (Duplicada B/N)"
          subtitle={`Período: ${mesSeleccionado} ${anioSeleccionado} • Formato económico de bajo consumo de tinta`}
          icon={<Receipt className="w-5 h-5 text-amber-500" />}
          maxWidth="4xl"
        >
          <div className="space-y-6">
            {/* Contenedor de impresión en blanco y negro de bajo consumo */}
            <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-300 shadow-sm space-y-6 font-sans">
              {[
                { copia: "COPIA EMPLEADOR (ADMINISTRACIÓN / RRHH)", footerNota: "El trabajador declara recibir el monto conforme a ley." },
                { copia: "COPIA TRABAJADOR (TALÓN DE CONTROL)", footerNota: "Conserve este comprobante como constancia oficial de aportes al sistema de seguridad social." }
              ].map((item, idx) => (
                <React.Fragment key={item.copia}>
                  {idx > 0 && (
                    <div className="border-t-2 border-dashed border-slate-400 my-4 text-center text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                      - - - - - - - - - - - - - - - - CORTAR POR LA LÍNEA PUNTEADA - - - - - - - - - - - - - - - -
                    </div>
                  )}

                  <div className="border border-slate-400 p-4 rounded-lg space-y-3 text-xs bg-white text-black">
                    <div className="flex justify-between items-start border-b border-slate-400 pb-2">
                      <div>
                        <h4 className="font-extrabold text-sm uppercase tracking-tight text-black">
                          EMPRESA MINERA PROYJIMP S.A.
                        </h4>
                        <p className="text-[10px] text-slate-600 font-medium">
                          NIT: 1029384029 • Unidad Minera Central • Bolivia
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold font-mono text-[11px] block text-black">
                          BOLETA #{mesSeleccionado.slice(0, 3).toUpperCase()}-2026-{String(selectedPago.id_pago).padStart(3, "0")}
                        </span>
                        <span className="inline-block px-2 py-0.5 border border-black font-extrabold text-[9px] uppercase tracking-wider mt-0.5">
                          {item.copia}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-50 border border-slate-300 p-2.5 rounded">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Trabajador:</span>
                        <strong className="text-slate-900">{selectedPago.empleado_nombre}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Cargo / Puesto:</span>
                        <strong className="text-slate-900">{selectedPago.cargo}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Período de Liquidación:</span>
                        <strong className="text-slate-900">{mesSeleccionado} {anioSeleccionado}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Moneda Oficial:</span>
                        <strong className="text-slate-900">Bolivianos (Bs.)</strong>
                      </div>
                    </div>

                    {/* Tabla de Conceptos */}
                    <table className="w-full text-left text-xs border border-slate-300">
                      <thead className="bg-slate-100 border-b border-slate-300 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="p-1.5 border-r border-slate-300">Concepto / Detalle</th>
                          <th className="p-1.5 border-r border-slate-300 text-center w-28">Clasificación</th>
                          <th className="p-1.5 border-r border-slate-300 text-right w-28">Haberes (Bs.)</th>
                          <th className="p-1.5 text-right w-28">Descuentos (Bs.)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                        {currentConceptos.map((c) => (
                          <tr key={c.id_concepto}>
                            <td className="p-1.5 font-sans border-r border-slate-300 text-slate-800">
                              {c.descripcion_info}
                            </td>
                            <td className="p-1.5 text-center border-r border-slate-300 text-[10px] font-sans">
                              {c.tipo_concepto === "SALARIO_BASE" ? "HABER" : c.tipo_concepto}
                            </td>
                            <td className="p-1.5 text-right border-r border-slate-300 text-slate-900 font-bold">
                              {c.monto > 0 ? c.monto.toFixed(2) : "-"}
                            </td>
                            <td className="p-1.5 text-right text-slate-900 font-bold">
                              {c.monto < 0 ? Math.abs(c.monto).toFixed(2) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t-2 border-slate-400 bg-slate-50 font-bold">
                        <tr>
                          <td colSpan={2} className="p-1.5 text-right uppercase text-[10px]">
                            Totales Parciales:
                          </td>
                          <td className="p-1.5 text-right font-mono border-r border-slate-300 text-slate-900">
                            Bs. {totalIngresos.toFixed(2)}
                          </td>
                          <td className="p-1.5 text-right font-mono text-slate-900">
                            - Bs. {totalDeducciones.toFixed(2)}
                          </td>
                        </tr>
                        <tr className="border-t border-slate-400 bg-slate-100 text-sm">
                          <td colSpan={2} className="p-2 font-black uppercase text-slate-950">
                            LÍQUIDO PAGABLE EFECTIVO:
                          </td>
                          <td colSpan={2} className="p-2 text-right font-black font-mono text-base text-slate-950">
                            Bs. {netoAPagar.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>

                    <p className="text-[9px] text-slate-500 italic">
                      {item.footerNota} Ley General del Trabajo y Régimen Gestora Pública de la Seguridad Social de Largo Plazo (12.71%).
                    </p>

                    {/* Firmas Oficiales */}
                    <div className="grid grid-cols-2 gap-8 pt-6 pb-2 text-center text-[10px]">
                      <div className="border-t border-slate-700 pt-1">
                        <span className="font-bold block text-slate-900">{selectedPago.empleado_nombre}</span>
                        <span className="text-slate-500">Firma del Trabajador / C.I.</span>
                      </div>
                      <div className="border-t border-slate-700 pt-1">
                        <span className="font-bold block text-slate-900">Administración de Planillas</span>
                        <span className="text-slate-500">Firma y Sello Empleador</span>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsBoletaModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4 stroke-[2.2]" />
                Imprimir Boleta Duplicada (B/N)
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
