// bci_extractor.gs
class BciExtractor extends Extractor {
  /**
   * Parsing de correo de tarjeta de crédito BCI
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
   * Parsing de correo de transferencia BCI
   */
  _parseBCITransfer(body, time) {
    const isReceived = /\brecibido\b/i.test(body); // Busca la palabra "recibido" (o perfecciónalo si lo necesitas)

    const amount = extractAmount(
      body,
      "CLP",
      isReceived
        ? /Monto recibido\s+\$([0-9\.]+)/ // Para transferencias recibidas
        : /Monto transferido\s+\$([0-9\.]+)/ // Para transferencias realizadas
    );

    const date = extractByRegex(
      body,
      isReceived
        ? /Fecha de la transferencia\s*(\d{2}\/\d{2}\/\d{4})/
        : /Fecha de abono\s*(\d{2}\/\d{2}\/\d{4})/,
      ""
    );

    let bancoOtro, cuenta, nombre, mensaje;
    if (isReceived) {
      bancoOtro = extractByRegex(body, /Banco de origen\s*(.*)/, "");
      cuenta = ""; // no hay cuenta de destino relevante en recibidas
      nombre = ""; // normalmente no se menciona destinatario
      mensaje = extractByRegex(body, /Mensaje\s*(.*)/, "");
    } else {
      bancoOtro = extractByRegex(body, /Banco de destino\s*(.*)/, "");
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
          ? `(Banco origen: ${bancoOtro})`
          : `(Banco destino: ${bancoOtro})`) +
        (cuenta ? ` (Cuenta: ${cuenta})` : "") +
        (nombre ? ` (Nombre: ${nombre})` : ""),
    });
  }

  /**
   * Parsing de pago de cuenta en línea
   */
  _parseBCIOnlinePayment(body, time) {
    const amount = extractAmount(body, "CLP");
    const empresa = extractByRegex(body, /Empresa\s*(.*)/, "");
    const date = extractByRegex(body, /Fecha\s*(\d{2}\/\d{2}\/\d{4})/, "");
    const cuenta = extractByRegex(body, /Número de cliente\s*(.*)/, "");
    const servicio = extractByRegex(body, /^Servicio (.+)$/m, "");

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
   * Parsing de pago de crédito
   */
  _parseBCICreditPayment(htmlBody, date, time) {
    // Usa RegEx que reconozca bien el HTML y extrae info relevante
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
      medio: VALUE_TYPE_TRANS,
      banco: VALUE_BANK_BCI,
      fecha: date,
      hora: time,
      monto: amount,
      moneda: VALUE_CURRENCY_CLP,
      descripcion: description + (cuotas ? ` (Cuotas: ${cuotas})` : ""),
    });
  }

  parse(message) {
    Logger.log("Parsing message with BciExtractor: " + message.getPlainBody());
    var from = message.getFrom();
    Logger.log("Date: " + message.getDate());
    const jsDate = message.getDate(); // objeto Date
    const date = formatDate(jsDate); // "02/07/2024"
    const time = formatTime(jsDate);
    if (
      message.getSubject() === "Notificación de uso de tu tarjeta de crédito" &&
      from.includes("contacto@bci.cl")
    ) {
      return this._parseBCICreditCard(message.getPlainBody());
    } else if (
      message.getSubject() === "Aviso de Transferencia de Fondos." &&
      from.includes("transferencias@bci.cl")
    ) {
      return this._parseBCITransfer(message.getPlainBody(), time);
    } else if (
      message.getSubject() === "Pago de Cuenta en Linea" &&
      from.includes("contacto@bci.cl")
    ) {
      return this._parseBCIOnlinePayment(message.getPlainBody(), time);
    } else if (
      message.getSubject() === "Pago crédito consumo" &&
      from.includes("contacto@bci.cl")
    ) {
      return this._parseBCICreditPayment(message.getPlainBody(), date, time);
    } else {
      Logger.log(
        "Mensaje no reconocido. Subject: " +
          message.getSubject() +
          ", From: " +
          from
      );
    }
  }
}
