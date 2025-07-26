function testEdwardsExtractor() {
  // Mock de TransactionEntity, remplaza por tu import real si fuera necesario
  function TransactionEntity(obj) {
    return obj;
  }

  // Instancia tu extractor
  var extractor = new EdwardsExtractor();

  // Todas las variantes de correos a probar
  var tests = [
    {
      desc: "Crédito, sin saltos raros, CLP",
      body: `
Te informamos que se ha realizado una compra por $14.990 con Tarjeta de Crédito ****1319 en PEDIDOSYA CL CL CHL el 01/05/2023 21:01.
      `,
      expect: {
        monto: 14990,
        moneda: "CLP",
        comercio: "PEDIDOSYA CL CL CHL",
        medio: VALUE_TYPE_CREDIT,
      },
    },
    {
      desc: "Crédito, salto después de Tarjeta de",
      body: `
Te informamos que se ha realizado una compra por $14.990 con Tarjeta de
Crédito ****1319 en PEDIDOSYA CL CL CHL el 01/05/2023 21:01.
      `,
      expect: {
        monto: 14990,
        moneda: "CLP",
        comercio: "PEDIDOSYA CL CL CHL",
        medio: VALUE_TYPE_CREDIT,
      },
    },
    {
      desc: "Débito, con saltos normales, CLP",
      body: `
Te informamos que se ha realizado una compra por $12.650 con cargo a
Cuenta ****0908 en CLOSS LIMITADA el 26/04/2023 21:36.
      `,
      expect: {
        monto: 12650,
        moneda: "CLP",
        comercio: "CLOSS LIMITADA",
        medio: VALUE_TYPE_DEBIT,
      },
    },
    {
      desc: "Crédito, internacional, salto antes de en",
      body: `
Te informamos que se ha realizado una compra por US$23,80 con Tarjeta de
Crédito ****0953 en OPENAI *CHATGPT SUBSCR +14158799686 US el 09/07/2025
01:51.
      `,
      expect: {
        monto: 23.8,
        moneda: "USD",
        comercio: "OPENAI *CHATGPT SUBSCR +14158799686 US",
        medio: VALUE_TYPE_CREDIT,
      },
    },
    {
      desc: "Crédito, internacional, monto con coma, hora al final",
      body: `
Te informamos que se ha realizado una compra por US$4,16 con Tarjeta de
Crédito ****1319 en STAR PLUS CL BURBANK CA el 07/05/2023 19:03.
      `,
      expect: {
        monto: 4.16,
        moneda: "USD",
        comercio: "STAR PLUS CL BURBANK CA",
        medio: VALUE_TYPE_CREDIT,
      },
    },
    {
      desc: "Débito con saldo en pesos y más líneas",
      body: `
Te informamos que se ha realizado una compra por $2.400 con cargo a Cuenta
****0908 en MARTINA el 02/05/2023 23:55.
      `,
      expect: {
        monto: 2400,
        moneda: "CLP",
        comercio: "MARTINA",
        medio: VALUE_TYPE_DEBIT,
      },
    },
    // Puedes agregar más aquí según tus ejemplos históricos
  ];

  // Iteración sobre los tests
  tests.forEach(function (test, idx) {
    // Mock de GmailMessage
    var message = {
      getPlainBody: function () {
        return test.body;
      },
    };
    var result = extractor.parse(message);

    var pass =
      !!result &&
      Math.abs(result.monto - test.expect.monto) < 0.05 &&
      result.moneda === test.expect.moneda &&
      result.descripcion.indexOf(test.expect.comercio) !== -1 &&
      result.medio === test.expect.medio;

    Logger.log(
      "Test #" +
        (idx + 1) +
        " - " +
        test.desc +
        ": " +
        (pass ? "✔️ OK" : "❌ ERROR")
    );
    if (!pass) {
      Logger.log("Esperaba: ", test.expect);
      Logger.log("Obtuvo: ", result);
    }
  });
}
