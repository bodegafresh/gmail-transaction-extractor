// Tipo transaccion
const VALUE_REVENUE = "Ingreso";
const VALUE_EGRESS = "Egreso";

// Tipo de moneda
const VALUE_CURRENCY_CLP = "CLP";
const VALUE_CURRENCY_USD = "USD";

// Tipo de medio
const VALUE_TYPE_CREDIT = "Credito";
const VALUE_TYPE_DEBIT = "Debito";
const VALUE_TYPE_TRANS = "Transferencia";
const VALUE_TYPE_CASH = "Cajero";
const VALUE_TYPE_PAYMENT = "Pago cuenta";
const VALUE_TYPE_PAYMENT_CREDIT = "Pago credito";

// Bancos
const VALUE_BANK_BCI = "BCI";
const VALUE_BANK_EDWARDS = "EDWARDS/BANCOCHILE";
const VALUE_BANK_SANTANDER = "SANTANDER";
const VALUE_BANK_ITAU = "ITAU";
const VALUE_BANK_SECURITY = "SECURITY";
const VALUE_BANK_BICE = "BICE";
const VALUE_BANK_BANCOESTADO = "BANCOESTADO";
const VALUE_BANK_BANCOFALABELLA = "BANCOFALABELLA";

// Estados
const VALUE_STATE_SUCESS = "Corecto";
const VALUE_STATE_DUP = "Duplicado";
const VALUE_STATE_SUSPECT = "Sospechoso";

// Palabras clave de alerta para transacciones sospechosas
const ALERT_KEYWORDS = [
  "transferencia internacional",
  "bitcoin",
  "casino",
  "apuesta",
  "fraude",
  "error",
];

// Umbral de monto alto considerado sospechoso
const ALERT_AMOUNT_THRESHOLD = 800000;

// Hora en la que empiezan a considerarse movimientos nocturnos sospechosos (ej: < 6 ó >= 23)
const ALERT_NIGHT_HOUR_MIN = 0; // inclusive
const ALERT_NIGHT_HOUR_MAX = 6; // exclusive (0:00-5:59)
const ALERT_LATE_HOUR_MIN = 23; // inclusive (23:00-23:59)
