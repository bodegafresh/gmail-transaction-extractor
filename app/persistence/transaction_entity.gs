class TransactionEntity {
  /**
   * @param {Object} data
   * {
   *   tipo: 'INGRESO' o 'RETIRO',
   *   medio: 'DEBITO', 'CREDITO', 'TRANSFERENCIA', etc,
   *   banco: 'BCI', 'EDWARDS', etc,
   *   fecha: '2024-06-02',
   *   hora: '15:23',
   *   monto: 10000,
   *   moneda: 'CLP' o 'USD',
   *   descripcion: 'Detalle del movimiento',
   * }
   */
  constructor(data) {
    this.tipo = data.tipo;
    this.medio = data.medio;
    this.banco = data.banco;
    this.fecha = data.fecha;
    this.hora = data.hora;
    this.monto = data.monto;
    this.moneda = data.moneda || VALUE_CURRENCY_CLP;
    this.estado = data.estado || VALUE_STATE_SUCESS;
    this.descripcion = data.descripcion || "";
  }

  toString() {
    return `[${this.fecha} ${this.hora}] ${this.tipo} (${this.medio}) ${this.monto} ${this.moneda} ${this.estado} - ${this.descripcion}`;
  }
}
