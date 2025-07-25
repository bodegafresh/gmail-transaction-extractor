class TransactionRepository {
  constructor(data) {
    this.sheet = SpreadsheetApp.openById(data.id).getSheetByName(
      data.sheetname
    );
  }
  save(transactionEntity) {
    // Por ahora solo dejar un log.
    Logger.log("Guardando transacción:\n" + transactionEntity.toString());
    this.sheet.appendRow(Object.values(transactionEntity));
  }
}
