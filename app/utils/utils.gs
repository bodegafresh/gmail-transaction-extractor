function zeroPad(num, places) {
  return String(num).padStart(places, "0");
}

function formatCurrency(amount) {
  return "$" + parseFloat(amount).toLocaleString("es-CL");
}

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

function extractByRegex(body, regex, defaultValue = "") {
  const m = body.match(regex);
  return m ? m[1].trim() : defaultValue;
}

function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy");
}
function formatTime(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "HH:mm");
}
