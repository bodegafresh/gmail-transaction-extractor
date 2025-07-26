/**
 * Extractor especializado para compras y movimientos Banco Edwards.
 * Permite agregar parsing para otros tipos (transferencias, servicios, etc) modularmente.
 * @extends Extractor
 */
class EdwardsExtractor extends Extractor {
  /**
   * Parsea un mensaje de compra con tarjeta de débito.
   * @private
   * @param {string} body - Texto plano del correo.
   * @returns {TransactionEntity|undefined}
   */
  _parseDebitPurchase(emailBody) {
    const regex =
      /se ha realizado una compra por\s+\$([\d\.]+)\s+con\s+cargo\s+a\s+Cuenta\s+\*+\d+\s+en\s+([\s\S]+?)\s+el\s+(\d{2}\/\d{2}\/\d{4})[\s\r\n]+(\d{2}:\d{2})\./im;
    const match = emailBody.match(regex);
    if (!match) {
      Logger.log(
        "No se logró parsear compra con débito Edwards. Regex no match."
      );
      return undefined;
    }
    const amount = parseInt(match[1].replace(/\./g, ""), 10) || 0;
    const merchant = match[2].replace(/\s+/g, " ").trim();
    const date = match[3];
    const time = match[4];
    return new TransactionEntity({
      tipo: VALUE_EGRESS,
      medio: VALUE_TYPE_DEBIT,
      banco: VALUE_BANK_EDWARDS,
      fecha: date,
      hora: time,
      monto: amount,
      moneda: VALUE_CURRENCY_CLP,
      descripcion: `Compra (Débito) en ${merchant}`,
    });
  }

  /**
   * Parsea un mensaje de compra con tarjeta de crédito en Banco Edwards
   * Tolerante a saltos de línea, a $ y US$, coma o punto, y comercio con saltos de línea.
   * @private
   * @param {string} emailBody
   * @returns {TransactionEntity|undefined}
   */
  _parseCreditPurchase(emailBody) {
    // Haz tolerante a saltos arbitrarios en TODO el patrón
    const regex =
      /se[\s\S]*?ha[\s\S]*?realizado[\s\S]*?una[\s\S]*?compra[\s\S]*?por[\s\S]*?(?:US\$|U\$S)?\s*([\d\.,]+)[\s\S]*?con[\s\S]*?Tarjeta[\s\S]*?de[\s\S]*?Crédito[\s\S]*?\*+\d+[\s\S]*?en[\s\S]*?([^\n]+)[\s\S]*?el[\s\S]*?(\d{2}\/\d{2}\/\d{4})[\s\S]*?(\d{2}:\d{2})\./im;
    const match = emailBody.match(regex);
    if (!match) {
      Logger.log(
        "No se logró parsear compra con crédito Edwards. Regex no match."
      );
      return undefined;
    }
    let amountStr = match[1].replace(/\./g, "").replace(",", ".");
    let amount = parseFloat(amountStr);
    if (isNaN(amount)) amount = 0;
    let currency = /US\$|U\$S/.test(match[0]) ? "USD" : "CLP";
    const merchant = match[2].replace(/\s+/g, " ").trim();
    const date = match[3];
    const time = match[4];
    return new TransactionEntity({
      tipo: VALUE_EGRESS,
      medio: VALUE_TYPE_CREDIT,
      banco: VALUE_BANK_EDWARDS,
      fecha: date,
      hora: time,
      monto: amount,
      moneda: currency,
      descripcion: `Compra (Crédito) en ${merchant}`,
    });
  }

  /**
   * Parsea el mensaje y elige el parser especializado según el contenido.
   * Puedes agregar aquí otras categorías (transferencias, avances, servicios).
   * @param {GmailMessage} message - Mensaje de Gmail.
   * @returns {TransactionEntity|undefined}
   */
  parse(message) {
    if (!message) {
      Logger.log("Mensaje Edwards no definido.");
      return undefined;
    }
    const emailBody = message.getPlainBody();

    // Prioridad: primero Crédito, luego Débito
    let entity = this._parseCreditPurchase(emailBody);
    if (entity !== undefined) {
      Logger.log("Transacción crédito extraída por EdwardsExtractor.");
      return entity;
    }
    entity = this._parseDebitPurchase(emailBody);
    if (entity !== undefined) {
      Logger.log("Transacción débito extraída por EdwardsExtractor.");
      return entity;
    }

    Logger.log(
      "Correo Edwards no matchea patrón de compra(débito/crédito). Agrega nuevos parsers aquí según sea necesario."
    );
    return undefined;
  }
}
