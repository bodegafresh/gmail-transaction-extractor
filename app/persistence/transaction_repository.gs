class TransactionRepository {
  constructor(data) {
    this.sheet = SpreadsheetApp.openById(data.id).getSheetByName(
      data.sheetname
    );
  }

  /**
   * Guarda una transacción en la hoja de cálculo.
   * @param transactionEntity
   */
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

  /**
   * Busca todas las transacciones de una fecha específica.
   * @param {string} fecha - Debe estar en formato 'dd/MM/yyyy'
   * @returns {TransactionEntity[]} Array de transacciones encontradas
   */
  findByDate(fecha) {
    const values = this.sheet
      .getRange(2, 1, this.sheet.getLastRow() - 1, this.sheet.getLastColumn())
      .getValues();

    // Índices/orden de columnas: ajusta si tu hoja es diferente
    const idxFecha = 3; // Ejemplo: si las columnas son [tipo, medio, banco, fecha, hora, monto, moneda, descripcion]
    const transacciones = [];
    for (let i = 1; i < values.length; i++) {
      // Empieza desde 1 si tienes encabezado
      if (values[i][idxFecha] === fecha) {
        // Crea el TransactionEntity reconstruyendo del array
        const entidad = new TransactionEntity({
          tipo: values[i][0],
          medio: values[i][1],
          banco: values[i][2],
          fecha: values[i][3],
          hora: values[i][4],
          monto: values[i][5],
          moneda: values[i][6],
          estado: values[i][7],
          descripcion: values[i][8],
        });
        transacciones.push(entidad);
      }
    }
    return transacciones;
  }

  /**
   * Alternativo: busca todas las transacciones.
   * @returns {TransactionEntity[]}
   */
  findAll() {
    const values = this.sheet.getDataRange().getValues();
    const transacciones = [];
    for (let i = 1; i < values.length; i++) {
      // Salta encabezado
      transacciones.push(
        new TransactionEntity({
          tipo: values[i][0],
          medio: values[i][1],
          banco: values[i][2],
          fecha: values[i][3],
          hora: values[i][4],
          monto: values[i][5],
          moneda: values[i][6],
          estado: values[i][7],
          descripcion: values[i][8],
        })
      );
    }
    return transacciones;
  }
}
