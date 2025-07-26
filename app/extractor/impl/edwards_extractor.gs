// edwards_extractor.gs
class EdwardsExtractor extends Extractor {
  parse(message) {
    Logger.log("Parsing message with EdwardsExtractor: " + message.getBody());
    Logger.log(
      "Parsing message with EdwardsExtractor: " + message.getPlainBody()
    );
    return new TransactionEntity({
      tipo: VALUE_REVENUE,
      medio: VALUE_TYPE_DEDIT,
      fecha: "2024-06-02",
      hora: "16:30",
      monto: 15990,
      moneda: VALUE_CURRENCY_CLP,
      descripcion: "Compra en Supermercado Lider",
    });
  }
}
