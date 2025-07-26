class TransactionRepository {
  constructor(data) {
    this.sheet = SpreadsheetApp.openById(data.id).getSheetByName(
      data.sheetname
    );
  }
  save(transactionEntity) {
    Logger.log("Guardando transacción:\n" + transactionEntity.toString());
    this.sheet.appendRow(
      Object.values(transactionEntity).map((val) => {
        if (
          typeof val === "object" &&
          val !== null &&
          Object.keys(val).length === 0
        ) {
          return "";
        }
        return val;
      })
    );
  }
}
