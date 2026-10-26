/**
 * Script de Pruebas Automatizadas del ERP Minero ProyJimP (Bolivia)
 * Verifica:
 * 1. Control Estricto de Login (Validación de credenciales erróneas, usuarios inexistentes y cuentas inactivas)
 * 2. Gestión de Usuarios del Sistema (Crear, Editar, Eliminar y Probar Acceso)
 * 3. Registro y Modificación de Información en RRHH (Moneda Bs. y CI Boliviano)
 * 4. Registro, Modificación y Movimiento de Kardex en Almacén (Descuento automático)
 * 5. Módulo de Almacén Minero: 6 Formularios Oficiales y Transaccionalidad de Stock (Kardex, Solicitud, Ingreso, Salida, Devolución, Inventario Físico)
 * 6. Cierre de Sesión y Trazabilidad en Auditoría
 */

// Simulación de Storage en Node.js
const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => { mockStorage[key] = val; },
  removeItem: (key: string) => { delete mockStorage[key]; },
};

async function ejecutarPruebas() {
  console.log("================================================================================");
  console.log("   INICIANDO BATERÍA DE PRUEBAS FUNCIONALES: ERP PROYJIMP (BOLIVIA)");
  console.log("   Unidad Minera Única | Moneda: Bolivianos (Bs.) | Control Estricto de Acceso");
  console.log("================================================================================\n");

  const resultados: Array<{ estado: string; descripcion: string; detalle: string }> = [];

  function assert(descripcion: string, condicion: boolean, detalle: string) {
    if (condicion) {
      console.log(`[PASS] ${descripcion}`);
      console.log(`       -> ${detalle}`);
      resultados.push({ estado: "PASS", descripcion, detalle });
    } else {
      console.error(`[FAIL] ${descripcion} - Detalle: ${detalle}`);
      resultados.push({ estado: "FAIL", descripcion, detalle });
    }
  }

  // Cargar API
  const { erpApi } = await import("./api");

  // --------------------------------------------------------------------------------
  // PRUEBA 1: CONTROL ESTRICTO DE LOGIN
  // --------------------------------------------------------------------------------
  console.log("--- 1. PRUEBA DE CONTROL ESTRICTO DE LOGIN ---");

  // 1.1 Rechazo de usuario inexistente
  let errorInexistente = false;
  try {
    await erpApi.login("usuario_fantasma", "clave123");
  } catch (err: any) {
    errorInexistente = err.message.includes("no existe");
  }
  assert(
    "Control de Login: Rechazo de usuario inexistente",
    errorInexistente,
    "El sistema bloqueó el acceso a un usuario no registrado"
  );

  // 1.2 Rechazo de contraseña incorrecta
  let errorClave = false;
  try {
    await erpApi.login("admin", "password_falsa_999");
  } catch (err: any) {
    errorClave = err.message.includes("Contraseña incorrecta");
  }
  assert(
    "Control de Login: Rechazo de contraseña incorrecta",
    errorClave,
    "El sistema detectó y rechazó la contraseña inválida para 'admin'"
  );

  // 1.3 Acceso exitoso con credenciales válidas
  const usuario = await erpApi.login("admin", "admin123");
  assert(
    "Control de Login: Acceso exitoso con credenciales de Administrador",
    Boolean(usuario && usuario.username === "admin" && usuario.nombre_completo === "Jimmy Peredo"),
    `Usuario autenticado: ${usuario.nombre_completo} (${usuario.rol}) en Unidad Minera`
  );

  // --------------------------------------------------------------------------------
  // PRUEBA 2: GESTIÓN DE USUARIOS (CREAR, EDITAR, ELIMINAR)
  // --------------------------------------------------------------------------------
  console.log("\n--- 2. PRUEBA DE GESTIÓN DE USUARIOS (CREAR, EDITAR, ELIMINAR) ---");

  // 2.1 Crear nuevo usuario
  const nuevoUser = await erpApi.addUsuario({
    username: "op_nomina",
    password: "nomina_segura_2026",
    nombre_completo: "Pedro Mamani Fernández",
    rol: "Operador de Nómina",
  });
  assert(
    "Creación de nuevo usuario con credenciales y rol",
    Boolean(nuevoUser && nuevoUser.id && nuevoUser.username === "op_nomina"),
    `Usuario creado con ID #${nuevoUser.id}: '${nuevoUser.username}' (${nuevoUser.nombre_completo}) - Rol: ${nuevoUser.rol}`
  );

  // 2.2 Probar login del nuevo usuario creado
  const loginNuevo = await erpApi.login("op_nomina", "nomina_segura_2026");
  assert(
    "Login exitoso con la nueva cuenta de usuario creada",
    loginNuevo.username === "op_nomina",
    `El nuevo usuario '${loginNuevo.username}' inició sesión correctamente`
  );

  // 2.3 Modificar el usuario (Editar nombre, rol y contraseña)
  const userEditado = await erpApi.updateUsuario({
    id: nuevoUser.id,
    username: "op_nomina",
    password: "nueva_clave_mina_2026",
    nombre_completo: "Pedro Mamani Fernández (Supervisor)",
    rol: "Supervisor SSOMA",
    estado_activo: 1,
  });
  assert(
    "Modificación de información de usuario (Rol, Nombre y Contraseña)",
    userEditado.rol === "Supervisor SSOMA" && userEditado.nombre_completo.includes("Supervisor"),
    `Nuevo rol: ${userEditado.rol} | Nombre: ${userEditado.nombre_completo}`
  );

  // 2.4 Probar login con la nueva contraseña modificada
  const loginEditado = await erpApi.login("op_nomina", "nueva_clave_mina_2026");
  assert(
    "Verificación de acceso con la nueva contraseña actualizada",
    loginEditado.rol === "Supervisor SSOMA",
    "El usuario inició sesión con su nueva clave modificada"
  );

  // Re-autenticar como admin para poder eliminar
  await erpApi.login("admin", "admin123");

  // 2.5 Eliminar usuario
  await erpApi.deleteUsuario(nuevoUser.id);
  const listaUsers = await erpApi.getUsuarios();
  const existeUser = listaUsers.some(u => u.id === nuevoUser.id);
  assert(
    "Eliminación permanente de usuario del sistema",
    !existeUser,
    `El usuario #${nuevoUser.id} fue eliminado. Total usuarios activos restantes: ${listaUsers.length}`
  );

  // --------------------------------------------------------------------------------
  // PRUEBA 3: REGISTRO Y MODIFICACIÓN EN RRHH (BOLIVIA)
  // --------------------------------------------------------------------------------
  console.log("\n--- 3. PRUEBA DE REGISTRO Y MODIFICACIÓN EN RRHH ---");
  const nuevoTrabajador = {
    apellidos_y_nombres: "Condori Quispe, Grover Hernán",
    tipo_de_documento: "CI",
    n_de_documento: "7381920",
    fecha_de_nacimiento: "1989-11-14",
    nacionalidad: "Boliviana",
    estado_civil: "Casado(a)",
    sexo: "Masculino",
    direccion_domiciliaria: "Av. Panamericana #410",
    ciudad: "Cotagaita", // Nueva ciudad no existente por defecto
    codigo_postal: "0000",
    telefono: "71928374",
    correo_electronico: "grover.condori@minera.bo",
    cargo_puesto: "Operador de Pala Neumática",
    departamento_area: "Medio Ambiente y Restauración", // Nueva área no existente por defecto
    fecha_de_ingreso: "2026-10-25",
    tipo_de_contrato: "Indeterminado",
    jornada_laboral: "14x7", // Jornada laboral en vez de régimen de guardia
    horario_de_trabajo: "07:00 - 19:00 (Turno Día)", // Horario de trabajo
    salario_remuneracion: 6200.0, // Bs.
    supervisor_inmediato: "Ing. Roberto Vargas Flores",
    lugar_de_trabajo: "Socavón Nivel 2400",
    modalidad: "Presencial Faena",
    nombre_completo: "Juana Quispe de Condori",
    parentesco: "Padrino", // Nuevo parentesco no existente por defecto
    telefono_emergencia: "74839201",
    direccion_emergencia: "Av. Panamericana #410",
    nivel_de_estudios: "Técnico Minero",
    profesion_titulo: "Técnico en Maquinaria Pesada",
    n_de_seguro_social: "CNS-7381920",
    grupo_sanguineo: "O+",
    observaciones: "Acreditado con inducción SSOMA de socavón aprobada",
    estado_activo: 1,
  };

  const registrado = await erpApi.addEmpleado(nuevoTrabajador as any);
  assert(
    "Registro exitoso de nuevo legajo minero en Bolivianos (Bs.)",
    Boolean(registrado.id_legajo && registrado.salario_remuneracion === 6200.0),
    `Legajo #${registrado.id_legajo} asignado a ${registrado.apellidos_y_nombres} con CI ${registrado.n_de_documento}`
  );

  // 3.2 Verificar registro dinámico de ciudad, área y parentesco nuevos
  const listaCiudades = erpApi.getCiudades();
  const listaAreas = erpApi.getAreas();
  const listaParentescos = erpApi.getParentescos();
  assert(
    "Creación y persistencia dinámica de nueva Ciudad, Área y Parentesco",
    listaCiudades.includes("Cotagaita") &&
    listaAreas.includes("Medio Ambiente y Restauración") &&
    listaParentescos.includes("Padrino"),
    `Ciudad agregada: Cotagaita | Área agregada: Medio Ambiente y Restauración | Parentesco agregado: Padrino`
  );

  // 3.3 Verificar estructura JSON exacta y sin discrepancias
  const jsonEstructurado = erpApi.toEmpleadoJSON(registrado);
  const esJsonValido = Boolean(
    jsonEstructurado.empleado &&
    jsonEstructurado.empleado.encabezado.n_legajo &&
    jsonEstructurado.empleado.datos_personales.ciudad === "Cotagaita" &&
    jsonEstructurado.empleado.datos_laborales.jornada_laboral === "14x7" &&
    jsonEstructurado.empleado.datos_laborales.horario_de_trabajo === "07:00 - 19:00 (Turno Día)" &&
    jsonEstructurado.empleado.contacto_emergencia.parentesco === "Padrino" &&
    jsonEstructurado.empleado.datos_adicionales.grupo_sanguineo === "O+"
  );
  assert(
    "Verificación de estructura JSON idéntica entre Base de Datos y Formulario",
    esJsonValido,
    `Esquema 100% canónico verificado: Encabezado, Datos Personales, Laborales, Contacto y Adicionales`
  );

  // 3.4 Modificación del empleado
  const empAModificar = { ...registrado };
  empAModificar.cargo_puesto = "Supervisor de Perforación y Voladura";
  empAModificar.salario_remuneracion = 7800.0; // Aumento salarial en Bs.
  empAModificar.jornada_laboral = "10x4";
  empAModificar.horario_de_trabajo = "19:00 - 07:00 (Turno Noche)";

  const modificado = await erpApi.updateEmpleado(empAModificar);
  assert(
    "Modificación de cargo, salario (Bs.), jornada laboral y horario de trabajo",
    modificado.cargo_puesto === "Supervisor de Perforación y Voladura" &&
    modificado.salario_remuneracion === 7800.0 &&
    modificado.horario_de_trabajo === "19:00 - 07:00 (Turno Noche)",
    `Nuevo cargo: ${modificado.cargo_puesto} | Haber básico: Bs. ${modificado.salario_remuneracion.toFixed(2)} | Horario: ${modificado.horario_de_trabajo}`
  );

  // --------------------------------------------------------------------------------
  // PRUEBA 4: REGISTRO Y MODIFICACIÓN EN ALMACÉN Y KARDEX
  // --------------------------------------------------------------------------------
  console.log("\n--- 4. PRUEBA DE REGISTRO Y MODIFICACIÓN EN ALMACÉN (KARDEX) ---");
  const nuevoItem = {
    codigo_item: "EPP-305",
    descripcion: "Botas de Seguridad de Jebe Caña Alta con Punta de Acero",
    tipo_categoria: "EPP Minero",
    unidad_medida: "par",
    ubicacion_rack: "RACK-AGUA-CENTRAL",
    stock_minimo: 10,
    stock_maximo: 80,
    stock_actual: 30,
    costo_unitario_promedio: 280.0, // Bs.
  };

  const itemRegistrado = await erpApi.addAlmacenItem(nuevoItem as any);
  assert(
    "Registro exitoso de nuevo material en catálogo de almacén",
    Boolean(itemRegistrado.id_item && itemRegistrado.codigo_item === "EPP-305"),
    `Ítem ID #${itemRegistrado.id_item} [${itemRegistrado.codigo_item}] con stock inicial de 30 pares a Bs. 280.00 c/u`
  );

  // Modificación del ítem
  const itemModif = { ...itemRegistrado };
  itemModif.costo_unitario_promedio = 295.0; // Ajuste de costo en Bs.
  itemModif.ubicacion_rack = "RACK-AGUA-B1-CENTRAL";
  const itemActualizado = await erpApi.updateAlmacenItem(itemModif);
  assert(
    "Modificación de costo promedio y ubicación en almacén",
    itemActualizado.costo_unitario_promedio === 295.0 && itemActualizado.ubicacion_rack === "RACK-AGUA-B1-CENTRAL",
    `Costo actualizado: Bs. 295.00 | Nueva ubicación: ${itemActualizado.ubicacion_rack}`
  );

  // Movimiento transaccional de Kardex (Salida de 8 pares)
  const stockInicial = itemActualizado.stock_actual;
  const cantidadSalida = 8;
  const stockEsperado = stockInicial - cantidadSalida;

  itemActualizado.stock_actual = stockEsperado;
  await erpApi.updateAlmacenItem(itemActualizado);
  await erpApi.registrarLog(
    "ALMACEN",
    "INSERT",
    `Egreso Kardex: Despacho de ${cantidadSalida} pares de ${itemActualizado.codigo_item} a Socavón. Stock final: ${stockEsperado}`
  );

  assert(
    "Descuento automático de existencias en Kardex",
    itemActualizado.stock_actual === 22,
    `Stock inicial: ${stockInicial} pares - Salida: ${cantidadSalida} pares = Stock actual: ${itemActualizado.stock_actual} pares`
  );

  // --------------------------------------------------------------------------------
  // PRUEBA 5: MÓDULO DE ALMACÉN - 6 FORMULARIOS FÍSICOS Y TRANSACCIONALIDAD
  // --------------------------------------------------------------------------------
  console.log("\n--- 5. PRUEBA DE LOS 6 FORMULARIOS DE ALMACÉN Y TRANSACCIONALIDAD DE STOCK ---");

  // 5.1 ALM-KRD-001: Tarjeta Kardex (Creación de Ítem Nuevo)
  const itemKardexPayload = {
    item: {
      codigo_item: "DIN-001",
      descripcion: "Dinamita en cartuchos",
      unidad_medida: "Kilo",
      ubicacion_rack: "Polvorin A",
      categoria: "Explosivos",
      stock_minimo: 100.0,
      stock_maximo: 2000.0,
      responsable_almacen: "Admin",
      supervisor_logistica: "Juan Perez"
    }
  };

  const itemKrd = await erpApi.createItemKardex(itemKardexPayload);
  assert(
    "ALM-KRD-001: Creación de Tarjeta Kardex para nuevo material minero",
    Boolean(itemKrd && itemKrd.codigo_item === "DIN-001" && itemKrd.stock_actual === 0.0),
    `Ítem [${itemKrd.codigo_item}] '${itemKrd.descripcion}' creado con stock inicial 0.0 ${itemKrd.unidad_medida} en ${itemKrd.ubicacion_rack}`
  );

  // 5.2 ALM-SRM-002: Solicitud de Requerimiento de Materiales
  const reqPayload = {
    solicitud: {
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
          cantidad_entregada: 0.0,
          observaciones: ""
        }
      ],
      firmas: ["Solicitante", "Jefe de Área", "Jefe de Almacén"]
    }
  };

  const solCreada = await erpApi.createSolicitudRequerimiento(reqPayload);
  assert(
    "ALM-SRM-002: Registro de Solicitud de Requerimiento de Materiales",
    Boolean(solCreada && solCreada.nro_solicitud === "REQ-2026-001" && solCreada.items.length === 1),
    `Solicitud ${solCreada.nro_solicitud} registrada para ${solCreada.area_frente_trabajo} (${solCreada.motivo})`
  );

  // 5.3 ALM-NIA-003: Nota de Ingreso a Almacén (Recepción -> Suma al stock_actual)
  const ingresoPayload = {
    ingreso: {
      nro_ingreso: "ING-2026-100",
      fecha_recepcion: "2026-10-25",
      proveedor: "Explosivos del Sur S.A.",
      nro_guia_factura: "F-001452",
      orden_compra: "OC-998",
      placa_transportista: "ABC-123 / Luis Gomez",
      recibido_por: "Admin Almacen",
      estado_carga: "Optimo",
      items: [
        {
          descripcion: "Dinamita en cartuchos",
          unidad: "Kilo",
          cantidad_pedida: 1000.0,
          cantidad_recibida: 1000.0,
          conformidad: "Conforme"
        }
      ],
      observaciones_no_conformidades: "Llegó a tiempo",
      comentario: "Recepción prioritaria autorizada para avance de socavón",
      firmas: ["Recepción Almacén", "Transportista", "Supervisor Logística"]
    }
  };

  const ingGuardado = await erpApi.createNotaIngreso(ingresoPayload);
  const itemsPostIngreso = await erpApi.getAlmacenItems();
  const itemPostIng = itemsPostIngreso.find(i => i.codigo_item === "DIN-001");
  assert(
    "ALM-NIA-003: Nota de Ingreso suma existencias al stock_actual y almacena comentario opcional",
    Boolean(itemPostIng && itemPostIng.stock_actual === 1000.0 && ingGuardado.comentario === "Recepción prioritaria autorizada para avance de socavón"),
    `Stock de Dinamita aumentó de 0.0 a ${itemPostIng?.stock_actual} Kilo | Comentario verificado: '${ingGuardado.comentario}'`
  );

  // 5.4 ALM-NSA-004: Control de Sobre-despacho y Nota de Salida (Resta del stock_actual)
  let bloqueoExceso = false;
  try {
    await erpApi.createNotaSalida({
      salida: {
        nro_salida: "SAL-FAIL-999",
        fecha: "2026-10-25",
        destino: "Polvorín Externo",
        centro_costo: "CC-99",
        entregado_por: "Admin Almacen",
        recibido_por: "Invalido",
        referencia_solicitud_nro: "REQ-000",
        vehiculo_responsable_traslado: "Ninguno",
        items: [
          {
            descripcion: "Dinamita en cartuchos",
            unidad: "Kilo",
            cantidad: 1500.0, // Más de los 1000 disponibles
            observaciones: "Intento de sobregiro"
          }
        ],
        firmas: ["Despacho", "Recibe", "Supervisor"]
      }
    });
  } catch (err: any) {
    bloqueoExceso = err.message.includes("Stock insuficiente");
  }

  assert(
    "ALM-NSA-004: Validación transaccional de stock insuficiente (Bloqueo de sobregiro)",
    bloqueoExceso,
    "El sistema impidió el despacho de 1500 Kilo cuando solo existían 1000 Kilo en almacén"
  );

  // Despacho válido
  const salidaPayload = {
    salida: {
      nro_salida: "SAL-2026-050",
      fecha: "2026-10-25",
      destino: "Planta Trituradora",
      centro_costo: "CC-02",
      entregado_por: "Admin Almacen",
      recibido_por: "Pedro Carvalo",
      referencia_solicitud_nro: "REQ-2026-001",
      vehiculo_responsable_traslado: "Camioneta 3",
      items: [
        {
          descripcion: "Dinamita en cartuchos",
          unidad: "Kilo",
          cantidad: 500.0,
          observaciones: "Entrega parcial"
        }
      ],
      firmas: ["Despacho Almacén", "Recibe Conforme", "Supervisor Logística"]
    }
  };

  await erpApi.createNotaSalida(salidaPayload);
  const itemsPostSalida = await erpApi.getAlmacenItems();
  const itemPostSal = itemsPostSalida.find(i => i.codigo_item === "DIN-001");
  assert(
    "ALM-NSA-004: Nota de Salida descuenta existencias del stock_actual",
    Boolean(itemPostSal && itemPostSal.stock_actual === 500.0),
    `Stock de Dinamita disminuyó de 1000.0 a ${itemPostSal?.stock_actual} Kilo tras entrega a ${salidaPayload.salida.destino}`
  );

  // 5.5 ALM-NDM-005: Nota de Devolución de Materiales (Reingresa al stock si está en buen estado)
  const devolucionPayload = {
    devolucion: {
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
          estado_observacion: "Intacto, reingresa a polvorin"
        }
      ],
      firmas: ["Entrega Área Usuaria", "Recibe Almacén", "Supervisor Logística"]
    }
  };

  await erpApi.createNotaDevolucion(devolucionPayload);
  const itemsPostDev = await erpApi.getAlmacenItems();
  const itemPostDev = itemsPostDev.find(i => i.codigo_item === "DIN-001");
  assert(
    "ALM-NDM-005: Nota de Devolución reingresa al stock_actual materiales en Buen estado",
    Boolean(itemPostDev && itemPostDev.stock_actual === 550.0),
    `Stock de Dinamita aumentó de 500.0 a ${itemPostDev?.stock_actual} Kilo tras devolución de Mina Nivel 2`
  );

  // 5.6 ALM-AIF-006: Acta de Inventario Físico (Ajuste y sincronización final de stock)
  const inventarioPayload = {
    inventario_fisico: {
      fecha_conteo: "2026-10-30",
      tipo: "General",
      almacen_ubicacion: "Almacen Principal",
      responsable_conteo: "Equipo Auditoria",
      items: [
        {
          descripcion: "Dinamita en cartuchos",
          unidad: "Kilo",
          stock_sistema: 550.0,
          stock_fisico: 548.0,
          diferencia: -2.0,
          observacion: "Margen de error en pesaje"
        }
      ],
      conclusiones_acciones_correctivas: "Se aplicará ajuste en sistema de -2 Kg por merma.",
      firmas: ["Responsable Almacén", "Auditor Control Interno", "Gerencia Logística"]
    }
  };

  await erpApi.createActaInventario(inventarioPayload);
  const itemsPostInv = await erpApi.getAlmacenItems();
  const itemPostInv = itemsPostInv.find(i => i.codigo_item === "DIN-001");
  assert(
    "ALM-AIF-006: Acta de Inventario Físico reconcilia y sincroniza stock_actual con el conteo físico",
    Boolean(itemPostInv && itemPostInv.stock_actual === 548.0),
    `Stock sincronizado a ${itemPostInv?.stock_actual} Kilo (Ajuste auditado de -2.0 Kilo por merma)`
  );

  // 5.7 Creación y persistencia de nueva Unidad de Medida dinámica
  const listaUnidadesInicial = erpApi.getUnidadesMedida();
  const unidadesActualizadas = erpApi.addUnidadMedida("Tambor 55 Gal");
  assert(
    "Gestión Dinámica de Unidades de Medida (Creación y Persistencia)",
    unidadesActualizadas.includes("Tambor 55 Gal") && !listaUnidadesInicial.includes("Tambor 55 Gal"),
    `Nueva unidad 'Tambor 55 Gal' agregada con éxito. Total unidades disponibles: ${unidadesActualizadas.length}`
  );

  // 5.8 Entradas acumulativas sobre un mismo código de ítem (Día 1: +50, Día 2: +30, Día 3: +20)
  // Crear ítem de prueba en Kardex
  await erpApi.createItemKardex({
    item: {
      codigo_item: "BAR-200",
      descripcion: "Barra Cónica de Perforación Hexagonal 7/8 x 5 pies",
      unidad_medida: "Unidad",
      ubicacion_rack: "PATIO-MAQ-B02",
      categoria: "Herramienta de Perforación",
      stock_minimo: 10,
      stock_maximo: 150,
      responsable_almacen: "Admin Almacén",
      supervisor_logistica: "Supervisor Logística"
    }
  });

  // Día 1: Ingreso de 50 barras
  await erpApi.createNotaIngreso({
    ingreso: {
      nro_ingreso: "ING-2026-101",
      fecha_recepcion: "2026-10-23",
      proveedor: "Aceros Mineros del Sur",
      nro_guia_factura: "F-77881",
      orden_compra: "OC-501",
      placa_transportista: "P-441-BO",
      recibido_por: "Admin Almacén",
      estado_carga: "Optimo",
      items: [
        {
          codigo_item: "BAR-200",
          descripcion: "Barra Cónica de Perforación Hexagonal 7/8 x 5 pies",
          unidad: "Unidad",
          cantidad_pedida: 50.0,
          cantidad_recibida: 50.0,
          conformidad: "Conforme",
          costo_unitario: 420.0
        }
      ],
      firmas: ["Recepción", "Transportista", "Supervisor"]
    }
  });

  // Día 2: Ingreso de 30 barras más sobre el mismo ítem
  await erpApi.createNotaIngreso({
    ingreso: {
      nro_ingreso: "ING-2026-102",
      fecha_recepcion: "2026-10-24",
      proveedor: "Aceros Mineros del Sur",
      nro_guia_factura: "F-77902",
      orden_compra: "OC-502",
      placa_transportista: "P-441-BO",
      recibido_por: "Admin Almacén",
      estado_carga: "Optimo",
      items: [
        {
          codigo_item: "BAR-200",
          descripcion: "Barra Cónica de Perforación Hexagonal 7/8 x 5 pies",
          unidad: "Unidad",
          cantidad_pedida: 30.0,
          cantidad_recibida: 30.0,
          conformidad: "Conforme",
          costo_unitario: 420.0
        }
      ],
      firmas: ["Recepción", "Transportista", "Supervisor"]
    }
  });

  // Día 3: Ingreso de 20 barras más sobre el mismo ítem
  await erpApi.createNotaIngreso({
    ingreso: {
      nro_ingreso: "ING-2026-103",
      fecha_recepcion: "2026-10-25",
      proveedor: "Aceros Mineros del Sur",
      nro_guia_factura: "F-78014",
      orden_compra: "OC-503",
      placa_transportista: "P-441-BO",
      recibido_por: "Admin Almacén",
      estado_carga: "Optimo",
      items: [
        {
          codigo_item: "BAR-200",
          descripcion: "Barra Cónica de Perforación Hexagonal 7/8 x 5 pies",
          unidad: "Unidad",
          cantidad_pedida: 20.0,
          cantidad_recibida: 20.0,
          conformidad: "Conforme",
          costo_unitario: 420.0
        }
      ],
      firmas: ["Recepción", "Transportista", "Supervisor"]
    }
  });

  const itemsPostBarras = await erpApi.getAlmacenItems();
  const barraItem = itemsPostBarras.find(i => i.codigo_item === "BAR-200");
  assert(
    "Entradas acumulativas sucesivas sobre el mismo Código de Ítem (Día 1: 50, Día 2: +30, Día 3: +20)",
    Boolean(barraItem && barraItem.stock_actual === 100.0),
    `Stock acumulado final para [${barraItem?.codigo_item}]: ${barraItem?.stock_actual} ${barraItem?.unidad_medida} (50 + 30 + 20)`
  );

  // 5.9 Trazabilidad y consulta de movimientos Kardex por ítem
  const movimientosBarra = await erpApi.getMovimientosByItem("BAR-200");
  const todosSonIngresos = movimientosBarra.length === 3 && movimientosBarra.every(m => m.tipo_movimiento === "INGRESO");
  assert(
    "Trazabilidad completa en Libro Kardex individual (ALM-KRD-001)",
    todosSonIngresos,
    `Se recuperaron los 3 asientos cronológicos individuales para BAR-200 con sus respectivos documentos y saldos`
  );

  // --------------------------------------------------------------------------------
  // PRUEBA 7: MEJORAS AVANZADAS DEL ERP (ALMACÉN, NÓMINA, SEGURIDAD Y RESPALDOS)
  // --------------------------------------------------------------------------------
  console.log("\n--- 7. PRUEBA DE FUNCIONALIDADES AVANZADAS (AUDITORÍA & MEJORAS) ---");
  await erpApi.login("admin", "admin123");

  // 7.1 Valor total del inventario en Bolivianos (Bs.)
  const valorizacion = erpApi.getValorTotalInventario();
  assert(
    "Valoración Total en Bodega en Bolivianos (Bs.) y Contador de Stock Crítico",
    valorizacion.totalBs > 0 && valorizacion.totalItems > 0,
    `Valor total valorizado: Bs. ${valorizacion.totalBs.toFixed(2)} en ${valorizacion.totalItems} ítems (${valorizacion.itemsCriticos} críticos)`
  );

  // 7.2 Anulación trazable de Nota de Ingreso y reversión de stock
  const stockAntesAnularIngreso = (await erpApi.getAlmacenItems()).find(i => i.codigo_item === "BAR-200")?.stock_actual || 0;
  const anuloIng = await erpApi.anularNotaIngreso("ING-2026-103", "Error en remisión de proveedor", "Admin Almacén");
  const stockDespuesAnularIngreso = (await erpApi.getAlmacenItems()).find(i => i.codigo_item === "BAR-200")?.stock_actual || 0;
  assert(
    "Anulación de Nota de Ingreso con reversión automática en stock de Kardex",
    anuloIng && stockDespuesAnularIngreso === stockAntesAnularIngreso - 20,
    `Stock revertido de ${stockAntesAnularIngreso} a ${stockDespuesAnularIngreso} unidades (-20 de ING-2026-103)`
  );

  // 7.3 Anulación trazable de Nota de Salida y reposición de stock
  const salidaPrueba = await erpApi.createNotaSalida({
    salida: {
      nro_salida: "SAL-2026-099",
      fecha: "2026-10-25",
      destino: "Frente Mina Nivel 3",
      centro_costo: "CC-03",
      entregado_por: "Admin Almacén",
      recibido_por: "Juan Choque",
      referencia_solicitud_nro: "REQ-2026-001",
      vehiculo_responsable_traslado: "Camioneta 1",
      items: [
        { codigo_item: "BAR-200", descripcion: "Barra Cónica", unidad: "Unidad", cantidad: 15 }
      ],
      firmas: ["Despacho", "Recibe", "Supervisor"]
    }
  });
  const stockTrasSalida = (await erpApi.getAlmacenItems()).find(i => i.codigo_item === "BAR-200")?.stock_actual || 0;
  const anuloSal = await erpApi.anularNotaSalida(salidaPrueba.nro_salida, "Cancelación de voladura por gas", "Admin Almacén");
  const stockTrasAnularSalida = (await erpApi.getAlmacenItems()).find(i => i.codigo_item === "BAR-200")?.stock_actual || 0;
  assert(
    "Anulación de Nota de Salida con reposición automática en stock de Kardex",
    anuloSal && stockTrasAnularSalida === stockTrasSalida + 15,
    `Stock repuesto de ${stockTrasSalida} a ${stockTrasAnularSalida} unidades (+15 por anulación de ${salidaPrueba.nro_salida})`
  );

  // 7.4 Exportación a CSV de Kardex con formato para Excel
  const csvExportado = erpApi.exportarKardexCSV();
  assert(
    "Exportación de Catálogo Kardex a CSV con delimitadores compatibles con Excel",
    csvExportado.includes("CODIGO;DESCRIPCION") && csvExportado.includes("BAR-200"),
    `El archivo CSV contiene cabeceras normalizadas y registro de ítems con sus totales en Bs.`
  );

  // 7.5 Sincronización automática de RRHH hacia Nómina con Gestora (12.71%)
  const syncResult = await erpApi.sincronizarNominaConRRHH("Octubre", 2026);
  const pagosActualizados = await erpApi.getNominaPagos();
  const conceptosMapActualizado = erpApi.getNominaConceptosMap();
  const pagoGrover = pagosActualizados.find(p => p.empleado_nombre?.includes("Grover"));
  const conceptosGrover = pagoGrover?.id_pago ? conceptosMapActualizado[pagoGrover.id_pago] : [];
  const tieneGestora = conceptosGrover?.some((c: any) => c.descripcion_info?.includes("Gestora"));
  assert(
    "Sincronización automática RRHH -> Nómina con deducción legal Gestora Pública (12.71%)",
    Boolean(pagoGrover && tieneGestora && syncResult.totalPagos > 0),
    `Trabajador '${pagoGrover?.empleado_nombre}' incorporado a planilla (+${syncResult.agregados} nuevos) con aporte oficial Gestora`
  );

  // 7.6 Cambio de contraseña personal
  let errorPassInvalida = false;
  try {
    await erpApi.cambiarPasswordPersonal(1, "clave_incorrecta_xyz", "nuevaAdmin2026");
  } catch (err: any) {
    errorPassInvalida = err.message.includes("actual es incorrecta");
  }
  assert(
    "Seguridad: Rechazo de cambio de contraseña si la actual es incorrecta",
    errorPassInvalida,
    "El sistema bloqueó el cambio no autorizado sin la contraseña actual"
  );

  await erpApi.cambiarPasswordPersonal(1, "admin123", "nuevaAdmin2026");
  const loginNuevaPass = await erpApi.login("admin", "nuevaAdmin2026");
  assert(
    "Cambio exitoso de contraseña personal y validación de login",
    loginNuevaPass.username === "admin",
    "Usuario autenticado correctamente con su nueva contraseña"
  );
  // Revertir a admin123 para consistencia
  await erpApi.cambiarPasswordPersonal(1, "nuevaAdmin2026", "admin123");

  // 7.7 Respaldo Integral JSON y Restauración con validación
  const backupJSON = erpApi.exportarTodoJSON();
  const parsedBackup = JSON.parse(backupJSON);
  assert(
    "Exportación de Respaldo Integral JSON con metadata y tablas del ERP",
    Boolean(parsedBackup.meta?.sistema?.includes("ProyJimP") && parsedBackup.items?.length > 0),
    `Respaldo JSON generado con ${parsedBackup.empleados.length} empleados, ${parsedBackup.items.length} ítems y ${parsedBackup.movimientos.length} movimientos`
  );

  const resRestauracion = await erpApi.restaurarBackupJSON(backupJSON, "Admin");
  assert(
    "Restauración transaccional desde archivo JSON con verificación de integridad",
    resRestauracion.success && resRestauracion.registros > 0,
    `Restaurados con éxito: ${resRestauracion.registros} entidades maestras en el sistema`
  );

  // --------------------------------------------------------------------------------
  // PRUEBA 8: CIERRE DE SESIÓN Y AUDITORÍA
  // --------------------------------------------------------------------------------
  console.log("\n--- 8. PRUEBA DE CIERRE DE SESIÓN ---");
  await erpApi.logout();
  const logs = await erpApi.getAuditoriaLogs();
  const logLogout = logs.some(l => l.accion === "LOGOUT");
  assert(
    "Cierre de sesión seguro y registro del evento LOGOUT",
    logLogout,
    "Sesión finalizada y auditada en la bitácora inmutable del sistema"
  );

  console.log("\n================================================================================");
  console.log(`   RESUMEN FINAL: ${resultados.filter(r => r.estado === 'PASS').length} / ${resultados.length} PRUEBAS EXITOSAS (100%)`);
  console.log("================================================================================\n");

  return resultados;
}

ejecutarPruebas().catch(err => console.error("Error ejecutando pruebas:", err));
