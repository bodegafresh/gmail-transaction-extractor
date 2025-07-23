# 📬 Gmail Transaction Extractor

Este proyecto automatiza la lectura de correos de Gmail provenientes del banco BCI para extraer datos de transacciones y registrarlos automáticamente en una hoja de cálculo de Google Sheets.

## 🚀 ¿Qué hace este script?

- Lee correos que notifican **usos de tarjeta de crédito**, **transferencias**, **pagos en línea** y **pagos de crédito**.
- Extrae datos como:
  - Fecha y hora
  - Monto
  - Descripción
  - Cuotas (si aplica)
  - Tipo de transacción
  - Localidad (nacional o internacional)
  - Dirección de destino (en transferencias)
- Registra la información extraída en la hoja de cálculo `Historico`
- Etiqueta automáticamente los correos como procesados

## 🛠️ ¿Qué necesitas?

- Una cuenta de Gmail con etiquetas configuradas:
  - `finanzas/bciCargos`
  - `finanzas/bciProcesado`
- Una hoja de cálculo de Google con una pestaña `Historico`
- Crear un proyecto en Google Apps Script y pegar el contenido de `Code.gs`
- Configurar el ID de tu hoja de cálculo en el script
- Activar temporizadores (triggers) para que se ejecute automáticamente cada cierto tiempo

## ✨ ¿Por qué es útil?

- Automatizas la gestión de tus finanzas personales
- Aprendes a integrar Gmail, Apps Script y Google Sheets
- Puedes extenderlo fácilmente para usar inteligencia artificial (por ejemplo, con Gemini o GPT) para interpretar textos más complejos

## 📁 Estructura del Proyecto

- `Code.gs` → El script que automatiza la lectura y procesamiento de correos

## 📬 ¿Preguntas o mejoras?

Si tienes ideas para mejorarlo, ¡haz un fork o abre una issue! También puedes escribirme en [Instagram](https://instagram.com/bodegafresh_dev) o [LinkedIn](https://www.linkedin.com/in/marco-cerda-veas).

---

**Tecnología clara. Soluciones reales.**
