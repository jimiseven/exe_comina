use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

pub fn get_db_path() -> PathBuf {
    PathBuf::from("datos_sistema.db")
}

pub fn get_connection() -> Result<Connection, String> {
    let path = get_db_path();
    let conn = Connection::open(&path).map_err(|e| format!("Error al abrir SQLite: {}", e))?;
    
    // Activar PRAGMAS de alta concurrencia, integridad y seguridad ante cortes eléctricos
    conn.execute_batch(
        "PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;
         PRAGMA foreign_keys = ON;"
    ).map_err(|e| format!("Error aplicando PRAGMAs: {}", e))?;

    Ok(conn)
}

pub fn initialize_schema() -> Result<(), String> {
    let conn = get_connection()?;

    let ddl = "
    -- 1. Módulo RRHH (Tabla: empleados)
    CREATE TABLE IF NOT EXISTS empleados (
        id_legajo INTEGER PRIMARY KEY AUTOINCREMENT,
        n_legajo TEXT,
        fecha_registro DATE DEFAULT CURRENT_DATE,
        
        -- Datos Personales
        apellidos_y_nombres TEXT NOT NULL,
        apellidos_nombres TEXT,
        tipo_de_documento TEXT DEFAULT 'CI',
        tipo_documento TEXT DEFAULT 'CI',
        n_de_documento TEXT NOT NULL UNIQUE,
        nro_documento TEXT,
        fecha_de_nacimiento DATE,
        fecha_nacimiento DATE,
        nacionalidad TEXT DEFAULT 'Boliviana',
        estado_civil TEXT DEFAULT 'Soltero(a)',
        sexo TEXT DEFAULT 'Masculino',
        direccion_domiciliaria TEXT,
        ciudad TEXT DEFAULT 'Potosí',
        codigo_postal TEXT DEFAULT '0000',
        telefono TEXT,
        correo_electronico TEXT,
        
        -- Datos Laborales
        cargo_puesto TEXT NOT NULL,
        departamento_area TEXT DEFAULT 'Mina',
        fecha_de_ingreso DATE NOT NULL,
        fecha_ingreso DATE,
        tipo_de_contrato TEXT DEFAULT 'Indeterminado',
        tipo_contrato TEXT DEFAULT 'Indeterminado',
        jornada_laboral TEXT DEFAULT '14x7',
        horario_de_trabajo TEXT DEFAULT '07:00 - 19:00 (Turno Día)',
        horario_trabajo TEXT,
        salario_remuneracion REAL NOT NULL DEFAULT 0.0,
        supervisor_inmediato TEXT,
        lugar_de_trabajo TEXT,
        lugar_trabajo TEXT,
        modalidad TEXT DEFAULT 'Presencial Faena',
        
        -- Contacto de Emergencia
        nombre_completo TEXT,
        emergencia_nombre TEXT,
        parentesco TEXT,
        emergencia_parentesco TEXT,
        telefono_emergencia TEXT,
        emergencia_telefono TEXT,
        direccion_emergencia TEXT,
        emergencia_direccion TEXT,
        
        -- Datos Adicionales
        nivel_de_estudios TEXT DEFAULT 'Técnico Minero',
        nivel_estudios TEXT,
        profesion_titulo TEXT,
        n_de_seguro_social TEXT,
        nro_seguro_social TEXT,
        grupo_sanguineo TEXT DEFAULT 'O+',
        observaciones TEXT,
        
        estado_activo INTEGER DEFAULT 1
    );

    -- 2. Módulo Nómina (Tabla: nomina_pagos y nomina_conceptos)
    CREATE TABLE IF NOT EXISTS nomina_pagos (
        id_pago INTEGER PRIMARY KEY AUTOINCREMENT,
        id_empleado INTEGER NOT NULL,
        mes TEXT NOT NULL,
        anio INTEGER NOT NULL,
        monto_total REAL NOT NULL,
        estado_bloqueo INTEGER DEFAULT 0,
        FOREIGN KEY (id_empleado) REFERENCES empleados(id_legajo)
    );

    CREATE TABLE IF NOT EXISTS nomina_conceptos (
        id_concepto INTEGER PRIMARY KEY AUTOINCREMENT,
        id_pago INTEGER NOT NULL,
        tipo_concepto TEXT NOT NULL,
        monto REAL NOT NULL,
        descripcion_info TEXT,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_pago) REFERENCES nomina_pagos(id_pago)
    );

    -- 3. Módulo Almacén (Tabla: almacen_items y almacen_movimientos)
    CREATE TABLE IF NOT EXISTS almacen_items (
        id_item INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_item TEXT UNIQUE,
        descripcion TEXT NOT NULL,
        tipo_categoria TEXT,
        categoria TEXT,
        unidad_medida TEXT NOT NULL,
        ubicacion_rack TEXT,
        stock_minimo REAL DEFAULT 0.0,
        stock_maximo REAL DEFAULT 0.0,
        stock_actual REAL DEFAULT 0.0,
        costo_unitario_promedio REAL DEFAULT 0.0,
        responsable_almacen TEXT DEFAULT 'Admin',
        supervisor_logistica TEXT DEFAULT 'Supervisor Logística'
    );

    CREATE TABLE IF NOT EXISTS almacen_movimientos (
        id_movimiento INTEGER PRIMARY KEY AUTOINCREMENT,
        id_item INTEGER NOT NULL,
        tipo_movimiento TEXT NOT NULL,
        fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
        nro_documento_ref TEXT,
        entidad_origen_destino TEXT,
        cantidad REAL NOT NULL,
        costo_total_movimiento REAL,
        id_empleado_involucrado INTEGER,
        observaciones TEXT,
        FOREIGN KEY (id_item) REFERENCES almacen_items(id_item),
        FOREIGN KEY (id_empleado_involucrado) REFERENCES empleados(id_legajo)
    );

    -- Tablas de los 6 Formularios Físicos de Almacén Minero:
    -- 2. ALM-SRM-002: Solicitud de Requerimiento de Materiales
    CREATE TABLE IF NOT EXISTS almacen_solicitudes (
        id_solicitud INTEGER PRIMARY KEY AUTOINCREMENT,
        nro_solicitud TEXT NOT NULL UNIQUE,
        fecha DATE NOT NULL,
        area_frente_trabajo TEXT NOT NULL,
        centro_costo TEXT,
        solicitado_por TEXT NOT NULL,
        cargo TEXT,
        urgencia TEXT DEFAULT 'Media',
        motivo TEXT,
        firmas_json TEXT
    );

    CREATE TABLE IF NOT EXISTS almacen_solicitudes_detalle (
        id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
        nro_solicitud TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        unidad TEXT NOT NULL,
        cantidad_solicitada REAL NOT NULL,
        cantidad_entregada REAL DEFAULT 0.0,
        observaciones TEXT,
        FOREIGN KEY (nro_solicitud) REFERENCES almacen_solicitudes(nro_solicitud)
    );

    -- 3. ALM-NIA-003: Nota de Ingreso a Almacén (Recepción)
    CREATE TABLE IF NOT EXISTS almacen_ingresos (
        id_ingreso INTEGER PRIMARY KEY AUTOINCREMENT,
        nro_ingreso TEXT NOT NULL UNIQUE,
        fecha_recepcion DATE NOT NULL,
        proveedor TEXT NOT NULL,
        nro_guia_factura TEXT,
        orden_compra TEXT,
        placa_transportista TEXT,
        recibido_por TEXT NOT NULL,
        estado_carga TEXT DEFAULT 'Optimo',
        observaciones_no_conformidades TEXT,
        firmas_json TEXT
    );

    CREATE TABLE IF NOT EXISTS almacen_ingresos_detalle (
        id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
        nro_ingreso TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        unidad TEXT NOT NULL,
        cantidad_pedida REAL NOT NULL,
        cantidad_recibida REAL NOT NULL,
        conformidad TEXT DEFAULT 'Conforme',
        FOREIGN KEY (nro_ingreso) REFERENCES almacen_ingresos(nro_ingreso)
    );

    -- 4. ALM-NSA-004: Nota de Salida de Almacén (Despacho)
    CREATE TABLE IF NOT EXISTS almacen_salidas (
        id_salida INTEGER PRIMARY KEY AUTOINCREMENT,
        nro_salida TEXT NOT NULL UNIQUE,
        fecha DATE NOT NULL,
        destino TEXT NOT NULL,
        centro_costo TEXT,
        entregado_por TEXT NOT NULL,
        recibido_por TEXT NOT NULL,
        referencia_solicitud_nro TEXT,
        vehiculo_responsable_traslado TEXT,
        firmas_json TEXT
    );

    CREATE TABLE IF NOT EXISTS almacen_salidas_detalle (
        id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
        nro_salida TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        unidad TEXT NOT NULL,
        cantidad REAL NOT NULL,
        observaciones TEXT,
        FOREIGN KEY (nro_salida) REFERENCES almacen_salidas(nro_salida)
    );

    -- 5. ALM-NDM-005: Nota de Devolución de Materiales
    CREATE TABLE IF NOT EXISTS almacen_devoluciones (
        id_devolucion INTEGER PRIMARY KEY AUTOINCREMENT,
        nro_devolucion TEXT NOT NULL UNIQUE,
        fecha DATE NOT NULL,
        area_que_devuelve TEXT NOT NULL,
        referencia_salida_nro TEXT,
        motivo_devolucion TEXT,
        condicion_material TEXT DEFAULT 'Buen estado',
        firmas_json TEXT
    );

    CREATE TABLE IF NOT EXISTS almacen_devoluciones_detalle (
        id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
        nro_devolucion TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        unidad TEXT NOT NULL,
        cantidad REAL NOT NULL,
        estado_observacion TEXT,
        FOREIGN KEY (nro_devolucion) REFERENCES almacen_devoluciones(nro_devolucion)
    );

    -- 6. ALM-AIF-006: Acta de Inventario Físico
    CREATE TABLE IF NOT EXISTS almacen_inventarios (
        id_inventario INTEGER PRIMARY KEY AUTOINCREMENT,
        nro_acta TEXT,
        fecha_conteo DATE NOT NULL,
        tipo TEXT DEFAULT 'General',
        almacen_ubicacion TEXT NOT NULL,
        responsable_conteo TEXT NOT NULL,
        conclusiones_acciones_correctivas TEXT,
        firmas_json TEXT
    );

    CREATE TABLE IF NOT EXISTS almacen_inventarios_detalle (
        id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
        id_inventario INTEGER,
        descripcion TEXT NOT NULL,
        unidad TEXT NOT NULL,
        stock_sistema REAL NOT NULL,
        stock_fisico REAL NOT NULL,
        diferencia REAL NOT NULL,
        observacion TEXT,
        FOREIGN KEY (id_inventario) REFERENCES almacen_inventarios(id_inventario)
    );

    -- 4. Módulo Seguridad (Tabla: auditoria_logs)
    CREATE TABLE IF NOT EXISTS auditoria_logs (
        id_log INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
        usuario TEXT DEFAULT 'Administrador',
        modulo TEXT NOT NULL,
        accion TEXT NOT NULL,
        detalles TEXT
    );

    -- 5. Módulo Control de Acceso (Tabla: usuarios)
    CREATE TABLE IF NOT EXISTS usuarios (
        id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        nombre_completo TEXT NOT NULL,
        rol TEXT NOT NULL,
        estado_activo INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        ultimo_acceso DATETIME
    );
    ";

    conn.execute_batch(ddl).map_err(|e| format!("Error en DDL: {}", e))?;

    // Registrar en auditoría el inicio del sistema
    let _ = conn.execute(
        "INSERT INTO auditoria_logs (modulo, accion, detalles) VALUES (?1, ?2, ?3)",
        params!["SISTEMA", "INIT", "Base de datos inicializada en modo WAL con integridad transaccional."],
    );

    Ok(())
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SystemStats {
    pub total_empleados: i64,
    pub total_items_almacen: i64,
    pub total_logs: i64,
    pub wal_mode: String,
    pub db_size_bytes: u64,
}

pub fn get_stats() -> Result<SystemStats, String> {
    let conn = get_connection()?;
    let path = get_db_path();
    let db_size_bytes = fs::metadata(&path).map(|m| m.len()).unwrap_or(0);

    let total_empleados: i64 = conn
        .query_row("SELECT COUNT(*) FROM empleados", [], |row| row.get(0))
        .unwrap_or(0);

    let total_items_almacen: i64 = conn
        .query_row("SELECT COUNT(*) FROM almacen_items", [], |row| row.get(0))
        .unwrap_or(0);

    let total_logs: i64 = conn
        .query_row("SELECT COUNT(*) FROM auditoria_logs", [], |row| row.get(0))
        .unwrap_or(0);

    let wal_mode: String = conn
        .query_row("PRAGMA journal_mode;", [], |row| row.get(0))
        .unwrap_or_else(|_| "UNKNOWN".into());

    Ok(SystemStats {
        total_empleados,
        total_items_almacen,
        total_logs,
        wal_mode,
        db_size_bytes,
    })
}

pub fn perform_backup(target_dir: Option<String>) -> Result<String, String> {
    let source = get_db_path();
    if !source.exists() {
        return Err("No existe el archivo de base de datos para respaldar.".into());
    }

    let dest_dir = match target_dir {
        Some(d) if !d.trim().is_empty() => PathBuf::from(d),
        _ => PathBuf::from("backups"),
    };

    if !dest_dir.exists() {
        fs::create_dir_all(&dest_dir).map_err(|e| format!("Error creando carpeta de respaldos: {}", e))?;
    }

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let backup_filename = format!("respaldo_datos_sistema_{}.db", timestamp);
    let destination = dest_dir.join(&backup_filename);

    fs::copy(&source, &destination).map_err(|e| format!("Error al copiar archivo DB: {}", e))?;

    // Registrar en auditoría
    if let Ok(conn) = get_connection() {
        let _ = conn.execute(
            "INSERT INTO auditoria_logs (modulo, accion, detalles) VALUES (?1, ?2, ?3)",
            params!["RESPALDO", "BACKUP", format!("Copia de seguridad creada en {:?}", destination)],
        );
    }

    Ok(format!("Respaldo creado con éxito: {}", destination.display()))
}

// --------------------------------------------------------------------------------
// STRUCTS Y FUNCIONES TRANSACCIONALES PARA LOS 6 FORMULARIOS DE ALMACÉN
// --------------------------------------------------------------------------------

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ItemKardexData {
    pub codigo_item: String,
    pub descripcion: String,
    pub unidad_medida: String,
    pub ubicacion_rack: String,
    pub categoria: String,
    pub stock_minimo: f64,
    pub stock_maximo: f64,
    pub responsable_almacen: String,
    pub supervisor_logistica: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ItemKardexPayload {
    pub item: ItemKardexData,
}

pub fn create_item_kardex(payload: ItemKardexPayload) -> Result<String, String> {
    let mut conn = get_connection()?;
    let tx = conn.transaction().map_err(|e| format!("Error iniciando transacción: {}", e))?;
    let it = &payload.item;

    tx.execute(
        "INSERT INTO almacen_items (
            codigo_item, descripcion, tipo_categoria, categoria,
            unidad_medida, ubicacion_rack, stock_minimo, stock_maximo,
            stock_actual, costo_unitario_promedio, responsable_almacen, supervisor_logistica
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 0.0, 0.0, ?9, ?10)",
        params![
            it.codigo_item, it.descripcion, it.categoria, it.categoria,
            it.unidad_medida, it.ubicacion_rack, it.stock_minimo, it.stock_maximo,
            it.responsable_almacen, it.supervisor_logistica
        ],
    ).map_err(|e| format!("Error insertando ítem en Kardex: {}", e))?;

    tx.execute(
        "INSERT INTO auditoria_logs (modulo, accion, detalles) VALUES (?1, ?2, ?3)",
        params!["ALMACEN", "INSERT", format!("Ítem Kardex registrado: [{}] {}", it.codigo_item, it.descripcion)],
    ).map_err(|e| format!("Error en log: {}", e))?;

    tx.commit().map_err(|e| format!("Error confirmando transacción: {}", e))?;
    Ok(format!("Ítem [{}] catalogado en Kardex con éxito.", it.codigo_item))
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SolicitudItemData {
    pub descripcion: String,
    pub unidad: String,
    pub cantidad_solicitada: f64,
    pub cantidad_entregada: f64,
    pub observaciones: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SolicitudData {
    pub nro_solicitud: String,
    pub fecha: String,
    pub area_frente_trabajo: String,
    pub centro_costo: String,
    pub solicitado_por: String,
    pub cargo: String,
    pub urgencia: String,
    pub motivo: String,
    pub items: Vec<SolicitudItemData>,
    pub firmas: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SolicitudRequerimientoPayload {
    pub solicitud: SolicitudData,
}

pub fn create_solicitud_requerimiento(payload: SolicitudRequerimientoPayload) -> Result<String, String> {
    let mut conn = get_connection()?;
    let tx = conn.transaction().map_err(|e| format!("Error iniciando transacción: {}", e))?;
    let sol = &payload.solicitud;
    let firmas_str = serde_json::to_string(&sol.firmas).unwrap_or_default();

    tx.execute(
        "INSERT INTO almacen_solicitudes (
            nro_solicitud, fecha, area_frente_trabajo, centro_costo,
            solicitado_por, cargo, urgencia, motivo, firmas_json
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            sol.nro_solicitud, sol.fecha, sol.area_frente_trabajo, sol.centro_costo,
            solicitado_por, sol.cargo, sol.urgencia, sol.motivo, firmas_str
        ],
    ).map_err(|e| format!("Error insertando cabecera de solicitud: {}", e))?;

    for it in &sol.items {
        tx.execute(
            "INSERT INTO almacen_solicitudes_detalle (
                nro_solicitud, descripcion, unidad, cantidad_solicitada, cantidad_entregada, observaciones
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                sol.nro_solicitud, it.descripcion, it.unidad, it.cantidad_solicitada,
                it.cantidad_entregada, it.observaciones.as_deref().unwrap_or("")
            ],
        ).map_err(|e| format!("Error insertando detalle de solicitud: {}", e))?;
    }

    tx.execute(
        "INSERT INTO auditoria_logs (modulo, accion, detalles) VALUES (?1, ?2, ?3)",
        params!["ALMACEN", "INSERT", format!("Solicitud de Requerimiento {} registrada para {}", sol.nro_solicitud, sol.area_frente_trabajo)],
    ).map_err(|e| format!("Error en log: {}", e))?;

    tx.commit().map_err(|e| format!("Error confirmando transacción: {}", e))?;
    Ok(format!("Solicitud de Requerimiento {} registrada.", sol.nro_solicitud))
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NotaIngresoItemData {
    pub descripcion: String,
    pub unidad: String,
    pub cantidad_pedida: f64,
    pub cantidad_recibida: f64,
    pub conformidad: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NotaIngresoData {
    pub nro_ingreso: String,
    pub fecha_recepcion: String,
    pub proveedor: String,
    pub nro_guia_factura: String,
    pub orden_compra: String,
    pub placa_transportista: String,
    pub recibido_por: String,
    pub estado_carga: String,
    pub items: Vec<NotaIngresoItemData>,
    pub observaciones_no_conformidades: Option<String>,
    pub firmas: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NotaIngresoPayload {
    pub ingreso: NotaIngresoData,
}

pub fn create_nota_ingreso(payload: NotaIngresoPayload) -> Result<String, String> {
    let mut conn = get_connection()?;
    let tx = conn.transaction().map_err(|e| format!("Error iniciando transacción: {}", e))?;
    let ing = &payload.ingreso;
    let firmas_str = serde_json::to_string(&ing.firmas).unwrap_or_default();

    tx.execute(
        "INSERT INTO almacen_ingresos (
            nro_ingreso, fecha_recepcion, proveedor, nro_guia_factura,
            orden_compra, placa_transportista, recibido_por, estado_carga,
            observaciones_no_conformidades, firmas_json
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            ing.nro_ingreso, ing.fecha_recepcion, ing.proveedor, ing.nro_guia_factura,
            ing.orden_compra, ing.placa_transportista, ing.recibido_por, ing.estado_carga,
            ing.observaciones_no_conformidades.as_deref().unwrap_or(""), firmas_str
        ],
    ).map_err(|e| format!("Error guardando cabecera de ingreso: {}", e))?;

    for it in &ing.items {
        tx.execute(
            "INSERT INTO almacen_ingresos_detalle (
                nro_ingreso, descripcion, unidad, cantidad_pedida, cantidad_recibida, conformidad
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                ing.nro_ingreso, it.descripcion, it.unidad, it.cantidad_pedida,
                it.cantidad_recibida, it.conformidad
            ],
        ).map_err(|e| format!("Error guardando detalle de ingreso: {}", e))?;

        // Sumar al stock_actual en la tabla almacen_items
        let rows_affected = tx.execute(
            "UPDATE almacen_items SET stock_actual = stock_actual + ?1 WHERE descripcion = ?2 OR codigo_item = ?2",
            params![it.cantidad_recibida, it.descripcion],
        ).unwrap_or(0);

        // Si no existe, crear ítem temporal para no perder la recepción
        if rows_affected == 0 {
            let _ = tx.execute(
                "INSERT INTO almacen_items (codigo_item, descripcion, unidad_medida, stock_actual) VALUES (?1, ?1, ?2, ?3)",
                params![it.descripcion, it.unidad, it.cantidad_recibida],
            );
        }

        // Registrar movimiento
        let _ = tx.execute(
            "INSERT INTO almacen_movimientos (id_item, tipo_movimiento, nro_documento_ref, entidad_origen_destino, cantidad)
             SELECT id_item, 'INGRESO', ?1, ?2, ?3 FROM almacen_items WHERE descripcion = ?4 LIMIT 1",
            params![ing.nro_ingreso, ing.proveedor, it.cantidad_recibida, it.descripcion],
        );
    }

    tx.execute(
        "INSERT INTO auditoria_logs (modulo, accion, detalles) VALUES (?1, ?2, ?3)",
        params!["ALMACEN", "INSERT", format!("Nota de Ingreso {} procesada. Stock incrementado.", ing.nro_ingreso)],
    ).map_err(|e| format!("Error en log: {}", e))?;

    tx.commit().map_err(|e| format!("Error confirmando transacción: {}", e))?;
    Ok(format!("Nota de Ingreso {} guardada y stock actualizado.", ing.nro_ingreso))
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NotaSalidaItemData {
    pub descripcion: String,
    pub unidad: String,
    pub cantidad: f64,
    pub observaciones: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NotaSalidaData {
    pub nro_salida: String,
    pub fecha: String,
    pub destino: String,
    pub centro_costo: String,
    pub entregado_por: String,
    pub recibido_por: String,
    pub referencia_solicitud_nro: String,
    pub vehiculo_responsable_traslado: String,
    pub items: Vec<NotaSalidaItemData>,
    pub firmas: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NotaSalidaPayload {
    pub salida: NotaSalidaData,
}

pub fn create_nota_salida(payload: NotaSalidaPayload) -> Result<String, String> {
    let mut conn = get_connection()?;
    let tx = conn.transaction().map_err(|e| format!("Error iniciando transacción: {}", e))?;
    let sal = &payload.salida;
    let firmas_str = serde_json::to_string(&sal.firmas).unwrap_or_default();

    tx.execute(
        "INSERT INTO almacen_salidas (
            nro_salida, fecha, destino, centro_costo,
            entregado_por, recibido_por, referencia_solicitud_nro,
            vehiculo_responsable_traslado, firmas_json
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            sal.nro_salida, sal.fecha, sal.destino, sal.centro_costo,
            sal.entregado_por, sal.recibido_por, sal.referencia_solicitud_nro,
            sal.vehiculo_responsable_traslado, firmas_str
        ],
    ).map_err(|e| format!("Error guardando cabecera de salida: {}", e))?;

    for it in &sal.items {
        // Verificar stock actual antes de despachar
        let stock_actual: f64 = tx.query_row(
            "SELECT stock_actual FROM almacen_items WHERE descripcion = ?1 OR codigo_item = ?1",
            params![it.descripcion],
            |r| r.get(0),
        ).unwrap_or(0.0);

        if stock_actual < it.cantidad {
            return Err(format!("Stock insuficiente para '{}'. Disponible: {}, Solicitado: {}", it.descripcion, stock_actual, it.cantidad));
        }

        tx.execute(
            "INSERT INTO almacen_salidas_detalle (
                nro_salida, descripcion, unidad, cantidad, observaciones
            ) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![sal.nro_salida, it.descripcion, it.unidad, it.cantidad, it.observaciones.as_deref().unwrap_or("")],
        ).map_err(|e| format!("Error guardando detalle de salida: {}", e))?;

        // Restar de stock_actual
        tx.execute(
            "UPDATE almacen_items SET stock_actual = stock_actual - ?1 WHERE descripcion = ?2 OR codigo_item = ?2",
            params![it.cantidad, it.descripcion],
        ).map_err(|e| format!("Error actualizando stock: {}", e))?;

        // Registrar movimiento
        let _ = tx.execute(
            "INSERT INTO almacen_movimientos (id_item, tipo_movimiento, nro_documento_ref, entidad_origen_destino, cantidad)
             SELECT id_item, 'EGRESO', ?1, ?2, ?3 FROM almacen_items WHERE descripcion = ?4 LIMIT 1",
            params![sal.nro_salida, sal.destino, it.cantidad, it.descripcion],
        );
    }

    tx.execute(
        "INSERT INTO auditoria_logs (modulo, accion, detalles) VALUES (?1, ?2, ?3)",
        params!["ALMACEN", "INSERT", format!("Nota de Salida {} despachada a {}. Stock decrementado.", sal.nro_salida, sal.destino)],
    ).map_err(|e| format!("Error en log: {}", e))?;

    tx.commit().map_err(|e| format!("Error confirmando transacción: {}", e))?;
    Ok(format!("Nota de Salida {} procesada y stock descontado.", sal.nro_salida))
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NotaDevolucionItemData {
    pub descripcion: String,
    pub unidad: String,
    pub cantidad: f64,
    pub estado_observacion: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NotaDevolucionData {
    pub nro_devolucion: String,
    pub fecha: String,
    pub area_que_devuelve: String,
    pub referencia_salida_nro: String,
    pub motivo_devolucion: String,
    pub condicion_material: String,
    pub items: Vec<NotaDevolucionItemData>,
    pub firmas: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NotaDevolucionPayload {
    pub devolucion: NotaDevolucionData,
}

pub fn create_nota_devolucion(payload: NotaDevolucionPayload) -> Result<String, String> {
    let mut conn = get_connection()?;
    let tx = conn.transaction().map_err(|e| format!("Error iniciando transacción: {}", e))?;
    let dev = &payload.devolucion;
    let firmas_str = serde_json::to_string(&dev.firmas).unwrap_or_default();

    tx.execute(
        "INSERT INTO almacen_devoluciones (
            nro_devolucion, fecha, area_que_devuelve, referencia_salida_nro,
            motivo_devolucion, condicion_material, firmas_json
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            dev.nro_devolucion, dev.fecha, dev.area_que_devuelve, dev.referencia_salida_nro,
            dev.motivo_devolucion, dev.condicion_material, firmas_str
        ],
    ).map_err(|e| format!("Error guardando cabecera de devolución: {}", e))?;

    let suma_stock = dev.condicion_material.to_lowercase().contains("buen");

    for it in &dev.items {
        tx.execute(
            "INSERT INTO almacen_devoluciones_detalle (
                nro_devolucion, descripcion, unidad, cantidad, estado_observacion
            ) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![dev.nro_devolucion, it.descripcion, it.unidad, it.cantidad, it.estado_observacion.as_deref().unwrap_or("")],
        ).map_err(|e| format!("Error guardando detalle de devolución: {}", e))?;

        if suma_stock {
            let _ = tx.execute(
                "UPDATE almacen_items SET stock_actual = stock_actual + ?1 WHERE descripcion = ?2 OR codigo_item = ?2",
                params![it.cantidad, it.descripcion],
            );
        }

        let _ = tx.execute(
            "INSERT INTO almacen_movimientos (id_item, tipo_movimiento, nro_documento_ref, entidad_origen_destino, cantidad)
             SELECT id_item, 'DEVOLUCION', ?1, ?2, ?3 FROM almacen_items WHERE descripcion = ?4 LIMIT 1",
            params![dev.nro_devolucion, dev.area_que_devuelve, it.cantidad, it.descripcion],
        );
    }

    tx.execute(
        "INSERT INTO auditoria_logs (modulo, accion, detalles) VALUES (?1, ?2, ?3)",
        params!["ALMACEN", "INSERT", format!("Nota de Devolución {} recibida desde {}.", dev.nro_devolucion, dev.area_que_devuelve)],
    ).map_err(|e| format!("Error en log: {}", e))?;

    tx.commit().map_err(|e| format!("Error confirmando transacción: {}", e))?;
    Ok(format!("Nota de Devolución {} procesada exitosamente.", dev.nro_devolucion))
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ActaInventarioItemData {
    pub descripcion: String,
    pub unidad: String,
    pub stock_sistema: f64,
    pub stock_fisico: f64,
    pub diferencia: f64,
    pub observacion: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ActaInventarioData {
    pub fecha_conteo: String,
    pub r#tipo: String,
    pub almacen_ubicacion: String,
    pub responsable_conteo: String,
    pub items: Vec<ActaInventarioItemData>,
    pub conclusiones_acciones_correctivas: Option<String>,
    pub firmas: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ActaInventarioPayload {
    pub inventario_fisico: ActaInventarioData,
}

pub fn create_acta_inventario(payload: ActaInventarioPayload) -> Result<String, String> {
    let mut conn = get_connection()?;
    let tx = conn.transaction().map_err(|e| format!("Error iniciando transacción: {}", e))?;
    let inv = &payload.inventario_fisico;
    let firmas_str = serde_json::to_string(&inv.firmas).unwrap_or_default();
    let nro_acta = format!("AIF-{}", inv.fecha_conteo.replace("-", ""));

    tx.execute(
        "INSERT INTO almacen_inventarios (
            nro_acta, fecha_conteo, tipo, almacen_ubicacion,
            responsable_conteo, conclusiones_acciones_correctivas, firmas_json
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            nro_acta, inv.fecha_conteo, inv.r#tipo, inv.almacen_ubicacion,
            inv.responsable_conteo, inv.conclusiones_acciones_correctivas.as_deref().unwrap_or(""), firmas_str
        ],
    ).map_err(|e| format!("Error guardando cabecera de inventario físico: {}", e))?;

    let id_inv = tx.last_insert_rowid();

    for it in &inv.items {
        tx.execute(
            "INSERT INTO almacen_inventarios_detalle (
                id_inventario, descripcion, unidad, stock_sistema, stock_fisico, diferencia, observacion
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![id_inv, it.descripcion, it.unidad, it.stock_sistema, it.stock_fisico, it.diferencia, it.observacion.as_deref().unwrap_or("")],
        ).map_err(|e| format!("Error guardando detalle de inventario físico: {}", e))?;

        // Ajuste en sistema: el stock_actual pasa a ser el stock_fisico verificado
        let _ = tx.execute(
            "UPDATE almacen_items SET stock_actual = ?1 WHERE descripcion = ?2 OR codigo_item = ?2",
            params![it.stock_fisico, it.descripcion],
        );
    }

    tx.execute(
        "INSERT INTO auditoria_logs (modulo, accion, detalles) VALUES (?1, ?2, ?3)",
        params!["ALMACEN", "UPDATE", format!("Acta de Inventario Físico {} aplicada. Existencias sincronizadas con conteo físico.", nro_acta)],
    ).map_err(|e| format!("Error en log: {}", e))?;

    tx.commit().map_err(|e| format!("Error confirmando transacción: {}", e))?;
    Ok(format!("Acta de Inventario Físico {} registrada y ajustes aplicados.", nro_acta))
}
