/**
 * Servicio centralizado de notificaciones para transacciones
 * Puede notificar por Telegram y WhatsApp según motivo (duplicado, sospechosa, etc.)
 */
class NotificationService {
  /**
   * @param {Extractor} extractor - El extractor actual, para referencia, logging o acceso extendido
   *        (podría ser también extractorName, según tu arquitectura)
   * @param {Object} options - Opcional: { telegramToken, telegramChatId, ... }
   */
  constructor(extractor, options = {}) {
    this.extractor = extractor;
    this.telegramToken = options.telegramToken || TELEGRAM_TOKEN; // puede venir de constants
    this.telegramChatId = options.telegramChatId || TELEGRAM_CHAT_ID;
  }

  /**
   * Enviar una notificación de transacción sospechosa o duplicada
   * @param {String} reason - Razón (por ejemplo: 'Duplicado', 'Sospechosa')
   * @param {TransactionEntity} transaction
   * @param {Array<String>} channels - ['telegram', 'whatsapp']
   */
  notify(reason, transaction, channels = ["telegram"], detail = "") {
    const message = this._buildMessage(reason, transaction, detail);
    Logger.log("Enviando notificación: " + message);
    if (channels.includes("telegram")) {
      this._sendTelegram(message);
    }
    if (channels.includes("whatsapp")) {
      //TODO: implementar notificación por WhatsApp
      Logger.log("Notificación por WhatsApp no implementada.");
    }
  }

  /**
   * Arma el texto del mensaje de alerta
   */
  _buildMessage(reason, transaction, detail = "") {
    return (
      "🔔 *Alerta de transacción " +
      reason +
      "*\n" +
      (detail ? "Motivo: " + detail + "\n" : "") +
      transaction.toString()
      // Puedes añadir más campos si los agregas al TransactionEntity
    );
  }

  /**
   * Envía un mensaje por Telegram usando Bot API
   * @param {string} text
   */
  _sendTelegram(text) {
    if (!this.telegramToken || !this.telegramChatId) {
      Logger.log("Faltan credenciales de Telegram.");
      return;
    }
    try {
      const url = `https://api.telegram.org/bot${this.telegramToken}/sendMessage`;
      const payload = {
        chat_id: this.telegramChatId,
        text: text,
        parse_mode: "Markdown",
      };
      const options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
      };
      UrlFetchApp.fetch(url, options);
    } catch (e) {
      Logger.log("Error enviando a Telegram: " + e);
    }
  }
}
