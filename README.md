# 1. 📬 Gmail Transaction Extractor

Este proyecto automatiza la extracción de transacciones financieras desde correos electrónicos de Gmail (por ejemplo, BCI y Banco Edwards) y registra los movimientos directamente en una hoja de cálculo de Google Sheets. Ahora permite alertas por Telegram (y próximamente WhatsApp) para transacciones sospechosas o duplicadas.

---

## 1.1. 🚦 Pasos de configuración rápida

### 1.1.1. Configuración en Gmail

1. Ve a tu Gmail y crea el label raíz: `finanzas`
2. Dentro de `finanzas`, crea **sub-labels**:
   - `a_procesar`
   - `procesado`
   - `no_procesado`
   - `duplicada`
   - `sospechosa`
3. Crea **filtros** para los correos de tus bancos, por ejemplo:
   - Todos los mensajes entrantes de tu banco (ej: _@bci.cl_, _@bancoedwards.cl_)
   - Estos filtros deben **aplicar automáticamente el label `finanzas/a_procesar`** a todos los correos transaccionales.
4. (Opcional) Usa los sub-labels como bandeja de revisión de alertas financieras.

---

### 1.1.2. Configuración en Google Drive

- Crea una carpeta para finanzas en tu Google Drive (ejemplo: `finanzas`).
- Crea una hoja de cálculo dentro de esa carpeta.
- Renombra la pestaña principal exactamente como `Historico`.
- Copia el ID de la hoja de cálculo de la URL:

  ```
  https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit#gid=0
  ```

---

### 1.1.3. Configuración en Google Apps Script

- Abre [Google Apps Script](https://script.google.com/) y crea un nuevo proyecto.
- Copia el contenido y estructura (`app/`, `main.gs`, etc.) en tu proyecto.
- Sube los archivos usando [clasp](https://github.com/google/clasp) o desde el editor online.
- En el archivo `app/utils/constants.gs`, reemplaza la línea:

  ```js
  const SPREADSHEET_ID = "<SPREADSHEET_ID>";
  ```

  …por el ID real de tu hoja de cálculo.

- **En el archivo `appsscript.json`** (manifiesto), asegúrate de tener estos scopes para poder notificar por APIs externas y acceder a Gmail, Drive y Sheets:

  ```json
  "oauthScopes": [
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file"
  ]
  ```

---

### 1.1.4. Permisos y cuenta

- Al ejecutar el script por primera vez, Google Apps Script solicitará permisos para:
  - Gmail
  - Google Drive
  - Google Sheets
  - Llamadas externas (UrlFetchApp)
- Es importante **usar la misma cuenta para Gmail, Drive y Apps Script**.
- Si alguna vez niegas permisos, bórralos desde [permissions](https://myaccount.google.com/permissions), y vuelve a ejecutar el script.

---

### 1.1.5. Configuración del Bot de Telegram

1. Busca [@BotFather](https://t.me/botfather) en Telegram.
2. Envía `/newbot` y sigue los pasos:
   - Elige un nombre visible (ej. `Alerta Finanzas`)
   - Elige un username único terminado en `bot` (ej. `finanzasalertbot`)
3. Obtén el **token de acceso** de BotFather.
4. Habla con tu bot (envíale "hola") para crear el chat, o agrégalo a un grupo/canal.
5. Obtén el `chat_id` (puedes usar bots como [@userinfobot](https://t.me/userinfobot) o [@getmyid_bot](https://t.me/getmyid_bot)).
6. Ingresa el **token y chat_id** en tus constants o en el constructor de `NotificationService`.

---

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
│   │   ├── extractor_service.gs
│   │   └── notification_service.gs
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

---

## 1.3. 🏦 ¿Qué hace el script?

- Lee correos **etiquetados como `finanzas/a_procesar`**.
- Extrae datos importantes: fecha, hora, monto, moneda, descripción, tipo, medio, banco.
- Registra toda la información en la sheet `Historico`.
- Marca los correos como `procesado`, `duplicada`, `sospechosa` o `errores` según corresponda.
- Envía notificaciones automáticas por Telegram (y WhatsApp cuando lo habilites) de:
  - Transacciones sospechosas (palabras clave, monto, hora inusual)
  - Duplicados
- Permite ampliar para otros bancos y formatos.

---

## 1.4. 📝 Ejemplo de entidad registrada

```javascript
class TransactionEntity {
  /**
   * @param {Object} data
   * {
   *   tipo: 'INGRESO' o 'EGRESO',
   *   medio: 'DEBITO', 'CREDITO', 'TRANSFERENCIA', etc,
   *   banco: 'BCI', 'EDWARDS', etc,
   *   fecha: '2024-06-02',
   *   hora: '15:23',
   *   monto: 10000,
   *   moneda: 'CLP' o 'USD',
   *   estado: 'Correcta' | 'Duplicada' | 'Sospechosa',
   *   descripcion: 'Detalle del movimiento',
   * }
   */
}
```

### 1.4.1. Ejemplo en la hoja:

| Tipo    | Medio         | Banco   | Fecha      | Hora  | Monto  | Moneda | Estado     | Descripción                  |
| ------- | ------------- | ------- | ---------- | ----- | ------ | ------ | ---------- | ---------------------------- |
| Egreso  | Débito        | BCI     | 2024-06-02 | 15:23 | 10000  | CLP    | Correcta   | Compra en SUPERMERCADO LIDER |
| Egreso  | Débito        | BCI     | 2024-06-02 | 15:23 | 10000  | CLP    | Duplicada  | Compra en SUPERMERCADO LIDER |
| Ingreso | Transferencia | EDWARDS | 2024-06-15 | 09:40 | 338000 | CLP    | Correcta   | Desde BANCO SANTANDER        |
| Egreso  | Crédito       | EDWARDS | 2024-07-03 | 23:03 | 20000  | CLP    | Sospechosa | Compra (Crédito) en TIENDA X |

---

## 1.5. 🧰 Requerimientos Técnicos

- Tener configurado [clasp](https://github.com/google/clasp) si trabajas localmente.
- Los labels deben coincidir exactamente (`finanzas/a_procesar`, etc).
- Debes tener habilitado el scope `https://www.googleapis.com/auth/script.external_request` en `appsscript.json` para poder usar notificaciones externas.
- Usa la misma cuenta para Gmail, Drive y Apps Script.

---

## 1.6. 🚀 Automatización (Triggers)

- Puedes configurar el script para que se ejecute automáticamente usando triggers en Apps Script:
  - Desde el editor, ve a Triggers > Añadir trigger y selecciona la función principal (`run` o similar).
  - Elige cada hora, día, o tu necesidad.

---

## 1.7. 🤖 Extensibilidad

- Para nuevos bancos: crea un extractor en `app/extractor/impl` y agrégalo a `extractor_service.gs`.
- Para nuevos canales de alerta, extiende el `NotificationService`.
- Puedes cambiar los keywords sospechosos, umbral de monto alto (en `constants_values.gs`).

---

## 1.8. 💬 ¿Preguntas o mejoras?

¡Ayuda y aportes bienvenidos!

- Si tienes ideas para mejorar, haz un fork o abre una issue.
- Contacto:
  - [Instagram](https://instagram.com/bodegafresh_dev)
  - [LinkedIn](https://www.linkedin.com/in/marco-cerda-veas)

---

Tecnología clara. Soluciones reales.
