/**
 * Añade ceros a la izquierda hasta alcanzar el largo deseado.
 * @param {number|string} num - Número o string numérico.
 * @param {number} places - Cantidad de cifras totales.
 * @returns {string}
 */
function zeroPad(num, places) {
  return String(num).padStart(places, "0");
}

/**
 * Formatea un número como moneda CLP local.
 * @param {number|string} amount - Monto a formatear.
 * @returns {string}
 */
function formatCurrency(amount) {
  return "$" + parseFloat(amount).toLocaleString("es-CL");
}

/**
 * Extrae e interpreta el monto de un mensaje, tolerando USD o CLP.
 * @param {string} body - Cuerpo del email.
 * @param {string} tipo - Tipo de moneda.
 * @param {RegExp} [customRegex] - Regex personalizada.
 * @returns {string}
 */
function extractAmount(body, tipo, customRegex) {
  let regex, match, amount;
  if (tipo === VALUE_CURRENCY_USD) {
    regex = customRegex || /Monto\s+USD\s+([0-9,\.]+)/;
    match = body.match(regex);
    amount = match ? match[1].replace(/\,/g, ".").replace(/[^0-9\.]/g, "") : "";
  } else {
    // CLP
    regex = customRegex || /Monto\s+\$([0-9\.]+)/;
    match = body.match(regex);
    amount = match ? match[1].replace(/\./g, "") : "";
  }
  return amount || "0";
}

/**
 * Aplica una expresión regular sobre un cuerpo y extrae el primer grupo, o defaultValue si no hay match.
 * @param {string} body
 * @param {RegExp} regex
 * @param {string} [defaultValue=""]
 * @returns {string}
 */
function extractByRegex(body, regex, defaultValue = "") {
  const m = body.match(regex);
  return m ? m[1].trim() : defaultValue;
}

/**
 * Da formato a un objeto Date como dd/MM/yyyy usando la zona del script.
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy");
}

/**
 * Da formato a un objeto Date como HH:mm usando la zona del script.
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "HH:mm");
}

function dateToComparableString(fecha) {
  if (typeof fecha === "string") {
    return fecha.trim();
  }
  if (Object.prototype.toString.call(fecha) === "[object Date]") {
    return formatDate(fecha); // tu utilidad para dd/MM/yyyy
  }
  return ""; // fallback para nulos y otros tipos
}

/**
 * Detecta si una transacción es duplicada según un arreglo de transacciones.
 * Compara monto, fecha, banco, medio, descripción y hora exacta.
 *
 * @param {TransactionEntity} transaction - La transacción nueva a comparar.
 * @param {TransactionEntity[]} transactionsArr - Arreglo de transacciones ya leídas de la hoja.
 * @returns {boolean}
 */
function isDuplicate(transaction, transactionsArr) {
  for (var i = 0; i < transactionsArr.length; i++) {
    var t = transactionsArr[i];
    // Usa helper para ambos lados
    var sameDate =
      dateToComparableString(t.fecha) ===
      dateToComparableString(transaction.fecha);
    var sameAmount = Number(t.monto) === Number(transaction.monto);
    var sameBanco =
      (t.banco || "").toLowerCase() === (transaction.banco || "").toLowerCase();
    var sameMedio =
      (t.medio || "").toLowerCase() === (transaction.medio || "").toLowerCase();
    var descA = (t.descripcion || "").replace(/\s+/g, " ").trim().toLowerCase();
    var descB = (transaction.descripcion || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    var sameDesc = descA === descB;
    var sameHora = (t.hora || "") === (transaction.hora || "");
    if (
      sameDate &&
      sameAmount &&
      sameBanco &&
      sameMedio &&
      sameDesc &&
      sameHora
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Detecta si una transacción es sospechosa y describe el motivo.
 * Analiza monto alto, keywords en descripción y rangos horarios sospechosos.
 *
 * @param {TransactionEntity} transaction
 * @returns {Object} { suspicious: true/false, reason: detalle }
 */
function isSuspicious(transaction) {
  // 1. Monto alto
  if (
    Number(transaction.monto) >
    (typeof ALERT_AMOUNT_THRESHOLD !== "undefined"
      ? ALERT_AMOUNT_THRESHOLD
      : 800000)
  ) {
    return {
      suspicious: true,
      reason:
        "Monto mayor a $" + formatCurrency(ALERT_AMOUNT_THRESHOLD || 800000),
    };
  }
  // 2. Palabras clave sospechosas en la descripción
  var desc = (transaction.descripcion || "").toLowerCase();
  var keywords =
    typeof ALERT_KEYWORDS !== "undefined"
      ? ALERT_KEYWORDS
      : [
          "transferencia internacional",
          "bitcoin",
          "casino",
          "apuesta",
          "fraude",
          "error",
        ];
  for (var i = 0; i < keywords.length; i++) {
    if (desc.indexOf(keywords[i]) !== -1) {
      return {
        suspicious: true,
        reason:
          "Descripción contiene palabra sospechosa: '" + keywords[i] + "'",
      };
    }
  }
  // 3. Hora inusual (Ej: de madrugada o tarde noche)
  var hora = transaction.hora
    ? parseInt(transaction.hora.split(":")[0], 10)
    : -1;
  var nightMin =
    typeof ALERT_NIGHT_HOUR_MIN !== "undefined" ? ALERT_NIGHT_HOUR_MIN : 0;
  var nightMax =
    typeof ALERT_NIGHT_HOUR_MAX !== "undefined" ? ALERT_NIGHT_HOUR_MAX : 6;
  var lateMin =
    typeof ALERT_LATE_HOUR_MIN !== "undefined" ? ALERT_LATE_HOUR_MIN : 23;
  if (hora >= nightMin && hora < nightMax) {
    return {
      suspicious: true,
      reason: "Transacción realizada en horario nocturno: " + transaction.hora,
    };
  }
  if (hora >= lateMin && hora <= 23) {
    return {
      suspicious: true,
      reason:
        "Transacción realizada cerca de la medianoche: " + transaction.hora,
    };
  }
  return { suspicious: false, reason: "" };
}
