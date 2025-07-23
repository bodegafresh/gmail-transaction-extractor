/**
 * Organizador automático de movimientos financieros desde Gmail a Google Sheets
 * Compatible con BCI, extensible para otros bancos y flujos.
 *
 * Autor: Tu Nombre
 * GitHub: https://github.com/bodegafresh/gmail-transaction-extractor
 *
 * Consideraciones de seguridad: Nunca publiques tu spreadsheetId, revisa los permisos, y pon restricciones a las etiquetas de Gmail.
 */

/**
 * Configuración principal
 */
const SPREADSHEET_ID = 'TU_ID_AQUI';
const SHEET_NAME = 'Historico';
const PROCESS_LABEL = 'finanzas/bciProcesado'; // Define tu propio label en Gmail

/**
 * Punto de entrada principal
 */
function processInbox() {
  const threads = GmailApp.search('label:finanzas/bciCargos -label:' + PROCESS_LABEL);
  if (threads.length === 0) {
    Logger.log('No hay hilos por procesar.');
    return;
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const processLabel = GmailApp.getUserLabelByName(PROCESS_LABEL);

  for (const thread of threads) {
    for (const message of thread.getMessages()) {
      try {
        processMessage(message, sheet);
        thread.addLabel(processLabel);
      } catch (e) {
        Logger.log('Error procesando mensaje: ' + e);
      }
    }
  }
}

/**
 * Procesamiento de cada mensaje individual
 */
function processMessage(message, sheet) {
  const subject = message.getSubject();
  const from = message.getFrom().toLowerCase();
  const bodyPlain = message.getPlainBody();
  const bodyHtml = message.getBody();

  const date = formatDate(message.getDate());
  const time = formatTime(message.getDate());

  // Puedes agregar aquí nuevas reglas y flujos, solo extiende el switch
  if (subject === 'Notificación de uso de tu tarjeta de crédito' && from.includes('contacto@bci.cl')) {
    parseBCICreditCard(bodyPlain, sheet);
  } else if (subject === 'Aviso de Transferencia de Fondos.' && from.includes('transferencias@bci.cl')) {
    parseBCITransfer(bodyPlain, sheet, time);
  } else if (subject === 'Pago de Cuenta en Linea' && from.includes('contacto@bci.cl')) {
    parseBCIOnlinePayment(bodyPlain, sheet, time);
  } else if (subject === 'Pago crédito consumo' && from.includes('contacto@bci.cl')) {
    parseBCICreditPayment(bodyHtml, sheet, date, time);
  } else {
    Logger.log('Mensaje no reconocido. Subject: ' + subject + ', From: ' + from);
  }
}

/**
 * Parsing de correo de tarjeta de crédito BCI
 */
function parseBCICreditCard(body, sheet) {
  const isInternational = /compra\s+en\s+comercio\s+internacional/i.test(body);
  const localidad = isInternational ? 'Internacional' : 'Nacional';
  const amount = extractAmount(body, isInternational ? 'USD' : 'CLP');
  const isCancellation = /\banulación\b/i.test(body);

  const description = extractByRegex(body, /Comercio\s*(.*)/, 'No encontrado');
  const date = extractByRegex(body, /Fecha\s*(\d{2}\/\d{2}\/\d{4})/, '');
  const time = extractByRegex(body, /Hora\s*(\d{2}:\d{2})\s*horas/, '');
  const installments = extractByRegex(body, /Cuotas\s*(\d+)/, '');

  appendToSheet(sheet, [date, time, 'Tarjeta Crédito', amount, description, installments, localidad, isCancellation ? 'Ingreso' : 'Egreso', '', '']);
}

/**
 * Parsing de correo de transferencia BCI
 */
function parseBCITransfer(body, sheet, time) {
  const amount = extractAmount(body, 'CLP', /Monto transferido\s+\$([0-9\.]+)/);
  const description = extractByRegex(body, /Mensaje\s*(.*)/);
  const date = extractByRegex(body, /Fecha de abono\s*(\d{2}\/\d{2}\/\d{4})/, '');
  const cuenta = extractByRegex(body, /Cuenta de destino\s*(.*)/, 'No encontrado');
  const name = extractByRegex(body, /Nombre del destinatario\s*(.*)/, '');

  appendToSheet(sheet, [date, time, 'Transferencia', amount, description, '', 'Nacional', 'Egreso', name, cuenta]);
}

/**
 * Parsing de pago de cuenta en línea
 */
function parseBCIOnlinePayment(body, sheet, time) {
  const amount = extractAmount(body, 'CLP');
  const description = extractByRegex(body, /Empresa\s*(.*)/, '');
  const date = extractByRegex(body, /Fecha\s*(\d{2}\/\d{2}\/\d{4})/, '');
  const cuenta = extractByRegex(body, /Número de cliente\s*(.*)/, '');
  const name = extractByRegex(body, /Servicio\s*(.*)/, '');

  appendToSheet(sheet, [date, time, 'Pago en línea', amount, description, '', 'Nacional', 'Egreso', name, cuenta]);
}

/**
 * Parsing de pago de crédito
 */
function parseBCICreditPayment(htmlBody, sheet, date, time) {
  // Usa RegEx que reconozca bien el HTML y extrae info relevante
  const amount = extractAmount(htmlBody, 'CLP', /Monto:\s*<\/td>\s*<td[^>]*>\s*\$?([0-9.,]+)/i);
  const description = extractByRegex(htmlBody, /Nº de cr&eacute;dito:\s*<\/td>\s*<td[^>]*>\s*(\w+)/, 'No encontrado');
  const cuotas = extractByRegex(htmlBody, /Nº de cuota\(s\):\s*<\/td>\s*<td[^>]*>\s*(\d+)/, '');

  appendToSheet(sheet, [date, time, 'Pago Crédito', amount, description, cuotas, 'Nacional', 'Egreso', '', '']);
}

/**
 * Herramientas de extracción y utils
 */
function extractAmount(body, tipo, customRegex) {
  let regex, match, amount;
  if (tipo === 'USD') {
    regex = customRegex || /Monto\s+USD\s+([0-9,\.]+)/;
    match = body.match(regex);
    amount = match ? match[1].replace(/\,/g, '.').replace(/[^0-9\.]/g, '') : '';
  } else {
    // CLP
    regex = customRegex || /Monto\s+\$([0-9\.]+)/;
    match = body.match(regex);
    amount = match ? match[1].replace(/\./g, '') : '';
  }
  return amount || '0';
}
function extractByRegex(body, regex, defaultValue = '') {
  const m = body.match(regex);
  return m ? m[1].trim() : defaultValue;
}
function appendToSheet(sheet, arr) {
  sheet.appendRow(arr);
}
function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy');
}
function formatTime(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'HH:mm');
}