/* ============================================
   GOOGLE APPS SCRIPT - LOCAL MARKET
   Con Upload Automático a Google Drive
   ============================================ */

// ============================================
// CONFIGURACIÓN
// ============================================
const CONFIG = {
  sheetName: 'Productos',
  adminEmail: 'jerezcarlos70@gmail.com', // TU EMAIL AQUÍ
  imageFolderName: 'LocalMarket - Productos', // Nombre de la carpeta en Drive
  publicSheetURL: 'https://docs.google.com/spreadsheets/d/TU_ID/pub?gid=0&single=true&output=csv'
};

// ============================================
// OBTENER O CREAR CARPETA DE IMÁGENES
// ============================================
function getOrCreateImageFolder() {
  const folders = DriveApp.getFoldersByName(CONFIG.imageFolderName);
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    const folder = DriveApp.createFolder(CONFIG.imageFolderName);
    // Hacer la carpeta pública (cualquiera con el link puede ver)
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return folder;
  }
}

// ============================================
// SUBIR IMAGEN A GOOGLE DRIVE
// ============================================
function uploadImageToDrive(imageData, imageName, productId) {
  try {
    // Obtener la carpeta
    const folder = getOrCreateImageFolder();
    
    // Decodificar base64
    const blob = Utilities.newBlob(
      Utilities.base64Decode(imageData.data),
      imageData.mimeType,
      `product_${productId}_${imageName}`
    );
    
    // Crear archivo en Drive
    const file = folder.createFile(blob);
    
    // Hacer el archivo público
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Obtener ID del archivo
    const fileId = file.getId();
    
    Logger.log('Imagen subida: ' + fileId);
    
    return fileId;
    
  } catch (error) {
    Logger.log('Error subiendo imagen: ' + error);
    throw error;
  }
}

// ============================================
// RECIBIR PRODUCTOS DESDE EL FORMULARIO WEB
// ============================================
function doPost(e) {
  try {
    // Parsear datos recibidos
    const data = JSON.parse(e.postData.contents);
    
    Logger.log('Datos recibidos: ' + JSON.stringify(data));
    
    // Obtener la hoja de cálculo
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.sheetName);
    
    // Si no existe la hoja, crearla
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.sheetName);
      crearEncabezados(sheet);
    }
    
    // Generar ID único
    const lastRow = sheet.getLastRow();
    const newId = lastRow > 1 ? parseInt(sheet.getRange(lastRow, 1).getValue()) + 1 : 1;
    
    // SUBIR IMÁGENES A GOOGLE DRIVE
    Logger.log('Subiendo ' + data.images.length + ' imágenes...');
    const imageIds = [];
    
    for (let i = 0; i < data.images.length; i++) {
      const image = data.images[i];
      try {
        const fileId = uploadImageToDrive(image, image.name, newId);
        imageIds.push(fileId);
        Logger.log(`Imagen ${i+1}/${data.images.length} subida: ${fileId}`);
      } catch (error) {
        Logger.log('Error subiendo imagen ' + (i+1) + ': ' + error);
      }
    }
    
    // Convertir IDs a string separado por pipe
    const imageIdsString = imageIds.join('|');
    
    Logger.log('IDs de imágenes: ' + imageIdsString);
    
    // Preparar fila de datos
    const rowData = [
      newId,                           // id
      data.nombre,                     // nombre
      data.precio,                     // precio
      data.categoria,                  // categoria
      data.estado,                     // estado
      data.descripcionCorta,           // descripcionCorta
      data.descripcionLarga,           // descripcionLarga
      imageIdsString,                  // imagenes (IDs separados por |)
      data.ubicacion,                  // ubicacion
      data.comuna,                     // comuna
      data.region,                     // region
      data.entrega,                    // entrega
      'pendiente',                     // disponibilidad
      data.fechaPublicacion,           // fechaPublicacion
      'FALSE',                         // destacado
      data.vendedor,                   // vendedor
      data.whatsappvendedor,           // whatsappvendedor
      new Date(),                      // fechaRecepcion
      data.email,                      // email
      '',                              // notasAdmin
      ''                               // accionAdmin
    ];
    
    // Agregar fila
    sheet.appendRow(rowData);
    
    // Colorear la fila como pendiente (amarillo)
    const newRow = sheet.getLastRow();
    sheet.getRange(newRow, 1, 1, rowData.length).setBackground('#FFF3CD');
    
    // Enviar notificación al admin
    notificarAdminNuevoProducto(data, newId, imageIds.length);
    
    // Enviar confirmación al vendedor
    enviarConfirmacionVendedor(data);
    
    // Respuesta exitosa
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Producto recibido correctamente',
      id: newId,
      imagesUploaded: imageIds.length
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error en doPost: ' + error);
    
    // Enviar email de error al admin
    try {
      MailApp.sendEmail(
        CONFIG.adminEmail,
        '❌ Error en LocalMarket - Sistema de Productos',
        'Se produjo un error al procesar un producto:\n\n' + error.toString()
      );
    } catch (e) {
      Logger.log('Error enviando email de error: ' + e);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// CREAR ENCABEZADOS DE LA HOJA
// ============================================
function crearEncabezados(sheet) {
  const headers = [
    'id',
    'nombre',
    'precio',
    'categoria',
    'estado',
    'descripcionCorta',
    'descripcionLarga',
    'imagenes',
    'ubicacion',
    'comuna',
    'region',
    'entrega',
    'disponibilidad',
    'fechaPublicacion',
    'destacado',
    'vendedor',
    'whatsappvendedor',
    'fechaRecepcion',
    'email',
    'notasAdmin',
    'accionAdmin'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#5B7B5A');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
}

// ============================================
// NOTIFICAR AL ADMIN DE NUEVO PRODUCTO
// ============================================
function notificarAdminNuevoProducto(data, id, numImagenes) {
  const subject = '🆕 Nuevo Producto para Revisar - Local Market';
  
  // Obtener URLs de las imágenes
  const folder = getOrCreateImageFolder();
  const folderId = folder.getId();
  const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
  
  const body = `
Hola Admin,

Un nuevo producto ha sido enviado para revisión:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 INFORMACIÓN DEL PRODUCTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ID: ${id}
Nombre: ${data.nombre}
Precio: $${parseInt(data.precio).toLocaleString('es-CL')}
Categoría: ${data.categoria}
Estado: ${data.estado}

Descripción:
${data.descripcionLarga}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 VENDEDOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nombre: ${data.vendedor}
Email: ${data.email}
WhatsApp: ${data.whatsappvendedor}
Ubicación: ${data.ubicacion}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📸 IMÁGENES (${numImagenes} fotos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ver todas las imágenes en Google Drive:
${folderUrl}

Las imágenes se subieron automáticamente a tu carpeta "${CONFIG.imageFolderName}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para aprobar o rechazar este producto:
1. Abre la hoja de Google Sheets
2. Busca la fila con ID ${id}
3. Cambia la columna "disponibilidad" a "disponible" para aprobar
4. O cámbiala a "rechazado" para rechazar

El producto aparecerá automáticamente en el sitio al aprobarlo.

Saludos,
Sistema Local Market
  `;
  
  try {
    MailApp.sendEmail(CONFIG.adminEmail, subject, body);
  } catch (error) {
    Logger.log('Error enviando email al admin: ' + error);
  }
}

// ============================================
// ENVIAR CONFIRMACIÓN AL VENDEDOR
// ============================================
function enviarConfirmacionVendedor(data) {
  const subject = '✅ Producto Recibido - Local Market';
  
  const body = `
Hola ${data.vendedor},

¡Gracias por publicar en Local Market!

Hemos recibido tu producto:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 ${data.nombre}
💰 $${parseInt(data.precio).toLocaleString('es-CL')}
📸 ${data.images ? data.images.length : 0} foto(s) subida(s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏳ ¿Qué sigue?

Tu producto está en revisión. Nuestro equipo lo verificará y lo publicará en el catálogo en las próximas 24-48 horas.

Te enviaremos otro email cuando tu producto esté publicado y visible para todos.

📱 Tu WhatsApp de contacto: ${data.whatsappvendedor}

Si tienes alguna pregunta, responde a este email.

¡Gracias por confiar en nosotros!

Equipo Local Market
  `;
  
  try {
    MailApp.sendEmail(data.email, subject, body);
  } catch (error) {
    Logger.log('Error enviando email al vendedor: ' + error);
  }
}

// ============================================
// FUNCIÓN PARA APROBAR PRODUCTOS (TRIGGER AUTOMÁTICO)
// ============================================
function onEdit(e) {
  try {
    const sheet = e.source.getActiveSheet();
    const range = e.range;
    const row = range.getRow();
    const col = range.getColumn();
    
    // Solo procesar si es la hoja correcta y no es la primera fila
    if (sheet.getName() !== CONFIG.sheetName || row === 1) return;
    
    // Columna 13 = disponibilidad
    if (col === 13) {
      const newValue = range.getValue();
      const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      // Si cambió a "disponible" (aprobado)
      if (newValue === 'disponible') {
        sheet.getRange(row, 1, 1, sheet.getLastColumn()).setBackground('#D4EDDA');
        enviarEmailAprobacion(rowData);
        sheet.getRange(row, 21).setValue('aprobado');
      } 
      // Si cambió a "rechazado"
      else if (newValue === 'rechazado') {
        sheet.getRange(row, 1, 1, sheet.getLastColumn()).setBackground('#F8D7DA');
        enviarEmailRechazo(rowData);
        sheet.getRange(row, 21).setValue('rechazado');
      }
      // Si cambió a "pendiente"
      else if (newValue === 'pendiente') {
        sheet.getRange(row, 1, 1, sheet.getLastColumn()).setBackground('#FFF3CD');
      }
    }
  } catch (error) {
    Logger.log('Error en onEdit: ' + error);
  }
}

// ============================================
// ENVIAR EMAIL DE APROBACIÓN
// ============================================
function enviarEmailAprobacion(rowData) {
  const [id, nombre, precio, categoria, estado, , , , , , , , , , , vendedor, whatsapp, , email] = rowData;
  
  const subject = '🎉 ¡Tu Producto ha sido Publicado! - Local Market';
  
  const body = `
¡Hola ${vendedor}!

¡Excelentes noticias! 🎉

Tu producto ha sido aprobado y ya está visible en nuestro catálogo:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 ${nombre}
💰 $${parseInt(precio).toLocaleString('es-CL')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 Ver en el catálogo:
https://tu-sitio.com/catalogo.html?categoria=${categoria}

📱 Los interesados te contactarán directamente al WhatsApp: ${whatsapp}

💡 Consejos:
✓ Responde rápido a los mensajes
✓ Sé amable y profesional
✓ Ten fotos adicionales listas si te las piden
✓ Coordina horarios flexibles para retiro/entrega

¡Mucha suerte con tu venta!

Equipo Local Market
  `;
  
  try {
    MailApp.sendEmail(email, subject, body);
  } catch (error) {
    Logger.log('Error enviando email de aprobación: ' + error);
  }
}

// ============================================
// ENVIAR EMAIL DE RECHAZO
// ============================================
function enviarEmailRechazo(rowData) {
  const [id, nombre, , , , , , , , , , , , , , vendedor, , , email, notasAdmin] = rowData;
  
  const subject = '❌ Producto No Aprobado - Local Market';
  
  const motivo = notasAdmin || 'No cumple con nuestras políticas de publicación';
  
  const body = `
Hola ${vendedor},

Lamentablemente tu producto "${nombre}" no ha sido aprobado para publicación.

Motivo:
${motivo}

Si crees que esto es un error o quieres más información, responde a este email y lo revisaremos.

También puedes intentar publicar otro producto que cumpla con nuestras políticas.

Saludos,
Equipo Local Market
  `;
  
  try {
    MailApp.sendEmail(email, subject, body);
  } catch (error) {
    Logger.log('Error enviando email de rechazo: ' + error);
  }
}

// ============================================
// FUNCIÓN PARA OBTENER ESTADÍSTICAS (OPCIONAL)
// ============================================
function obtenerEstadisticas() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetName);
  const data = sheet.getDataRange().getValues();
  
  let stats = {
    total: data.length - 1,
    pendientes: 0,
    aprobados: 0,
    rechazados: 0,
    totalImagenes: 0
  };
  
  for (let i = 1; i < data.length; i++) {
    const estado = data[i][12];
    const imagenes = data[i][7];
    
    if (estado === 'pendiente') stats.pendientes++;
    else if (estado === 'disponible') stats.aprobados++;
    else if (estado === 'rechazado') stats.rechazados++;
    
    if (imagenes) {
      stats.totalImagenes += imagenes.split('|').length;
    }
  }
  
  Logger.log(stats);
  return stats;
}

// ============================================
// TEST: Subir imagen de prueba
// ============================================
function testUploadImage() {
  // Esto es solo para probar que funciona la carpeta
  const folder = getOrCreateImageFolder();
  Logger.log('Carpeta ID: ' + folder.getId());
  Logger.log('Carpeta URL: https://drive.google.com/drive/folders/' + folder.getId());
}