import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  HardHat,
  User,
  Briefcase,
  Eye,
  BadgeCheck,
  Calendar,
  X,
  CreditCard,
  MapPin,
  FileText,
  Pencil,
  Phone,
  GraduationCap,
  Copy,
  Check,
  Code
} from "lucide-react";
import { Empleado } from "../../types";
import { erpApi, toEmpleadoJSON } from "../../services/api";
import { Modal } from "../../components/Modal";

export const RRHHView: React.FC = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [search, setSearch] = useState("");
  const [filtroArea, setFiltroArea] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState<"TODOS" | "ACTIVO" | "INACTIVO">("TODOS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLegajo, setSelectedLegajo] = useState<Empleado | null>(null);

  // Listas dinámicas con creación en caliente
  const [ciudades, setCiudades] = useState<string[]>(() => erpApi.getCiudades());
  const [areas, setAreas] = useState<string[]>(() => erpApi.getAreas());
  const [parentescos, setParentescos] = useState<string[]>(() => erpApi.getParentescos());

  // Estados de creación inline
  const [isCreatingCity, setIsCreatingCity] = useState(false);
  const [newCityInput, setNewCityInput] = useState("");

  const [isCreatingArea, setIsCreatingArea] = useState(false);
  const [newAreaInput, setNewAreaInput] = useState("");

  const [isCreatingParentesco, setIsCreatingParentesco] = useState(false);
  const [newParentescoInput, setNewParentescoInput] = useState("");

  // Modal para ver formato JSON estructurado
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Form State Inicial con todos los campos del esquema
  const initialForm: Partial<Empleado> = {
    // Encabezado
    n_legajo: "",
    fecha_registro: new Date().toISOString().split("T")[0],

    // Datos Personales
    apellidos_y_nombres: "",
    apellidos_nombres: "",
    tipo_de_documento: "CI",
    tipo_documento: "CI",
    n_de_documento: "",
    nro_documento: "",
    fecha_de_nacimiento: "1990-01-01",
    fecha_nacimiento: "1990-01-01",
    nacionalidad: "Boliviana",
    estado_civil: "Soltero(a)",
    sexo: "Masculino",
    direccion_domiciliaria: "",
    ciudad: "Potosí",
    codigo_postal: "0000",
    telefono: "",
    correo_electronico: "",

    // Datos Laborales
    cargo_puesto: "",
    departamento_area: "Mina",
    fecha_de_ingreso: new Date().toISOString().split("T")[0],
    fecha_ingreso: new Date().toISOString().split("T")[0],
    tipo_de_contrato: "Indeterminado",
    tipo_contrato: "Indeterminado",
    jornada_laboral: "14x7",
    horario_de_trabajo: "07:00 - 19:00 (Turno Día)",
    horario_trabajo: "07:00 - 19:00 (Turno Día)",
    salario_remuneracion: 5500.0, // Bolivianos (Bs.)
    supervisor_inmediato: "Ing. Roberto Vargas Flores",
    lugar_de_trabajo: "Socavón Nivel 2400",
    lugar_trabajo: "Socavón Nivel 2400",
    modalidad: "Presencial Faena",

    // Contacto de Emergencia
    nombre_completo: "",
    emergencia_nombre: "",
    parentesco: "Cónyuge",
    emergencia_parentesco: "Cónyuge",
    telefono_emergencia: "",
    emergencia_telefono: "",
    direccion_emergencia: "",
    emergencia_direccion: "",

    // Datos Adicionales
    nivel_de_estudios: "Técnico Minero",
    nivel_estudios: "Técnico Minero",
    profesion_titulo: "",
    n_de_seguro_social: "",
    nro_seguro_social: "",
    grupo_sanguineo: "O+",
    observaciones: "",

    estado_activo: 1,
  };

  const [formData, setFormData] = useState<Partial<Empleado>>(initialForm);

  const loadData = async () => {
    const data = await erpApi.getEmpleados();
    setEmpleados(data);
    setCiudades(erpApi.getCiudades());
    setAreas(erpApi.getAreas());
    setParentescos(erpApi.getParentescos());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setIsCreatingCity(false);
    setIsCreatingArea(false);
    setIsCreatingParentesco(false);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Empleado) => {
    setIsEditing(true);
    setIsCreatingCity(false);
    setIsCreatingArea(false);
    setIsCreatingParentesco(false);
    setFormData({ ...emp });
    setIsModalOpen(true);
  };

  // Creación dinámica de ciudades
  const handleAddNewCity = () => {
    const trimmed = newCityInput.trim();
    if (!trimmed) return;
    const updated = erpApi.addCiudad(trimmed);
    setCiudades(updated);
    setFormData((prev) => ({ ...prev, ciudad: trimmed }));
    setNewCityInput("");
    setIsCreatingCity(false);
  };

  // Creación dinámica de áreas
  const handleAddNewArea = () => {
    const trimmed = newAreaInput.trim();
    if (!trimmed) return;
    const updated = erpApi.addArea(trimmed);
    setAreas(updated);
    setFormData((prev) => ({ ...prev, departamento_area: trimmed }));
    setNewAreaInput("");
    setIsCreatingArea(false);
  };

  // Creación dinámica de parentescos
  const handleAddNewParentesco = () => {
    const trimmed = newParentescoInput.trim();
    if (!trimmed) return;
    const updated = erpApi.addParentesco(trimmed);
    setParentescos(updated);
    setFormData((prev) => ({
      ...prev,
      parentesco: trimmed,
      emergencia_parentesco: trimmed,
    }));
    setNewParentescoInput("");
    setIsCreatingParentesco(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombres = (formData.apellidos_y_nombres || formData.apellidos_nombres || "").trim();
    const doc = (formData.n_de_documento || formData.nro_documento || "").trim();
    const cargo = (formData.cargo_puesto || "").trim();

    if (!nombres || !doc || !cargo) {
      alert("Por favor completa los campos obligatorios: Apellidos y Nombres, N° de Documento y Cargo.");
      return;
    }

    if (isEditing && formData.id_legajo) {
      const modificado = await erpApi.updateEmpleado(formData as Empleado);
      if (selectedLegajo?.id_legajo === formData.id_legajo) {
        setSelectedLegajo(modificado);
      }
      alert(`Legajo #${formData.id_legajo} modificado con éxito.`);
    } else {
      const nuevo = await erpApi.addEmpleado(formData as Empleado);
      alert(`Nuevo trabajador registrado exitosamente con Legajo #${String(nuevo.id_legajo).padStart(3, "0")}.`);
    }

    setIsModalOpen(false);
    setFormData(initialForm);
    loadData();
  };

  const handleToggleEstado = async (emp: Empleado) => {
    const nuevoEstado = emp.estado_activo === 1 ? 0 : 1;
    const nombre = emp.apellidos_y_nombres || emp.apellidos_nombres;
    const msg =
      nuevoEstado === 0
        ? `¿Confirmas dar de baja lógica a ${nombre}?`
        : `¿Reactivar el legajo de ${nombre}?`;
    if (confirm(msg)) {
      const updated = { ...emp, estado_activo: nuevoEstado };
      await erpApi.updateEmpleado(updated);
      if (selectedLegajo?.id_legajo === emp.id_legajo) {
        setSelectedLegajo(updated);
      }
      loadData();
    }
  };

  const handleCopyJson = (emp: Empleado) => {
    const jsonStr = JSON.stringify(toEmpleadoJSON(emp), null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const filtered = empleados.filter((emp) => {
    const nombres = (emp.apellidos_y_nombres || emp.apellidos_nombres || "").toLowerCase();
    const doc = (emp.n_de_documento || emp.nro_documento || "").toLowerCase();
    const cargo = (emp.cargo_puesto || "").toLowerCase();
    const term = search.toLowerCase();

    const matchSearch = nombres.includes(term) || doc.includes(term) || cargo.includes(term);
    const matchArea = filtroArea === "TODOS" || emp.departamento_area === filtroArea;
    const matchEstado =
      filtroEstado === "TODOS" ||
      (filtroEstado === "ACTIVO" && emp.estado_activo === 1) ||
      (filtroEstado === "INACTIVO" && emp.estado_activo === 0);
    return matchSearch && matchArea && matchEstado;
  });

  const totalActivos = empleados.filter((e) => e.estado_activo === 1).length;
  const planillaTotalBs = empleados.reduce(
    (acc, curr) => acc + (curr.salario_remuneracion || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* 1. KPIS CARDS (BOLIVIA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-inner-card hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Personal Registrado</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <HardHat className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-100 mt-2 font-mono">{empleados.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">Legajos en base de datos local SQLite</span>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-inner-card hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Personal Activo</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <BadgeCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">{totalActivos}</p>
          <span className="text-xs text-emerald-400/80 mt-1 block">Operando en faena minera</span>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-inner-card hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Jornada Laboral</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-blue-400 mt-2 font-mono">14 x 7 / 10 x 4</p>
          <span className="text-xs text-slate-400 mt-1 block">Turnos de guardia y campamento</span>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-inner-card hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Planilla Base Mensual</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-400 mt-2 font-mono">
            Bs. {planillaTotalBs.toLocaleString("es-BO", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Total haberes en moneda nacional</span>
        </div>
      </div>

      {/* 2. FILTROS Y BARRA DE ACCIÓN */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Buscador */}
          <div className="relative min-w-[280px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por CI, nombres o cargo..."
              className="w-full pl-10 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro Estado */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFiltroEstado("TODOS")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                filtroEstado === "TODOS"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Todos ({empleados.length})
            </button>
            <button
              onClick={() => setFiltroEstado("ACTIVO")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                filtroEstado === "ACTIVO"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Activos ({totalActivos})
            </button>
            <button
              onClick={() => setFiltroEstado("INACTIVO")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                filtroEstado === "INACTIVO"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Bajas ({empleados.length - totalActivos})
            </button>
          </div>

          {/* Selector de Área Dinámico */}
          <select
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 px-3 py-2.5 focus:outline-none focus:border-amber-500"
          >
            <option value="TODOS">Todas las Áreas ({areas.length})</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Botón Registrar */}
        <button
          onClick={handleOpenCreate}
          className="w-full lg:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/10 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Registrar Nuevo Personal
        </button>
      </div>

      {/* 3. TABLA DE EMPLEADOS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">N° Legajo</th>
                <th className="px-5 py-4">Apellidos y Nombres</th>
                <th className="px-5 py-4">Documento (CI)</th>
                <th className="px-5 py-4">Cargo / Puesto</th>
                <th className="px-5 py-4">Departamento / Área</th>
                <th className="px-5 py-4">Jornada Laboral</th>
                <th className="px-5 py-4">Remuneración (Bs.)</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    <p className="text-base font-medium">No se encontraron trabajadores registrados.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const nombre = emp.apellidos_y_nombres || emp.apellidos_nombres || "Sin nombre";
                  const doc = emp.n_de_documento || emp.nro_documento;
                  const tipoDoc = emp.tipo_de_documento || emp.tipo_documento || "CI";

                  return (
                    <tr key={emp.id_legajo} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-5 py-4 font-mono font-bold text-xs text-amber-500">
                        #{String(emp.id_legajo).padStart(3, "0")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold text-amber-400 text-xs shadow-inner shrink-0">
                            {nombre
                              .split(" ")
                              .slice(0, 2)
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-100 text-sm truncate">{nombre}</p>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              {emp.ciudad || "Potosí"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-200">
                        {tipoDoc} {doc}
                      </td>
                      <td className="px-5 py-4 text-slate-200 font-medium">{emp.cargo_puesto}</td>
                      <td className="px-5 py-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700/60">
                          {emp.departamento_area}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-slate-300">{emp.jornada_laboral}</td>
                      <td className="px-5 py-4 font-mono font-bold text-emerald-400">
                        Bs. {(emp.salario_remuneracion || 0).toLocaleString("es-BO", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4">
                        {emp.estado_activo === 1 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                            Baja Lógica
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedLegajo(emp)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Ver Expediente Completo"
                          >
                            <Eye className="w-4 h-4 text-amber-400" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Modificar Datos del Empleado"
                          >
                            <Pencil className="w-4 h-4 text-blue-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: EXPEDIENTE COMPLETO */}
      {selectedLegajo && (
        <Modal
          isOpen={!!selectedLegajo}
          onClose={() => setSelectedLegajo(null)}
          title={`Expediente Oficial: ${selectedLegajo.apellidos_y_nombres || selectedLegajo.apellidos_nombres || "Trabajador"}`}
          subtitle={`N° Legajo #${String(selectedLegajo.id_legajo).padStart(3, "0")} • CI: ${selectedLegajo.n_de_documento || selectedLegajo.nro_documento} • Fecha Reg: ${selectedLegajo.fecha_registro}`}
          icon={<FileText className="w-5 h-5 text-amber-500" />}
          maxWidth="5xl"
        >
          <div className="space-y-5">
            {/* Cabecera del trabajador */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-lg shrink-0">
                  {(selectedLegajo.apellidos_y_nombres || selectedLegajo.apellidos_nombres || "T").charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-base">
                    {selectedLegajo.apellidos_y_nombres || selectedLegajo.apellidos_nombres || "Sin nombre"}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {selectedLegajo.cargo_puesto} • {selectedLegajo.departamento_area}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowJsonModal(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5" /> Ver Formato JSON
                </button>
                <button
                  onClick={() => {
                    handleOpenEdit(selectedLegajo);
                    setSelectedLegajo(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" /> Modificar
                </button>
                <button
                  onClick={() => handleToggleEstado(selectedLegajo)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedLegajo.estado_activo === 1
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                  }`}
                >
                  {selectedLegajo.estado_activo === 1 ? "Dar de Baja Lógica" : "Reactivar Legajo"}
                </button>
              </div>
            </div>

            {/* Grid con las 4 secciones exactas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Datos Personales */}
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs border-b border-slate-800 pb-2">
                  <User className="w-3.5 h-3.5" />
                  1. Datos Personales
                </div>
                <div className="space-y-1.5 text-xs">
                  <p><span className="text-slate-500">Documento:</span> <span className="font-mono text-slate-200">{selectedLegajo.tipo_de_documento || selectedLegajo.tipo_documento} {selectedLegajo.n_de_documento || selectedLegajo.nro_documento}</span></p>
                  <p><span className="text-slate-500">F. Nacimiento:</span> <span className="text-slate-200">{selectedLegajo.fecha_de_nacimiento || "No especificada"}</span></p>
                  <p><span className="text-slate-500">Nacionalidad:</span> <span className="text-slate-200">{selectedLegajo.nacionalidad || "Boliviana"}</span></p>
                  <p><span className="text-slate-500">Estado Civil:</span> <span className="text-slate-200">{selectedLegajo.estado_civil}</span></p>
                  <p><span className="text-slate-500">Sexo:</span> <span className="text-slate-200">{selectedLegajo.sexo}</span></p>
                  <p><span className="text-slate-500">Ciudad:</span> <span className="text-slate-200 font-bold text-amber-400">{selectedLegajo.ciudad}</span></p>
                  <p><span className="text-slate-500">Cód. Postal:</span> <span className="font-mono text-slate-200">{selectedLegajo.codigo_postal || "0000"}</span></p>
                  <p><span className="text-slate-500">Teléfono:</span> <span className="text-slate-200">{selectedLegajo.telefono || "Sin teléfono"}</span></p>
                  <p><span className="text-slate-500">Email:</span> <span className="text-slate-200 truncate block">{selectedLegajo.correo_electronico || "Sin correo"}</span></p>
                  <p><span className="text-slate-500">Dirección:</span> <span className="text-slate-200">{selectedLegajo.direccion_domiciliaria || "Sin dirección"}</span></p>
                </div>
              </div>

              {/* 2. Datos Laborales */}
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs border-b border-slate-800 pb-2">
                  <Briefcase className="w-3.5 h-3.5" />
                  2. Datos Laborales
                </div>
                <div className="space-y-1.5 text-xs">
                  <p><span className="text-slate-500">Cargo:</span> <span className="font-semibold text-slate-200">{selectedLegajo.cargo_puesto}</span></p>
                  <p><span className="text-slate-500">Área / Dpto:</span> <span className="font-bold text-amber-400">{selectedLegajo.departamento_area}</span></p>
                  <p><span className="text-slate-500">F. Ingreso:</span> <span className="font-mono text-slate-200">{selectedLegajo.fecha_de_ingreso || selectedLegajo.fecha_ingreso}</span></p>
                  <p><span className="text-slate-500">Contrato:</span> <span className="text-slate-200">{selectedLegajo.tipo_de_contrato || selectedLegajo.tipo_contrato}</span></p>
                  <p><span className="text-slate-500">Jornada Laboral:</span> <span className="font-mono text-amber-400 font-bold">{selectedLegajo.jornada_laboral}</span></p>
                  <p><span className="text-slate-500">Horario Trabajo:</span> <span className="text-slate-200">{selectedLegajo.horario_de_trabajo || selectedLegajo.horario_trabajo}</span></p>
                  <p><span className="text-slate-500">Remuneración:</span> <span className="font-mono font-bold text-emerald-400 text-sm">Bs. {(selectedLegajo.salario_remuneracion || 0).toLocaleString("es-BO", { minimumFractionDigits: 2 })}</span></p>
                  <p><span className="text-slate-500">Supervisor:</span> <span className="text-slate-200">{selectedLegajo.supervisor_inmediato || "No asignado"}</span></p>
                  <p><span className="text-slate-500">Lugar Trabajo:</span> <span className="text-slate-200">{selectedLegajo.lugar_de_trabajo || selectedLegajo.lugar_trabajo}</span></p>
                  <p><span className="text-slate-500">Modalidad:</span> <span className="text-slate-200">{selectedLegajo.modalidad}</span></p>
                </div>
              </div>

              {/* 3. Contacto de Emergencia */}
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs border-b border-slate-800 pb-2">
                  <Phone className="w-3.5 h-3.5" />
                  3. Contacto Emergencia
                </div>
                <div className="space-y-1.5 text-xs">
                  <p><span className="text-slate-500">Nombre:</span> <span className="font-semibold text-slate-200">{selectedLegajo.nombre_completo || selectedLegajo.emergencia_nombre || "No registrado"}</span></p>
                  <p><span className="text-slate-500">Parentesco:</span> <span className="font-bold text-amber-400">{selectedLegajo.parentesco || selectedLegajo.emergencia_parentesco || "Familiar"}</span></p>
                  <p><span className="text-slate-500">Tel. Urgencias:</span> <span className="font-mono font-bold text-rose-400">{selectedLegajo.telefono_emergencia || selectedLegajo.emergencia_telefono || "Sin teléfono"}</span></p>
                  <p><span className="text-slate-500">Dirección:</span> <span className="text-slate-200">{selectedLegajo.direccion_emergencia || selectedLegajo.emergencia_direccion || "No registrada"}</span></p>
                </div>
              </div>

              {/* 4. Datos Adicionales */}
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs border-b border-slate-800 pb-2">
                  <GraduationCap className="w-3.5 h-3.5" />
                  4. Datos Adicionales
                </div>
                <div className="space-y-1.5 text-xs">
                  <p><span className="text-slate-500">Estudios:</span> <span className="text-slate-200">{selectedLegajo.nivel_de_estudios || selectedLegajo.nivel_estudios}</span></p>
                  <p><span className="text-slate-500">Título/Oficio:</span> <span className="text-slate-200">{selectedLegajo.profesion_titulo || "Sin título registrado"}</span></p>
                  <p><span className="text-slate-500">Seguro CNS:</span> <span className="font-mono text-slate-200">{selectedLegajo.n_de_seguro_social || selectedLegajo.nro_seguro_social || "En trámite"}</span></p>
                  <p><span className="text-slate-500">Grupo Sanguíneo:</span> <span className="font-mono font-bold text-rose-400">{selectedLegajo.grupo_sanguineo || "O+"}</span></p>
                  <p><span className="text-slate-500">Observaciones:</span> <span className="text-slate-300 italic block mt-1 bg-slate-900 p-2 rounded-lg border border-slate-800">{selectedLegajo.observaciones || "Sin observaciones adicionales"}</span></p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLegajo(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 5. MODAL PARA VISUALIZAR Y COPIAR EL FORMATO JSON SOLICITADO */}
      {showJsonModal && selectedLegajo && (
        <Modal
          isOpen={showJsonModal}
          onClose={() => setShowJsonModal(false)}
          title="Estructura JSON Oficial de Personal"
          subtitle={`Formato estructurado exacto para Legajo #${String(selectedLegajo.id_legajo).padStart(3, "0")}`}
          icon={<Code className="w-5 h-5 text-amber-500" />}
          maxWidth="3xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Estructura canónica 100% compatible con base de datos y modelo de personal:
              </span>
              <button
                onClick={() => handleCopyJson(selectedLegajo)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedJson ? "¡Copiado!" : "Copiar JSON"}
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-amber-300 font-mono text-xs overflow-x-auto max-h-[480px]">
              {JSON.stringify(toEmpleadoJSON(selectedLegajo), null, 2)}
            </pre>

            <div className="flex justify-end">
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. MODAL: REGISTRAR O MODIFICAR EMPLEADO (TODOS LOS CAMPOS DEL ESQUEMA) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? `Modificar Legajo #${formData.id_legajo}` : "Registro Oficial de Personal Minero (Bolivia)"}
        subtitle={
          isEditing
            ? `Actualización completa de expediente para ${formData.apellidos_y_nombres || formData.apellidos_nombres}`
            : "Ingreso de nuevo trabajador a la base de datos SQLite WAL sin discrepancias de esquema"
        }
        icon={<HardHat className="w-5 h-5 text-amber-500" />}
        maxWidth="5xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ENCABEZADO */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-amber-500" />
              Encabezado de Registro Oficial
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">N° Legajo:</span>
                <span className="font-mono font-extrabold text-amber-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  {isEditing ? `#${String(formData.id_legajo).padStart(3, "0")}` : "Auto-asignado"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Fecha Registro:</span>
                <input
                  type="date"
                  value={formData.fecha_registro || new Date().toISOString().split("T")[0]}
                  onChange={(e) => setFormData({ ...formData, fecha_registro: e.target.value })}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 1: DATOS PERSONALES */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider border-b border-slate-800/80 pb-2">
              <User className="w-4 h-4 text-amber-500" />
              1. Datos Personales
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Apellidos y Nombres Completos <span className="text-amber-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.apellidos_y_nombres || formData.apellidos_nombres || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      apellidos_y_nombres: e.target.value,
                      apellidos_nombres: e.target.value,
                    })
                  }
                  placeholder="Ej: Mamani Choque, Carlos Alberto"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Documento</label>
                <select
                  value={formData.tipo_de_documento || formData.tipo_documento || "CI"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipo_de_documento: e.target.value,
                      tipo_documento: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="CI">CI (Cédula de Identidad Bolivia)</option>
                  <option value="PASAPORTE">Pasaporte</option>
                  <option value="EXTRANJERO">Carnet de Extranjería</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  N° de Documento <span className="text-amber-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.n_de_documento || formData.nro_documento || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      n_de_documento: e.target.value,
                      nro_documento: e.target.value,
                    })
                  }
                  placeholder="Ej: 8472910-PT"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={formData.fecha_de_nacimiento || formData.fecha_nacimiento || "1990-01-01"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fecha_de_nacimiento: e.target.value,
                      fecha_nacimiento: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nacionalidad</label>
                <input
                  type="text"
                  value={formData.nacionalidad || "Boliviana"}
                  onChange={(e) => setFormData({ ...formData, nacionalidad: e.target.value })}
                  placeholder="Boliviana"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Estado Civil</label>
                <select
                  value={formData.estado_civil || "Soltero(a)"}
                  onChange={(e) => setFormData({ ...formData, estado_civil: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Soltero(a)">Soltero(a)</option>
                  <option value="Casado(a)">Casado(a)</option>
                  <option value="Conviviente / Unión Libre">Conviviente / Unión Libre</option>
                  <option value="Divorciado(a)">Divorciado(a)</option>
                  <option value="Viudo(a)">Viudo(a)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sexo</label>
                <select
                  value={formData.sexo || "Masculino"}
                  onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>

              {/* Selector de Ciudad con Posibilidad de Crear Nueva */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Ciudad / Procedencia <span className="text-amber-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCity(!isCreatingCity)}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    {isCreatingCity ? "Cancelar" : "+ Nueva Ciudad"}
                  </button>
                </div>
                {isCreatingCity ? (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newCityInput}
                      onChange={(e) => setNewCityInput(e.target.value)}
                      placeholder="Nombre de la nueva ciudad..."
                      className="flex-1 px-3 py-2 bg-slate-900 border border-amber-500/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCity}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
                    >
                      Guardar
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.ciudad || "Potosí"}
                    onChange={(e) => {
                      if (e.target.value === "__NEW__") {
                        setIsCreatingCity(true);
                      } else {
                        setFormData({ ...formData, ciudad: e.target.value });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {ciudades.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__NEW__" className="text-amber-400 font-bold">+ Crear nueva ciudad...</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Código Postal</label>
                <input
                  type="text"
                  value={formData.codigo_postal || "0000"}
                  onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                  placeholder="0000"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={formData.telefono || ""}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="71829304"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={formData.correo_electronico || ""}
                  onChange={(e) => setFormData({ ...formData, correo_electronico: e.target.value })}
                  placeholder="trabajador@minera.bo"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dirección Domiciliaria</label>
                <input
                  type="text"
                  value={formData.direccion_domiciliaria || ""}
                  onChange={(e) => setFormData({ ...formData, direccion_domiciliaria: e.target.value })}
                  placeholder="Av. Mineros #120, Zona Central"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DATOS LABORALES */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider border-b border-slate-800/80 pb-2">
              <Briefcase className="w-4 h-4 text-amber-500" />
              2. Datos Laborales
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cargo / Puesto <span className="text-amber-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.cargo_puesto || ""}
                  onChange={(e) => setFormData({ ...formData, cargo_puesto: e.target.value })}
                  placeholder="Ej: Operador de Jumbo, Perforista"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Selector de Departamento / Área con Creación Dinámica */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Departamento / Área <span className="text-amber-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingArea(!isCreatingArea)}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    {isCreatingArea ? "Cancelar" : "+ Nueva Área"}
                  </button>
                </div>
                {isCreatingArea ? (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newAreaInput}
                      onChange={(e) => setNewAreaInput(e.target.value)}
                      placeholder="Nombre de la nueva área..."
                      className="flex-1 px-3 py-2 bg-slate-900 border border-amber-500/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddNewArea}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
                    >
                      Guardar
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.departamento_area || "Mina"}
                    onChange={(e) => {
                      if (e.target.value === "__NEW__") {
                        setIsCreatingArea(true);
                      } else {
                        setFormData({ ...formData, departamento_area: e.target.value });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {areas.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                    <option value="__NEW__" className="text-amber-400 font-bold">+ Crear nueva área / dpto...</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fecha de Ingreso <span className="text-amber-400">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={formData.fecha_de_ingreso || formData.fecha_ingreso || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fecha_de_ingreso: e.target.value,
                      fecha_ingreso: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Contrato</label>
                <select
                  value={formData.tipo_de_contrato || formData.tipo_contrato || "Indeterminado"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipo_de_contrato: e.target.value,
                      tipo_contrato: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Indeterminado">Indeterminado (Planta)</option>
                  <option value="Plazo Fijo">Plazo Fijo</option>
                  <option value="Por Faena / Obra">Por Faena / Obra Minera</option>
                  <option value="Eventual">Eventual</option>
                  <option value="Pasantía / Práctica">Pasantía / Práctica</option>
                </select>
              </div>

              {/* JORNADA LABORAL (Reemplazo de régimen de guardia) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Jornada Laboral <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.jornada_laboral || "14x7"}
                  onChange={(e) => setFormData({ ...formData, jornada_laboral: e.target.value })}
                  placeholder="14x7, 10x4, 20x10, 5x2..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* HORARIO DE TRABAJO (Nuevo campo añadido a datos laborales) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Horario de Trabajo <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.horario_de_trabajo || formData.horario_trabajo || "07:00 - 19:00 (Turno Día)"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      horario_de_trabajo: e.target.value,
                      horario_trabajo: e.target.value,
                    })
                  }
                  placeholder="07:00 - 19:00 (Turno Día), 19:00 - 07:00..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Salario / Remuneración (Bs.) <span className="text-amber-400">*</span>
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={formData.salario_remuneracion ?? 0}
                  onChange={(e) =>
                    setFormData({ ...formData, salario_remuneracion: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Supervisor Inmediato</label>
                <input
                  type="text"
                  value={formData.supervisor_inmediato || ""}
                  onChange={(e) => setFormData({ ...formData, supervisor_inmediato: e.target.value })}
                  placeholder="Ej: Ing. Roberto Vargas Flores"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Lugar de Trabajo</label>
                <input
                  type="text"
                  value={formData.lugar_de_trabajo || formData.lugar_trabajo || "Socavón Nivel 2400"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lugar_de_trabajo: e.target.value,
                      lugar_trabajo: e.target.value,
                    })
                  }
                  placeholder="Socavón Nivel 2400, Bocamina Central"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Modalidad</label>
                <select
                  value={formData.modalidad || "Presencial Faena"}
                  onChange={(e) => setFormData({ ...formData, modalidad: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Presencial Faena">Presencial Faena (Subterránea)</option>
                  <option value="Campamento Minero">Campamento Minero</option>
                  <option value="Semipresencial">Semipresencial</option>
                  <option value="Teletrabajo / Administrativo">Teletrabajo / Administrativo</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: CONTACTO DE EMERGENCIA */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider border-b border-slate-800/80 pb-2">
              <Phone className="w-4 h-4 text-amber-500" />
              3. Contacto de Emergencia
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre Completo del Contacto
                </label>
                <input
                  type="text"
                  value={formData.nombre_completo || formData.emergencia_nombre || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nombre_completo: e.target.value,
                      emergencia_nombre: e.target.value,
                    })
                  }
                  placeholder="Familiar o apoderado"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Selector de Parentesco con Opciones Predefinidas y Creación de Nuevos */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Parentesco <span className="text-amber-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingParentesco(!isCreatingParentesco)}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    {isCreatingParentesco ? "Cancelar" : "+ Nuevo Parentesco"}
                  </button>
                </div>
                {isCreatingParentesco ? (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newParentescoInput}
                      onChange={(e) => setNewParentescoInput(e.target.value)}
                      placeholder="Ej: Cuñado, Compadre..."
                      className="flex-1 px-3 py-2 bg-slate-900 border border-amber-500/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddNewParentesco}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
                    >
                      Guardar
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.parentesco || formData.emergencia_parentesco || "Cónyuge"}
                    onChange={(e) => {
                      if (e.target.value === "__NEW__") {
                        setIsCreatingParentesco(true);
                      } else {
                        setFormData({
                          ...formData,
                          parentesco: e.target.value,
                          emergencia_parentesco: e.target.value,
                        });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {parentescos.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    <option value="__NEW__" className="text-amber-400 font-bold">+ Crear nuevo parentesco...</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Teléfono de Contacto Urgente
                </label>
                <input
                  type="text"
                  value={formData.telefono_emergencia || formData.emergencia_telefono || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      telefono_emergencia: e.target.value,
                      emergencia_telefono: e.target.value,
                    })
                  }
                  placeholder="Número de celular urgente"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dirección del Contacto</label>
                <input
                  type="text"
                  value={formData.direccion_emergencia || formData.emergencia_direccion || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      direccion_emergencia: e.target.value,
                      emergencia_direccion: e.target.value,
                    })
                  }
                  placeholder="Ciudad o referencia domiciliaria"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: DATOS ADICIONALES */}
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider border-b border-slate-800/80 pb-2">
              <GraduationCap className="w-4 h-4 text-amber-500" />
              4. Datos Adicionales
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nivel de Estudios</label>
                <select
                  value={formData.nivel_de_estudios || formData.nivel_estudios || "Técnico Minero"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nivel_de_estudios: e.target.value,
                      nivel_estudios: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Primaria">Primaria</option>
                  <option value="Secundaria">Secundaria</option>
                  <option value="Técnico Medio">Técnico Medio</option>
                  <option value="Técnico Minero">Técnico Minero</option>
                  <option value="Técnico Superior">Técnico Superior</option>
                  <option value="Licenciatura / Ingeniería">Licenciatura / Ingeniería</option>
                  <option value="Diplomado / Maestría">Diplomado / Maestría</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Profesión / Título</label>
                <input
                  type="text"
                  value={formData.profesion_titulo || ""}
                  onChange={(e) => setFormData({ ...formData, profesion_titulo: e.target.value })}
                  placeholder="Ej: Ing. de Minas, Perforista"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  N° de Seguro Social (CNS)
                </label>
                <input
                  type="text"
                  value={formData.n_de_seguro_social || formData.nro_seguro_social || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      n_de_seguro_social: e.target.value,
                      nro_seguro_social: e.target.value,
                    })
                  }
                  placeholder="CNS-8472910"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Grupo Sanguíneo</label>
                <select
                  value={formData.grupo_sanguineo || "O+"}
                  onChange={(e) => setFormData({ ...formData, grupo_sanguineo: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="O+">O Positivo (O+)</option>
                  <option value="O-">O Negativo (O-)</option>
                  <option value="A+">A Positivo (A+)</option>
                  <option value="A-">A Negativo (A-)</option>
                  <option value="B+">B Positivo (B+)</option>
                  <option value="AB+">AB Positivo (AB+)</option>
                </select>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={formData.observaciones || ""}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Anotaciones médicas, autorizaciones de bocamina, historial de faena..."
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer del Formulario */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-7 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              {isEditing ? "Guardar Modificaciones" : "Guardar Legajo en SQLite"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
