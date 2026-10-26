mod db;

use db::{
    SystemStats,
    ItemKardexPayload,
    SolicitudRequerimientoPayload,
    NotaIngresoPayload,
    NotaSalidaPayload,
    NotaDevolucionPayload,
    ActaInventarioPayload,
};

#[tauri::command]
fn init_database() -> Result<String, String> {
    db::initialize_schema()?;
    Ok("Base de datos SQLite inicializada correctamente en modo WAL.".into())
}

#[tauri::command]
fn get_system_stats() -> Result<SystemStats, String> {
    db::get_stats()
}

#[tauri::command]
fn backup_database(target_dir: Option<String>) -> Result<String, String> {
    db::perform_backup(target_dir)
}

#[tauri::command]
fn create_item_kardex(item: ItemKardexPayload) -> Result<String, String> {
    db::create_item_kardex(item)
}

#[tauri::command]
fn create_solicitud_requerimiento(solicitud: SolicitudRequerimientoPayload) -> Result<String, String> {
    db::create_solicitud_requerimiento(solicitud)
}

#[tauri::command]
fn create_nota_ingreso(ingreso: NotaIngresoPayload) -> Result<String, String> {
    db::create_nota_ingreso(ingreso)
}

#[tauri::command]
fn create_nota_salida(salida: NotaSalidaPayload) -> Result<String, String> {
    db::create_nota_salida(salida)
}

#[tauri::command]
fn create_nota_devolucion(devolucion: NotaDevolucionPayload) -> Result<String, String> {
    db::create_nota_devolucion(devolucion)
}

#[tauri::command]
fn create_acta_inventario(inventario: ActaInventarioPayload) -> Result<String, String> {
    db::create_acta_inventario(inventario)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Inicialización automática de la base de datos al arrancar
    if let Err(e) = db::initialize_schema() {
        eprintln!("Advertencia al inicializar SQLite: {}", e);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            init_database,
            get_system_stats,
            backup_database,
            create_item_kardex,
            create_solicitud_requerimiento,
            create_nota_ingreso,
            create_nota_salida,
            create_nota_devolucion,
            create_acta_inventario
        ])
        .run(tauri::generate_context!())
        .expect("Error al ejecutar la aplicación Tauri");
}
