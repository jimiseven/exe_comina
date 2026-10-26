import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Layers,
  CheckCircle2,
  X,
  Boxes,
  Truck,
  HardHat,
  Hammer,
  Droplets,
  Cog,
  ClipboardList,
  Printer,
  FileText,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  Scale,
  Trash2,
  Download,
  Ban,
  Filter
} from "lucide-react";
import {
  AlmacenItem,
  AlmacenMovimiento,
  ItemKardexPayload,
  SolicitudRequerimientoPayload,
  NotaIngresoPayload,
  NotaSalidaPayload,
  NotaDevolucionPayload,
  ActaInventarioPayload,
  Empleado
} from "../../types";
import { erpApi } from "../../services/api";
import { Modal } from "../../components/Modal";

interface CategoriaCardInfo {
  id: string;
  nombre: string;
  descripcion: string;
  icono: React.ReactNode;
  colorIcono: string;
  bgIcono: string;
  borderColor: string;
  badgeColor: string;
  topGradient: string;
}

type TabAlmacen =
  | "KARDEX"         // ALM-KRD-001
  | "SOLICITUDES"    // ALM-SRM-002
  | "INGRESOS"       // ALM-NIA-003
  | "SALIDAS"        // ALM-NSA-004
  | "DEVOLUCIONES"   // ALM-NDM-005
  | "INVENTARIOS"    // ALM-AIF-006
  | "MOVIMIENTOS";

// Interfaz para el documento imprimible en blanco y negro (bajo consumo de tinta)
interface PrintableDocumentData {
  codigoFormulario: string;
  tituloDocumento: string;
  nroDocumento: string;
  fecha: string;
  cabecera: Array<{ label: string; valor: string }>;
  columnas: string[];
  filas: Array<Array<string | number>>;
  firmas: string[];
  pieNota?: string;
}

// Componente interactivo para buscar por código o descripción y crear ítem directamente
interface ItemComboboxProps {
  selectedCode?: string;
  items: AlmacenItem[];
  onSelect: (item: AlmacenItem) => void;
  onClear: () => void;
  onCreateNew: (typedQuery: string) => void;
  placeholder?: string;
}

const ItemCombobox: React.FC<ItemComboboxProps> = ({
  selectedCode,
  items,
  onSelect,
  onClear,
  onCreateNew,
  placeholder = "Buscar por código (ej. DIN-001) o descripción..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = items.filter(
    (i) =>
      i.codigo_item.toLowerCase().includes(query.toLowerCase()) ||
      i.descripcion.toLowerCase().includes(query.toLowerCase())
  );

  const matched = items.find((i) => i.codigo_item === selectedCode);

  return (
    <div className="relative flex-1">
      {selectedCode && matched ? (
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border border-amber-500/50 rounded-lg text-xs">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
            <span className="font-mono font-bold text-amber-400 shrink-0">[{matched.codigo_item}]</span>
            <span className="text-slate-100 font-semibold truncate">{matched.descripcion}</span>
            <span className="text-[10px] text-emerald-400 shrink-0 font-mono">
              ({matched.stock_actual} {matched.unidad_medida})
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
              setQuery("");
            }}
            className="ml-2 p-1 text-slate-400 hover:text-rose-400 rounded-md transition-colors cursor-pointer shrink-0"
            title="Cambiar o desvincular ítem"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="button"
            onClick={() => onCreateNew(query)}
            title="Crear nuevo ítem en Kardex directamente"
            className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Nuevo Ítem
          </button>
        </div>
      )}

      {/* Menú flotante con resultados en vivo */}
      {isOpen && !selectedCode && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-800">
            {filtered.length > 0 ? (
              filtered.map((it) => (
                <div
                  key={it.id_item || it.codigo_item}
                  onClick={() => {
                    onSelect(it);
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className="p-2.5 hover:bg-slate-800/80 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-amber-400">[{it.codigo_item}]</span>
                      <span className="text-xs font-semibold text-slate-200 truncate">{it.descripcion}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Ubic: {it.ubicacion_rack || "Almacén Principal"}</span>
                      <span>•</span>
                      <span>Cat: {it.categoria || it.tipo_categoria || "General"}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-emerald-400 block">
                      {it.stock_actual} {it.unidad_medida}
                    </span>
                    <span className="text-[9px] text-slate-400">Stock en bodega</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                No se encontró &quot;{query}&quot; en el catálogo existente.
              </div>
            )}

            {/* Opción destacada para crear el ítem al instante */}
            <div
              onClick={() => {
                onCreateNew(query);
                setIsOpen(false);
              }}
              className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs cursor-pointer transition-colors flex items-center gap-2 border-t border-slate-700"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>
                {query.trim()
                  ? `+ Crear "${query.trim()}" directamente en Kardex...`
                  : "+ Crear nuevo ítem en Kardex..."}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const AlmacenView: React.FC = () => {
  const [tabActiva, setTabActiva] = useState<TabAlmacen>("KARDEX");
  const [items, setItems] = useState<AlmacenItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("TODOS");
  const [filtroSoloCriticos, setFiltroSoloCriticos] = useState(false);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);

  // Documentos de los 6 formularios
  const [solicitudes, setSolicitudes] = useState<SolicitudRequerimientoPayload["solicitud"][]>([]);
  const [ingresos, setIngresos] = useState<NotaIngresoPayload["ingreso"][]>([]);
  const [salidas, setSalidas] = useState<NotaSalidaPayload["salida"][]>([]);
  const [devoluciones, setDevoluciones] = useState<NotaDevolucionPayload["devolucion"][]>([]);
  const [inventarios, setInventarios] = useState<ActaInventarioPayload["inventario_fisico"][]>([]);
  const [movimientos, setMovimientos] = useState<AlmacenMovimiento[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<string[]>([]);
  const [modalNuevaUnidadOpen, setModalNuevaUnidadOpen] = useState(false);
  const [nuevaUnidadNombre, setNuevaUnidadNombre] = useState("");
  const [kardexCreationTarget, setKardexCreationTarget] = useState<{
    formType: "ingreso" | "salida" | "solicitud" | "devolucion" | "inventario";
    rowIndex: number;
  } | null>(null);

  // Modales de Creación
  const [modalKardexOpen, setModalKardexOpen] = useState(false);
  const [modalSolicitudOpen, setModalSolicitudOpen] = useState(false);
  const [modalIngresoOpen, setModalIngresoOpen] = useState(false);
  const [modalSalidaOpen, setModalSalidaOpen] = useState(false);
  const [modalDevolucionOpen, setModalDevolucionOpen] = useState(false);
  const [modalInventarioOpen, setModalInventarioOpen] = useState(false);

  // Modal de Impresión Blanco y Negro
  const [printableDoc, setPrintableDoc] = useState<PrintableDocumentData | null>(null);

  // Estados de Formulario: 1. ALM-KRD-001
  const [formKardex, setFormKardex] = useState<ItemKardexPayload["item"]>({
    codigo_item: "",
    descripcion: "",
    unidad_medida: "Kilo",
    ubicacion_rack: "Polvorin A",
    categoria: "Explosivos",
    stock_minimo: 100,
    stock_maximo: 2000,
    responsable_almacen: "Admin Almacén",
    supervisor_logistica: "Ing. Juan Pérez",
  });

  // Estados de Formulario: 2. ALM-SRM-002
  const [formSolicitud, setFormSolicitud] = useState<SolicitudRequerimientoPayload["solicitud"]>({
    nro_solicitud: "",
    fecha: new Date().toISOString().split("T")[0],
    area_frente_trabajo: "Mina Nivel 2",
    centro_costo: "CC-05",
    solicitado_por: "Carlos Molina",
    cargo: "Jefe de Frente",
    urgencia: "Alta",
    motivo: "Voladura programada turno tarde",
    items: [
      { descripcion: "Dinamita en cartuchos", unidad: "Kilo", cantidad_solicitada: 500, cantidad_entregada: 0, observaciones: "" }
    ],
    firmas: ["Solicitante", "Jefe de Área", "Jefe de Almacén"]
  });

  // Estados de Formulario: 3. ALM-NIA-003
  const [formIngreso, setFormIngreso] = useState<NotaIngresoPayload["ingreso"]>({
    nro_ingreso: "",
    fecha_recepcion: new Date().toISOString().split("T")[0],
    proveedor: "Explosivos del Sur S.A.",
    nro_guia_factura: "F-001452",
    orden_compra: "OC-998",
    placa_transportista: "ABC-123 / Luis Gomez",
    recibido_por: "Admin Almacén",
    estado_carga: "Optimo",
    items: [
      { descripcion: "Dinamita en cartuchos", unidad: "Kilo", cantidad_pedida: 1000, cantidad_recibida: 1000, conformidad: "Conforme" }
    ],
    observaciones_no_conformidades: "Llegó a tiempo",
    comentario: "",
    firmas: ["Recepción Almacén", "Transportista", "Supervisor Logística"]
  });

  // Estados de Formulario: 4. ALM-NSA-004
  const [formSalida, setFormSalida] = useState<NotaSalidaPayload["salida"]>({
    nro_salida: "",
    fecha: new Date().toISOString().split("T")[0],
    destino: "Planta Trituradora",
    centro_costo: "CC-02",
    entregado_por: "Admin Almacén",
    recibido_por: "Pedro Carvalo",
    referencia_solicitud_nro: "REQ-2026-001",
    vehiculo_responsable_traslado: "Camioneta 3",
    items: [
      { descripcion: "Dinamita en cartuchos", unidad: "Kilo", cantidad: 500, observaciones: "Entrega parcial" }
    ],
    firmas: ["Despacho Almacén", "Recibe Conforme", "Supervisor Logística"]
  });

  // Estados de Formulario: 5. ALM-NDM-005
  const [formDevolucion, setFormDevolucion] = useState<NotaDevolucionPayload["devolucion"]>({
    nro_devolucion: "",
    fecha: new Date().toISOString().split("T")[0],
    area_que_devuelve: "Mina Nivel 2",
    referencia_salida_nro: "SAL-2026-050",
    motivo_devolucion: "Sobrante de voladura",
    condicion_material: "Buen estado",
    items: [
      { descripcion: "Dinamita en cartuchos", unidad: "Kilo", cantidad: 50, estado_observacion: "Intacto, reingresa a polvorin" }
    ],
    firmas: ["Entrega Área Usuaria", "Recibe Almacén", "Supervisor Logística"]
  });

  // Estados de Formulario: 6. ALM-AIF-006
  const [formInventario, setFormInventario] = useState<ActaInventarioPayload["inventario_fisico"]>({
    fecha_conteo: new Date().toISOString().split("T")[0],
    tipo: "General",
    almacen_ubicacion: "Almacen Principal",
    responsable_conteo: "Equipo Auditoria",
    items: [
      { descripcion: "Dinamita en cartuchos", unidad: "Kilo", stock_sistema: 550, stock_fisico: 548, diferencia: -2, observacion: "Margen de error en pesaje" }
    ],
    conclusiones_acciones_correctivas: "Se aplicará ajuste en sistema de -2 Kg por merma.",
    firmas: ["Responsable Almacén", "Auditor Control Interno", "Gerencia Logística"]
  });

  const loadData = async () => {
    const dataItems = await erpApi.getAlmacenItems();
    setItems(dataItems);

    const dataSol = await erpApi.getSolicitudesRequerimiento();
    setSolicitudes(dataSol);

    const dataIng = await erpApi.getNotasIngreso();
    setIngresos(dataIng);

    const dataSal = await erpApi.getNotasSalida();
    setSalidas(dataSal);

    const dataDev = await erpApi.getNotasDevolucion();
    setDevoluciones(dataDev);

    const dataInv = await erpApi.getActasInventario();
    setInventarios(dataInv);

    const dataMovs = await erpApi.getAlmacenMovimientos();
    setMovimientos(dataMovs);

    const dataUnidades = erpApi.getUnidadesMedida();
    setUnidadesMedida(dataUnidades);

    const dataEmpleados = await erpApi.getEmpleados();
    setEmpleados(dataEmpleados);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAbrirCreacionKardex = (
    queryInicial: string,
    formType: "ingreso" | "salida" | "solicitud" | "devolucion" | "inventario",
    rowIndex: number
  ) => {
    const trimmed = queryInicial.trim();
    const pareceCodigo = /^[A-Z0-9-]{3,10}$/.test(trimmed);

    setFormKardex({
      codigo_item: pareceCodigo ? trimmed.toUpperCase() : `MAT-${String(items.length + 1).padStart(3, "0")}`,
      descripcion: pareceCodigo ? "" : trimmed,
      unidad_medida: "Unidad",
      ubicacion_rack: "Almacén Principal",
      categoria: "General",
      stock_minimo: 10,
      stock_maximo: 500,
      responsable_almacen: "Admin Almacén",
      supervisor_logistica: "Supervisor Logística",
    });
    setKardexCreationTarget({ formType, rowIndex });
    setModalKardexOpen(true);
  };

  // 1. Guardar ALM-KRD-001
  const handleGuardarKardex = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKardex.codigo_item || !formKardex.descripcion) {
      alert("Código y Descripción son obligatorios.");
      return;
    }
    const nuevo = await erpApi.createItemKardex({ item: formKardex });

    // Actualizar catálogo local de ítems inmediatamente
    setItems((prev) => [nuevo, ...prev.filter((i) => i.codigo_item !== nuevo.codigo_item)]);

    // Si la unidad del nuevo ítem no estaba en la lista, agregarla
    if (nuevo.unidad_medida && !unidadesMedida.includes(nuevo.unidad_medida)) {
      setUnidadesMedida((prev) => [...prev, nuevo.unidad_medida]);
    }

    setModalKardexOpen(false);

    if (kardexCreationTarget) {
      const { formType, rowIndex } = kardexCreationTarget;
      handleSeleccionarItemEnFila(rowIndex, nuevo, formType);
      setKardexCreationTarget(null);
    }

    alert(`Tarjeta Kardex ALM-KRD-001 creada con éxito para [${nuevo.codigo_item}]. ¡Ítem vinculado automáticamente a la fila!`);
    loadData();
  };

  // 2. Guardar ALM-SRM-002
  const handleGuardarSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    const nro = formSolicitud.nro_solicitud || `REQ-2026-${String(solicitudes.length + 1).padStart(3, "0")}`;
    await erpApi.createSolicitudRequerimiento({
      solicitud: { ...formSolicitud, nro_solicitud: nro }
    });
    alert(`Solicitud ALM-SRM-002 [${nro}] registrada exitosamente.`);
    setModalSolicitudOpen(false);
    loadData();
  };

  // 3. Guardar ALM-NIA-003
  const handleGuardarIngreso = async (e: React.FormEvent) => {
    e.preventDefault();
    const nro = formIngreso.nro_ingreso || `ING-2026-${String(ingresos.length + 101)}`;
    await erpApi.createNotaIngreso({
      ingreso: { ...formIngreso, nro_ingreso: nro }
    });
    alert(`Nota de Ingreso ALM-NIA-003 [${nro}] guardada. ¡Stock actualizado en Kardex!`);
    setModalIngresoOpen(false);
    loadData();
  };

  // 4. Guardar ALM-NSA-004
  const handleGuardarSalida = async (e: React.FormEvent) => {
    e.preventDefault();
    const nro = formSalida.nro_salida || `SAL-2026-${String(salidas.length + 51)}`;
    try {
      await erpApi.createNotaSalida({
        salida: { ...formSalida, nro_salida: nro }
      });
      alert(`Nota de Salida ALM-NSA-004 [${nro}] despachada. ¡Stock descontado en Kardex!`);
      setModalSalidaOpen(false);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  // 5. Guardar ALM-NDM-005
  const handleGuardarDevolucion = async (e: React.FormEvent) => {
    e.preventDefault();
    const nro = formDevolucion.nro_devolucion || `DEV-2026-${String(devoluciones.length + 6).padStart(3, "0")}`;
    await erpApi.createNotaDevolucion({
      devolucion: { ...formDevolucion, nro_devolucion: nro }
    });
    alert(`Nota de Devolución ALM-NDM-005 [${nro}] procesada.`);
    setModalDevolucionOpen(false);
    loadData();
  };

  // 6. Guardar ALM-AIF-006
  const handleGuardarInventario = async (e: React.FormEvent) => {
    e.preventDefault();
    await erpApi.createActaInventario({
      inventario_fisico: formInventario
    });
    alert(`Acta de Inventario Físico ALM-AIF-006 guardada. Stock sincronizado con conteo físico.`);
    setModalInventarioOpen(false);
    loadData();
  };

  // Exportar inventario completo en formato CSV para Excel
  const handleExportarCSV = () => {
    try {
      const csvStr = erpApi.exportarKardexCSV();
      // Agregar BOM (\uFEFF) para compatibilidad UTF-8 en Excel
      const blob = new Blob(["\uFEFF" + csvStr], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Kardex_Inventario_ProyJimP_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error al exportar inventario a CSV: " + err);
    }
  };

  // Anular Nota de Ingreso (revertir stock ingresado)
  const handleAnularIngreso = async (ing: NotaIngresoPayload["ingreso"]) => {
    if (ing.estado === "ANULADO") {
      alert("Esta nota de ingreso ya ha sido anulada previamente.");
      return;
    }
    const seguro = window.confirm(
      `¿Desea ANULAR la Nota de Ingreso [${ing.nro_ingreso}]?\n\n` +
      `ADVERTENCIA: Esta acción restará automáticamente las cantidades recibidas del stock del Kardex y registrará el movimiento de auditoría correspondiente.`
    );
    if (!seguro) return;

    const motivo = window.prompt("Ingrese el motivo de anulación de la nota de ingreso (obligatorio):");
    if (!motivo || !motivo.trim()) {
      alert("El motivo de anulación es obligatorio para mantener la trazabilidad.");
      return;
    }

    try {
      await erpApi.anularNotaIngreso(ing.nro_ingreso, motivo.trim(), "Admin Almacén");
      alert(`Nota de Ingreso [${ing.nro_ingreso}] anulada exitosamente. El stock en Kardex fue revertido.`);
      await loadData();
    } catch (err: unknown) {
      alert("Error anulando nota de ingreso: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Anular Nota de Salida (reponer stock despachado)
  const handleAnularSalida = async (sal: NotaSalidaPayload["salida"]) => {
    if (sal.estado === "ANULADO") {
      alert("Esta nota de salida ya ha sido anulada previamente.");
      return;
    }
    const seguro = window.confirm(
      `¿Desea ANULAR la Nota de Salida [${sal.nro_salida}]?\n\n` +
      `ADVERTENCIA: Esta acción repondrá automáticamente las cantidades al stock del Kardex y registrará el movimiento de reversión.`
    );
    if (!seguro) return;

    const motivo = window.prompt("Ingrese el motivo de anulación del despacho (obligatorio):");
    if (!motivo || !motivo.trim()) {
      alert("El motivo de anulación es obligatorio para mantener la trazabilidad.");
      return;
    }

    try {
      await erpApi.anularNotaSalida(sal.nro_salida, motivo.trim(), "Admin Almacén");
      alert(`Nota de Salida [${sal.nro_salida}] anulada exitosamente. Las cantidades fueron repuestas en el Kardex.`);
      await loadData();
    } catch (err: unknown) {
      alert("Error anulando nota de salida: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Preparar impresiones en formato blanco y negro económico
  const handleImprimirKardex = async (it: AlmacenItem) => {
    const itemMovs = await erpApi.getMovimientosByItem(it.codigo_item);

    const filasMovimientos: Array<Array<string | number>> = itemMovs.length > 0
      ? itemMovs.map((m) => [
          m.fecha_movimiento?.split(" ")[0] || "---",
          m.nro_documento_ref || "---",
          m.entidad_origen_destino || m.observaciones || "Movimiento registrado",
          m.tipo_movimiento === "INGRESO" || m.tipo_movimiento === "DEVOLUCION" ? m.cantidad : "-",
          m.tipo_movimiento === "EGRESO" ? m.cantidad : "-",
          m.saldo_resultante !== undefined ? m.saldo_resultante : it.stock_actual,
          m.costo_unitario ? `Bs. ${m.costo_unitario.toFixed(2)}` : `Bs. ${(it.costo_unitario_promedio || 0).toFixed(2)}`,
          m.costo_total_movimiento ? `Bs. ${m.costo_total_movimiento.toFixed(2)}` : `Bs. ${((m.saldo_resultante ?? it.stock_actual) * (it.costo_unitario_promedio || 0)).toFixed(2)}`
        ])
      : [
          [
            new Date().toISOString().split("T")[0],
            "CAT-INICIAL",
            "Saldo inicial de catalogación en almacén",
            it.stock_actual,
            "-",
            it.stock_actual,
            `Bs. ${(it.costo_unitario_promedio || 0).toFixed(2)}`,
            `Bs. ${(it.stock_actual * (it.costo_unitario_promedio || 0)).toFixed(2)}`
          ]
        ];

    setPrintableDoc({
      codigoFormulario: "ALM-KRD-001",
      tituloDocumento: "TARJETA KARDEX - CONTROL DE INVENTARIO DE ALMACÉN",
      nroDocumento: it.codigo_item,
      fecha: new Date().toLocaleDateString("es-BO"),
      cabecera: [
        { label: "Código de ítem", valor: it.codigo_item },
        { label: "Descripción", valor: it.descripcion },
        { label: "Unidad de medida", valor: it.unidad_medida },
        { label: "Ubicación / Rack", valor: it.ubicacion_rack || "Almacén Principal" },
        { label: "Categoría", valor: it.categoria || it.tipo_categoria || "General" },
        { label: "Stock mínimo / máximo", valor: `${it.stock_minimo} / ${it.stock_maximo} ${it.unidad_medida}` },
      ],
      columnas: ["Fecha", "Documento", "Detalle / Proveedor u Obra", "Entrada", "Salida", "Saldo", "Costo Unit.", "Costo Total"],
      filas: filasMovimientos,
      firmas: [
        it.responsable_almacen || "Responsable de Almacén",
        it.supervisor_logistica || "Supervisor de Logística",
        "Control Interno"
      ],
      pieNota: "Registro de control visible en anaquel. Formato oficial bajo norma técnica de seguridad minera."
    });
  };

  const handleSeleccionarItemEnFila = (
    idx: number,
    itemOrCode: AlmacenItem | string,
    tipoForm: "ingreso" | "salida" | "solicitud" | "devolucion" | "inventario"
  ) => {
    const item = typeof itemOrCode === "object"
      ? itemOrCode
      : items.find(i => i.codigo_item === itemOrCode);
    if (!item) return;

    if (item.unidad_medida && !unidadesMedida.includes(item.unidad_medida)) {
      setUnidadesMedida(prev => [...prev, item.unidad_medida]);
    }

    if (tipoForm === "ingreso") {
      const copy = [...formIngreso.items];
      copy[idx] = {
        ...copy[idx],
        codigo_item: item.codigo_item,
        descripcion: item.descripcion,
        unidad: item.unidad_medida,
        costo_unitario: item.costo_unitario_promedio || copy[idx].costo_unitario || 0
      };
      setFormIngreso({ ...formIngreso, items: copy });
    } else if (tipoForm === "salida") {
      const copy = [...formSalida.items];
      copy[idx] = {
        ...copy[idx],
        codigo_item: item.codigo_item,
        descripcion: item.descripcion,
        unidad: item.unidad_medida,
      };
      setFormSalida({ ...formSalida, items: copy });
    } else if (tipoForm === "solicitud") {
      const copy = [...formSolicitud.items];
      copy[idx] = {
        ...copy[idx],
        codigo_item: item.codigo_item,
        descripcion: item.descripcion,
        unidad: item.unidad_medida,
      };
      setFormSolicitud({ ...formSolicitud, items: copy });
    } else if (tipoForm === "devolucion") {
      const copy = [...formDevolucion.items];
      copy[idx] = {
        ...copy[idx],
        codigo_item: item.codigo_item,
        descripcion: item.descripcion,
        unidad: item.unidad_medida,
      };
      setFormDevolucion({ ...formDevolucion, items: copy });
    } else if (tipoForm === "inventario") {
      const copy = [...formInventario.items];
      copy[idx] = {
        ...copy[idx],
        codigo_item: item.codigo_item,
        descripcion: item.descripcion,
        unidad: item.unidad_medida,
        stock_sistema: item.stock_actual,
        stock_fisico: item.stock_actual,
        diferencia: 0,
      };
      setFormInventario({ ...formInventario, items: copy });
    }
  };

  const handleUnitSelect = (
    val: string,
    onSuccess: (unit: string) => void
  ) => {
    if (val === "__NUEVA_UNIDAD__") {
      setModalNuevaUnidadOpen(true);
    } else {
      onSuccess(val);
    }
  };

  const handleCrearNuevaUnidad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaUnidadNombre.trim()) return;
    const lista = erpApi.addUnidadMedida(nuevaUnidadNombre.trim());
    setUnidadesMedida(lista);
    setNuevaUnidadNombre("");
    setModalNuevaUnidadOpen(false);
  };

  const handleImprimirSolicitud = (s: SolicitudRequerimientoPayload["solicitud"]) => {
    setPrintableDoc({
      codigoFormulario: "ALM-SRM-002",
      tituloDocumento: "SOLICITUD DE REQUERIMIENTO DE MATERIALES (SRM)",
      nroDocumento: s.nro_solicitud,
      fecha: s.fecha,
      cabecera: [
        { label: "N° Solicitud", valor: s.nro_solicitud },
        { label: "Fecha Emisión", valor: s.fecha },
        { label: "Área / Frente Trabajo", valor: s.area_frente_trabajo },
        { label: "Centro de Costo", valor: s.centro_costo },
        { label: "Solicitado Por", valor: `${s.solicitado_por} (${s.cargo})` },
        { label: "Nivel de Urgencia", valor: s.urgencia },
        { label: "Motivo Requerimiento", valor: s.motivo },
      ],
      columnas: ["N°", "Descripción del Material", "Unidad", "Cant. Solicitada", "Cant. Entregada", "Observaciones"],
      filas: s.items.map((it, idx) => [
        idx + 1,
        it.descripcion,
        it.unidad,
        it.cantidad_solicitada,
        it.cantidad_entregada,
        it.observaciones || "Conforme"
      ]),
      firmas: s.firmas.length ? s.firmas : ["Solicitante", "Jefe de Área", "Jefe de Almacén"],
      pieNota: "Copia blanca: Almacén Central | Copia amarilla: Frente Solicitante | Válido únicamente con firmas autorizadas."
    });
  };

  const handleImprimirIngreso = (ing: NotaIngresoPayload["ingreso"]) => {
    setPrintableDoc({
      codigoFormulario: "ALM-NIA-003",
      tituloDocumento: "NOTA DE INGRESO A ALMACÉN (RECEPCIÓN TÉCNICA)",
      nroDocumento: ing.nro_ingreso,
      fecha: ing.fecha_recepcion,
      cabecera: [
        { label: "N° Nota de Ingreso", valor: ing.nro_ingreso },
        { label: "Fecha de Recepción", valor: ing.fecha_recepcion },
        { label: "Proveedor", valor: ing.proveedor },
        { label: "Factura / Guía N°", valor: ing.nro_guia_factura },
        { label: "Orden de Compra", valor: ing.orden_compra },
        { label: "Transportista / Placa", valor: ing.placa_transportista },
        { label: "Recibido Por", valor: ing.recibido_por },
        { label: "Estado de la Carga", valor: ing.estado_carga },
        { label: "Observaciones", valor: ing.observaciones_no_conformidades || "Sin novedades" },
        ...(ing.comentario ? [{ label: "Comentario Adicional", valor: ing.comentario }] : []),
      ],
      columnas: ["N°", "Descripción de Material", "Unidad", "Cant. Pedida", "Cant. Recibida", "Conformidad"],
      filas: ing.items.map((it, idx) => [
        idx + 1,
        it.descripcion,
        it.unidad,
        it.cantidad_pedida,
        it.cantidad_recibida,
        it.conformidad
      ]),
      firmas: ing.firmas.length ? ing.firmas : ["Recepción Almacén", "Transportista", "Supervisor Logística"],
      pieNota: "Material verificado físicamente contra factura comercial y orden de compra. Aprobado para ingreso al inventario."
    });
  };

  const handleImprimirSalida = (sal: NotaSalidaPayload["salida"]) => {
    setPrintableDoc({
      codigoFormulario: "ALM-NSA-004",
      tituloDocumento: "NOTA DE SALIDA DE ALMACÉN (DESPACHO A OPERACIONES)",
      nroDocumento: sal.nro_salida,
      fecha: sal.fecha,
      cabecera: [
        { label: "N° Nota de Salida", valor: sal.nro_salida },
        { label: "Fecha de Despacho", valor: sal.fecha },
        { label: "Destino en Mina", valor: sal.destino },
        { label: "Centro de Costo", valor: sal.centro_costo },
        { label: "Entregado Por", valor: sal.entregado_por },
        { label: "Recibido Por", valor: sal.recibido_por },
        { label: "Ref. Solicitud N°", valor: sal.referencia_solicitud_nro },
        { label: "Vehículo Traslado", valor: sal.vehiculo_responsable_traslado },
      ],
      columnas: ["N°", "Descripción del Material", "Unidad", "Cantidad Despachada", "Observaciones"],
      filas: sal.items.map((it, idx) => [
        idx + 1,
        it.descripcion,
        it.unidad,
        it.cantidad,
        it.observaciones || "Despacho regular"
      ]),
      firmas: sal.firmas.length ? sal.firmas : ["Despacho Almacén", "Recibe Conforme", "Supervisor Logística"],
      pieNota: "El receptor se hace responsable del traslado y uso conforme a las normas de seguridad del campamento minero."
    });
  };

  const handleImprimirDevolucion = (dev: NotaDevolucionPayload["devolucion"]) => {
    setPrintableDoc({
      codigoFormulario: "ALM-NDM-005",
      tituloDocumento: "NOTA DE DEVOLUCIÓN DE MATERIALES (REINGRESO)",
      nroDocumento: dev.nro_devolucion,
      fecha: dev.fecha,
      cabecera: [
        { label: "N° Devolución", valor: dev.nro_devolucion },
        { label: "Fecha", valor: dev.fecha },
        { label: "Área que Devuelve", valor: dev.area_que_devuelve },
        { label: "Referencia Salida N°", valor: dev.referencia_salida_nro },
        { label: "Motivo Devolución", valor: dev.motivo_devolucion },
        { label: "Condición Material", valor: dev.condicion_material },
      ],
      columnas: ["N°", "Descripción del Material", "Unidad", "Cantidad Devuelta", "Inspección / Observación"],
      filas: dev.items.map((it, idx) => [
        idx + 1,
        it.descripcion,
        it.unidad,
        it.cantidad,
        it.estado_observacion || "Inspeccionado"
      ]),
      firmas: dev.firmas.length ? dev.firmas : ["Entrega Área Usuaria", "Recibe Almacén", "Supervisor Logística"],
      pieNota: "Material revisado por el encargado de almacén. Se certifica reingreso según condición técnica registrada."
    });
  };

  const handleImprimirInventario = (inv: ActaInventarioPayload["inventario_fisico"]) => {
    setPrintableDoc({
      codigoFormulario: "ALM-AIF-006",
      tituloDocumento: "ACTA DE INVENTARIO FÍSICO Y AUDITORÍA DE EXISTENCIAS",
      nroDocumento: `AIF-${inv.fecha_conteo}`,
      fecha: inv.fecha_conteo,
      cabecera: [
        { label: "Fecha de Conteo", valor: inv.fecha_conteo },
        { label: "Tipo de Inventario", valor: inv.tipo },
        { label: "Ubicación Almacén", valor: inv.almacen_ubicacion },
        { label: "Responsable Conteo", valor: inv.responsable_conteo },
        { label: "Conclusiones / Medidas", valor: inv.conclusiones_acciones_correctivas || "Conteo cerrado sin discrepancias críticas" },
      ],
      columnas: ["N°", "Descripción de Material", "Unidad", "Stock Sistema", "Stock Físico", "Diferencia", "Observación"],
      filas: inv.items.map((it, idx) => [
        idx + 1,
        it.descripcion,
        it.unidad,
        it.stock_sistema,
        it.stock_fisico,
        it.diferencia > 0 ? `+${it.diferencia}` : it.diferencia,
        it.observacion || "Sin observación"
      ]),
      firmas: inv.firmas.length ? inv.firmas : ["Responsable Almacén", "Auditor Control Interno", "Gerencia Logística"],
      pieNota: "Acta oficial con valor legal y contable para ajuste directo de existencias en el ERP ProyJimP."
    });
  };

  const triggerPrint = () => {
    window.print();
  };

  // Configuración de Categorías para las Cards
  const categoriasConfig: CategoriaCardInfo[] = [
    {
      id: "TODOS",
      nombre: "Catálogo General",
      descripcion: "Inventario integral y suministros",
      icono: <Layers className="w-5 h-5" />,
      colorIcono: "text-amber-400",
      bgIcono: "bg-amber-500/10 border-amber-500/30",
      borderColor: "hover:border-amber-500/60",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      topGradient: "from-amber-500 via-amber-400 to-amber-600"
    },
    {
      id: "Explosivos",
      nombre: "Explosivos y Voladura",
      descripcion: "Dinamita, guías, fulminantes y ANFO",
      icono: <Hammer className="w-5 h-5" />,
      colorIcono: "text-rose-400",
      bgIcono: "bg-rose-500/10 border-rose-500/30",
      borderColor: "hover:border-rose-500/60",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      topGradient: "from-rose-500 via-rose-400 to-rose-600"
    },
    {
      id: "EPP Minero",
      nombre: "EPP Minero",
      descripcion: "Cascos, respiradores y botas",
      icono: <HardHat className="w-5 h-5" />,
      colorIcono: "text-yellow-400",
      bgIcono: "bg-yellow-500/10 border-yellow-500/30",
      borderColor: "hover:border-yellow-500/60",
      badgeColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
      topGradient: "from-yellow-400 via-amber-400 to-yellow-600"
    },
    {
      id: "Herramienta de Perforación",
      nombre: "Perforación y Barrenos",
      descripcion: "Brocas, barras y adaptadores",
      icono: <Hammer className="w-5 h-5" />,
      colorIcono: "text-sky-400",
      bgIcono: "bg-sky-500/10 border-sky-500/30",
      borderColor: "hover:border-sky-500/60",
      badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/30",
      topGradient: "from-sky-400 via-blue-500 to-sky-600"
    },
    {
      id: "Lubricantes y Químicos",
      nombre: "Lubricantes y Químicos",
      descripcion: "Aceites ISO VG y aditivos",
      icono: <Droplets className="w-5 h-5" />,
      colorIcono: "text-emerald-400",
      bgIcono: "bg-emerald-500/10 border-emerald-500/30",
      borderColor: "hover:border-emerald-500/60",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      topGradient: "from-emerald-400 via-teal-500 to-emerald-600"
    },
    {
      id: "Repuestos Mecánicos",
      nombre: "Repuestos Mecánicos",
      descripcion: "Filtros de maquinaria y mangueras",
      icono: <Cog className="w-5 h-5" />,
      colorIcono: "text-purple-400",
      bgIcono: "bg-purple-500/10 border-purple-500/30",
      borderColor: "hover:border-purple-500/60",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      topGradient: "from-purple-400 via-violet-500 to-purple-600"
    }
  ];

  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.codigo_item.toLowerCase().includes(search.toLowerCase()) ||
      item.descripcion.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      categoriaFiltro === "TODOS" ||
      item.tipo_categoria === categoriaFiltro ||
      item.categoria === categoriaFiltro;
    const matchCritico = !filtroSoloCriticos || item.stock_actual <= item.stock_minimo;
    return matchSearch && matchCat && matchCritico;
  });

  const stockCriticos = items.filter((i) => i.stock_actual <= i.stock_minimo);
  const valorTotalInventarioBs = items.reduce(
    (sum, i) => sum + i.stock_actual * (i.costo_unitario_promedio || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* 1. KPIS GENERALES DEL ALMACÉN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-inner-card hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Materiales</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-100 mt-2 font-mono">{items.length}</p>
          <span className="text-xs text-slate-400 mt-0.5 block">Ítems catalogados en Kardex</span>
        </div>

        <div
          onClick={() => setFiltroSoloCriticos(!filtroSoloCriticos)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-inner-card ${
            filtroSoloCriticos
              ? "bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/40 shadow-rose-500/10"
              : "bg-slate-900/80 border-slate-800 hover:border-rose-500/60"
          }`}
          title="Haga clic para activar/desactivar filtro de ítems en nivel crítico"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">Stock Crítico</span>
              {filtroSoloCriticos && (
                <span className="text-[9px] bg-rose-500 text-slate-950 px-1.5 py-0.2 rounded font-black">FILTRO ACTIVO</span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-400 mt-2 font-mono">{stockCriticos.length}</p>
          <span className="text-xs text-rose-400/80 mt-0.5 block">
            {filtroSoloCriticos ? "✓ Mostrando solo ítems en reposición" : "Clic para ver solo ítems por agotarse"}
          </span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-inner-card hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Valor Total en Bodega</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2 font-mono">
            Bs. {valorTotalInventarioBs.toLocaleString("es-BO", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-400 mt-0.5 block">Existencias valorizadas en Bolivianos</span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-inner-card hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Formularios Procesados</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-blue-400 mt-2 font-mono">
            {solicitudes.length + ingresos.length + salidas.length + devoluciones.length + inventarios.length}
          </p>
          <span className="text-xs text-slate-400 mt-0.5 block">SRM, NIA, NSA, NDM y AIF</span>
        </div>
      </div>

      {/* 2. SUB-MENÚ DE NAVEGACIÓN POR LOS 6 FORMULARIOS FÍSICOS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 flex flex-wrap items-center gap-1.5 no-print shadow-xl">
        <button
          onClick={() => setTabActiva("KARDEX")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tabActiva === "KARDEX"
              ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Package className="w-4 h-4" />
          ALM-KRD-001: Kardex ({items.length})
        </button>

        <button
          onClick={() => setTabActiva("SOLICITUDES")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tabActiva === "SOLICITUDES"
              ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          ALM-SRM-002: Solicitudes ({solicitudes.length})
        </button>

        <button
          onClick={() => setTabActiva("INGRESOS")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tabActiva === "INGRESOS"
              ? "bg-emerald-500 text-slate-950 shadow-md font-extrabold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          ALM-NIA-003: Ingresos ({ingresos.length})
        </button>

        <button
          onClick={() => setTabActiva("SALIDAS")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tabActiva === "SALIDAS"
              ? "bg-rose-500 text-slate-950 shadow-md font-extrabold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          ALM-NSA-004: Salidas ({salidas.length})
        </button>

        <button
          onClick={() => setTabActiva("DEVOLUCIONES")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tabActiva === "DEVOLUCIONES"
              ? "bg-blue-500 text-slate-950 shadow-md font-extrabold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          ALM-NDM-005: Devoluciones ({devoluciones.length})
        </button>

        <button
          onClick={() => setTabActiva("INVENTARIOS")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tabActiva === "INVENTARIOS"
              ? "bg-purple-500 text-slate-950 shadow-md font-extrabold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Scale className="w-4 h-4" />
          ALM-AIF-006: Inventarios ({inventarios.length})
        </button>

        <button
          onClick={() => setTabActiva("MOVIMIENTOS")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tabActiva === "MOVIMIENTOS"
              ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Truck className="w-4 h-4" />
          Kardex Movimientos ({movimientos.length})
        </button>
      </div>

      {/* 3. VISTA: ALM-KRD-001 (TARJETA KARDEX Y CATÁLOGO) */}
      {tabActiva === "KARDEX" && (
        <div className="space-y-6">
          {/* Cards de Categorías */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  Categorías de Inventario y Kardex (Filtro 1-Clic)
                </h3>
              </div>
              {categoriaFiltro !== "TODOS" && (
                <button
                  onClick={() => setCategoriaFiltro("TODOS")}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Ver Catálogo Completo</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
              {categoriasConfig.map((cat) => {
                const isSelected = categoriaFiltro === cat.id;
                const itemsEnCat = cat.id === "TODOS" ? items : items.filter((i) => i.tipo_categoria === cat.id || i.categoria === cat.id);
                const criticosEnCat = itemsEnCat.filter((i) => i.stock_actual <= i.stock_minimo).length;
                const valorizadoCat = itemsEnCat.reduce((sum, i) => sum + i.stock_actual * (i.costo_unitario_promedio || 0), 0);

                return (
                  <div
                    key={cat.id}
                    onClick={() => setCategoriaFiltro(isSelected ? "TODOS" : cat.id)}
                    className={`relative rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between group overflow-hidden ${
                      isSelected
                        ? "bg-slate-900 border-amber-500 ring-2 ring-amber-500/30 shadow-xl shadow-amber-500/15 -translate-y-1"
                        : "bg-slate-900/80 border-slate-800/90 hover:border-slate-700 hover:bg-slate-850 hover:-translate-y-1 hover:shadow-lg shadow-sm"
                    }`}
                  >
                    <div className={`h-1.5 w-full bg-gradient-to-r ${cat.topGradient} ${isSelected ? "opacity-100" : "opacity-40 group-hover:opacity-90"} transition-opacity`} />
                    <div className="p-4 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-inner ${cat.bgIcono} ${cat.colorIcono}`}>
                            {cat.icono}
                          </div>
                          <span className="font-mono font-extrabold text-sm text-slate-100 bg-slate-950/90 px-2.5 py-0.5 rounded-lg border border-slate-800">
                            {itemsEnCat.length}
                          </span>
                        </div>
                        <h4 className={`font-bold text-xs transition-colors line-clamp-1 ${isSelected ? "text-amber-400 font-extrabold" : "text-slate-100 group-hover:text-amber-400"}`}>
                          {cat.nombre}
                        </h4>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{cat.descripcion}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold">Valor Kardex:</span>
                          <span className="font-mono font-bold text-emerald-400 text-xs">
                            Bs. {valorizadoCat.toLocaleString("es-BO", { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        {criticosEnCat > 0 ? (
                          <div className="flex items-center gap-1 text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/25">
                            <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0 animate-pulse" />
                            <span>{criticosEnCat} en reposición</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>Stock óptimo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Barra de Filtros y Botón para Crear ALM-KRD-001 */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por código o descripción..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                onClick={() => setFiltroSoloCriticos(!filtroSoloCriticos)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                  filtroSoloCriticos
                    ? "bg-rose-500 text-slate-950 border-rose-400 font-extrabold shadow-md shadow-rose-500/20"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                }`}
                title="Filtrar únicamente ítems con stock menor o igual al mínimo"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{filtroSoloCriticos ? "Críticos (Activo)" : "Solo Críticos"}</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              <button
                onClick={handleExportarCSV}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-emerald-500/50 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm hover:text-emerald-400"
                title="Descargar archivo .CSV con catálogo, stocks valorizados y categorías para Microsoft Excel"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Exportar Excel (CSV)</span>
              </button>

              <button
                onClick={() => setModalKardexOpen(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/10 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Crear Ítem Kardex (ALM-KRD-001)</span>
              </button>
            </div>
          </div>

          {/* Tabla de Ítems Kardex */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-4">Código</th>
                    <th className="px-5 py-4">Descripción del Material</th>
                    <th className="px-5 py-4">Categoría</th>
                    <th className="px-5 py-4">Ubicación / Rack</th>
                    <th className="px-5 py-4 text-center">Mín / Máx</th>
                    <th className="px-5 py-4 text-right">Stock Actual</th>
                    <th className="px-5 py-4 text-right">Costo Prom. (Bs.)</th>
                    <th className="px-5 py-4 text-right">Valor Total (Bs.)</th>
                    <th className="px-5 py-4 text-center">Estado</th>
                    <th className="px-5 py-4 text-right">Imprimir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredItems.map((it) => (
                    <tr key={it.id_item || it.codigo_item} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-xs text-amber-400">{it.codigo_item}</td>
                      <td className="px-5 py-4 font-semibold text-slate-100 text-xs">{it.descripcion}</td>
                      <td className="px-5 py-4 text-xs text-slate-400">{it.categoria || it.tipo_categoria}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-400">{it.ubicacion_rack}</td>
                      <td className="px-5 py-4 text-xs font-mono text-center text-slate-400">
                        {it.stock_minimo} / {it.stock_maximo}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-extrabold text-sm text-slate-100">
                        {it.stock_actual} <span className="text-[10px] text-slate-400 font-normal">{it.unidad_medida}</span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-xs text-slate-300">
                        Bs. {(it.costo_unitario_promedio || 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-xs text-emerald-400">
                        Bs. {(it.stock_actual * (it.costo_unitario_promedio || 0)).toLocaleString("es-BO", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {it.stock_actual <= it.stock_minimo ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Reponer
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Óptimo
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleImprimirKardex(it)}
                          title="Imprimir Tarjeta Kardex ALM-KRD-001 (B/N)"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-amber-400" />
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

      {/* 4. VISTA: ALM-SRM-002 (SOLICITUDES DE REQUERIMIENTO) */}
      {tabActiva === "SOLICITUDES" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900/70 border border-slate-800 rounded-2xl p-4 gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-amber-400" />
                Formulario ALM-SRM-002: Solicitudes de Requerimiento de Materiales
              </h3>
              <p className="text-xs text-slate-400">Peticiones de socavón y planta con firmas oficiales y centros de costo</p>
            </div>
            <button
              onClick={() => {
                setFormSolicitud({
                  nro_solicitud: `REQ-2026-${String(solicitudes.length + 1).padStart(3, "0")}`,
                  fecha: new Date().toISOString().split("T")[0],
                  area_frente_trabajo: "Mina Nivel 2",
                  centro_costo: "CC-05",
                  solicitado_por: "Carlos Molina",
                  cargo: "Jefe de Frente",
                  urgencia: "Alta",
                  motivo: "Voladura programada turno tarde",
                  items: [
                    { descripcion: "Dinamita en cartuchos", unidad: "Kilo", cantidad_solicitada: 500, cantidad_entregada: 0, observaciones: "" }
                  ],
                  firmas: ["Solicitante", "Jefe de Área", "Jefe de Almacén"]
                });
                setModalSolicitudOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Nueva Solicitud (ALM-SRM-002)
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">N° Solicitud</th>
                  <th className="px-5 py-4">Fecha</th>
                  <th className="px-5 py-4">Área / Frente</th>
                  <th className="px-5 py-4">Centro Costo</th>
                  <th className="px-5 py-4">Solicitado Por</th>
                  <th className="px-5 py-4">Urgencia</th>
                  <th className="px-5 py-4">Materiales</th>
                  <th className="px-5 py-4 text-right">Imprimir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {solicitudes.map((s) => (
                  <tr key={s.nro_solicitud} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-xs text-amber-400">{s.nro_solicitud}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-300">{s.fecha}</td>
                    <td className="px-5 py-4 font-semibold text-xs text-slate-200">{s.area_frente_trabajo}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">{s.centro_costo}</td>
                    <td className="px-5 py-4 text-xs text-slate-300">{s.solicitado_por} ({s.cargo})</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {s.urgencia}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {s.items.map(it => `${it.cantidad_solicitada} ${it.unidad} de ${it.descripcion}`).join(", ")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleImprimirSolicitud(s)}
                        title="Imprimir Formulario ALM-SRM-002 (B/N)"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-amber-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. VISTA: ALM-NIA-003 (NOTAS DE INGRESO A ALMACÉN) */}
      {tabActiva === "INGRESOS" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900/70 border border-slate-800 rounded-2xl p-4 gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                Formulario ALM-NIA-003: Nota de Ingreso a Almacén (Recepción Técnica)
              </h3>
              <p className="text-xs text-emerald-400/90 font-medium">✓ Las notas de ingreso suman automáticamente las cantidades recibidas al stock de Kardex</p>
            </div>
            <button
              onClick={() => {
                setFormIngreso({
                  nro_ingreso: `ING-2026-${String(ingresos.length + 101)}`,
                  fecha_recepcion: new Date().toISOString().split("T")[0],
                  proveedor: "Explosivos del Sur S.A.",
                  nro_guia_factura: "F-001452",
                  orden_compra: "OC-998",
                  placa_transportista: "ABC-123 / Luis Gomez",
                  recibido_por: "Admin Almacén",
                  estado_carga: "Optimo",
                  items: [
                    { descripcion: "Dinamita en cartuchos", unidad: "Kilo", cantidad_pedida: 1000, cantidad_recibida: 1000, conformidad: "Conforme" }
                  ],
                  observaciones_no_conformidades: "Llegó a tiempo",
                  firmas: ["Recepción Almacén", "Transportista", "Supervisor Logística"]
                });
                setModalIngresoOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Nueva Nota de Ingreso (ALM-NIA-003)
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">N° Ingreso</th>
                  <th className="px-5 py-4">Fecha Recepción</th>
                  <th className="px-5 py-4">Proveedor</th>
                  <th className="px-5 py-4">Guía / Factura</th>
                  <th className="px-5 py-4">O.C.</th>
                  <th className="px-5 py-4">Transportista</th>
                  <th className="px-5 py-4">Materiales Recibidos</th>
                  <th className="px-5 py-4 text-center">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {ingresos.map((ing) => {
                  const isAnulado = ing.estado === "ANULADO";
                  return (
                    <tr
                      key={ing.nro_ingreso}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isAnulado ? "opacity-60 bg-rose-950/10" : ""
                      }`}
                    >
                      <td className={`px-5 py-4 font-mono font-bold text-xs ${isAnulado ? "text-slate-400 line-through" : "text-emerald-400"}`}>
                        {ing.nro_ingreso}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-300">{ing.fecha_recepcion}</td>
                      <td className="px-5 py-4 font-semibold text-xs text-slate-200">{ing.proveedor}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-400">{ing.nro_guia_factura}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-400">{ing.orden_compra}</td>
                      <td className="px-5 py-4 text-xs text-slate-300">{ing.placa_transportista}</td>
                      <td className={`px-5 py-4 text-xs ${isAnulado ? "text-slate-400 line-through" : "text-emerald-400 font-bold"}`}>
                        <div>{ing.items.map(it => `+${it.cantidad_recibida} ${it.unidad} (${it.descripcion})`).join(", ")}</div>
                        {ing.comentario && (
                          <div className="text-[10px] text-slate-400 font-normal italic mt-0.5">
                            Nota: {ing.comentario}
                          </div>
                        )}
                        {isAnulado && ing.motivo_anulacion && (
                          <div className="text-[10px] text-rose-400 font-normal mt-1 flex items-center gap-1">
                            <span>Motivo anulación: {ing.motivo_anulacion}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {isAnulado ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            title={`Anulado por ${ing.anulado_por || "Admin"} el ${ing.fecha_anulacion || ""}: ${ing.motivo_anulacion || "Sin motivo"}`}
                          >
                            ANULADO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            CONFORME
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleImprimirIngreso(ing)}
                            title="Imprimir Formulario ALM-NIA-003 (B/N)"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4 text-emerald-400" />
                          </button>
                          {!isAnulado && (
                            <button
                              onClick={() => handleAnularIngreso(ing)}
                              title="Anular Nota de Ingreso y revertir el stock en Kardex"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-500/40 transition-colors cursor-pointer"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
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

      {/* 6. VISTA: ALM-NSA-004 (NOTAS DE SALIDA DE ALMACÉN) */}
      {tabActiva === "SALIDAS" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900/70 border border-slate-800 rounded-2xl p-4 gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
                Formulario ALM-NSA-004: Nota de Salida de Almacén (Despacho a Operaciones)
              </h3>
              <p className="text-xs text-rose-400/90 font-medium">⚠️ Las notas de salida descuentan automáticamente del stock de Kardex verificando existencias</p>
            </div>
            <button
              onClick={() => {
                setFormSalida({
                  nro_salida: `SAL-2026-${String(salidas.length + 51)}`,
                  fecha: new Date().toISOString().split("T")[0],
                  destino: "Planta Trituradora",
                  centro_costo: "CC-02",
                  entregado_por: "Admin Almacén",
                  recibido_por: "Pedro Carvalo",
                  referencia_solicitud_nro: "REQ-2026-001",
                  vehiculo_responsable_traslado: "Camioneta 3",
                  items: [
                    { descripcion: "Dinamita en cartuchos", unidad: "Kilo", cantidad: 500, observaciones: "Entrega parcial" }
                  ],
                  firmas: ["Despacho Almacén", "Recibe Conforme", "Supervisor Logística"]
                });
                setModalSalidaOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Nueva Nota de Salida (ALM-NSA-004)
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">N° Salida</th>
                  <th className="px-5 py-4">Fecha</th>
                  <th className="px-5 py-4">Destino en Mina</th>
                  <th className="px-5 py-4">Centro Costo</th>
                  <th className="px-5 py-4">Recibido Por</th>
                  <th className="px-5 py-4">Ref. Solicitud</th>
                  <th className="px-5 py-4">Materiales Despachados</th>
                  <th className="px-5 py-4 text-center">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {salidas.map((sal) => {
                  const isAnulado = sal.estado === "ANULADO";
                  return (
                    <tr
                      key={sal.nro_salida}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isAnulado ? "opacity-60 bg-rose-950/10" : ""
                      }`}
                    >
                      <td className={`px-5 py-4 font-mono font-bold text-xs ${isAnulado ? "text-slate-400 line-through" : "text-rose-400"}`}>
                        {sal.nro_salida}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-300">{sal.fecha}</td>
                      <td className="px-5 py-4 font-semibold text-xs text-slate-200">{sal.destino}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-400">{sal.centro_costo}</td>
                      <td className="px-5 py-4 text-xs text-slate-300">{sal.recibido_por}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-400">{sal.referencia_solicitud_nro}</td>
                      <td className={`px-5 py-4 text-xs ${isAnulado ? "text-slate-400 line-through" : "text-rose-400 font-bold"}`}>
                        <div>{sal.items.map(it => `-${it.cantidad} ${it.unidad} (${it.descripcion})`).join(", ")}</div>
                        {isAnulado && sal.motivo_anulacion && (
                          <div className="text-[10px] text-rose-400 font-normal mt-1 flex items-center gap-1">
                            <span>Motivo anulación: {sal.motivo_anulacion}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {isAnulado ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            title={`Anulado por ${sal.anulado_por || "Admin"} el ${sal.fecha_anulacion || ""}: ${sal.motivo_anulacion || "Sin motivo"}`}
                          >
                            ANULADO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            DESPACHADO
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleImprimirSalida(sal)}
                            title="Imprimir Formulario ALM-NSA-004 (B/N)"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4 text-rose-400" />
                          </button>
                          {!isAnulado && (
                            <button
                              onClick={() => handleAnularSalida(sal)}
                              title="Anular Nota de Salida y reintegrar el stock en Kardex"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-500/40 transition-colors cursor-pointer"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
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

      {/* 7. VISTA: ALM-NDM-005 (DEVOLUCIÓN DE MATERIALES) */}
      {tabActiva === "DEVOLUCIONES" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900/70 border border-slate-800 rounded-2xl p-4 gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-blue-400" />
                Formulario ALM-NDM-005: Nota de Devolución de Materiales
              </h3>
              <p className="text-xs text-blue-400/90 font-medium">✓ Si la condición es 'Buen estado', se suma de vuelta al stock de existencias</p>
            </div>
            <button
              onClick={() => {
                setFormDevolucion({
                  nro_devolucion: `DEV-2026-${String(devoluciones.length + 6).padStart(3, "0")}`,
                  fecha: new Date().toISOString().split("T")[0],
                  area_que_devuelve: "Mina Nivel 2",
                  referencia_salida_nro: "SAL-2026-050",
                  motivo_devolucion: "Sobrante de voladura",
                  condicion_material: "Buen estado",
                  items: [
                    { descripcion: "Dinamita en cartuchos", unidad: "Kilo", cantidad: 50, estado_observacion: "Intacto, reingresa a polvorin" }
                  ],
                  firmas: ["Entrega Área Usuaria", "Recibe Almacén", "Supervisor Logística"]
                });
                setModalDevolucionOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Nueva Devolución (ALM-NDM-005)
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">N° Devolución</th>
                  <th className="px-5 py-4">Fecha</th>
                  <th className="px-5 py-4">Área que Devuelve</th>
                  <th className="px-5 py-4">Ref. Salida</th>
                  <th className="px-5 py-4">Motivo</th>
                  <th className="px-5 py-4">Condición</th>
                  <th className="px-5 py-4">Material Devuelto</th>
                  <th className="px-5 py-4 text-right">Imprimir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {devoluciones.map((dev) => (
                  <tr key={dev.nro_devolucion} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-xs text-blue-400">{dev.nro_devolucion}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-300">{dev.fecha}</td>
                    <td className="px-5 py-4 font-semibold text-xs text-slate-200">{dev.area_que_devuelve}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">{dev.referencia_salida_nro}</td>
                    <td className="px-5 py-4 text-xs text-slate-300">{dev.motivo_devolucion}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        dev.condicion_material.toLowerCase().includes("buen")
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {dev.condicion_material}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-blue-400 font-bold">
                      {dev.items.map(it => `+${it.cantidad} ${it.unidad} (${it.descripcion})`).join(", ")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleImprimirDevolucion(dev)}
                        title="Imprimir Formulario ALM-NDM-005 (B/N)"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-blue-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. VISTA: ALM-AIF-006 (ACTA DE INVENTARIO FÍSICO) */}
      {tabActiva === "INVENTARIOS" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900/70 border border-slate-800 rounded-2xl p-4 gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <Scale className="w-4 h-4 text-purple-400" />
                Formulario ALM-AIF-006: Acta de Inventario Físico y Auditoría
              </h3>
              <p className="text-xs text-purple-400/90 font-medium">✓ Sincroniza y ajusta el stock del sistema exactamente al stock físico auditado</p>
            </div>
            <button
              onClick={() => {
                setFormInventario({
                  fecha_conteo: new Date().toISOString().split("T")[0],
                  tipo: "General",
                  almacen_ubicacion: "Almacen Principal",
                  responsable_conteo: "Equipo Auditoria",
                  items: items.slice(0, 3).map(it => ({
                    descripcion: it.descripcion,
                    unidad: it.unidad_medida,
                    stock_sistema: it.stock_actual,
                    stock_fisico: it.stock_actual,
                    diferencia: 0,
                    observacion: "Conteo regular"
                  })),
                  conclusiones_acciones_correctivas: "Ajuste directo aplicado para conciliación contable.",
                  firmas: ["Responsable Almacén", "Auditor Control Interno", "Gerencia Logística"]
                });
                setModalInventarioOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Nueva Acta de Inventario (ALM-AIF-006)
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">Fecha Conteo</th>
                  <th className="px-5 py-4">Tipo</th>
                  <th className="px-5 py-4">Ubicación</th>
                  <th className="px-5 py-4">Auditor / Responsable</th>
                  <th className="px-5 py-4">Ítems Auditados</th>
                  <th className="px-5 py-4">Conclusiones / Acciones</th>
                  <th className="px-5 py-4 text-right">Imprimir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {inventarios.map((inv, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-xs text-purple-400">{inv.fecha_conteo}</td>
                    <td className="px-5 py-4 font-semibold text-xs text-slate-200">{inv.tipo}</td>
                    <td className="px-5 py-4 text-xs text-slate-300">{inv.almacen_ubicacion}</td>
                    <td className="px-5 py-4 text-xs text-slate-300">{inv.responsable_conteo}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-200">
                      {inv.items.length} ítems ({inv.items.map(it => `${it.descripcion}: ${it.stock_fisico}`).join("; ")})
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400 italic">{inv.conclusiones_acciones_correctivas}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleImprimirInventario(inv)}
                        title="Imprimir Formulario ALM-AIF-006 (B/N)"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-purple-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9. VISTA: MOVIMIENTOS KARDEX */}
      {tabActiva === "MOVIMIENTOS" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-500" />
              Historial Cronológico de Movimientos Kardex
            </h4>
            <span className="text-xs text-slate-400 font-mono">Total Registros: {movimientos.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">Fecha</th>
                  <th className="px-5 py-4">Tipo</th>
                  <th className="px-5 py-4">Doc. Ref.</th>
                  <th className="px-5 py-4">Material</th>
                  <th className="px-5 py-4">Origen / Destino</th>
                  <th className="px-5 py-4 text-right">Cantidad</th>
                  <th className="px-5 py-4 text-right">Costo Total (Bs.)</th>
                  <th className="px-5 py-4">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {movimientos.map((mov) => (
                  <tr key={mov.id_movimiento} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">{mov.fecha_movimiento}</td>
                    <td className="px-5 py-4">
                      {mov.tipo_movimiento === "INGRESO" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          INGRESO
                        </span>
                      )}
                      {mov.tipo_movimiento === "EGRESO" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          EGRESO
                        </span>
                      )}
                      {mov.tipo_movimiento === "DEVOLUCION" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          DEVOLUCIÓN
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-amber-400">{mov.nro_documento_ref}</td>
                    <td className="px-5 py-4 font-semibold text-xs text-slate-200">
                      [{mov.item_codigo}] {mov.item_descripcion}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">{mov.entidad_origen_destino}</td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-xs text-slate-100">
                      {mov.tipo_movimiento === "INGRESO" && "+"}
                      {mov.tipo_movimiento === "EGRESO" && "-"}
                      {mov.cantidad}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-xs text-emerald-400 font-bold">
                      Bs. {(mov.costo_total_movimiento || 0).toLocaleString("es-BO", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">{mov.empleado_nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE IMPRESIÓN OFICIAL: 100% BLANCO Y NEGRO (BAJO CONSUMO DE TINTA)
         ========================================================================= */}
      {printableDoc && (
        <Modal
          isOpen={!!printableDoc}
          onClose={() => setPrintableDoc(null)}
          title={`Vista de Impresión Oficial: ${printableDoc.codigoFormulario}`}
          subtitle="Formato estándar en blanco y negro sin fondos de tinta para reducción de costos operativos"
          icon={<Printer className="w-5 h-5 text-amber-500" />}
          maxWidth="4xl"
        >
          <div className="space-y-4">
            {/* Barra superior de acciones para pantalla */}
            <div className="flex items-center justify-between no-print bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-300 font-medium">
                📄 Formato limpio B/N listo para impresora láser o matriz de puntos:
              </span>
              <div className="flex gap-2">
                <button
                  onClick={triggerPrint}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4 stroke-[2.2]" />
                  Mandar a Imprimir (B/N)
                </button>
                <button
                  onClick={() => setPrintableDoc(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* HOJA IMPRIMIBLE EN BLANCO Y NEGRO (ESTRICTO) */}
            <div className="printable-document bg-white text-black p-6 border-2 border-black font-sans text-xs leading-relaxed shadow-lg">
              {/* Encabezado Institucional */}
              <div className="border border-black flex justify-between items-stretch mb-4">
                <div className="p-3 border-r border-black w-2/5 flex flex-col justify-center">
                  <h1 className="font-extrabold text-sm tracking-tight uppercase leading-tight">PROYJIMP S.A.</h1>
                  <p className="text-[10px] uppercase font-bold tracking-wider">UNIDAD MINERA BOLIVIA</p>
                  <p className="text-[9px] text-gray-700">DPTO. DE ALMACÉN, POLVORÍN Y LOGÍSTICA</p>
                </div>
                <div className="p-3 border-r border-black flex-1 flex flex-col justify-center text-center">
                  <h2 className="font-extrabold text-xs sm:text-sm uppercase tracking-tight">
                    {printableDoc.tituloDocumento}
                  </h2>
                  <p className="text-[10px] font-semibold mt-1">SISTEMA INTEGRADO DE GESTIÓN MINERA</p>
                </div>
                <div className="p-3 w-1/4 flex flex-col justify-center text-right font-mono text-[10px] space-y-0.5">
                  <p><span className="font-bold">CÓDIGO:</span> {printableDoc.codigoFormulario}</p>
                  <p><span className="font-bold">N° REGISTRO:</span> {printableDoc.nroDocumento}</p>
                  <p><span className="font-bold">FECHA:</span> {printableDoc.fecha}</p>
                  <p><span className="font-bold">VERSIÓN:</span> 01</p>
                </div>
              </div>

              {/* Cabecera / Metadatos de la Operación */}
              {printableDoc.codigoFormulario === "ALM-KRD-001" ? (
                <div className="border border-black mb-4">
                  <table className="w-full border-collapse text-[11px]">
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="p-2.5 font-bold w-1/5 border-r border-black bg-gray-50">Código de ítem:</td>
                        <td className="p-2.5 font-mono font-bold w-[30%] border-r border-black">
                          {printableDoc.cabecera.find(c => c.label.toLowerCase().includes("código"))?.valor || "---"}
                        </td>
                        <td className="p-2.5 font-bold w-1/5 border-r border-black bg-gray-50">Descripción:</td>
                        <td className="p-2.5 font-bold w-[30%]">
                          {printableDoc.cabecera.find(c => c.label.toLowerCase().includes("descripción"))?.valor || "---"}
                        </td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="p-2.5 font-bold border-r border-black bg-gray-50">Unidad de medida:</td>
                        <td className="p-2.5 border-r border-black">
                          {printableDoc.cabecera.find(c => c.label.toLowerCase().includes("unidad"))?.valor || "---"}
                        </td>
                        <td className="p-2.5 font-bold border-r border-black bg-gray-50">Ubicación / Rack:</td>
                        <td className="p-2.5">
                          {printableDoc.cabecera.find(c => c.label.toLowerCase().includes("ubicación"))?.valor || "---"}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold border-r border-black bg-gray-50">Categoría:</td>
                        <td className="p-2.5 border-r border-black">
                          {printableDoc.cabecera.find(c => c.label.toLowerCase().includes("categoría"))?.valor || "---"}
                        </td>
                        <td className="p-2.5 font-bold border-r border-black bg-gray-50">Stock mínimo / máximo:</td>
                        <td className="p-2.5 font-mono">
                          {printableDoc.cabecera.find(c => c.label.toLowerCase().includes("stock mínimo"))?.valor || "---"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-black mb-4">
                  <div className="bg-gray-100 border-b border-black px-3 py-1 font-extrabold text-[10px] uppercase">
                    Datos Generales del Documento
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 p-3 text-[11px]">
                    {printableDoc.cabecera.map((item, idx) => (
                      <div key={idx}>
                        <span className="font-bold uppercase text-[10px] block text-gray-800">{item.label}:</span>
                        <span className="font-medium">{item.valor || "---"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabla de Detalle de Ítems */}
              <div className="border border-black mb-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black text-[10px] uppercase font-extrabold">
                      {printableDoc.columnas.map((col, idx) => (
                        <th key={idx} className="p-2 border-r border-black last:border-r-0">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black text-[11px]">
                    {printableDoc.filas.map((fila, fIdx) => (
                      <tr key={fIdx}>
                        {fila.map((celda, cIdx) => (
                          <td key={cIdx} className="p-2 border-r border-black last:border-r-0">
                            {celda}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sección de Firmas Obligatorias */}
              <div className="border border-black p-3 mb-4">
                <p className="font-bold text-[10px] uppercase mb-8">Validación y Firmas Oficiales de Faena:</p>
                <div className="grid grid-cols-3 gap-6 text-center">
                  {printableDoc.firmas.map((firma, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-4/5 border-t border-black pt-1">
                        <p className="font-bold text-[10px] uppercase">{firma}</p>
                        <p className="text-[9px] text-gray-700">Firma, Aclaración y Sello</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pie de Página de Control */}
              <div className="flex justify-between items-center text-[9px] text-gray-600 border-t border-gray-400 pt-1.5">
                <span>{printableDoc.pieNota || "Documento oficial de control interno de faena minera."}</span>
                <span>Impreso desde ERP ProyJimP • Terminal Autorizada</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL 1: ALM-KRD-001 (CREACIÓN DE ÍTEM KARDEX NUEVO)
         ========================================================================= */}
      <Modal
        isOpen={modalKardexOpen}
        onClose={() => {
          setModalKardexOpen(false);
          setKardexCreationTarget(null);
        }}
        title="Crear Ítem en Kardex (ALM-KRD-001)"
        subtitle="Catalogación formal de material para control físico y valorizado"
        icon={<Package className="w-5 h-5 text-amber-500" />}
        maxWidth="4xl"
        zIndex="z-[70]"
      >
        <form onSubmit={handleGuardarKardex} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Código de Ítem <span className="text-amber-400">*</span></label>
              <input
                required
                type="text"
                value={formKardex.codigo_item}
                onChange={(e) => setFormKardex({ ...formKardex, codigo_item: e.target.value.toUpperCase() })}
                placeholder="Ej: DIN-001, BRO-105"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Categoría <span className="text-amber-400">*</span></label>
              <select
                value={formKardex.categoria}
                onChange={(e) => setFormKardex({ ...formKardex, categoria: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Explosivos">Explosivos y Voladura</option>
                <option value="EPP Minero">EPP Minero</option>
                <option value="Herramienta de Perforación">Perforación y Barrenos</option>
                <option value="Lubricantes y Químicos">Lubricantes y Químicos</option>
                <option value="Repuestos Mecánicos">Repuestos Mecánicos</option>
                <option value="Material de Oficina">Oficina y Logística</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">Descripción del Material <span className="text-amber-400">*</span></label>
              <input
                required
                type="text"
                value={formKardex.descripcion}
                onChange={(e) => setFormKardex({ ...formKardex, descripcion: e.target.value })}
                placeholder="Ej: Dinamita en cartuchos 7/8 x 8 pulg"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-semibold text-slate-300">Unidad de Medida <span className="text-amber-400">*</span></label>
                <button
                  type="button"
                  onClick={() => setModalNuevaUnidadOpen(true)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                >
                  + Nueva unidad
                </button>
              </div>
              <select
                value={formKardex.unidad_medida}
                onChange={(e) => {
                  const val = e.target.value;
                  handleUnitSelect(val, (u) => setFormKardex({ ...formKardex, unidad_medida: u }));
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {unidadesMedida.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
                <option value="__NUEVA_UNIDAD__">+ Crear nueva unidad de medida...</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Ubicación en Bodega / Polvorín</label>
              <input
                type="text"
                value={formKardex.ubicacion_rack}
                onChange={(e) => setFormKardex({ ...formKardex, ubicacion_rack: e.target.value })}
                placeholder="Polvorin A, RACK-A1"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Stock Mínimo (Alerta)</label>
              <input
                type="number"
                value={formKardex.stock_minimo}
                onChange={(e) => setFormKardex({ ...formKardex, stock_minimo: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Stock Máximo</label>
              <input
                type="number"
                value={formKardex.stock_maximo}
                onChange={(e) => setFormKardex({ ...formKardex, stock_maximo: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Responsable de Almacén</label>
              <input
                type="text"
                value={formKardex.responsable_almacen}
                onChange={(e) => setFormKardex({ ...formKardex, responsable_almacen: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Supervisor de Logística</label>
              <input
                type="text"
                value={formKardex.supervisor_logistica}
                onChange={(e) => setFormKardex({ ...formKardex, supervisor_logistica: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setModalKardexOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-lg"
            >
              Registrar en Kardex (ALM-KRD-001)
            </button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL 2: ALM-SRM-002 (SOLICITUD DE REQUERIMIENTO)
         ========================================================================= */}
      <Modal
        isOpen={modalSolicitudOpen}
        onClose={() => setModalSolicitudOpen(false)}
        title="Registrar Solicitud de Requerimiento (ALM-SRM-002)"
        subtitle="Formulario oficial de pedido de insumos y materiales para frentes de trabajo"
        icon={<ClipboardList className="w-5 h-5 text-amber-500" />}
        maxWidth="7xl"
      >
        <form onSubmit={handleGuardarSolicitud} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">N° Solicitud</label>
              <input
                type="text"
                value={formSolicitud.nro_solicitud}
                onChange={(e) => setFormSolicitud({ ...formSolicitud, nro_solicitud: e.target.value })}
                placeholder="REQ-2026-001"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Fecha</label>
              <input
                type="date"
                value={formSolicitud.fecha}
                onChange={(e) => setFormSolicitud({ ...formSolicitud, fecha: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Urgencia</label>
              <select
                value={formSolicitud.urgencia}
                onChange={(e) => setFormSolicitud({ ...formSolicitud, urgencia: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Área / Frente de Trabajo</label>
              <input
                type="text"
                value={formSolicitud.area_frente_trabajo}
                onChange={(e) => setFormSolicitud({ ...formSolicitud, area_frente_trabajo: e.target.value })}
                placeholder="Mina Nivel 2"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Centro de Costo</label>
              <input
                type="text"
                value={formSolicitud.centro_costo}
                onChange={(e) => setFormSolicitud({ ...formSolicitud, centro_costo: e.target.value })}
                placeholder="CC-05"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Solicitado Por</label>
              <input
                type="text"
                list="lista-empleados-rrhh"
                value={formSolicitud.solicitado_por}
                onChange={(e) => setFormSolicitud({ ...formSolicitud, solicitado_por: e.target.value })}
                placeholder="Carlos Molina"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block font-semibold text-slate-300 mb-1">Motivo del Requerimiento</label>
              <input
                type="text"
                value={formSolicitud.motivo}
                onChange={(e) => setFormSolicitud({ ...formSolicitud, motivo: e.target.value })}
                placeholder="Voladura programada turno tarde"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
              />
            </div>
          </div>

          {/* Filas Dinámicas de Ítems */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/70 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Ítems Requeridos</h4>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormSolicitud({
                    ...formSolicitud,
                    items: [...formSolicitud.items, { descripcion: "", unidad: "Kilo", cantidad_solicitada: 10, cantidad_entregada: 0, observaciones: "" }]
                  })
                }
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Fila
              </button>
            </div>

            {/* Cabecera de Columnas */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-900/90 rounded-lg text-[11px] font-bold text-slate-400 uppercase tracking-wider border border-slate-800/60">
              <div className="flex-1 min-w-[260px]">Material / Código o Descripción (Kardex)</div>
              <div className="w-32 text-center">Unidad Kardex</div>
              <div className="w-32 text-center">Cant. Solicitada</div>
              <div className="flex-1 min-w-[180px]">Observaciones del Ítem</div>
              <div className="w-10 text-center">Acción</div>
            </div>

            <div className="space-y-2.5">
              {formSolicitud.items.map((row, idx) => {
                const matchedItem = items.find(
                  (i) =>
                    (row.codigo_item && i.codigo_item.toLowerCase() === row.codigo_item.toLowerCase()) ||
                    (row.descripcion && i.descripcion.toLowerCase() === row.descripcion.toLowerCase())
                );

                return (
                  <div key={idx} className="flex flex-col gap-2 p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 hover:border-slate-700/80 transition-colors">
                    <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                      {/* Buscador inteligente */}
                      <ItemCombobox
                        selectedCode={row.codigo_item}
                        items={items}
                        onSelect={(item) => handleSeleccionarItemEnFila(idx, item, "solicitud")}
                        onClear={() => {
                          const copy = [...formSolicitud.items];
                          copy[idx] = { ...copy[idx], codigo_item: "", descripcion: "" };
                          setFormSolicitud({ ...formSolicitud, items: copy });
                        }}
                        onCreateNew={(typedQuery) => handleAbrirCreacionKardex(typedQuery, "solicitud", idx)}
                        placeholder="Buscar por código (ej. DIN-001) o descripción..."
                      />

                      {/* Unidad Oficial Kardex */}
                      {matchedItem ? (
                        <div
                          className="w-32 px-2.5 py-1.5 bg-slate-950/90 border border-amber-500/50 rounded-lg text-xs font-mono font-bold text-amber-300 flex items-center justify-between shrink-0 shadow-sm"
                          title={`Unidad oficial registrada en Kardex para [${matchedItem.codigo_item}]: ${matchedItem.unidad_medida}`}
                        >
                          <span className="truncate">{matchedItem.unidad_medida}</span>
                          <span className="text-[10px] text-amber-500/70 ml-1">🔒</span>
                        </div>
                      ) : (
                        <select
                          value={row.unidad}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUnitSelect(val, (u) => {
                              const copy = [...formSolicitud.items];
                              copy[idx].unidad = u;
                              setFormSolicitud({ ...formSolicitud, items: copy });
                            });
                          }}
                          className="w-32 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 shrink-0 focus:border-amber-500"
                        >
                          {unidadesMedida.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                          <option value="__NUEVA_UNIDAD__">+ Otra unidad...</option>
                        </select>
                      )}

                      {/* Cantidad Solicitada */}
                      <div className="w-32 shrink-0">
                        <input
                          type="number"
                          placeholder="Solicitada"
                          value={row.cantidad_solicitada}
                          onChange={(e) => {
                            const copy = [...formSolicitud.items];
                            copy[idx].cantidad_solicitada = parseFloat(e.target.value) || 0;
                            setFormSolicitud({ ...formSolicitud, items: copy });
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-amber-400 font-bold text-right focus:border-amber-500"
                        />
                      </div>

                      {/* Observaciones */}
                      <div className="flex-1 min-w-[180px]">
                        <input
                          type="text"
                          placeholder="Observación o destino de uso..."
                          value={row.observaciones || ""}
                          onChange={(e) => {
                            const copy = [...formSolicitud.items];
                            copy[idx].observaciones = e.target.value;
                            setFormSolicitud({ ...formSolicitud, items: copy });
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-amber-500"
                        />
                      </div>

                      {/* Botón Eliminar */}
                      <div className="w-10 text-center shrink-0">
                        {formSolicitud.items.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              const copy = formSolicitud.items.filter((_, i) => i !== idx);
                              setFormSolicitud({ ...formSolicitud, items: copy });
                            }}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </div>
                    </div>

                    {matchedItem && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 pl-1 pt-1 border-t border-slate-800/50">
                        <span className="text-amber-400 font-bold">✓ Material [{matchedItem.codigo_item}]</span>
                        <span>• Stock actual en polvorín: <strong className="text-slate-200 font-mono">{matchedItem.stock_actual} {matchedItem.unidad_medida}</strong></span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setModalSolicitudOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-lg"
            >
              Guardar Solicitud (ALM-SRM-002)
            </button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL 3: ALM-NIA-003 (NOTA DE INGRESO A ALMACÉN)
         ========================================================================= */}
      <Modal
        isOpen={modalIngresoOpen}
        onClose={() => setModalIngresoOpen(false)}
        title="Registrar Nota de Ingreso a Almacén (ALM-NIA-003)"
        subtitle="Recepción formal de proveedores • Suma automáticamente al stock actual del Kardex"
        icon={<ArrowDownRight className="w-5 h-5 text-emerald-400" />}
        maxWidth="7xl"
      >
        <form onSubmit={handleGuardarIngreso} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">N° Nota de Ingreso</label>
              <input
                type="text"
                value={formIngreso.nro_ingreso}
                onChange={(e) => setFormIngreso({ ...formIngreso, nro_ingreso: e.target.value })}
                placeholder="ING-2026-100"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Fecha Recepción</label>
              <input
                type="date"
                value={formIngreso.fecha_recepcion}
                onChange={(e) => setFormIngreso({ ...formIngreso, fecha_recepcion: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Proveedor</label>
              <input
                type="text"
                value={formIngreso.proveedor}
                onChange={(e) => setFormIngreso({ ...formIngreso, proveedor: e.target.value })}
                placeholder="Explosivos del Sur S.A."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Guía / Factura N°</label>
              <input
                type="text"
                value={formIngreso.nro_guia_factura}
                onChange={(e) => setFormIngreso({ ...formIngreso, nro_guia_factura: e.target.value })}
                placeholder="F-001452"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Orden de Compra</label>
              <input
                type="text"
                value={formIngreso.orden_compra}
                onChange={(e) => setFormIngreso({ ...formIngreso, orden_compra: e.target.value })}
                placeholder="OC-998"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Placa / Transportista</label>
              <input
                type="text"
                value={formIngreso.placa_transportista}
                onChange={(e) => setFormIngreso({ ...formIngreso, placa_transportista: e.target.value })}
                placeholder="ABC-123 / Luis Gomez"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Recibido Por (Almacén)</label>
              <input
                type="text"
                list="lista-empleados-rrhh"
                value={formIngreso.recibido_por}
                onChange={(e) => setFormIngreso({ ...formIngreso, recibido_por: e.target.value })}
                placeholder="Admin Almacén"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Estado de Carga</label>
              <select
                value={formIngreso.estado_carga}
                onChange={(e) => setFormIngreso({ ...formIngreso, estado_carga: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
              >
                <option value="Optimo">Óptimo</option>
                <option value="Regular">Regular</option>
                <option value="Con Observaciones">Con Observaciones</option>
                <option value="Dañado">Dañado</option>
              </select>
            </div>
          </div>

          {/* Filas Dinámicas de Recepción - Estructura amplia y sin scroll horizontal */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/70 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Ítems a Recepcionar (Suman al Stock del Kardex)
                </h4>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormIngreso({
                    ...formIngreso,
                    items: [
                      ...formIngreso.items,
                      { descripcion: "", unidad: "Kilo", cantidad_pedida: 100, cantidad_recibida: 100, conformidad: "Conforme", costo_unitario: 0 }
                    ]
                  })
                }
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Fila
              </button>
            </div>

            {/* Cabecera de Columnas para Visibilidad Total */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-900/90 rounded-lg text-[11px] font-bold text-slate-400 uppercase tracking-wider border border-slate-800/60">
              <div className="flex-1 min-w-[260px]">Material / Código o Descripción (Kardex)</div>
              <div className="w-32 text-center">Unidad Kardex</div>
              <div className="w-28 text-center">Cant. Pedida</div>
              <div className="w-28 text-center">Cant. Recibida</div>
              <div className="w-32 text-center">Costo Unit. (Bs.)</div>
              <div className="w-32 text-center">Conformidad</div>
              <div className="w-10 text-center">Acción</div>
            </div>

            <div className="space-y-2.5">
              {formIngreso.items.map((row, idx) => {
                const matchedItem = items.find(
                  (i) =>
                    (row.codigo_item && i.codigo_item.toLowerCase() === row.codigo_item.toLowerCase()) ||
                    (row.descripcion && i.descripcion.toLowerCase() === row.descripcion.toLowerCase())
                );

                return (
                  <div key={idx} className="flex flex-col gap-2 p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 hover:border-slate-700/80 transition-colors">
                    <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                      {/* Buscador inteligente */}
                      <ItemCombobox
                        selectedCode={row.codigo_item}
                        items={items}
                        onSelect={(item) => handleSeleccionarItemEnFila(idx, item, "ingreso")}
                        onClear={() => {
                          const copy = [...formIngreso.items];
                          copy[idx] = { ...copy[idx], codigo_item: "", descripcion: "" };
                          setFormIngreso({ ...formIngreso, items: copy });
                        }}
                        onCreateNew={(typedQuery) => handleAbrirCreacionKardex(typedQuery, "ingreso", idx)}
                        placeholder="Buscar por código (ej. DIN-001) o descripción..."
                      />

                      {/* Unidad Oficial Kardex */}
                      {matchedItem ? (
                        <div
                          className="w-32 px-2.5 py-1.5 bg-slate-950/90 border border-amber-500/50 rounded-lg text-xs font-mono font-bold text-amber-300 flex items-center justify-between shrink-0 shadow-sm"
                          title={`Unidad oficial registrada en Kardex para [${matchedItem.codigo_item}]: ${matchedItem.unidad_medida}`}
                        >
                          <span className="truncate">{matchedItem.unidad_medida}</span>
                          <span className="text-[10px] text-amber-500/70 ml-1">🔒</span>
                        </div>
                      ) : (
                        <select
                          value={row.unidad}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUnitSelect(val, (u) => {
                              const copy = [...formIngreso.items];
                              copy[idx].unidad = u;
                              setFormIngreso({ ...formIngreso, items: copy });
                            });
                          }}
                          className="w-32 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 shrink-0 focus:border-amber-500"
                        >
                          {unidadesMedida.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                          <option value="__NUEVA_UNIDAD__">+ Otra unidad...</option>
                        </select>
                      )}

                      {/* Cantidad Pedida */}
                      <div className="w-28 shrink-0">
                        <input
                          type="number"
                          placeholder="Pedida"
                          value={row.cantidad_pedida}
                          onChange={(e) => {
                            const copy = [...formIngreso.items];
                            copy[idx].cantidad_pedida = parseFloat(e.target.value) || 0;
                            setFormIngreso({ ...formIngreso, items: copy });
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 text-right focus:border-amber-500"
                        />
                      </div>

                      {/* Cantidad Recibida */}
                      <div className="w-28 shrink-0">
                        <input
                          type="number"
                          placeholder="Recibida"
                          value={row.cantidad_recibida}
                          onChange={(e) => {
                            const copy = [...formIngreso.items];
                            copy[idx].cantidad_recibida = parseFloat(e.target.value) || 0;
                            setFormIngreso({ ...formIngreso, items: copy });
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-emerald-500/50 rounded-lg text-xs font-mono text-emerald-400 font-bold text-right focus:border-emerald-400"
                        />
                      </div>

                      {/* Costo Unitario */}
                      <div className="w-32 shrink-0 flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 focus-within:border-amber-500">
                        <span className="text-[10px] text-amber-400 font-mono font-bold">Bs.</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={row.costo_unitario ?? (matchedItem ? matchedItem.costo_unitario_promedio : 0)}
                          onChange={(e) => {
                            const copy = [...formIngreso.items];
                            copy[idx].costo_unitario = parseFloat(e.target.value) || 0;
                            setFormIngreso({ ...formIngreso, items: copy });
                          }}
                          className="w-full bg-transparent text-xs font-mono text-slate-200 text-right focus:outline-none"
                        />
                      </div>

                      {/* Conformidad */}
                      <div className="w-32 shrink-0">
                        <select
                          value={row.conformidad}
                          onChange={(e) => {
                            const copy = [...formIngreso.items];
                            copy[idx].conformidad = e.target.value;
                            setFormIngreso({ ...formIngreso, items: copy });
                          }}
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-amber-500"
                        >
                          <option value="Conforme">Conforme</option>
                          <option value="Observado">Observado</option>
                          <option value="Rechazado">Rechazado</option>
                        </select>
                      </div>

                      {/* Botón Eliminar */}
                      <div className="w-10 text-center shrink-0">
                        {formIngreso.items.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              const copy = formIngreso.items.filter((_, i) => i !== idx);
                              setFormIngreso({ ...formIngreso, items: copy });
                            }}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </div>
                    </div>

                    {matchedItem && (
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pl-1 pt-1 border-t border-slate-800/50">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Vinculado a [{matchedItem.codigo_item}] {matchedItem.descripcion}
                        </span>
                        <span>• Existencias actuales: <strong className="text-slate-200 font-mono">{matchedItem.stock_actual} {matchedItem.unidad_medida}</strong></span>
                        <span>• Nuevo stock tras este ingreso: <strong className="text-emerald-400 font-mono font-bold">{(matchedItem.stock_actual + row.cantidad_recibida)} {matchedItem.unidad_medida}</strong></span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Observaciones y Comentario Adicional Opcional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Observaciones / No Conformidades
              </label>
              <input
                type="text"
                value={formIngreso.observaciones_no_conformidades || ""}
                onChange={(e) => setFormIngreso({ ...formIngreso, observaciones_no_conformidades: e.target.value })}
                placeholder="Ej. Llegó a tiempo, empaque precintado..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Comentario Adicional</span>
                <span className="text-[10px] text-slate-400 font-normal">(Opcional, puede ir vacío)</span>
              </label>
              <input
                type="text"
                value={formIngreso.comentario || ""}
                onChange={(e) => setFormIngreso({ ...formIngreso, comentario: e.target.value })}
                placeholder="Notas internas, número de precinto adicional u observaciones generales..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setModalIngresoOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-lg"
            >
              Procesar Ingreso y Sumar Stock (ALM-NIA-003)
            </button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL 4: ALM-NSA-004 (NOTA DE SALIDA DE ALMACÉN)
         ========================================================================= */}
      <Modal
        isOpen={modalSalidaOpen}
        onClose={() => setModalSalidaOpen(false)}
        title="Registrar Nota de Salida de Almacén (ALM-NSA-004)"
        subtitle="Despacho hacia socavón y plantas • Descuenta automáticamente del stock actual del Kardex"
        icon={<ArrowUpRight className="w-5 h-5 text-rose-400" />}
        maxWidth="7xl"
      >
        <form onSubmit={handleGuardarSalida} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">N° Nota de Salida</label>
              <input
                type="text"
                value={formSalida.nro_salida}
                onChange={(e) => setFormSalida({ ...formSalida, nro_salida: e.target.value })}
                placeholder="SAL-2026-050"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Fecha</label>
              <input
                type="date"
                value={formSalida.fecha}
                onChange={(e) => setFormSalida({ ...formSalida, fecha: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Destino en Mina</label>
              <input
                type="text"
                value={formSalida.destino}
                onChange={(e) => setFormSalida({ ...formSalida, destino: e.target.value })}
                placeholder="Planta Trituradora, Socavón"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Centro de Costo</label>
              <input
                type="text"
                value={formSalida.centro_costo}
                onChange={(e) => setFormSalida({ ...formSalida, centro_costo: e.target.value })}
                placeholder="CC-02"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Recibido Por</label>
              <input
                type="text"
                list="lista-empleados-rrhh"
                value={formSalida.recibido_por}
                onChange={(e) => setFormSalida({ ...formSalida, recibido_por: e.target.value })}
                placeholder="Pedro Carvalo"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Ref. Solicitud N°</label>
              <input
                type="text"
                value={formSalida.referencia_solicitud_nro}
                onChange={(e) => setFormSalida({ ...formSalida, referencia_solicitud_nro: e.target.value })}
                placeholder="REQ-2026-001"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono"
              />
            </div>
          </div>

          {/* Filas Dinámicas de Salida */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/70 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  Ítems a Despachar (Descuentan del Stock del Kardex)
                </h4>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormSalida({
                    ...formSalida,
                    items: [...formSalida.items, { descripcion: "", unidad: "Kilo", cantidad: 50, observaciones: "" }]
                  })
                }
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Fila
              </button>
            </div>

            {/* Cabecera de Columnas */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-900/90 rounded-lg text-[11px] font-bold text-slate-400 uppercase tracking-wider border border-slate-800/60">
              <div className="flex-1 min-w-[260px]">Material / Código o Descripción (Kardex)</div>
              <div className="w-32 text-center">Unidad Kardex</div>
              <div className="w-32 text-center">Stock Disp.</div>
              <div className="w-32 text-center">Cant. Despachar</div>
              <div className="flex-1 min-w-[180px]">Observaciones del Despacho</div>
              <div className="w-10 text-center">Acción</div>
            </div>

            <div className="space-y-2.5">
              {formSalida.items.map((row, idx) => {
                const matchedItem = items.find(
                  (i) =>
                    (row.codigo_item && i.codigo_item.toLowerCase() === row.codigo_item.toLowerCase()) ||
                    (row.descripcion && i.descripcion.toLowerCase() === row.descripcion.toLowerCase())
                );
                const sobregiro = matchedItem && row.cantidad > matchedItem.stock_actual;

                return (
                  <div key={idx} className="flex flex-col gap-2 p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 hover:border-slate-700/80 transition-colors">
                    <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                      {/* Buscador inteligente */}
                      <ItemCombobox
                        selectedCode={row.codigo_item}
                        items={items}
                        onSelect={(item) => handleSeleccionarItemEnFila(idx, item, "salida")}
                        onClear={() => {
                          const copy = [...formSalida.items];
                          copy[idx] = { ...copy[idx], codigo_item: "", descripcion: "" };
                          setFormSalida({ ...formSalida, items: copy });
                        }}
                        onCreateNew={(typedQuery) => handleAbrirCreacionKardex(typedQuery, "salida", idx)}
                        placeholder="Buscar por código (ej. DIN-001) o descripción..."
                      />

                      {/* Unidad Oficial Kardex */}
                      {matchedItem ? (
                        <div
                          className="w-32 px-2.5 py-1.5 bg-slate-950/90 border border-amber-500/50 rounded-lg text-xs font-mono font-bold text-amber-300 flex items-center justify-between shrink-0 shadow-sm"
                          title={`Unidad oficial registrada en Kardex para [${matchedItem.codigo_item}]: ${matchedItem.unidad_medida}`}
                        >
                          <span className="truncate">{matchedItem.unidad_medida}</span>
                          <span className="text-[10px] text-amber-500/70 ml-1">🔒</span>
                        </div>
                      ) : (
                        <select
                          value={row.unidad}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUnitSelect(val, (u) => {
                              const copy = [...formSalida.items];
                              copy[idx].unidad = u;
                              setFormSalida({ ...formSalida, items: copy });
                            });
                          }}
                          className="w-32 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 shrink-0 focus:border-amber-500"
                        >
                          {unidadesMedida.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                          <option value="__NUEVA_UNIDAD__">+ Otra unidad...</option>
                        </select>
                      )}

                      {/* Stock Disponible */}
                      <div className="w-32 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-center text-slate-300 shrink-0">
                        {matchedItem ? `${matchedItem.stock_actual} ${matchedItem.unidad_medida}` : "N/A"}
                      </div>

                      {/* Cantidad a Despachar */}
                      <div className="w-32 shrink-0">
                        <input
                          type="number"
                          placeholder="Cantidad"
                          value={row.cantidad}
                          onChange={(e) => {
                            const copy = [...formSalida.items];
                            copy[idx].cantidad = parseFloat(e.target.value) || 0;
                            setFormSalida({ ...formSalida, items: copy });
                          }}
                          className={`w-full px-2.5 py-1.5 bg-slate-950 border ${
                            sobregiro ? "border-rose-500 text-rose-400 ring-1 ring-rose-500" : "border-slate-700 text-rose-400"
                          } rounded-lg text-xs font-mono font-bold text-right focus:border-rose-400`}
                        />
                      </div>

                      {/* Observaciones */}
                      <div className="flex-1 min-w-[180px]">
                        <input
                          type="text"
                          placeholder="Detalle de entrega o frente..."
                          value={row.observaciones || ""}
                          onChange={(e) => {
                            const copy = [...formSalida.items];
                            copy[idx].observaciones = e.target.value;
                            setFormSalida({ ...formSalida, items: copy });
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-amber-500"
                        />
                      </div>

                      {/* Botón Eliminar */}
                      <div className="w-10 text-center shrink-0">
                        {formSalida.items.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              const copy = formSalida.items.filter((_, i) => i !== idx);
                              setFormSalida({ ...formSalida, items: copy });
                            }}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </div>
                    </div>

                    {matchedItem && (
                      <div className="flex flex-wrap items-center gap-3 text-[11px] pl-1 pt-1 border-t border-slate-800/50">
                        <span className="text-amber-400 font-bold">✓ Material [{matchedItem.codigo_item}] {matchedItem.descripcion}</span>
                        <span>• Stock actual: <strong className="text-slate-200 font-mono">{matchedItem.stock_actual} {matchedItem.unidad_medida}</strong></span>
                        {sobregiro ? (
                          <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                            ⚠️ ALERTA: Despacho de {row.cantidad} supera el stock disponible ({matchedItem.stock_actual})
                          </span>
                        ) : (
                          <span>• Saldo restante estimado: <strong className="text-emerald-400 font-mono">{(matchedItem.stock_actual - row.cantidad)} {matchedItem.unidad_medida}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setModalSalidaOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-lg"
            >
              Procesar Despacho y Restar Stock (ALM-NSA-004)
            </button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL 5: ALM-NDM-005 (DEVOLUCIÓN DE MATERIALES)
         ========================================================================= */}
      <Modal
        isOpen={modalDevolucionOpen}
        onClose={() => setModalDevolucionOpen(false)}
        title="Registrar Nota de Devolución de Materiales (ALM-NDM-005)"
        subtitle="Reingreso a almacén de sobrantes • Suma a Kardex si la condición es 'Buen estado'"
        icon={<RotateCcw className="w-5 h-5 text-blue-400" />}
        maxWidth="7xl"
      >
        <form onSubmit={handleGuardarDevolucion} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">N° Devolución</label>
              <input
                type="text"
                value={formDevolucion.nro_devolucion}
                onChange={(e) => setFormDevolucion({ ...formDevolucion, nro_devolucion: e.target.value })}
                placeholder="DEV-2026-005"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Fecha</label>
              <input
                type="date"
                value={formDevolucion.fecha}
                onChange={(e) => setFormDevolucion({ ...formDevolucion, fecha: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Área que Devuelve</label>
              <input
                type="text"
                value={formDevolucion.area_que_devuelve}
                onChange={(e) => setFormDevolucion({ ...formDevolucion, area_que_devuelve: e.target.value })}
                placeholder="Mina Nivel 2"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Ref. Salida N°</label>
              <input
                type="text"
                value={formDevolucion.referencia_salida_nro}
                onChange={(e) => setFormDevolucion({ ...formDevolucion, referencia_salida_nro: e.target.value })}
                placeholder="SAL-2026-050"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Condición del Material</label>
              <select
                value={formDevolucion.condicion_material}
                onChange={(e) => setFormDevolucion({ ...formDevolucion, condicion_material: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
              >
                <option value="Buen estado">Buen estado (Reingresa a Stock)</option>
                <option value="Dañado / Para Reparación">Dañado / Para Reparación</option>
                <option value="Baja / Descarte">Baja / Descarte</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Motivo Devolución</label>
              <input
                type="text"
                value={formDevolucion.motivo_devolucion}
                onChange={(e) => setFormDevolucion({ ...formDevolucion, motivo_devolucion: e.target.value })}
                placeholder="Sobrante de voladura"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
              />
            </div>
          </div>

          {/* Filas Dinámicas de Devolución */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/70 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Ítems Devueltos</h4>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormDevolucion({
                    ...formDevolucion,
                    items: [...formDevolucion.items, { descripcion: "", unidad: "Kilo", cantidad: 10, estado_observacion: "" }]
                  })
                }
                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Fila
              </button>
            </div>

            {/* Cabecera de Columnas */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-900/90 rounded-lg text-[11px] font-bold text-slate-400 uppercase tracking-wider border border-slate-800/60">
              <div className="flex-1 min-w-[260px]">Material / Código o Descripción (Kardex)</div>
              <div className="w-32 text-center">Unidad Kardex</div>
              <div className="w-32 text-center">Cant. Devolver</div>
              <div className="flex-1 min-w-[180px]">Observación de Estado / Detalle</div>
              <div className="w-10 text-center">Acción</div>
            </div>

            <div className="space-y-2.5">
              {formDevolucion.items.map((row, idx) => {
                const matchedItem = items.find(
                  (i) =>
                    (row.codigo_item && i.codigo_item.toLowerCase() === row.codigo_item.toLowerCase()) ||
                    (row.descripcion && i.descripcion.toLowerCase() === row.descripcion.toLowerCase())
                );

                return (
                  <div key={idx} className="flex flex-col gap-2 p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 hover:border-slate-700/80 transition-colors">
                    <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                      {/* Buscador inteligente */}
                      <ItemCombobox
                        selectedCode={row.codigo_item}
                        items={items}
                        onSelect={(item) => handleSeleccionarItemEnFila(idx, item, "devolucion")}
                        onClear={() => {
                          const copy = [...formDevolucion.items];
                          copy[idx] = { ...copy[idx], codigo_item: "", descripcion: "" };
                          setFormDevolucion({ ...formDevolucion, items: copy });
                        }}
                        onCreateNew={(typedQuery) => handleAbrirCreacionKardex(typedQuery, "devolucion", idx)}
                        placeholder="Buscar por código (ej. DIN-001) o descripción..."
                      />

                      {/* Unidad Oficial Kardex */}
                      {matchedItem ? (
                        <div
                          className="w-32 px-2.5 py-1.5 bg-slate-950/90 border border-amber-500/50 rounded-lg text-xs font-mono font-bold text-amber-300 flex items-center justify-between shrink-0 shadow-sm"
                          title={`Unidad oficial registrada en Kardex para [${matchedItem.codigo_item}]: ${matchedItem.unidad_medida}`}
                        >
                          <span className="truncate">{matchedItem.unidad_medida}</span>
                          <span className="text-[10px] text-amber-500/70 ml-1">🔒</span>
                        </div>
                      ) : (
                        <select
                          value={row.unidad}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUnitSelect(val, (u) => {
                              const copy = [...formDevolucion.items];
                              copy[idx].unidad = u;
                              setFormDevolucion({ ...formDevolucion, items: copy });
                            });
                          }}
                          className="w-32 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 shrink-0 focus:border-amber-500"
                        >
                          {unidadesMedida.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                          <option value="__NUEVA_UNIDAD__">+ Otra unidad...</option>
                        </select>
                      )}

                      {/* Cantidad */}
                      <div className="w-32 shrink-0">
                        <input
                          type="number"
                          placeholder="Cantidad"
                          value={row.cantidad}
                          onChange={(e) => {
                            const copy = [...formDevolucion.items];
                            copy[idx].cantidad = parseFloat(e.target.value) || 0;
                            setFormDevolucion({ ...formDevolucion, items: copy });
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-blue-400 font-bold text-right focus:border-blue-400"
                        />
                      </div>

                      {/* Observación */}
                      <div className="flex-1 min-w-[180px]">
                        <input
                          type="text"
                          placeholder="Intacto, reingresa a polvorín, etc..."
                          value={row.estado_observacion || ""}
                          onChange={(e) => {
                            const copy = [...formDevolucion.items];
                            copy[idx].estado_observacion = e.target.value;
                            setFormDevolucion({ ...formDevolucion, items: copy });
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-amber-500"
                        />
                      </div>

                      {/* Botón Eliminar */}
                      <div className="w-10 text-center shrink-0">
                        {formDevolucion.items.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              const copy = formDevolucion.items.filter((_, i) => i !== idx);
                              setFormDevolucion({ ...formDevolucion, items: copy });
                            }}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </div>
                    </div>

                    {matchedItem && (
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pl-1 pt-1 border-t border-slate-800/50">
                        <span className="text-blue-400 font-bold">✓ Material [{matchedItem.codigo_item}] {matchedItem.descripcion}</span>
                        <span>• Stock actual: <strong className="text-slate-200 font-mono">{matchedItem.stock_actual} {matchedItem.unidad_medida}</strong></span>
                        <span>• Con reingreso pasará a: <strong className="text-emerald-400 font-mono font-bold">{(matchedItem.stock_actual + row.cantidad)} {matchedItem.unidad_medida}</strong></span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setModalDevolucionOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-lg"
            >
              Registrar Devolución (ALM-NDM-005)
            </button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL 6: ALM-AIF-006 (ACTA DE INVENTARIO FÍSICO)
         ========================================================================= */}
      <Modal
        isOpen={modalInventarioOpen}
        onClose={() => setModalInventarioOpen(false)}
        title="Crear Acta de Inventario Físico (ALM-AIF-006)"
        subtitle="Auditoría de existencias • Ajusta y sincroniza el stock del sistema con el conteo físico verificado"
        icon={<Scale className="w-5 h-5 text-purple-400" />}
        maxWidth="7xl"
      >
        <form onSubmit={handleGuardarInventario} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Fecha de Conteo</label>
              <input
                type="date"
                value={formInventario.fecha_conteo}
                onChange={(e) => setFormInventario({ ...formInventario, fecha_conteo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Tipo de Inventario</label>
              <select
                value={formInventario.tipo}
                onChange={(e) => setFormInventario({ ...formInventario, tipo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
              >
                <option value="General">General Integral</option>
                <option value="Rotativo">Rotativo / Selectivo</option>
                <option value="Críticos">Materiales Críticos</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Ubicación Almacén</label>
              <input
                type="text"
                value={formInventario.almacen_ubicacion}
                onChange={(e) => setFormInventario({ ...formInventario, almacen_ubicacion: e.target.value })}
                placeholder="Almacen Principal, Polvorin A"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Responsable del Conteo</label>
              <input
                type="text"
                list="lista-empleados-rrhh"
                value={formInventario.responsable_conteo}
                onChange={(e) => setFormInventario({ ...formInventario, responsable_conteo: e.target.value })}
                placeholder="Equipo Auditoria"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
              />
            </div>
          </div>

          {/* Filas Dinámicas de Auditoría */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/70 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  Detalle de Conteo Físico vs Sistema
                </h4>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormInventario({
                    ...formInventario,
                    items: [...formInventario.items, { descripcion: "", unidad: "Kilo", stock_sistema: 100, stock_fisico: 100, diferencia: 0, observacion: "" }]
                  })
                }
                className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Ítem Auditado
              </button>
            </div>

            {/* Cabecera de Columnas */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-900/90 rounded-lg text-[11px] font-bold text-slate-400 uppercase tracking-wider border border-slate-800/60">
              <div className="flex-1 min-w-[260px]">Material / Código o Descripción (Kardex)</div>
              <div className="w-32 text-center">Unidad Kardex</div>
              <div className="w-28 text-center">Stock Sistema</div>
              <div className="w-28 text-center">Stock Físico</div>
              <div className="w-24 text-center">Diferencia</div>
              <div className="flex-1 min-w-[180px]">Observación / Justificación</div>
              <div className="w-10 text-center">Acción</div>
            </div>

            <div className="space-y-2.5">
              {formInventario.items.map((row, idx) => {
                const matchedItem = items.find(
                  (i) =>
                    (row.codigo_item && i.codigo_item.toLowerCase() === row.codigo_item.toLowerCase()) ||
                    (row.descripcion && i.descripcion.toLowerCase() === row.descripcion.toLowerCase())
                );

                return (
                  <div key={idx} className="flex flex-col gap-2 p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 hover:border-slate-700/80 transition-colors">
                    <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                      {/* Buscador inteligente */}
                      <ItemCombobox
                        selectedCode={row.codigo_item}
                        items={items}
                        onSelect={(item) => handleSeleccionarItemEnFila(idx, item, "inventario")}
                        onClear={() => {
                          const copy = [...formInventario.items];
                          copy[idx] = { ...copy[idx], codigo_item: "", descripcion: "" };
                          setFormInventario({ ...formInventario, items: copy });
                        }}
                        onCreateNew={(typedQuery) => handleAbrirCreacionKardex(typedQuery, "inventario", idx)}
                        placeholder="Buscar por código (ej. DIN-001) o descripción..."
                      />

                      {/* Unidad Oficial Kardex */}
                      {matchedItem ? (
                        <div
                          className="w-32 px-2.5 py-1.5 bg-slate-950/90 border border-amber-500/50 rounded-lg text-xs font-mono font-bold text-amber-300 flex items-center justify-between shrink-0 shadow-sm"
                          title={`Unidad oficial registrada en Kardex para [${matchedItem.codigo_item}]: ${matchedItem.unidad_medida}`}
                        >
                          <span className="truncate">{matchedItem.unidad_medida}</span>
                          <span className="text-[10px] text-amber-500/70 ml-1">🔒</span>
                        </div>
                      ) : (
                        <select
                          value={row.unidad}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUnitSelect(val, (u) => {
                              const copy = [...formInventario.items];
                              copy[idx].unidad = u;
                              setFormInventario({ ...formInventario, items: copy });
                            });
                          }}
                          className="w-32 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 shrink-0 focus:border-amber-500"
                        >
                          {unidadesMedida.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                          <option value="__NUEVA_UNIDAD__">+ Otra unidad...</option>
                        </select>
                      )}

                      {/* Stock Sistema */}
                      <div className="w-28 shrink-0">
                        <input
                          type="number"
                          placeholder="Sistema"
                          value={row.stock_sistema}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const copy = [...formInventario.items];
                            copy[idx].stock_sistema = val;
                            copy[idx].diferencia = copy[idx].stock_fisico - val;
                            setFormInventario({ ...formInventario, items: copy });
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 text-right focus:border-purple-500"
                        />
                      </div>

                      {/* Stock Físico */}
                      <div className="w-28 shrink-0">
                        <input
                          type="number"
                          placeholder="Físico"
                          value={row.stock_fisico}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const copy = [...formInventario.items];
                            copy[idx].stock_fisico = val;
                            copy[idx].diferencia = val - copy[idx].stock_sistema;
                            setFormInventario({ ...formInventario, items: copy });
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-purple-500/60 rounded-lg text-xs font-mono text-purple-400 font-bold text-right focus:border-purple-400"
                        />
                      </div>

                      {/* Diferencia */}
                      <div className="w-24 shrink-0 px-2 py-1.5 text-center font-mono font-bold text-xs bg-slate-950 border border-slate-800 rounded-lg">
                        <span className={row.diferencia < 0 ? "text-rose-400" : row.diferencia > 0 ? "text-emerald-400" : "text-slate-400"}>
                          {row.diferencia > 0 ? `+${row.diferencia}` : row.diferencia}
                        </span>
                      </div>

                      {/* Observación */}
                      <div className="flex-1 min-w-[180px]">
                        <input
                          type="text"
                          placeholder="Observación o motivo de ajuste..."
                          value={row.observacion || ""}
                          onChange={(e) => {
                            const copy = [...formInventario.items];
                            copy[idx].observacion = e.target.value;
                            setFormInventario({ ...formInventario, items: copy });
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-purple-500"
                        />
                      </div>

                      {/* Botón Eliminar */}
                      <div className="w-10 text-center shrink-0">
                        {formInventario.items.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              const copy = formInventario.items.filter((_, i) => i !== idx);
                              setFormInventario({ ...formInventario, items: copy });
                            }}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </div>
                    </div>

                    {matchedItem && (
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pl-1 pt-1 border-t border-slate-800/50">
                        <span className="text-purple-400 font-bold">✓ Material [{matchedItem.codigo_item}] {matchedItem.descripcion}</span>
                        <span>• En sistema: <strong className="text-slate-200 font-mono">{matchedItem.stock_actual} {matchedItem.unidad_medida}</strong></span>
                        <span>• Conteo físico auditado: <strong className="text-purple-400 font-mono font-bold">{row.stock_fisico} {matchedItem.unidad_medida}</strong> (Ajuste: {row.diferencia})</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1 text-xs">Conclusiones y Acciones Correctivas</label>
            <textarea
              rows={2}
              value={formInventario.conclusiones_acciones_correctivas || ""}
              onChange={(e) => setFormInventario({ ...formInventario, conclusiones_acciones_correctivas: e.target.value })}
              placeholder="Se aplicará ajuste en sistema de -2 Kg por merma."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setModalInventarioOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-lg"
            >
              Aplicar Ajuste y Cerrar Acta (ALM-AIF-006)
            </button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL: CREAR NUEVA UNIDAD DE MEDIDA
         ========================================================================= */}
      <Modal
        isOpen={modalNuevaUnidadOpen}
        onClose={() => setModalNuevaUnidadOpen(false)}
        title="Crear Nueva Unidad de Medida"
        subtitle="Registrar nueva unidad física para ítems y formularios de almacén minero"
        icon={<Layers className="w-5 h-5 text-amber-500" />}
        maxWidth="md"
        zIndex="z-[80]"
      >
        <form onSubmit={handleCrearNuevaUnidad} className="space-y-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1 text-xs">
              Nombre de la Unidad <span className="text-amber-400">*</span>
            </label>
            <input
              required
              autoFocus
              type="text"
              value={nuevaUnidadNombre}
              onChange={(e) => setNuevaUnidadNombre(e.target.value)}
              placeholder="Ej: Bidón 20L, Cartucho, Tambor 55 Gal..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setNuevaUnidadNombre("");
                setModalNuevaUnidadOpen(false);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-lg"
            >
              Guardar y Utilizar Unidad
            </button>
          </div>
        </form>
      </Modal>

      {/* Datalist global para autocompletado inteligente de personal RRHH */}
      <datalist id="lista-empleados-rrhh">
        {empleados.map((emp) => (
          <option
            key={emp.id_legajo || emp.n_legajo || emp.n_de_documento || emp.nro_documento}
            value={emp.apellidos_y_nombres || emp.apellidos_nombres}
          >
            {emp.cargo_puesto} • CI: {emp.n_de_documento || emp.nro_documento}
          </option>
        ))}
      </datalist>
    </div>
  );
};
