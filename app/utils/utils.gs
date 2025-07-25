// Funciones utilitarias
function zeroPad(num, places) {
  return String(num).padStart(places, "0");
}

function formatCurrency(amount) {
  return "$" + parseFloat(amount).toLocaleString("es-CL");
}
