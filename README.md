# 1. 📬 Gmail Transaction Extractor

Este proyecto automatiza la extracción de transacciones financieras desde correos electrónicos de Gmail (por ejemplo, BCI y Banco Edwards) y registra los movimientos directamente en una hoja de cálculo de Google Sheets.

## 1.1. 🚦 Pasos de configuración rápida

### 1.1.1. Configuración en Gmail

- Ve a tu Gmail y crea el label raíz: `finanzas`
- Dentro de `finanzas`, crea **sub-labels**:
  - a_procesar
  - procesado
  - no_procesado
- Crea filtros para los correos de tus bancos, por ejemplo:
  - Todos los mensajes entrantes de tu banco (ej: _@bci.cl, _@bancoedwards.cl)
  - Estos filtros deben **aplicar automáticamente el label `finanzas/a_procesar`** a todos esos correos.

### 1.1.2. Configuración en Google Drive

- Crea una carpeta dentro de tu Drive dedicada a temas financieros (recomendado: `finanzas`).
- Crea una hoja de cálculo dentro de esa carpeta.
- Renombra la hoja y asegúrate que la pestaña principal (sheet) se llame exactamente `Historico`.
- Abre la hoja y copia el ID de la URL, que luce así:

  ```
  https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit#gid=0
  ```

### 1.1.3. Configuración en Google Apps Script

- Abre [Google Apps Script](https://script.google.com/) y crea un nuevo proyecto.
- Copia todo el contenido del proyecto (la estructura `app/`, el archivo `main.gs`, y demás) en tu editor.
- Sube los archivos usando [clasp](https://github.com/google/clasp) o directamente desde el editor online.
- En el archivo `app/utils/constants.gs`, reemplaza la línea:

  ```js
  const SPREADSHEET_ID = "<SPREADSHEET_ID>";
  ```

  ...por el ID real de tu hoja.

### 1.1.4. Permisos y cuenta

- Al ejecutar el script, Google Apps Script solicitará permisos para acceder a:
  - Gmail
  - Google Drive
  - Google Sheets
- Importante: Debes usar la **misma cuenta de usuario** para Gmail, Drive y Apps Script.

## 1.2. 📋 Estructura del Proyecto

```
GMAIL-TRANSACTION-EXTRACTOR/
├── app/
│   ├── extractor/
│   │   ├── impl/
│   │   │   ├── bci_extractor.gs
│   │   │   ├── edwards_extractor.gs
│   │   │   ├── test_edwards_extractor.gs
│   │   │   └── extractor.gs
│   ├── persistence/
│   │   ├── transaction_entity.gs
│   │   └── transaction_repository.gs
│   ├── service/
│   │   └── extractor_service.gs
│   ├── utils/
│   │   ├── constants_values.gs
│   │   ├── constants.gs
│   │   └── utils.gs
│   ├── main.gs
│   └── appsscript.json
├── .clasp.json
├── .gitignore
└── README.md
```

## 1.3. 🏦 ¿Qué hace el script?

- Lee correos **etiquetados como `finanzas/a_procesar`**.
- Extrae información relevante de notificaciones bancarias:
  - Fecha, hora
  - Monto y moneda (CLP/ USD)
  - Descripción (comercio, banco, mensaje)
  - Tipo de transacción (`Ingreso`, `Egreso`, `Pago`, etc)
  - Medio (`Débito`, `Crédito`, `Transferencia`, etc.)
- Registra toda esta información en la hoja de cálculo en la pestaña `Historico`.
- Etiqueta los correos procesados como `finanzas/procesado` o `finanzas/no_procesado` según resultado.
- Permite extender la lógica para soportar nuevos bancos o tipos de movimientos agregando nuevos extractores.

## 1.4. 📝 Ejemplo de entidad registrada

El script guarda los movimientos usando una clase estructurada, por ejemplo:

```javascript
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
}
```

### 1.4.1. Ejemplo de registro en `Historico`:

| Tipo    | Medio         | Banco   | Fecha      | Hora  | Monto  | Moneda | Descripción                  |
| ------- | ------------- | ------- | ---------- | ----- | ------ | ------ | ---------------------------- |
| Egreso  | Débito        | BCI     | 2024-06-02 | 15:23 | 10000  | CLP    | Compra en SUPERMERCADO LIDER |
| Ingreso | Transferencia | EDWARDS | 2024-06-15 | 09:40 | 338000 | CLP    | Desde BANCO SANTANDER        |

## 1.5. 🧰 Requerimientos Técnicos

- Tener configurado [clasp](https://github.com/google/clasp) si trabajas localmente y quieres subir tus scripts desde VSCode.
- Los labels deben coincidir exactamente (`finanzas/a_procesar`, etc).
- Tener permisos en la hoja y correo asociados a la misma cuenta.

## 1.6. 🚀 Automatización (Triggers)

Puedes configurar el script para que se ejecute automáticamente usando triggers en Apps Script:

- Desde el editor, ve a Triggers > Añadir trigger y selecciona la función principal (`run` o la que uses).
- Puedes ponerlo en ejecución periódica (cada hora, día, etc).

## 1.7. 🤖 Extensibilidad

Solo debes crear un nuevo extractor especializado en `app/extractor/impl` y agregarlo a la lógica de selección dentro de `extractor_service.gs`.
Ejemplo:
`SantanderExtractor`, `ScotiabankExtractor`, etc.

## 1.8. 💬 ¿Preguntas o mejoras?

¡Ayuda y aportes bienvenidos!

- Si tienes ideas para mejorar, haz un fork o abre una issue.
- Contacto personal:
  - [Instagram](https://instagram.com/bodegafresh_dev)
  - [LinkedIn](https://www.linkedin.com/in/marco-cerda-veas)

---

Tecnología clara. Soluciones reales.
