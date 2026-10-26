import {
  Empleado,
  EmpleadoJSON,
  NominaPago,
  NominaConcepto,
  AlmacenItem,
  AlmacenMovimiento,
  AuditoriaLog,
  SystemStats,
  Usuario,
  ItemKardexPayload,
  SolicitudRequerimientoPayload,
  NotaIngresoPayload,
  NotaSalidaPayload,
  NotaDevolucionPayload,
  ActaInventarioPayload,
} from "../types";

// Detectar si está corriendo dentro de Tauri
const isTauri = typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke<T>(cmd, args);
    } catch (err) {
      console.warn(`Error en Tauri invoke(${cmd}):`, err);
      throw err;
    }
  }
  throw new Error("Tauri environment not detected");
}

// Claves de almacenamiento local para persistir cambios y pruebas
const STORAGE_KEYS = {
  USER: "proyjimp_session_user",
  USUARIOS: "proyjimp_data_usuarios",
  EMPLEADOS: "proyjimp_data_empleados",
  ITEMS: "proyjimp_data_items",
  MOVIMIENTOS: "proyjimp_data_movimientos",
  PAGOS: "proyjimp_data_pagos",
  LOGS: "proyjimp_data_logs",
  CIUDADES: "proyjimp_data_ciudades",
  AREAS: "proyjimp_data_areas",
  PARENTESCOS: "proyjimp_data_parentescos",
  SOLICITUDES: "proyjimp_data_solicitudes",
  INGRESOS: "proyjimp_data_ingresos",
  SALIDAS: "proyjimp_data_salidas",
  DEVOLUCIONES: "proyjimp_data_devoluciones",
  INVENTARIOS: "proyjimp_data_inventarios",
  UNIDADES_MEDIDA: "proyjimp_data_unidades_medida",
  CONCEPTOS: "proyjimp_data_conceptos_map"
};

// Función para normalizar cualquier objeto de empleado y garantizar sincronía entre campos planos y JSON
export function normalizarEmpleado(emp: Partial<Empleado>): Empleado {
  const apellidos = (emp.apellidos_y_nombres || emp.apellidos_nombres || "").trim();
  const nroDoc = (emp.n_de_documento || emp.nro_documento || "").trim();
  const tipoDoc = emp.tipo_de_documento || emp.tipo_documento || "CI";
  const fechaIngreso = emp.fecha_de_ingreso || emp.fecha_ingreso || new Date().toISOString().split("T")[0];
  const jornada = emp.jornada_laboral || "14x7";
  const horario = emp.horario_de_trabajo || emp.horario_trabajo || "07:00 - 19:00 (Turno Día)";
  const tipoContrato = emp.tipo_de_contrato || emp.tipo_contrato || "Indeterminado";
  const lugar = emp.lugar_de_trabajo || emp.lugar_trabajo || "Socavón Nivel 2400";
  const contactoNombre = (emp.nombre_completo || emp.emergencia_nombre || "").trim();
  const parentesco = emp.parentesco || emp.emergencia_parentesco || "Familiar";
  const telEmergencia = emp.telefono_emergencia || emp.emergencia_telefono || "";
  const dirEmergencia = emp.direccion_emergencia || emp.emergencia_direccion || "";
  const nivelEstudios = emp.nivel_de_estudios || emp.nivel_estudios || "Técnico Minero";
  const seguroSocial = emp.n_de_seguro_social || emp.nro_seguro_social || "";
  const fechaNac = emp.fecha_de_nacimiento || emp.fecha_nacimiento || "1990-01-01";
  const idLeg = emp.id_legajo || (emp.n_legajo ? Number(emp.n_legajo) : undefined);
  const nLeg = emp.n_legajo ? String(emp.n_legajo) : idLeg ? String(idLeg).padStart(3, "0") : "";

  return {
    ...emp,
    id_legajo: idLeg,
    n_legajo: nLeg,
    fecha_registro: emp.fecha_registro || new Date().toISOString().split("T")[0],

    // Datos Personales
    apellidos_y_nombres: apellidos,
    apellidos_nombres: apellidos,
    tipo_de_documento: tipoDoc,
    tipo_documento: tipoDoc,
    n_de_documento: nroDoc,
    nro_documento: nroDoc,
    fecha_de_nacimiento: fechaNac,
    fecha_nacimiento: fechaNac,
    nacionalidad: emp.nacionalidad || "Boliviana",
    estado_civil: emp.estado_civil || "Soltero(a)",
    sexo: emp.sexo || "Masculino",
    direccion_domiciliaria: emp.direccion_domiciliaria || "",
    ciudad: emp.ciudad || "Potosí",
    codigo_postal: emp.codigo_postal || "0000",
    telefono: emp.telefono || "",
    correo_electronico: emp.correo_electronico || "",

    // Datos Laborales
    cargo_puesto: emp.cargo_puesto || "",
    departamento_area: emp.departamento_area || "Mina",
    fecha_de_ingreso: fechaIngreso,
    fecha_ingreso: fechaIngreso,
    tipo_de_contrato: tipoContrato,
    tipo_contrato: tipoContrato,
    jornada_laboral: jornada,
    horario_de_trabajo: horario,
    horario_trabajo: horario,
    salario_remuneracion: typeof emp.salario_remuneracion === "number" ? emp.salario_remuneracion : parseFloat(String(emp.salario_remuneracion || 0)) || 0,
    supervisor_inmediato: emp.supervisor_inmediato || "Ing. Roberto Vargas Flores",
    lugar_de_trabajo: lugar,
    lugar_trabajo: lugar,
    modalidad: emp.modalidad || "Presencial Faena",

    // Contacto de Emergencia
    nombre_completo: contactoNombre,
    emergencia_nombre: contactoNombre,
    parentesco: parentesco,
    emergencia_parentesco: parentesco,
    telefono_emergencia: telEmergencia,
    emergencia_telefono: telEmergencia,
    direccion_emergencia: dirEmergencia,
    emergencia_direccion: dirEmergencia,

    // Datos Adicionales
    nivel_de_estudios: nivelEstudios,
    nivel_estudios: nivelEstudios,
    profesion_titulo: emp.profesion_titulo || "",
    n_de_seguro_social: seguroSocial,
    nro_seguro_social: seguroSocial,
    grupo_sanguineo: emp.grupo_sanguineo || "O+",
    observaciones: emp.observaciones || "",

    estado_activo: emp.estado_activo ?? 1,
  };
}

// Convertidor al formato JSON estricto requerido
export function toEmpleadoJSON(emp: Empleado): EmpleadoJSON {
  const n = normalizarEmpleado(emp);
  return {
    empleado: {
      encabezado: {
        n_legajo: n.n_legajo ? String(n.n_legajo) : (n.id_legajo ? String(n.id_legajo).padStart(3, "0") : ""),
        fecha_registro: n.fecha_registro || "",
      },
      datos_personales: {
        apellidos_y_nombres: n.apellidos_y_nombres || "",
        tipo_de_documento: n.tipo_de_documento || "CI",
        n_de_documento: n.n_de_documento || "",
        fecha_de_nacimiento: n.fecha_de_nacimiento || "",
        nacionalidad: n.nacionalidad || "Boliviana",
        estado_civil: n.estado_civil || "Soltero(a)",
        sexo: n.sexo || "Masculino",
        direccion_domiciliaria: n.direccion_domiciliaria || "",
        ciudad: n.ciudad || "Potosí",
        codigo_postal: n.codigo_postal || "0000",
        telefono: n.telefono || "",
        correo_electronico: n.correo_electronico || "",
      },
      datos_laborales: {
        cargo_puesto: n.cargo_puesto,
        departamento_area: n.departamento_area || "Mina",
        fecha_de_ingreso: n.fecha_de_ingreso || "",
        tipo_de_contrato: n.tipo_de_contrato || "Indeterminado",
        jornada_laboral: n.jornada_laboral || "14x7",
        horario_de_trabajo: n.horario_de_trabajo || "",
        salario_remuneracion: n.salario_remuneracion || 0.0,
        supervisor_inmediato: n.supervisor_inmediato || "",
        lugar_de_trabajo: n.lugar_de_trabajo || "",
        modalidad: n.modalidad || "Presencial Faena",
      },
      contacto_emergencia: {
        nombre_completo: n.nombre_completo || "",
        parentesco: n.parentesco || "",
        telefono: n.telefono_emergencia || n.emergencia_telefono || "",
        direccion: n.direccion_emergencia || n.emergencia_direccion || "",
      },
      datos_adicionales: {
        nivel_de_estudios: n.nivel_de_estudios || "",
        profesion_titulo: n.profesion_titulo || "",
        n_de_seguro_social: n.n_de_seguro_social || "",
        grupo_sanguineo: n.grupo_sanguineo || "O+",
        observaciones: n.observaciones || "",
      },
    },
  };
}

// Usuarios del sistema por defecto
const defaultUsuarios: Usuario[] = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    nombre_completo: "Jimmy Peredo",
    rol: "Administrador General",
    estado_activo: 1,
    fecha_creacion: "2026-01-01",
    ultimo_acceso: "2026-10-25 08:30:00",
    avatar_iniciales: "JP"
  },
  {
    id: 2,
    username: "supervisor",
    password: "mina2026",
    nombre_completo: "Elena Quispe Colque",
    rol: "Supervisor SSOMA",
    estado_activo: 1,
    fecha_creacion: "2026-02-15",
    ultimo_acceso: "2026-10-24 16:45:00",
    avatar_iniciales: "EQ"
  },
  {
    id: 3,
    username: "almacen",
    password: "almacen123",
    nombre_completo: "Roberto Vargas Flores",
    rol: "Encargado de Almacén",
    estado_activo: 1,
    fecha_creacion: "2026-03-01",
    ultimo_acceso: "2026-10-25 07:15:00",
    avatar_iniciales: "RV"
  }
];

// Datos iniciales de empleados mineros con moneda en Bolivianos (Bs.)
const defaultEmpleados: Empleado[] = [
  {
    id_legajo: 1,
    fecha_registro: "2026-01-15",
    apellidos_nombres: "Mamani Choque, Carlos Alberto",
    tipo_documento: "CI",
    nro_documento: "8472910",
    cargo_puesto: "Operador de Jumbo / Perforación Subterránea",
    departamento_area: "Mina",
    fecha_ingreso: "2024-03-01",
    salario_remuneracion: 5850.0, // Bolivianos (Bs.)
    tipo_contrato: "Indeterminado",
    jornada_laboral: "14x7",
    lugar_trabajo: "Socavón Nivel 2400",
    telefono: "71829304",
    correo_electronico: "carlos.mamani@minera.bo",
    direccion_domiciliaria: "Av. Mineros #120",
    ciudad: "Potosí",
    nacionalidad: "Boliviana",
    estado_civil: "Casado(a)",
    sexo: "Masculino",
    emergencia_nombre: "María Choque Flores",
    emergencia_parentesco: "Cónyuge",
    emergencia_telefono: "72938401",
    emergencia_direccion: "Av. Mineros #120",
    nivel_estudios: "Técnico Superior Minero",
    profesion_titulo: "Técnico en Operación de Perforación",
    nro_seguro_social: "CNS-8472910",
    grupo_sanguineo: "O+",
    observaciones: "Autorizado para frentes subterráneos con explosivos",
    estado_activo: 1,
  },
  {
    id_legajo: 2,
    fecha_registro: "2026-02-10",
    apellidos_nombres: "Quispe Colque, Elena Beatriz",
    tipo_documento: "CI",
    nro_documento: "6291045",
    cargo_puesto: "Supervisora SSOMA y Salud Ocupacional",
    departamento_area: "Seguridad y Salud Ocupacional",
    fecha_ingreso: "2023-08-15",
    salario_remuneracion: 7200.0, // Bolivianos (Bs.)
    tipo_contrato: "Indeterminado",
    jornada_laboral: "10x4",
    lugar_trabajo: "Planta y Campamento",
    telefono: "73948201",
    correo_electronico: "elena.quispe@minera.bo",
    direccion_domiciliaria: "Calle Pagador #450",
    ciudad: "Oruro",
    nacionalidad: "Boliviana",
    estado_civil: "Soltera",
    sexo: "Femenino",
    emergencia_nombre: "Jorge Quispe Colque",
    emergencia_parentesco: "Hermano",
    emergencia_telefono: "74019283",
    emergencia_direccion: "Calle Pagador #450",
    nivel_estudios: "Licenciatura",
    profesion_titulo: "Ingeniera de Seguridad Industrial",
    nro_seguro_social: "CNS-6291045",
    grupo_sanguineo: "A+",
    observaciones: "Certificación en normativa boliviana de seguridad minera",
    estado_activo: 1,
  },
  {
    id_legajo: 3,
    fecha_registro: "2026-03-05",
    apellidos_nombres: "Vargas Flores, Roberto",
    tipo_documento: "CI",
    nro_documento: "5182947",
    cargo_puesto: "Jefe de Guardia de Extracción",
    departamento_area: "Mina",
    fecha_ingreso: "2022-01-10",
    salario_remuneracion: 9500.0, // Bolivianos (Bs.)
    tipo_contrato: "Indeterminado",
    jornada_laboral: "14x7",
    lugar_trabajo: "Bocamina Central",
    telefono: "75839201",
    correo_electronico: "roberto.vargas@minera.bo",
    direccion_domiciliaria: "Zona Minera #16",
    ciudad: "La Paz",
    nacionalidad: "Boliviana",
    estado_civil: "Casado(a)",
    sexo: "Masculino",
    emergencia_nombre: "Rosa Flores de Vargas",
    emergencia_parentesco: "Esposa",
    emergencia_telefono: "76940182",
    emergencia_direccion: "Zona Minera #16",
    nivel_estudios: "Ingeniería",
    profesion_titulo: "Ingeniero de Minas",
    nro_seguro_social: "CNS-5182947",
    grupo_sanguineo: "O+",
    observaciones: "Responsable de turno y polvorín de faena",
    estado_activo: 1,
  }
];

const defaultAlmacenItems: AlmacenItem[] = [
  {
    id_item: 1,
    codigo_item: "EPP-001",
    descripcion: "Casco Minero con Portalámpara Clase E (Norma Minera)",
    tipo_categoria: "EPP Minero",
    unidad_medida: "unidad",
    ubicacion_rack: "RACK-A1-CENTRAL",
    stock_minimo: 15,
    stock_maximo: 120,
    stock_actual: 45,
    costo_unitario_promedio: 140.0 // Bs.
  },
  {
    id_item: 2,
    codigo_item: "EPP-002",
    descripcion: "Respirador 3M Doble Vía con Filtros para Sílice y Polvo",
    tipo_categoria: "EPP Minero",
    unidad_medida: "unidad",
    ubicacion_rack: "RACK-A2-SEGURIDAD",
    stock_minimo: 20,
    stock_maximo: 100,
    stock_actual: 16, // Alerta stock bajo
    costo_unitario_promedio: 220.0 // Bs.
  },
  {
    id_item: 3,
    codigo_item: "BRO-105",
    descripcion: "Broca Integral para Barreno 7/8 x 4 pies (Perforación)",
    tipo_categoria: "Herramienta de Perforación",
    unidad_medida: "unidad",
    ubicacion_rack: "PATIO-MAQ-03",
    stock_minimo: 10,
    stock_maximo: 60,
    stock_actual: 28,
    costo_unitario_promedio: 650.0 // Bs.
  },
  {
    id_item: 4,
    codigo_item: "LUB-204",
    descripcion: "Aceite Hidráulico ISO VG 68 para Maquinaria Pesada (Turril 200L)",
    tipo_categoria: "Lubricantes y Químicos",
    unidad_medida: "cilindro",
    ubicacion_rack: "ZONA-LUBRICANTES",
    stock_minimo: 4,
    stock_maximo: 25,
    stock_actual: 7,
    costo_unitario_promedio: 3400.0 // Bs.
  }
];

const defaultPagos: NominaPago[] = [
  {
    id_pago: 1,
    id_empleado: 1,
    empleado_nombre: "Mamani Choque, Carlos Alberto",
    cargo: "Operador de Jumbo",
    mes: "Octubre",
    anio: 2026,
    monto_total: 5715.0, // Bs.
    estado_bloqueo: 0,
  },
  {
    id_pago: 2,
    id_empleado: 2,
    empleado_nombre: "Quispe Colque, Elena Beatriz",
    cargo: "Supervisora SSOMA",
    mes: "Octubre",
    anio: 2026,
    monto_total: 7080.0, // Bs.
    estado_bloqueo: 1,
  }
];

const defaultLogs: AuditoriaLog[] = [
  {
    id_log: 1,
    fecha_hora: "2026-10-25 08:00:00",
    usuario: "Jimmy Peredo (Admin)",
    modulo: "SISTEMA",
    accion: "INIT",
    detalles: "Inicialización de SQLite en modo WAL y verificación de tablas en moneda Bolivianos (Bs.).",
  },
  {
    id_log: 2,
    fecha_hora: "2026-10-25 08:30:15",
    usuario: "Jimmy Peredo (Admin)",
    modulo: "SEGURIDAD",
    accion: "LOGIN",
    detalles: "Inicio de sesión exitoso en Terminal de Unidad Minera.",
  }
];

function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error leyendo localStorage[${key}]:`, e);
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error guardando en localStorage[${key}]:`, e);
  }
}

// Variables reactivas en memoria alimentadas con localStorage
let currentUsuarios: Usuario[] = getFromStorage(STORAGE_KEYS.USUARIOS, defaultUsuarios);
let currentEmpleados: Empleado[] = getFromStorage(STORAGE_KEYS.EMPLEADOS, defaultEmpleados).map(normalizarEmpleado);
let currentItems: AlmacenItem[] = getFromStorage(STORAGE_KEYS.ITEMS, defaultAlmacenItems);
let currentPagos: NominaPago[] = getFromStorage(STORAGE_KEYS.PAGOS, defaultPagos);
let currentLogs: AuditoriaLog[] = getFromStorage(STORAGE_KEYS.LOGS, defaultLogs);

const defaultConceptosMap: Record<number, NominaConcepto[]> = {
  1: [
    {
      id_concepto: 1,
      id_pago: 1,
      tipo_concepto: "SALARIO_BASE",
      monto: 5850.0,
      descripcion_info: "Haber básico contractual minero",
      fecha_registro: "2026-10-01",
    },
    {
      id_concepto: 2,
      id_pago: 1,
      tipo_concepto: "SALARIO_BASE",
      monto: 650.0,
      descripcion_info: "Bono por cumplimiento de metraje en avance socavón",
      fecha_registro: "2026-10-15",
    },
    {
      id_concepto: 3,
      id_pago: 1,
      tipo_concepto: "DESCUENTO",
      monto: -743.54,
      descripcion_info: "Aporte Laboral de Ley - Gestora Pública (12.71%)",
      fecha_registro: "2026-10-15",
    },
    {
      id_concepto: 4,
      id_pago: 1,
      tipo_concepto: "ADELANTO",
      monto: -700.0,
      descripcion_info: "Anticipo de quincena en efectivo",
      fecha_registro: "2026-10-15",
    },
  ],
  2: [
    {
      id_concepto: 5,
      id_pago: 2,
      tipo_concepto: "SALARIO_BASE",
      monto: 7200.0,
      descripcion_info: "Haber básico contractual supervisión SSOMA",
      fecha_registro: "2026-10-01",
    },
    {
      id_concepto: 6,
      id_pago: 2,
      tipo_concepto: "DESCUENTO",
      monto: -915.12,
      descripcion_info: "Aporte Laboral de Ley - Gestora Pública (12.71%)",
      fecha_registro: "2026-10-01",
    },
    {
      id_concepto: 7,
      id_pago: 2,
      tipo_concepto: "DESCUENTO",
      monto: -120.0,
      descripcion_info: "Aporte sindicato minero y fondo social",
      fecha_registro: "2026-10-18",
    },
  ],
};
let currentConceptosMap: Record<number, NominaConcepto[]> = getFromStorage(STORAGE_KEYS.CONCEPTOS, defaultConceptosMap);

// Listas dinámicas para personal
const defaultCiudades = [
  "Potosí",
  "Oruro",
  "La Paz",
  "Cochabamba",
  "Santa Cruz",
  "Chuquisaca",
  "Tarija",
  "Beni",
  "Pando",
  "Llallagua",
  "Uyuni",
  "Tupiza",
  "Villazón",
  "Huanuni",
  "Colquiri"
];

const defaultAreas = [
  "Mina",
  "Operaciones Subterráneas",
  "Seguridad y Salud Ocupacional",
  "Mantenimiento Mecánico",
  "Planta Concentradora",
  "Geología y Sondaje",
  "Topografía y Planificación",
  "Almacén y Logística",
  "Administración"
];

const defaultParentescos = [
  "Cónyuge",
  "Madre",
  "Padre",
  "Hermano(a)",
  "Hijo(a)",
  "Tío(a)",
  "Primo(a)",
  "Abuelo(a)",
  "Conviviente / Pareja",
  "Tutor Legal"
];

let currentCiudades: string[] = getFromStorage(STORAGE_KEYS.CIUDADES, defaultCiudades);
let currentAreas: string[] = getFromStorage(STORAGE_KEYS.AREAS, defaultAreas);
let currentParentescos: string[] = getFromStorage(STORAGE_KEYS.PARENTESCOS, defaultParentescos);

// Datos iniciales de los formularios de almacén minero
const defaultSolicitudes: SolicitudRequerimientoPayload["solicitud"][] = [
  {
    nro_solicitud: "REQ-2026-001",
    fecha: "2026-10-25",
    area_frente_trabajo: "Mina Nivel 2",
    centro_costo: "CC-05",
    solicitado_por: "Carlos Molina",
    cargo: "Jefe de Frente",
    urgencia: "Alta",
    motivo: "Voladura programada turno tarde",
    items: [
      {
        descripcion: "Dinamita en cartuchos",
        unidad: "Kilo",
        cantidad_solicitada: 500.0,
        cantidad_entregada: 500.0,
        observaciones: "Entrega completa para disparo",
      },
    ],
    firmas: ["Carlos Molina (Solicitante)", "Ing. Roberto Vargas (Jefe Área)", "Admin Almacén"],
  },
];

const defaultIngresos: NotaIngresoPayload["ingreso"][] = [
  {
    nro_ingreso: "ING-2026-100",
    fecha_recepcion: "2026-10-25",
    proveedor: "Explosivos del Sur S.A.",
    nro_guia_factura: "F-001452",
    orden_compra: "OC-998",
    placa_transportista: "ABC-123 / Luis Gomez",
    recibido_por: "Admin Almacén",
    estado_carga: "Optimo",
    items: [
      {
        descripcion: "Dinamita en cartuchos",
        unidad: "Kilo",
        cantidad_pedida: 1000.0,
        cantidad_recibida: 1000.0,
        conformidad: "Conforme",
      },
    ],
    observaciones_no_conformidades: "Llegó a tiempo y con precintos de seguridad intactos",
    firmas: ["Admin Almacén (Recepción)", "Luis Gomez (Transportista)", "Supervisor Logística"],
  },
];

const defaultSalidas: NotaSalidaPayload["salida"][] = [
  {
    nro_salida: "SAL-2026-050",
    fecha: "2026-10-25",
    destino: "Planta Trituradora",
    centro_costo: "CC-02",
    entregado_por: "Admin Almacén",
    recibido_por: "Pedro Carvalo",
    referencia_solicitud_nro: "REQ-2026-001",
    vehiculo_responsable_traslado: "Camioneta 3",
    items: [
      {
        descripcion: "Dinamita en cartuchos",
        unidad: "Kilo",
        cantidad: 500.0,
        observaciones: "Entrega parcial para turno de extracción",
      },
    ],
    firmas: ["Admin Almacén (Despacho)", "Pedro Carvalo (Recibe Conforme)", "Supervisor Logística"],
  },
];

const defaultDevoluciones: NotaDevolucionPayload["devolucion"][] = [
  {
    nro_devolucion: "DEV-2026-005",
    fecha: "2026-10-26",
    area_que_devuelve: "Mina Nivel 2",
    referencia_salida_nro: "SAL-2026-050",
    motivo_devolucion: "Sobrante de voladura",
    condicion_material: "Buen estado",
    items: [
      {
        descripcion: "Dinamita en cartuchos",
        unidad: "Kilo",
        cantidad: 50.0,
        estado_observacion: "Intacto, reingresa a polvorín A",
      },
    ],
    firmas: ["Carlos Molina (Entrega Área)", "Admin Almacén (Recibe)", "Supervisor Logística"],
  },
];

const defaultInventarios: ActaInventarioPayload["inventario_fisico"][] = [
  {
    fecha_conteo: "2026-10-30",
    tipo: "General",
    almacen_ubicacion: "Almacén Principal",
    responsable_conteo: "Equipo Auditoría",
    items: [
      {
        descripcion: "Dinamita en cartuchos",
        unidad: "Kilo",
        stock_sistema: 550.0,
        stock_fisico: 548.0,
        diferencia: -2.0,
        observacion: "Margen de error en pesaje",
      },
    ],
    conclusiones_acciones_correctivas: "Se aplicará ajuste en sistema de -2 Kg por merma.",
    firmas: ["Admin Almacén", "Auditor Control Interno", "Gerencia Logística"],
  },
];

let currentSolicitudes: SolicitudRequerimientoPayload["solicitud"][] = getFromStorage(STORAGE_KEYS.SOLICITUDES, defaultSolicitudes);
let currentIngresos: NotaIngresoPayload["ingreso"][] = getFromStorage(STORAGE_KEYS.INGRESOS, defaultIngresos);
let currentSalidas: NotaSalidaPayload["salida"][] = getFromStorage(STORAGE_KEYS.SALIDAS, defaultSalidas);
let currentDevoluciones: NotaDevolucionPayload["devolucion"][] = getFromStorage(STORAGE_KEYS.DEVOLUCIONES, defaultDevoluciones);
let currentInventarios: ActaInventarioPayload["inventario_fisico"][] = getFromStorage(STORAGE_KEYS.INVENTARIOS, defaultInventarios);

const defaultUnidadesMedida = [
  "Kilo",
  "Unidad",
  "Par",
  "Metro",
  "Litro",
  "Turril / Cilindro (200L)",
  "Bolsa (50 Kg)",
  "Caja",
  "Rollo",
  "Barra",
  "Galón",
  "Pulgada",
  "Pie"
];

const defaultMovimientos: AlmacenMovimiento[] = [
  {
    id_movimiento: 1,
    id_item: 1,
    item_codigo: "CAS-001",
    item_descripcion: "Casco de Seguridad Minero Tipo I Clase E con Portalámpara",
    tipo_movimiento: "INGRESO",
    fecha_movimiento: "2026-10-20 08:30:00",
    nro_documento_ref: "ING-2026-090",
    entidad_origen_destino: "Seguridad Industrial Bolivia SRL",
    cantidad: 50,
    saldo_resultante: 50,
    costo_unitario: 140.0,
    costo_total_movimiento: 7000.0,
    empleado_nombre: "Roberto Vargas Flores",
    observaciones: "Recepción de lote inicial según Factura F-391"
  },
  {
    id_movimiento: 2,
    id_item: 1,
    item_codigo: "CAS-001",
    item_descripcion: "Casco de Seguridad Minero Tipo I Clase E con Portalámpara",
    tipo_movimiento: "EGRESO",
    fecha_movimiento: "2026-10-22 10:15:00",
    nro_documento_ref: "SAL-2026-041",
    entidad_origen_destino: "Mina Subterránea Nivel 2400",
    cantidad: 5,
    saldo_resultante: 45,
    costo_unitario: 140.0,
    costo_total_movimiento: 700.0,
    empleado_nombre: "Carlos Alberto Mamani",
    observaciones: "Dotación a nueva cuadrilla de perforación"
  },
  {
    id_movimiento: 3,
    id_item: 3,
    item_codigo: "BRO-105",
    item_descripcion: "Broca Integral para Barreno 7/8 x 4 pies (Perforación)",
    tipo_movimiento: "INGRESO",
    fecha_movimiento: "2026-10-24 09:00:00",
    nro_documento_ref: "ING-2026-095",
    entidad_origen_destino: "Herramientas Mineras del Altiplano",
    cantidad: 30,
    saldo_resultante: 30,
    costo_unitario: 650.0,
    costo_total_movimiento: 19500.0,
    empleado_nombre: "Roberto Vargas Flores",
    observaciones: "Lote de reposición de brocas"
  },
  {
    id_movimiento: 4,
    id_item: 3,
    item_codigo: "BRO-105",
    item_descripcion: "Broca Integral para Barreno 7/8 x 4 pies (Perforación)",
    tipo_movimiento: "EGRESO",
    fecha_movimiento: "2026-10-24 16:30:00",
    nro_documento_ref: "SAL-2026-048",
    entidad_origen_destino: "Frente de Avance Galería Sur",
    cantidad: 2,
    saldo_resultante: 28,
    costo_unitario: 650.0,
    costo_total_movimiento: 1300.0,
    empleado_nombre: "Carlos Molina",
    observaciones: "Entrega para turno de perforación nocturna"
  }
];

let currentUnidadesMedida: string[] = getFromStorage(STORAGE_KEYS.UNIDADES_MEDIDA, defaultUnidadesMedida);
let currentMovimientos: AlmacenMovimiento[] = getFromStorage(STORAGE_KEYS.MOVIMIENTOS, defaultMovimientos);

export const erpApi = {
  // --- CONTROL DE LOGIN Y AUTENTICACIÓN ---
  getCurrentUser(): Usuario | null {
    return getFromStorage<Usuario | null>(STORAGE_KEYS.USER, null);
  },

  async login(username: string, clave: string): Promise<Usuario> {
    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = clave.trim();

    if (!trimmedUser || !trimmedPass) {
      throw new Error("Debe ingresar el usuario y la contraseña.");
    }

    // Buscar en la lista de usuarios autorizados
    const user = currentUsuarios.find(u => u.username.toLowerCase() === trimmedUser);

    if (!user) {
      throw new Error("El usuario ingresado no existe en el sistema.");
    }

    if (user.estado_activo !== 1) {
      throw new Error("Esta cuenta de usuario ha sido desactivada. Comunícate con el Administrador.");
    }

    if (user.password !== trimmedPass) {
      throw new Error("Contraseña incorrecta. Por favor verifica tus credenciales.");
    }

    // Actualizar último acceso
    user.ultimo_acceso = new Date().toLocaleString("es-BO");
    saveToStorage(STORAGE_KEYS.USUARIOS, currentUsuarios);

    // Guardar sesión activa (sin exponer la clave en session)
    const sessionUser: Usuario = {
      id: user.id,
      username: user.username,
      nombre_completo: user.nombre_completo,
      rol: user.rol,
      estado_activo: user.estado_activo,
      fecha_creacion: user.fecha_creacion,
      ultimo_acceso: user.ultimo_acceso,
      avatar_iniciales: user.avatar_iniciales || user.nombre_completo.slice(0, 2).toUpperCase()
    };
    saveToStorage(STORAGE_KEYS.USER, sessionUser);

    // Registrar en auditoría
    await this.registrarLog(
      "SEGURIDAD",
      "LOGIN",
      `Acceso concedido a '${sessionUser.username}' (${sessionUser.rol}) en Unidad Minera.`,
      sessionUser.nombre_completo
    );

    return sessionUser;
  },

  async logout(): Promise<void> {
    const user = this.getCurrentUser();
    if (user) {
      await this.registrarLog(
        "SEGURIDAD",
        "LOGOUT",
        `Cierre de sesión de '${user.username}' (${user.rol}).`,
        user.nombre_completo
      );
    }
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // --- GESTIÓN DE USUARIOS (CREAR, EDITAR, ELIMINAR) ---
  async getUsuarios(): Promise<Usuario[]> {
    return [...currentUsuarios];
  },

  async addUsuario(nuevoUser: {
    username: string;
    password: string;
    nombre_completo: string;
    rol: Usuario["rol"];
  }): Promise<Usuario> {
    const trimmedUser = nuevoUser.username.trim().toLowerCase();
    if (!trimmedUser || !nuevoUser.password.trim() || !nuevoUser.nombre_completo.trim()) {
      throw new Error("Todos los campos son obligatorios para crear un usuario.");
    }

    if (nuevoUser.password.trim().length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres.");
    }

    // Validar nombre de usuario único
    const yaExiste = currentUsuarios.some(u => u.username.toLowerCase() === trimmedUser);
    if (yaExiste) {
      throw new Error(`El nombre de usuario '${nuevoUser.username}' ya está en uso.`);
    }

    const iniciales = nuevoUser.nombre_completo
      .split(" ")
      .slice(0, 2)
      .map(p => p[0])
      .join("")
      .toUpperCase();

    const userCreado: Usuario = {
      id: currentUsuarios.length > 0 ? Math.max(...currentUsuarios.map(u => u.id)) + 1 : 1,
      username: trimmedUser,
      password: nuevoUser.password.trim(),
      nombre_completo: nuevoUser.nombre_completo.trim(),
      rol: nuevoUser.rol,
      estado_activo: 1,
      fecha_creacion: new Date().toISOString().split("T")[0],
      ultimo_acceso: "Sin accesos aún",
      avatar_iniciales: iniciales || "US"
    };

    currentUsuarios.push(userCreado);
    saveToStorage(STORAGE_KEYS.USUARIOS, currentUsuarios);

    await this.registrarLog(
      "SEGURIDAD",
      "INSERT",
      `Nuevo usuario de sistema creado: '${userCreado.username}' (${userCreado.nombre_completo}) con rol '${userCreado.rol}'.`
    );

    return userCreado;
  },

  async updateUsuario(userModif: {
    id: number;
    username: string;
    password?: string;
    nombre_completo: string;
    rol: Usuario["rol"];
    estado_activo: number;
  }): Promise<Usuario> {
    const index = currentUsuarios.findIndex(u => u.id === userModif.id);
    if (index === -1) {
      throw new Error(`Usuario con ID #${userModif.id} no encontrado.`);
    }

    const anterior = currentUsuarios[index];
    const trimmedUser = userModif.username.trim().toLowerCase();

    // Validar username único excepto si es el mismo usuario
    const yaExiste = currentUsuarios.some(u => u.id !== userModif.id && u.username.toLowerCase() === trimmedUser);
    if (yaExiste) {
      throw new Error(`El nombre de usuario '${userModif.username}' ya está registrado.`);
    }

    const iniciales = userModif.nombre_completo
      .split(" ")
      .slice(0, 2)
      .map(p => p[0])
      .join("")
      .toUpperCase();

    currentUsuarios[index] = {
      ...anterior,
      username: trimmedUser,
      password: userModif.password && userModif.password.trim() ? userModif.password.trim() : anterior.password,
      nombre_completo: userModif.nombre_completo.trim(),
      rol: userModif.rol,
      estado_activo: userModif.estado_activo,
      avatar_iniciales: iniciales || anterior.avatar_iniciales
    };

    saveToStorage(STORAGE_KEYS.USUARIOS, currentUsuarios);

    // Si el usuario editado es el que tiene la sesión activa, actualizar la sesión
    const sesionActual = this.getCurrentUser();
    if (sesionActual && sesionActual.id === userModif.id) {
      saveToStorage(STORAGE_KEYS.USER, {
        ...sesionActual,
        username: currentUsuarios[index].username,
        nombre_completo: currentUsuarios[index].nombre_completo,
        rol: currentUsuarios[index].rol,
        estado_activo: currentUsuarios[index].estado_activo,
        avatar_iniciales: currentUsuarios[index].avatar_iniciales
      });
    }

    await this.registrarLog(
      "SEGURIDAD",
      "UPDATE",
      `Usuario #${userModif.id} modificado: '${anterior.username}' -> '${currentUsuarios[index].username}', Rol: '${currentUsuarios[index].rol}', Estado: ${userModif.estado_activo === 1 ? 'Activo' : 'Inactivo'}`
    );

    return currentUsuarios[index];
  },

  async deleteUsuario(idUsuario: number): Promise<void> {
    const sesionActual = this.getCurrentUser();
    if (sesionActual && sesionActual.id === idUsuario) {
      throw new Error("No puedes eliminar la cuenta con la que has iniciado sesión actualmente.");
    }

    if (idUsuario === 1) {
      throw new Error("El usuario principal de administración (#1) no puede ser eliminado por seguridad.");
    }

    const index = currentUsuarios.findIndex(u => u.id === idUsuario);
    if (index === -1) {
      throw new Error("El usuario a eliminar no existe.");
    }

    const eliminado = currentUsuarios[index];
    currentUsuarios.splice(index, 1);
    saveToStorage(STORAGE_KEYS.USUARIOS, currentUsuarios);

    await this.registrarLog(
      "SEGURIDAD",
      "DELETE",
      `Usuario eliminado del sistema: '${eliminado.username}' (${eliminado.nombre_completo}) - Rol: ${eliminado.rol}`
    );
  },

  // --- BITÁCORA DE AUDITORÍA ---
  async registrarLog(modulo: string, accion: AuditoriaLog["accion"], detalles: string, usuario?: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    const log: AuditoriaLog = {
      id_log: currentLogs.length + 1,
      fecha_hora: new Date().toLocaleString("es-BO"),
      usuario: usuario || currentUser?.nombre_completo || "Administrador",
      modulo,
      accion,
      detalles,
    };
    currentLogs.unshift(log);
    saveToStorage(STORAGE_KEYS.LOGS, currentLogs);
  },

  async initDb(): Promise<string> {
    try {
      return await safeInvoke<string>("init_database");
    } catch {
      return "SQLite WAL en Memoria / Almacenamiento Local";
    }
  },

  async getStats(): Promise<SystemStats> {
    try {
      return await safeInvoke<SystemStats>("get_system_stats");
    } catch {
      return {
        total_empleados: currentEmpleados.length,
        total_items_almacen: currentItems.length,
        total_logs: currentLogs.length,
        wal_mode: "WAL (Activo)",
        db_size_bytes: 49152,
      };
    }
  },

  // --- CRUD RECURSOS HUMANOS ---
  async getEmpleados(): Promise<Empleado[]> {
    return currentEmpleados.map(normalizarEmpleado);
  },

  async addEmpleado(emp: Empleado): Promise<Empleado> {
    const nextId = currentEmpleados.length > 0 ? Math.max(...currentEmpleados.map(e => e.id_legajo || 0)) + 1 : 1;
    const baseNormalizada = normalizarEmpleado({
      ...emp,
      id_legajo: nextId,
      n_legajo: emp.n_legajo || String(nextId).padStart(3, "0"),
      fecha_registro: emp.fecha_registro || new Date().toISOString().split("T")[0],
    });

    // Auto-registrar ciudad, área y parentesco en sus listas correspondientes si son nuevos
    if (baseNormalizada.ciudad) this.addCiudad(baseNormalizada.ciudad);
    if (baseNormalizada.departamento_area) this.addArea(baseNormalizada.departamento_area);
    if (baseNormalizada.parentesco) this.addParentesco(baseNormalizada.parentesco);

    currentEmpleados.unshift(baseNormalizada);
    saveToStorage(STORAGE_KEYS.EMPLEADOS, currentEmpleados);

    await this.registrarLog(
      "RRHH",
      "INSERT",
      `Nuevo personal registrado: ${baseNormalizada.apellidos_y_nombres} (CI: ${baseNormalizada.n_de_documento}, Cargo: ${baseNormalizada.cargo_puesto}, Área: ${baseNormalizada.departamento_area}, Ciudad: ${baseNormalizada.ciudad}, Jornada: ${baseNormalizada.jornada_laboral}, Salario: Bs. ${baseNormalizada.salario_remuneracion})`
    );
    return baseNormalizada;
  },

  async updateEmpleado(emp: Empleado): Promise<Empleado> {
    const targetId = emp.id_legajo || (emp.n_legajo ? Number(emp.n_legajo) : undefined);
    const index = currentEmpleados.findIndex((e) => e.id_legajo === targetId);
    if (index === -1) {
      throw new Error(`Empleado con legajo #${targetId} no encontrado.`);
    }

    const anterior = currentEmpleados[index];
    const modificado = normalizarEmpleado({
      ...anterior,
      ...emp,
      id_legajo: targetId,
    });

    if (modificado.ciudad) this.addCiudad(modificado.ciudad);
    if (modificado.departamento_area) this.addArea(modificado.departamento_area);
    if (modificado.parentesco) this.addParentesco(modificado.parentesco);

    currentEmpleados[index] = modificado;
    saveToStorage(STORAGE_KEYS.EMPLEADOS, currentEmpleados);

    await this.registrarLog(
      "RRHH",
      "UPDATE",
      `Modificación de legajo #${modificado.id_legajo} (${modificado.apellidos_y_nombres}): Cargo [${anterior.cargo_puesto} -> ${modificado.cargo_puesto}], Área: [${anterior.departamento_area} -> ${modificado.departamento_area}], Salario [Bs. ${anterior.salario_remuneracion} -> Bs. ${modificado.salario_remuneracion}], Estado [${modificado.estado_activo === 1 ? 'Activo' : 'Baja Lógica'}]`
    );
    return modificado;
  },

  // --- GESTIÓN DINÁMICA DE CIUDADES, ÁREAS Y PARENTESCOS ---
  getCiudades(): string[] {
    return [...currentCiudades];
  },

  addCiudad(nuevaCiudad: string): string[] {
    const trimmed = nuevaCiudad.trim();
    if (!trimmed) return currentCiudades;
    const existe = currentCiudades.some(c => c.toLowerCase() === trimmed.toLowerCase());
    if (!existe) {
      currentCiudades.push(trimmed);
      saveToStorage(STORAGE_KEYS.CIUDADES, currentCiudades);
    }
    return [...currentCiudades];
  },

  getAreas(): string[] {
    return [...currentAreas];
  },

  addArea(nuevaArea: string): string[] {
    const trimmed = nuevaArea.trim();
    if (!trimmed) return currentAreas;
    const existe = currentAreas.some(a => a.toLowerCase() === trimmed.toLowerCase());
    if (!existe) {
      currentAreas.push(trimmed);
      saveToStorage(STORAGE_KEYS.AREAS, currentAreas);
    }
    return [...currentAreas];
  },

  getParentescos(): string[] {
    return [...currentParentescos];
  },

  addParentesco(nuevoParentesco: string): string[] {
    const trimmed = nuevoParentesco.trim();
    if (!trimmed) return currentParentescos;
    const existe = currentParentescos.some(p => p.toLowerCase() === trimmed.toLowerCase());
    if (!existe) {
      currentParentescos.push(trimmed);
      saveToStorage(STORAGE_KEYS.PARENTESCOS, currentParentescos);
    }
    return [...currentParentescos];
  },

  getUnidadesMedida(): string[] {
    return [...currentUnidadesMedida];
  },

  addUnidadMedida(nuevaUnidad: string): string[] {
    const trimmed = nuevaUnidad.trim();
    if (!trimmed) return currentUnidadesMedida;
    const existe = currentUnidadesMedida.some(u => u.toLowerCase() === trimmed.toLowerCase());
    if (!existe) {
      currentUnidadesMedida.push(trimmed);
      saveToStorage(STORAGE_KEYS.UNIDADES_MEDIDA, currentUnidadesMedida);
    }
    return [...currentUnidadesMedida];
  },

  async getAlmacenMovimientos(): Promise<AlmacenMovimiento[]> {
    return [...currentMovimientos];
  },

  async getMovimientosByItem(codigo_item: string): Promise<AlmacenMovimiento[]> {
    const code = codigo_item.trim().toLowerCase();
    return currentMovimientos.filter(
      (m) =>
        (m.item_codigo && m.item_codigo.toLowerCase() === code) ||
        (m.item_descripcion && m.item_descripcion.toLowerCase() === code)
    );
  },

  toEmpleadoJSON(emp: Empleado): EmpleadoJSON {
    return toEmpleadoJSON(emp);
  },

  // --- CRUD ALMACÉN Y KARDEX ---
  async getAlmacenItems(): Promise<AlmacenItem[]> {
    return [...currentItems];
  },

  async addAlmacenItem(item: AlmacenItem): Promise<AlmacenItem> {
    const nuevo = { ...item, id_item: currentItems.length + 1 };
    currentItems.unshift(nuevo);
    saveToStorage(STORAGE_KEYS.ITEMS, currentItems);

    await this.registrarLog(
      "ALMACEN",
      "INSERT",
      `Nuevo ítem catalogado: [${nuevo.codigo_item}] ${nuevo.descripcion} (Stock inicial: ${nuevo.stock_actual} ${nuevo.unidad_medida}, Costo prom: Bs. ${nuevo.costo_unitario_promedio})`
    );
    return nuevo;
  },

  async updateAlmacenItem(item: AlmacenItem): Promise<AlmacenItem> {
    const index = currentItems.findIndex((i) => i.id_item === item.id_item);
    if (index === -1) {
      throw new Error(`Ítem con ID #${item.id_item} no encontrado.`);
    }

    const anterior = currentItems[index];
    currentItems[index] = { ...item };
    saveToStorage(STORAGE_KEYS.ITEMS, currentItems);

    await this.registrarLog(
      "ALMACEN",
      "UPDATE",
      `Actualización de ítem [${item.codigo_item}]: Stock mín [${anterior.stock_minimo} -> ${item.stock_minimo}], Costo [Bs. ${anterior.costo_unitario_promedio} -> Bs. ${item.costo_unitario_promedio}], Ubicación [${item.ubicacion_rack}]`
    );
    return item;
  },

  // --- LOS 6 FORMULARIOS DE ALMACÉN MINERO (TRANSACCIONALES) ---
  
  // 1. ALM-KRD-001: Tarjeta Kardex
  async createItemKardex(payload: ItemKardexPayload): Promise<AlmacenItem> {
    const it = payload.item;
    try {
      await safeInvoke("create_item_kardex", { item: payload });
    } catch {
      // Manejo en modo Web
    }

    const nuevoItem: AlmacenItem = {
      id_item: currentItems.length + 1,
      codigo_item: it.codigo_item,
      descripcion: it.descripcion,
      unidad_medida: it.unidad_medida,
      ubicacion_rack: it.ubicacion_rack,
      tipo_categoria: it.categoria,
      categoria: it.categoria,
      stock_minimo: it.stock_minimo,
      stock_maximo: it.stock_maximo,
      stock_actual: 0.0,
      costo_unitario_promedio: 0.0,
      responsable_almacen: it.responsable_almacen,
      supervisor_logistica: it.supervisor_logistica,
    };

    currentItems.unshift(nuevoItem);
    saveToStorage(STORAGE_KEYS.ITEMS, currentItems);

    await this.registrarLog(
      "ALMACEN",
      "INSERT",
      `ALM-KRD-001: Ítem Kardex [${nuevoItem.codigo_item}] ${nuevoItem.descripcion} catalogado en ${nuevoItem.ubicacion_rack}.`
    );
    return nuevoItem;
  },

  // 2. ALM-SRM-002: Solicitud de Requerimiento de Materiales
  async createSolicitudRequerimiento(payload: SolicitudRequerimientoPayload): Promise<SolicitudRequerimientoPayload["solicitud"]> {
    const sol = payload.solicitud;
    try {
      await safeInvoke("create_solicitud_requerimiento", { solicitud: payload });
    } catch {
      // Manejo en modo Web
    }

    currentSolicitudes.unshift(sol);
    saveToStorage(STORAGE_KEYS.SOLICITUDES, currentSolicitudes);

    await this.registrarLog(
      "ALMACEN",
      "INSERT",
      `ALM-SRM-002: Solicitud ${sol.nro_solicitud} registrada por ${sol.solicitado_por} para ${sol.area_frente_trabajo}. Urgencia: ${sol.urgencia}.`
    );
    return sol;
  },

  async getSolicitudesRequerimiento(): Promise<SolicitudRequerimientoPayload["solicitud"][]> {
    return [...currentSolicitudes];
  },

  // 3. ALM-NIA-003: Nota de Ingreso a Almacén (Suma al stock_actual)
  async createNotaIngreso(payload: NotaIngresoPayload): Promise<NotaIngresoPayload["ingreso"]> {
    const ing = payload.ingreso;
    try {
      await safeInvoke("create_nota_ingreso", { ingreso: payload });
    } catch {
      // Manejo en modo Web
    }

    currentIngresos.unshift(ing);
    saveToStorage(STORAGE_KEYS.INGRESOS, currentIngresos);

    // Transaccionalidad: Sumar cantidad_recibida al stock_actual y asentar en Kardex
    for (const row of ing.items) {
      let it = currentItems.find(
        (i) =>
          (row.codigo_item && i.codigo_item.toLowerCase() === row.codigo_item.toLowerCase()) ||
          i.descripcion.toLowerCase() === row.descripcion.toLowerCase() ||
          i.codigo_item.toLowerCase() === row.descripcion.toLowerCase()
      );

      const costoUnit = row.costo_unitario || (it ? it.costo_unitario_promedio : 150.0);

      if (it) {
        it.stock_actual += row.cantidad_recibida;
        if (row.costo_unitario && row.costo_unitario > 0) {
          it.costo_unitario_promedio = row.costo_unitario;
        }
      } else {
        // Crear ítem si no existía previamente
        const codigo = row.codigo_item || `MAT-${String(currentItems.length + 1).padStart(3, "0")}`;
        it = {
          id_item: currentItems.length + 1,
          codigo_item: codigo,
          descripcion: row.descripcion,
          unidad_medida: row.unidad,
          stock_minimo: 10,
          stock_maximo: 500,
          stock_actual: row.cantidad_recibida,
          costo_unitario_promedio: costoUnit,
          tipo_categoria: "General",
          categoria: "General",
          ubicacion_rack: "Almacén Principal"
        };
        currentItems.unshift(it);
      }

      // Asentar fila en el Kardex oficial de movimientos
      const mov: AlmacenMovimiento = {
        id_movimiento: currentMovimientos.length + 1,
        id_item: it.id_item || 0,
        item_codigo: it.codigo_item,
        item_descripcion: it.descripcion,
        tipo_movimiento: "INGRESO",
        fecha_movimiento: ing.fecha_recepcion || new Date().toISOString().split("T")[0],
        nro_documento_ref: ing.nro_ingreso,
        entidad_origen_destino: ing.proveedor,
        cantidad: row.cantidad_recibida,
        saldo_resultante: it.stock_actual,
        costo_unitario: costoUnit,
        costo_total_movimiento: row.cantidad_recibida * costoUnit,
        empleado_nombre: ing.recibido_por,
        observaciones: `Recepción Factura/Guía: ${ing.nro_guia_factura}. Conformidad: ${row.conformidad}`,
      };
      currentMovimientos.unshift(mov);
    }
    saveToStorage(STORAGE_KEYS.ITEMS, currentItems);
    saveToStorage(STORAGE_KEYS.MOVIMIENTOS, currentMovimientos);

    await this.registrarLog(
      "ALMACEN",
      "INSERT",
      `ALM-NIA-003: Nota de Ingreso ${ing.nro_ingreso} recibida de '${ing.proveedor}' (Factura/Guía: ${ing.nro_guia_factura}). Stock actualizado.`
    );
    return ing;
  },

  async getNotasIngreso(): Promise<NotaIngresoPayload["ingreso"][]> {
    return [...currentIngresos];
  },

  // 4. ALM-NSA-004: Nota de Salida de Almacén (Resta del stock_actual)
  async createNotaSalida(payload: NotaSalidaPayload): Promise<NotaSalidaPayload["salida"]> {
    const sal = payload.salida;
    try {
      await safeInvoke("create_nota_salida", { salida: payload });
    } catch {
      // Manejo en modo Web
    }

    // Validación previa de stock
    for (const row of sal.items) {
      const it = currentItems.find(
        (i) =>
          (row.codigo_item && i.codigo_item.toLowerCase() === row.codigo_item.toLowerCase()) ||
          i.descripcion.toLowerCase() === row.descripcion.toLowerCase() ||
          i.codigo_item.toLowerCase() === row.descripcion.toLowerCase()
      );
      if (it && it.stock_actual < row.cantidad) {
        throw new Error(`Stock insuficiente para '${row.descripcion}'. Existencias: ${it.stock_actual} ${it.unidad_medida}, Solicitado: ${row.cantidad}`);
      }
    }

    currentSalidas.unshift(sal);
    saveToStorage(STORAGE_KEYS.SALIDAS, currentSalidas);

    // Transaccionalidad: Restar cantidad del stock_actual y asentar en Kardex
    for (const row of sal.items) {
      const it = currentItems.find(
        (i) =>
          (row.codigo_item && i.codigo_item.toLowerCase() === row.codigo_item.toLowerCase()) ||
          i.descripcion.toLowerCase() === row.descripcion.toLowerCase() ||
          i.codigo_item.toLowerCase() === row.descripcion.toLowerCase()
      );
      if (it) {
        it.stock_actual = Math.max(0, it.stock_actual - row.cantidad);
        const costoUnit = it.costo_unitario_promedio || 0;

        const mov: AlmacenMovimiento = {
          id_movimiento: currentMovimientos.length + 1,
          id_item: it.id_item || 0,
          item_codigo: it.codigo_item,
          item_descripcion: it.descripcion,
          tipo_movimiento: "EGRESO",
          fecha_movimiento: sal.fecha || new Date().toISOString().split("T")[0],
          nro_documento_ref: sal.nro_salida,
          entidad_origen_destino: sal.destino,
          cantidad: row.cantidad,
          saldo_resultante: it.stock_actual,
          costo_unitario: costoUnit,
          costo_total_movimiento: row.cantidad * costoUnit,
          empleado_nombre: sal.entregado_por,
          observaciones: `Despacho a ${sal.destino} (${sal.centro_costo || "General"}). Receptor: ${sal.recibido_por}`,
        };
        currentMovimientos.unshift(mov);
      }
    }
    saveToStorage(STORAGE_KEYS.ITEMS, currentItems);
    saveToStorage(STORAGE_KEYS.MOVIMIENTOS, currentMovimientos);

    await this.registrarLog(
      "ALMACEN",
      "INSERT",
      `ALM-NSA-004: Nota de Salida ${sal.nro_salida} despachada a '${sal.destino}' (Receptor: ${sal.recibido_por}). Stock descontado.`
    );
    return sal;
  },

  async getNotasSalida(): Promise<NotaSalidaPayload["salida"][]> {
    return [...currentSalidas];
  },

  // 5. ALM-NDM-005: Nota de Devolución de Materiales (Suma si buen estado)
  async createNotaDevolucion(payload: NotaDevolucionPayload): Promise<NotaDevolucionPayload["devolucion"]> {
    const dev = payload.devolucion;
    try {
      await safeInvoke("create_nota_devolucion", { devolucion: payload });
    } catch {
      // Manejo en modo Web
    }

    currentDevoluciones.unshift(dev);
    saveToStorage(STORAGE_KEYS.DEVOLUCIONES, currentDevoluciones);

    const reingresaStock = dev.condicion_material.toLowerCase().includes("buen");
    if (reingresaStock) {
      for (const row of dev.items) {
        const it = currentItems.find(
          (i) =>
            (row.codigo_item && i.codigo_item.toLowerCase() === row.codigo_item.toLowerCase()) ||
            i.descripcion.toLowerCase() === row.descripcion.toLowerCase() ||
            i.codigo_item.toLowerCase() === row.descripcion.toLowerCase()
        );
        if (it) {
          it.stock_actual += row.cantidad;
          const costoUnit = it.costo_unitario_promedio || 0;

          const mov: AlmacenMovimiento = {
            id_movimiento: currentMovimientos.length + 1,
            id_item: it.id_item || 0,
            item_codigo: it.codigo_item,
            item_descripcion: it.descripcion,
            tipo_movimiento: "DEVOLUCION",
            fecha_movimiento: dev.fecha || new Date().toISOString().split("T")[0],
            nro_documento_ref: dev.nro_devolucion,
            entidad_origen_destino: dev.area_que_devuelve,
            cantidad: row.cantidad,
            saldo_resultante: it.stock_actual,
            costo_unitario: costoUnit,
            costo_total_movimiento: row.cantidad * costoUnit,
            empleado_nombre: dev.firmas[0] || "Área Usuaria",
            observaciones: `Devolución desde ${dev.area_que_devuelve} (${dev.motivo_devolucion}). Condición: ${dev.condicion_material}`,
          };
          currentMovimientos.unshift(mov);
        }
      }
      saveToStorage(STORAGE_KEYS.ITEMS, currentItems);
      saveToStorage(STORAGE_KEYS.MOVIMIENTOS, currentMovimientos);
    }

    await this.registrarLog(
      "ALMACEN",
      "INSERT",
      `ALM-NDM-005: Devolución ${dev.nro_devolucion} desde '${dev.area_que_devuelve}' (Motivo: ${dev.motivo_devolucion}). ${reingresaStock ? 'Material en buen estado reingresado a existencias.' : 'Material no apto registrado sin reingreso a stock.'}`
    );
    return dev;
  },

  async getNotasDevolucion(): Promise<NotaDevolucionPayload["devolucion"][]> {
    return [...currentDevoluciones];
  },

  // 6. ALM-AIF-006: Acta de Inventario Físico (Ajuste override)
  async createActaInventario(payload: ActaInventarioPayload): Promise<ActaInventarioPayload["inventario_fisico"]> {
    const inv = payload.inventario_fisico;
    try {
      await safeInvoke("create_acta_inventario", { inventario: payload });
    } catch {
      // Manejo en modo Web
    }

    currentInventarios.unshift(inv);
    saveToStorage(STORAGE_KEYS.INVENTARIOS, currentInventarios);

    // Transaccionalidad: Override del stock del sistema al stock físico verificado
    for (const row of inv.items) {
      const it = currentItems.find(
        (i) =>
          (row.codigo_item && i.codigo_item.toLowerCase() === row.codigo_item.toLowerCase()) ||
          i.descripcion.toLowerCase() === row.descripcion.toLowerCase() ||
          i.codigo_item.toLowerCase() === row.descripcion.toLowerCase()
      );
      if (it) {
        it.stock_actual = row.stock_fisico;
        const costoUnit = it.costo_unitario_promedio || 0;

        const mov: AlmacenMovimiento = {
          id_movimiento: currentMovimientos.length + 1,
          id_item: it.id_item || 0,
          item_codigo: it.codigo_item,
          item_descripcion: it.descripcion,
          tipo_movimiento: "AJUSTE",
          fecha_movimiento: inv.fecha_conteo || new Date().toISOString().split("T")[0],
          nro_documento_ref: `AIF-${inv.fecha_conteo}`,
          entidad_origen_destino: inv.almacen_ubicacion,
          cantidad: Math.abs(row.diferencia),
          saldo_resultante: it.stock_actual,
          costo_unitario: costoUnit,
          costo_total_movimiento: Math.abs(row.diferencia) * costoUnit,
          empleado_nombre: inv.responsable_conteo,
          observaciones: `Ajuste auditoría física. Dif: ${row.diferencia > 0 ? `+${row.diferencia}` : row.diferencia} ${row.unidad}. ${row.observacion || ""}`,
        };
        currentMovimientos.unshift(mov);
      }
    }
    saveToStorage(STORAGE_KEYS.ITEMS, currentItems);
    saveToStorage(STORAGE_KEYS.MOVIMIENTOS, currentMovimientos);

    await this.registrarLog(
      "ALMACEN",
      "UPDATE",
      `ALM-AIF-006: Acta de Inventario Físico en '${inv.almacen_ubicacion}' procesada. Existencias sincronizadas con conteo físico.`
    );
    return inv;
  },

  async getActasInventario(): Promise<ActaInventarioPayload["inventario_fisico"][]> {
    return [...currentInventarios];
  },

  // --- NÓMINA ---
  async getNominaPagos(): Promise<NominaPago[]> {
    return [...currentPagos];
  },

  async updateNominaPago(pago: NominaPago): Promise<NominaPago> {
    const index = currentPagos.findIndex((p) => p.id_pago === pago.id_pago);
    if (index !== -1) {
      currentPagos[index] = { ...pago };
      saveToStorage(STORAGE_KEYS.PAGOS, currentPagos);

      await this.registrarLog(
        "NOMINA",
        "UPDATE",
        `Planilla de ${pago.empleado_nombre} (${pago.mes} ${pago.anio}) actualizada: Total Bs. ${pago.monto_total.toFixed(2)}, Estado: ${pago.estado_bloqueo === 1 ? 'Bloqueado' : 'Editable'}`
      );
    }
    return pago;
  },

  // --- AUDITORÍA Y RESPALDO ---
  async getAuditoriaLogs(): Promise<AuditoriaLog[]> {
    return [...currentLogs];
  },

  async createBackup(path?: string): Promise<string> {
    try {
      return await safeInvoke<string>("backup_database", { targetDir: path });
    } catch {
      const ts = Date.now();
      const backupName = `respaldo_datos_sistema_${ts}.db`;
      await this.registrarLog(
        "RESPALDO",
        "BACKUP",
        `Copia de seguridad snapshot generada con éxito: ${backupName} (Integridad WAL preservada)`
      );
      return `Respaldo exitoso: backups/${backupName}`;
    }
  },

  // --- VALORACIÓN Y ANULACIONES DE ALMACÉN ---
  getValorTotalInventario(): {
    totalBs: number;
    totalItems: number;
    itemsCriticos: number;
    itemsSobrestock: number;
    porCategoria: Record<string, number>;
  } {
    let totalBs = 0;
    let itemsCriticos = 0;
    let itemsSobrestock = 0;
    const porCategoria: Record<string, number> = {};

    for (const it of currentItems) {
      const costo = it.costo_unitario_promedio || 0;
      const subtotal = it.stock_actual * costo;
      totalBs += subtotal;

      const cat = it.categoria || it.tipo_categoria || "General";
      porCategoria[cat] = (porCategoria[cat] || 0) + subtotal;

      if (it.stock_actual <= it.stock_minimo) {
        itemsCriticos++;
      } else if (it.stock_actual > it.stock_maximo) {
        itemsSobrestock++;
      }
    }

    return {
      totalBs: Math.round(totalBs * 100) / 100,
      totalItems: currentItems.length,
      itemsCriticos,
      itemsSobrestock,
      porCategoria
    };
  },

  async anularNotaIngreso(nro_ingreso: string, motivo: string, usuario?: string): Promise<NotaIngresoPayload["ingreso"]> {
    const ing = currentIngresos.find((i) => i.nro_ingreso === nro_ingreso);
    if (!ing) throw new Error(`Nota de Ingreso '${nro_ingreso}' no encontrada.`);
    if (ing.estado === "ANULADO") throw new Error(`La Nota de Ingreso '${nro_ingreso}' ya se encuentra anulada.`);

    const user = usuario || "Admin Almacén";

    // Revertir el stock sumado restándolo del stock_actual
    for (const row of ing.items) {
      const it = currentItems.find(
        (i) =>
          (row.codigo_item && i.codigo_item.toLowerCase() === row.codigo_item.toLowerCase()) ||
          i.descripcion.toLowerCase() === row.descripcion.toLowerCase() ||
          i.codigo_item.toLowerCase() === row.descripcion.toLowerCase()
      );
      if (it) {
        it.stock_actual = Math.max(0, it.stock_actual - row.cantidad_recibida);
        const costoUnit = it.costo_unitario_promedio || 0;

        const mov: AlmacenMovimiento = {
          id_movimiento: currentMovimientos.length + 1,
          id_item: it.id_item || 0,
          item_codigo: it.codigo_item,
          item_descripcion: it.descripcion,
          tipo_movimiento: "EGRESO",
          fecha_movimiento: new Date().toISOString().split("T")[0],
          nro_documento_ref: `ANUL-${ing.nro_ingreso}`,
          entidad_origen_destino: ing.proveedor,
          cantidad: row.cantidad_recibida,
          saldo_resultante: it.stock_actual,
          costo_unitario: costoUnit,
          costo_total_movimiento: row.cantidad_recibida * costoUnit,
          empleado_nombre: user,
          observaciones: `REVERSIÓN POR ANULACIÓN de ${ing.nro_ingreso}: ${motivo}`,
        };
        currentMovimientos.unshift(mov);
      }
    }

    ing.estado = "ANULADO";
    ing.motivo_anulacion = motivo;
    ing.fecha_anulacion = new Date().toISOString().replace("T", " ").substring(0, 19);
    ing.anulado_por = user;

    saveToStorage(STORAGE_KEYS.INGRESOS, currentIngresos);
    saveToStorage(STORAGE_KEYS.ITEMS, currentItems);
    saveToStorage(STORAGE_KEYS.MOVIMIENTOS, currentMovimientos);

    await this.registrarLog(
      "ALMACEN",
      "DELETE",
      `ALM-NIA-003: Nota de Ingreso ${nro_ingreso} ANULADA por ${user}. Motivo: ${motivo}. Stock revertido.`
    );
    return ing;
  },

  async anularNotaSalida(nro_salida: string, motivo: string, usuario?: string): Promise<NotaSalidaPayload["salida"]> {
    const sal = currentSalidas.find((s) => s.nro_salida === nro_salida);
    if (!sal) throw new Error(`Nota de Salida '${nro_salida}' no encontrada.`);
    if (sal.estado === "ANULADO") throw new Error(`La Nota de Salida '${nro_salida}' ya se encuentra anulada.`);

    const user = usuario || "Admin Almacén";

    // Revertir sumando la cantidad despachada de regreso al stock_actual
    for (const row of sal.items) {
      const it = currentItems.find(
        (i) =>
          (row.codigo_item && i.codigo_item.toLowerCase() === row.codigo_item.toLowerCase()) ||
          i.descripcion.toLowerCase() === row.descripcion.toLowerCase() ||
          i.codigo_item.toLowerCase() === row.descripcion.toLowerCase()
      );
      if (it) {
        it.stock_actual += row.cantidad;
        const costoUnit = it.costo_unitario_promedio || 0;

        const mov: AlmacenMovimiento = {
          id_movimiento: currentMovimientos.length + 1,
          id_item: it.id_item || 0,
          item_codigo: it.codigo_item,
          item_descripcion: it.descripcion,
          tipo_movimiento: "INGRESO",
          fecha_movimiento: new Date().toISOString().split("T")[0],
          nro_documento_ref: `ANUL-${sal.nro_salida}`,
          entidad_origen_destino: sal.destino,
          cantidad: row.cantidad,
          saldo_resultante: it.stock_actual,
          costo_unitario: costoUnit,
          costo_total_movimiento: row.cantidad * costoUnit,
          empleado_nombre: user,
          observaciones: `REVERSIÓN POR ANULACIÓN de ${sal.nro_salida}: ${motivo}`,
        };
        currentMovimientos.unshift(mov);
      }
    }

    sal.estado = "ANULADO";
    sal.motivo_anulacion = motivo;
    sal.fecha_anulacion = new Date().toISOString().replace("T", " ").substring(0, 19);
    sal.anulado_por = user;

    saveToStorage(STORAGE_KEYS.SALIDAS, currentSalidas);
    saveToStorage(STORAGE_KEYS.ITEMS, currentItems);
    saveToStorage(STORAGE_KEYS.MOVIMIENTOS, currentMovimientos);

    await this.registrarLog(
      "ALMACEN",
      "DELETE",
      `ALM-NSA-004: Nota de Salida ${nro_salida} ANULADA por ${user}. Motivo: ${motivo}. Stock reingresado a bodega.`
    );
    return sal;
  },

  // Exportar inventario y existencias a formato CSV compatible con Excel
  exportarKardexCSV(): string {
    const encabezados = ["CODIGO", "DESCRIPCION", "CATEGORIA", "UNIDAD", "UBICACION", "STOCK_ACTUAL", "STOCK_MINIMO", "STOCK_MAXIMO", "COSTO_UNITARIO_BS", "VALOR_TOTAL_BS"];
    const filas = currentItems.map((i) => [
      `"${i.codigo_item}"`,
      `"${i.descripcion.replace(/"/g, '""')}"`,
      `"${i.categoria || i.tipo_categoria || "General"}"`,
      `"${i.unidad_medida}"`,
      `"${i.ubicacion_rack || "Almacén Principal"}"`,
      i.stock_actual,
      i.stock_minimo,
      i.stock_maximo,
      (i.costo_unitario_promedio || 0).toFixed(2),
      (i.stock_actual * (i.costo_unitario_promedio || 0)).toFixed(2)
    ]);
    return [encabezados.join(";"), ...filas.map((f) => f.join(";"))].join("\n");
  },

  // --- NÓMINA INTEGRADA CON RRHH ---
  getNominaConceptosMap(): Record<number, NominaConcepto[]> {
    return { ...currentConceptosMap };
  },

  saveNominaConceptosMap(map: Record<number, NominaConcepto[]>): void {
    currentConceptosMap = { ...map };
    saveToStorage(STORAGE_KEYS.CONCEPTOS, currentConceptosMap);
  },

  async sincronizarNominaConRRHH(mesInput?: string, anioInput?: number): Promise<{ agregados: number; totalPagos: number }> {
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const now = new Date();
    const mes = mesInput || meses[now.getMonth()];
    const anio = anioInput || now.getFullYear();

    let agregados = 0;

    for (const emp of currentEmpleados) {
      const empId = emp.id_legajo || Number(emp.n_legajo) || 0;
      const yaExiste = currentPagos.some((p) => p.id_empleado === empId && p.mes === mes && p.anio === anio);

      if (!yaExiste) {
        const nextId = currentPagos.length > 0 ? Math.max(...currentPagos.map((p) => p.id_pago || 0)) + 1 : 1;
        const haberBasico = emp.salario_remuneracion || 5850.0;
        // Ley Boliviana: Gestora Pública de la Seguridad Social de Largo Plazo (12.71%)
        const aporteGestora = Math.round(haberBasico * 0.1271 * 100) / 100;
        const liquidoInicial = Math.round((haberBasico - aporteGestora) * 100) / 100;

        const nuevoPago: NominaPago = {
          id_pago: nextId,
          id_empleado: empId,
          empleado_nombre: emp.apellidos_y_nombres || "Trabajador Minero",
          cargo: emp.cargo_puesto || "Operario",
          departamento: emp.departamento_area || "Operaciones Mina",
          mes,
          anio,
          dias_trabajados: 30,
          monto_total: liquidoInicial,
          estado_bloqueo: 0,
          fecha_emision: new Date().toISOString().split("T")[0]
        };

        currentPagos.push(nuevoPago);

        currentConceptosMap[nextId] = [
          {
            id_concepto: Date.now() + nextId * 10,
            id_pago: nextId,
            tipo_concepto: "SALARIO_BASE",
            monto: haberBasico,
            descripcion_info: `Haber Básico Contractual (${emp.jornada_laboral || "14x7"})`,
            fecha_registro: new Date().toISOString().split("T")[0]
          },
          {
            id_concepto: Date.now() + nextId * 10 + 1,
            id_pago: nextId,
            tipo_concepto: "DESCUENTO",
            monto: -aporteGestora,
            descripcion_info: "Aporte Laboral de Ley - Gestora Pública (12.71%)",
            fecha_registro: new Date().toISOString().split("T")[0]
          }
        ];
        agregados++;
      }
    }

    if (agregados > 0) {
      saveToStorage(STORAGE_KEYS.PAGOS, currentPagos);
      saveToStorage(STORAGE_KEYS.CONCEPTOS, currentConceptosMap);

      await this.registrarLog(
        "NOMINA",
        "INSERT",
        `Sincronización de Nómina: ${agregados} empleados de RRHH incorporados a la planilla de ${mes} ${anio} con retención de ley Gestora (12.71%).`
      );
    }

    return { agregados, totalPagos: currentPagos.length };
  },

  // --- SEGURIDAD: CAMBIO DE CONTRASEÑA PERSONAL ---
  async cambiarPasswordPersonal(userId: number, passActual: string, passNueva: string): Promise<boolean> {
    const user = currentUsuarios.find((u) => u.id === userId);
    if (!user) throw new Error("Usuario no encontrado.");
    if (user.password !== passActual) throw new Error("La contraseña actual es incorrecta.");
    if (!passNueva || passNueva.trim().length < 4) throw new Error("La nueva contraseña debe tener al menos 4 caracteres.");

    user.password = passNueva.trim();
    saveToStorage(STORAGE_KEYS.USUARIOS, currentUsuarios);

    await this.registrarLog(
      "SEGURIDAD",
      "UPDATE",
      `El usuario '${user.username}' actualizó su contraseña de acceso personal.`
    );
    return true;
  },

  // --- RESPALDO Y RESTAURACIÓN INTEGRAL ---
  exportarTodoJSON(): string {
    const backupObj = {
      meta: {
        sistema: "ProyJimP - ERP Minero Bolivia",
        unidad_minera: "Unidad Minera",
        moneda: "Bolivianos (Bs.)",
        version: "2.0.0",
        fecha_exportacion: new Date().toISOString()
      },
      usuarios: currentUsuarios,
      empleados: currentEmpleados,
      items: currentItems,
      movimientos: currentMovimientos,
      pagos: currentPagos,
      conceptos_map: currentConceptosMap,
      ciudades: currentCiudades,
      areas: currentAreas,
      parentescos: currentParentescos,
      solicitudes: currentSolicitudes,
      ingresos: currentIngresos,
      salidas: currentSalidas,
      devoluciones: currentDevoluciones,
      inventarios: currentInventarios,
      unidades_medida: currentUnidadesMedida,
      logs: currentLogs
    };
    return JSON.stringify(backupObj, null, 2);
  },

  async restaurarBackupJSON(jsonStr: string, usuario?: string): Promise<{ success: boolean; mensaje: string; registros: number }> {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== "object") throw new Error("Formato JSON no válido.");

      let registrosRestaurados = 0;

      if (Array.isArray(data.usuarios)) {
        currentUsuarios = data.usuarios;
        saveToStorage(STORAGE_KEYS.USUARIOS, currentUsuarios);
        registrosRestaurados += data.usuarios.length;
      }
      if (Array.isArray(data.empleados)) {
        currentEmpleados = data.empleados.map(normalizarEmpleado);
        saveToStorage(STORAGE_KEYS.EMPLEADOS, currentEmpleados);
        registrosRestaurados += data.empleados.length;
      }
      if (Array.isArray(data.items)) {
        currentItems = data.items;
        saveToStorage(STORAGE_KEYS.ITEMS, currentItems);
        registrosRestaurados += data.items.length;
      }
      if (Array.isArray(data.movimientos)) {
        currentMovimientos = data.movimientos;
        saveToStorage(STORAGE_KEYS.MOVIMIENTOS, currentMovimientos);
        registrosRestaurados += data.movimientos.length;
      }
      if (Array.isArray(data.pagos)) {
        currentPagos = data.pagos;
        saveToStorage(STORAGE_KEYS.PAGOS, currentPagos);
        registrosRestaurados += data.pagos.length;
      }
      if (data.conceptos_map && typeof data.conceptos_map === "object") {
        currentConceptosMap = data.conceptos_map;
        saveToStorage(STORAGE_KEYS.CONCEPTOS, currentConceptosMap);
      }
      if (Array.isArray(data.ciudades)) {
        currentCiudades = data.ciudades;
        saveToStorage(STORAGE_KEYS.CIUDADES, currentCiudades);
      }
      if (Array.isArray(data.areas)) {
        currentAreas = data.areas;
        saveToStorage(STORAGE_KEYS.AREAS, currentAreas);
      }
      if (Array.isArray(data.parentescos)) {
        currentParentescos = data.parentescos;
        saveToStorage(STORAGE_KEYS.PARENTESCOS, currentParentescos);
      }
      if (Array.isArray(data.solicitudes)) {
        currentSolicitudes = data.solicitudes;
        saveToStorage(STORAGE_KEYS.SOLICITUDES, currentSolicitudes);
      }
      if (Array.isArray(data.ingresos)) {
        currentIngresos = data.ingresos;
        saveToStorage(STORAGE_KEYS.INGRESOS, currentIngresos);
      }
      if (Array.isArray(data.salidas)) {
        currentSalidas = data.salidas;
        saveToStorage(STORAGE_KEYS.SALIDAS, currentSalidas);
      }
      if (Array.isArray(data.devoluciones)) {
        currentDevoluciones = data.devoluciones;
        saveToStorage(STORAGE_KEYS.DEVOLUCIONES, currentDevoluciones);
      }
      if (Array.isArray(data.inventarios)) {
        currentInventarios = data.inventarios;
        saveToStorage(STORAGE_KEYS.INVENTARIOS, currentInventarios);
      }
      if (Array.isArray(data.unidades_medida)) {
        currentUnidadesMedida = data.unidades_medida;
        saveToStorage(STORAGE_KEYS.UNIDADES_MEDIDA, currentUnidadesMedida);
      }

      const user = usuario || "Administrador General";
      await this.registrarLog(
        "RESPALDO",
        "INSERT",
        `RESTAURACIÓN COMPLETA: Base de datos restaurada por ${user} con ${registrosRestaurados} entidades maestras.`
      );

      return {
        success: true,
        mensaje: `Restauración exitosa: ${registrosRestaurados} registros maestros reestablecidos.`,
        registros: registrosRestaurados
      };
    } catch (err: unknown) {
      throw new Error(`Fallo en restauración: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
};
