class Extractor {
  /**
   * @param {string} message - El cuerpo del email o mensaje raw.
   * @returns {TransactionEntity} - Debe retornar una entidad de transacción.
   */
  parse(message) {
    throw new Error(
      "El método parse debe ser implementado por el extractor específico (banco)"
    );
  }
}
