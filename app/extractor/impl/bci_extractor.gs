/**
 * Extractor especializado para notificaciones y comprobantes del Banco BCI.
 * Implementa distintos métodos para parsear y transformar correos en entidades de transacción.
 * @extends Extractor
 */
class BciExtractor extends Extractor {
  /**
   * Parsea notificaciones de uso de tarjeta de crédito BCI.
   * @param {string} body - El mensaje de texto plano extraído del email.
   * @returns {TransactionEntity}
   */
  _parseBCICreditCard(body) {
    const isInternational = /compra\s+en\s+comercio\s+internacional/i.test(
      body
    );
    const amount = extractAmount(
      body,
      isInternational ? VALUE_CURRENCY_USD : VALUE_CURRENCY_CLP
    );
    const isCancellation = /\banulación\b/i.test(body);
    const description = extractByRegex(
      body,
      /Comercio\s*(.*)/,
      "No encontrado"
    );
    const date = extractByRegex(body, /Fecha\s*(\d{2}\/\d{2}\/\d{4})/, "");
    const time = extractByRegex(body, /Hora\s*(\d{2}:\d{2})\s*horas/, "");
    const installments = extractByRegex(body, /Cuotas\s*(\d+)/, "");

    return new TransactionEntity({
      tipo: isCancellation ? VALUE_REVENUE : VALUE_EGRESS,
      medio: VALUE_TYPE_CREDIT,
      banco: VALUE_BANK_BCI,
      fecha: date,
      hora: time,
      monto: amount,
      moneda: isInternational ? VALUE_CURRENCY_USD : VALUE_CURRENCY_CLP,
      descripcion:
        description +
        (isCancellation ? " (Anulación)" : "") +
        (installments ? ` (Cuotas: ${installments})` : ""),
    });
  }

  /**
   * Parsea correos de transferencia BCI (recibida/realizada).
   * Determina si es egreso o ingreso.
   * @param {string} body - El mensaje de texto plano.
   * @param {string} time - Hora de la operación.
   * @returns {TransactionEntity}
   */
  _parseBCITransfer(body, time) {
    const isReceived = /\brecibido\b/i.test(body);

    const amount = extractAmount(
      body,
      "CLP",
      isReceived
        ? /Monto recibido\s+\$([0-9\.]+)/
        : /Monto transferido\s+\$([0-9\.]+)/
    );

    const date = extractByRegex(
      body,
      isReceived
        ? /Fecha de la transferencia\s*(\d{2}\/\d{2}\/\d{4})/
        : /Fecha de abono\s*(\d{2}\/\d{2}\/\d{4})/,
      ""
    );

    let bancoTercero = "";
    let cuenta = "";
    let nombre = "";
    let mensaje = "";

    if (isReceived) {
      bancoTercero = extractByRegex(body, /Banco de origen\s*(.*)/, "");
      mensaje = extractByRegex(body, /Mensaje\s*(.*)/, "");
    } else {
      bancoTercero = extractByRegex(body, /Banco de destino\s*(.*)/, "");
      cuenta = extractByRegex(body, /Cuenta de destino\s*(.*)/, "");
      nombre = extractByRegex(body, /Nombre del destinatario\s*(.*)/, "");
      mensaje = extractByRegex(body, /Mensaje\s*(.*)/, "");
    }

    return new TransactionEntity({
      tipo: isReceived ? VALUE_REVENUE : VALUE_EGRESS,
      medio: VALUE_TYPE_TRANS,
      banco: VALUE_BANK_BCI,
      fecha: date,
      hora: time,
      monto: amount,
      moneda: VALUE_CURRENCY_CLP,
      descripcion:
        (mensaje ? `${mensaje} ` : "") +
        (isReceived
          ? `(Banco origen: ${bancoTercero})`
          : `(Banco destino: ${bancoTercero})`) +
        (cuenta ? ` (Cuenta: ${cuenta})` : "") +
        (nombre ? ` (Nombre: ${nombre})` : ""),
    });
  }

  /**
   * Parsea pagos online BCI.
   * @param {string} body - Mensaje de texto.
   * @param {string} time - Hora del pago.
   * @returns {TransactionEntity}
   */
  _parseBCIOnlinePayment(body, time) {
    const amount = extractAmount(body, "CLP");
    const empresa = extractByRegex(body, /Empresa\s*(.*)/, "");
    const date = extractByRegex(body, /Fecha\s*(\d{2}\/\d{2}\/\d{4})/, "");
    const cuenta = extractByRegex(body, /Número de cliente\s*(.*)/, "");
    const servicio = extractByRegex(body, /^\s*Servicio\s+(.+)$/m, "");

    return new TransactionEntity({
      tipo: VALUE_EGRESS,
      medio: VALUE_TYPE_PAYMENT,
      banco: VALUE_BANK_BCI,
      fecha: date,
      hora: time,
      monto: amount,
      moneda: VALUE_CURRENCY_CLP,
      descripcion:
        empresa +
        (cuenta ? ` (Cuenta: ${cuenta})` : "") +
        (servicio ? ` (Servicio: ${servicio})` : ""),
    });
  }

  /**
   * Parsea correo de pago de crédito BCI.
   * @param {string} htmlBody - HTML completo del correo.
   * @param {string} date - Fecha de la operación.
   * @param {string} time - Hora de la operación.
   * @returns {TransactionEntity}
   */
  _parseBCICreditPayment(htmlBody, date, time) {
    const amount = extractAmount(
      htmlBody,
      "CLP",
      /Monto:\s*<\/td>\s*<td[^>]*>\s*\$?([0-9.,]+)/i
    );
    const description = extractByRegex(
      htmlBody,
      /Nº de cr&eacute;dito:\s*<\/td>\s*<td[^>]*>\s*(\w+)/,
      "No encontrado"
    );
    const cuotas = extractByRegex(
      htmlBody,
      /Nº de cuota\(s\):\s*<\/td>\s*<td[^>]*>\s*(\d+)/,
      ""
    );

    return new TransactionEntity({
      tipo: VALUE_EGRESS,
      medio: VALUE_TYPE_PAYMENT_CREDIT,
      banco: VALUE_BANK_BCI,
      fecha: date,
      hora: time,
      monto: amount,
      moneda: VALUE_CURRENCY_CLP,
      descripcion: description + (cuotas ? ` (Cuotas: ${cuotas})` : ""),
    });
  }

  /**
   * Determina el tipo de correo y lo transforma en TransactionEntity.
   * @param {GmailMessage} message - Mensaje de Gmail.
   * @returns {TransactionEntity|undefined} Entidad resultado o undefined si no matchea ningún patrón.
   */
  parse(message) {
    if (!message) {
      Logger.log("Mensaje no definido.");
      return undefined;
    }
    Logger.log("Parsing message with BciExtractor: " + message.getPlainBody());
    const from = message.getFrom();
    const jsDate = message.getDate();
    const date = formatDate(jsDate);
    const time = formatTime(jsDate);

    if (
      message.getSubject() === "Notificación de uso de tu tarjeta de crédito" &&
      from.includes("contacto@bci.cl")
    ) {
      return this._parseBCICreditCard(message.getPlainBody());
    }
    if (
      message.getSubject() === "Aviso de Transferencia de Fondos." &&
      from.includes("transferencias@bci.cl")
    ) {
      return this._parseBCITransfer(message.getPlainBody(), time);
    }
    if (
      message.getSubject() === "Pago de Cuenta en Linea" &&
      from.includes("contacto@bci.cl")
    ) {
      return this._parseBCIOnlinePayment(message.getPlainBody(), time);
    }
    if (
      message.getSubject() === "Pago crédito consumo" &&
      from.includes("contacto@bci.cl")
    ) {
      return this._parseBCICreditPayment(message.getPlainBody(), date, time);
    }

    Logger.log(
      "Mensaje no reconocido. Subject: " +
        message.getSubject() +
        ", From: " +
        from
    );
    return undefined;
  }
}
