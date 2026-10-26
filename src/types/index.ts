export type Modulo = "RRHH" | "NOMINA" | "ALMACEN" | "SEGURIDAD" | "RESPALDO";

export interface Usuario {
  id: number;
  username: string;
  password?: string;
  nombre_completo: string;
  rol: "Administrador General" | "Supervisor SSOMA" | "Encargado de Almacén" | "Operador de Nómina";
  estado_activo: number; // 1: Activo, 0: Inactivo
  fecha_creacion?: string;
  ultimo_acceso?: string;
  avatar_iniciales?: string;
}

export interface Empleado {
  // Encabezado
  id_legajo?: number;
  n_legajo?: string | number;
  fecha_registro?: string;

  // Datos Personales
  apellidos_y_nombres?: string;
  apellidos_nombres?: string; // Compatibilidad bidireccional
  tipo_de_documento?: string; // CI, PASAPORTE, EXTRANJERO
  tipo_documento?: string;
  n_de_documento?: string;
  nro_documento?: string; // Compatibilidad bidireccional
  fecha_de_nacimiento?: string;
  fecha_nacimiento?: string;
  nacionalidad?: string;
  estado_civil?: string;
  sexo?: string;
  direccion_domiciliaria?: string;
  ciudad?: string;
  codigo_postal?: string;
  telefono?: string;
  correo_electronico?: string;

  // Datos Laborales
  cargo_puesto: string;
  departamento_area?: string;
  fecha_de_ingreso?: string;
  fecha_ingreso?: string;
  tipo_de_contrato?: string;
  tipo_contrato?: string;
  jornada_laboral?: string;
  horario_de_trabajo?: string;
  horario_trabajo?: string;
  salario_remuneracion: number; // En Bolivianos (Bs.)
  supervisor_inmediato?: string;
  lugar_de_trabajo?: string;
  lugar_trabajo?: string;
  modalidad?: string;

  // Contacto de Emergencia
  nombre_completo?: string; // Nombre del contacto de urgencia
  emergencia_nombre?: string;
  parentesco?: string;
  emergencia_parentesco?: string;
  emergencia_telefono?: string;
  telefono_emergencia?: string;
  emergencia_direccion?: string;
  direccion_emergencia?: string;

  // Datos Adicionales
  nivel_de_estudios?: string;
  nivel_estudios?: string;
  profesion_titulo?: string;
  n_de_seguro_social?: string; // CNS (Caja Nacional de Salud)
  nro_seguro_social?: string;
  grupo_sanguineo?: string;
  observaciones?: string;

  estado_activo: number; // 1: Activo, 0: Inactivo
}

export interface EmpleadoJSON {
  empleado: {
    encabezado: {
      n_legajo: string;
      fecha_registro: string;
    };
    datos_personales: {
      apellidos_y_nombres: string;
      tipo_de_documento: string;
      n_de_documento: string;
      fecha_de_nacimiento: string;
      nacionalidad: string;
      estado_civil: string;
      sexo: string;
      direccion_domiciliaria: string;
      ciudad: string;
      codigo_postal: string;
      telefono: string;
      correo_electronico: string;
    };
    datos_laborales: {
      cargo_puesto: string;
      departamento_area: string;
      fecha_de_ingreso: string;
      tipo_de_contrato: string;
      jornada_laboral: string;
      horario_de_trabajo: string;
      salario_remuneracion: number;
      supervisor_inmediato: string;
      lugar_de_trabajo: string;
      modalidad: string;
    };
    contacto_emergencia: {
      nombre_completo: string;
      parentesco: string;
      telefono: string;
      direccion: string;
    };
    datos_adicionales: {
      nivel_de_estudios: string;
      profesion_titulo: string;
      n_de_seguro_social: string;
      grupo_sanguineo: string;
      observaciones: string;
    };
  };
}

export interface NominaPago {
  id_pago?: number;
  id_empleado: number;
  empleado_nombre?: string;
  cargo?: string;
  departamento?: string;
  mes: string;
  anio: number;
  dias_trabajados?: number;
  monto_total: number; // En Bolivianos (Bs.)
  estado_bloqueo: number; // 1: Bloqueado, 0: Editable
  fecha_emision?: string;
}

export interface NominaConcepto {
  id_concepto?: number;
  id_pago: number;
  tipo_concepto: "SALARIO_BASE" | "DESCUENTO" | "ADELANTO";
  monto: number; // En Bolivianos (Bs.)
  descripcion_info?: string;
  fecha_registro?: string;
}

export interface AlmacenItem {
  id_item?: number;
  codigo_item: string;
  descripcion: string;
  tipo_categoria?: string;
  categoria?: string; // ALM-KRD-001
  unidad_medida: string;
  ubicacion_rack?: string;
  stock_minimo: number;
  stock_maximo: number;
  stock_actual: number;
  costo_unitario_promedio: number; // En Bolivianos (Bs.)
  responsable_almacen?: string;
  supervisor_logistica?: string;
}

// --------------------------------------------------------------------------------
// ESTRUCTURAS JSON OFICIALES DE ALMACÉN (MINERÍA)
// --------------------------------------------------------------------------------

// 1. ALM-KRD-001: Tarjeta Kardex
export interface ItemKardexPayload {
  item: {
    codigo_item: string;
    descripcion: string;
    unidad_medida: string;
    ubicacion_rack: string;
    categoria: string;
    stock_minimo: number;
    stock_maximo: number;
    responsable_almacen: string;
    supervisor_logistica: string;
  };
}

// 2. ALM-SRM-002: Solicitud de Requerimiento de Materiales
export interface SolicitudRequerimientoItem {
  codigo_item?: string;
  descripcion: string;
  unidad: string;
  cantidad_solicitada: number;
  cantidad_entregada: number;
  observaciones?: string;
}

export interface SolicitudRequerimientoPayload {
  solicitud: {
    nro_solicitud: string;
    fecha: string;
    area_frente_trabajo: string;
    centro_costo: string;
    solicitado_por: string;
    cargo: string;
    urgencia: string;
    motivo: string;
    items: SolicitudRequerimientoItem[];
    firmas: string[];
  };
}

// 3. ALM-NIA-003: Nota de Ingreso a Almacén (Recepción)
export interface NotaIngresoItem {
  codigo_item?: string;
  descripcion: string;
  unidad: string;
  cantidad_pedida: number;
  cantidad_recibida: number;
  conformidad: string;
  costo_unitario?: number;
}

export interface NotaIngresoPayload {
  ingreso: {
    nro_ingreso: string;
    fecha_recepcion: string;
    proveedor: string;
    nro_guia_factura: string;
    orden_compra: string;
    placa_transportista: string;
    recibido_por: string;
    estado_carga: string;
    items: NotaIngresoItem[];
    observaciones_no_conformidades?: string;
    comentario?: string;
    estado?: "ACTIVO" | "ANULADO";
    motivo_anulacion?: string;
    fecha_anulacion?: string;
    anulado_por?: string;
    firmas: string[];
  };
}

// 4. ALM-NSA-004: Nota de Salida de Almacén (Despacho)
export interface NotaSalidaItem {
  codigo_item?: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  observaciones?: string;
}

export interface NotaSalidaPayload {
  salida: {
    nro_salida: string;
    fecha: string;
    destino: string;
    centro_costo: string;
    entregado_por: string;
    recibido_por: string;
    referencia_solicitud_nro: string;
    vehiculo_responsable_traslado: string;
    items: NotaSalidaItem[];
    estado?: "ACTIVO" | "ANULADO";
    motivo_anulacion?: string;
    fecha_anulacion?: string;
    anulado_por?: string;
    firmas: string[];
  };
}

// 5. ALM-NDM-005: Nota de Devolución de Materiales
export interface NotaDevolucionItem {
  codigo_item?: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  estado_observacion?: string;
}

export interface NotaDevolucionPayload {
  devolucion: {
    nro_devolucion: string;
    fecha: string;
    area_que_devuelve: string;
    referencia_salida_nro: string;
    motivo_devolucion: string;
    condicion_material: string;
    items: NotaDevolucionItem[];
    estado?: "ACTIVO" | "ANULADO";
    motivo_anulacion?: string;
    fecha_anulacion?: string;
    anulado_por?: string;
    firmas: string[];
  };
}

// 6. ALM-AIF-006: Acta de Inventario Físico
export interface ActaInventarioItem {
  codigo_item?: string;
  descripcion: string;
  unidad: string;
  stock_sistema: number;
  stock_fisico: number;
  diferencia: number;
  observacion?: string;
}

export interface ActaInventarioPayload {
  inventario_fisico: {
    fecha_conteo: string;
    tipo: string;
    almacen_ubicacion: string;
    responsable_conteo: string;
    items: ActaInventarioItem[];
    conclusiones_acciones_correctivas?: string;
    firmas: string[];
  };
}

export interface AlmacenMovimiento {
  id_movimiento?: number;
  id_item: number;
  item_codigo?: string;
  item_descripcion?: string;
  tipo_movimiento: "INGRESO" | "EGRESO" | "DEVOLUCION" | "AJUSTE";
  fecha_movimiento?: string;
  nro_documento_ref?: string;
  entidad_origen_destino?: string;
  cantidad: number;
  saldo_resultante?: number;
  costo_unitario?: number;
  costo_total_movimiento?: number; // En Bolivianos (Bs.)
  id_empleado_involucrado?: number;
  empleado_nombre?: string;
  observaciones?: string;
}

export interface AuditoriaLog {
  id_log?: number;
  fecha_hora?: string;
  usuario: string;
  modulo: string;
  accion: "INSERT" | "UPDATE" | "DELETE" | "BACKUP" | "INIT" | "LOGIN" | "LOGOUT";
  detalles?: string;
}

export interface SystemStats {
  total_empleados: number;
  total_items_almacen: number;
  total_logs: number;
  wal_mode: string;
  db_size_bytes: number;
}
