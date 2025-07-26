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
    const amount = extractAmount(
      body,
      "CLP",
      /Monto transferido\s+\$([0-9\.]+)/
    );
    const description = extractByRegex(body, /Mensaje\s*(.*)/);
    const date = extractByRegex(
      body,
      /Fecha de abono\s*(\d{2}\/\d{2}\/\d{4})/,
      ""
    );
    const cuenta = extractByRegex(
      body,
      /Cuenta de destino\s*(.*)/,
      "No encontrado"
    );
    const name = extractByRegex(body, /Nombre del destinatario\s*(.*)/, "");

    return new TransactionEntity({
      tipo: VALUE_EGRESS,
      medio: VALUE_TYPE_TRANS,
      banco: VALUE_BANK_BCI,
      fecha: date,
      hora: time,
      monto: amount,
      moneda: VALUE_CURRENCY_CLP,
      descripcion:
        description +
        (cuenta ? ` (Cuenta: ${cuenta})` : "") +
        (name ? ` (Nombre: ${name})` : ""),
    });
  }

  /**
   * Parsing de pago de cuenta en línea
   */
  _parseBCIOnlinePayment(body, time) {
    const amount = extractAmount(body, "CLP");
    const description = extractByRegex(body, /Empresa\s*(.*)/, "");
    const date = extractByRegex(body, /Fecha\s*(\d{2}\/\d{2}\/\d{4})/, "");
    const cuenta = extractByRegex(body, /Número de cliente\s*(.*)/, "");
    const name = extractByRegex(body, /Servicio\s*(.*)/, "");

    return new TransactionEntity({
      tipo: VALUE_EGRESS,
      medio: VALUE_TYPE_TRANS,
      banco: VALUE_BANK_BCI,
      fecha: date,
      hora: time,
      monto: amount,
      moneda: VALUE_CURRENCY_CLP,
      descripcion:
        description +
        (cuenta ? ` (Cuenta: ${cuenta})` : "") +
        (name ? ` (Nombre: ${name})` : ""),
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
    const date = formatDate(message.getDate());
    const time = formatTime(message.getDate());
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
      return this._parseBCIOnlinePayment(message.getPlainBody());
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
