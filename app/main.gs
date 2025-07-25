function main() {
  // Instancia el repositorio
  const repo = new TransactionRepository({
    id: SPREADSHEET_ID,
    sheetname: SHEET_NAME,
  });

  // Crea una transacción de prueba (en duro)
  const trans = new TransactionEntity({
    tipo: VALUE_REVENUE,
    medio: VALUE_TYPE_DEDIT,
    fecha: "2024-06-02",
    hora: "16:30",
    monto: 15990,
    moneda: VALUE_CURRENCY_CLP,
    descripcion: "Compra en Supermercado Lider",
  });

  repo.save(trans);
}
