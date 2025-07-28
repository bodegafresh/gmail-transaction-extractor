class ExtractorService {
  constructor(data) {
    this.repository = data.repository;
    this.notificationService = data.notificationService;
  }

  _extractDomainFromFromString(from) {
    var correo = from;
    var match = from.match(/<([^>]+)>/);
    if (match) {
      correo = match[1];
    }
    var atSplit = correo.split("@");
    if (atSplit.length === 2) {
      return atSplit[1];
    }
    return "";
  }

  _getExtractorForDomain(domain) {
    switch (domain) {
      case "bci.cl":
        return new BciExtractor();
      case "bancoedwards.cl":
        return new EdwardsExtractor();
      // ...otros bancos aquí...
      default:
        throw new Error("Banco no soportado: " + domain);
    }
  }

  run() {
    const threads = GmailApp.search(
      TO_PROCESS_LABEL + " -label:" + PROCESSED_LABEL + " -label:" + ERROR_LABEL
    );
    if (threads.length === 0) {
      Logger.log("No hay hilos por procesar.");
      return;
    }

    // ⚡ 1 sola lectura de todas las transacciones
    const allRows = this.repository.findAll();
    // Si tus transacciones vienen como arrays de arrays, convierte a TransactionEntity aquí

    threads.forEach((thread) => {
      const messages = thread.getMessages();
      messages.forEach((message) => {
        Logger.log("Procesando mensaje: " + message.getFrom());
        var from = message.getFrom();
        var domain = this._extractDomainFromFromString(from);
        Logger.log("Dominio detectado: " + domain);
        var extractor = this._getExtractorForDomain(domain);
        var transaction = extractor.parse(message);
        Logger.log("Transacción extraída: " + JSON.stringify(transaction));

        if (transaction && Number(transaction.monto) !== 0) {
          // Evaluación de duplicado y sospechoso usando el array en memoria
          let status = VALUE_STATE_SUCESS;
          let notifyReason = "";

          if (isDuplicate(transaction, allRows)) {
            status = VALUE_STATE_DUP;
            notifyReason = "Transacción duplicada";
            this.notificationService.notify(
              "Duplicado",
              transaction,
              ["telegram", "whatsapp"],
              notifyReason
            );
          } else {
            // Suspicious puede retornar {suspicious, reason}
            let suspiciousResult = isSuspicious(transaction);
            if (suspiciousResult.suspicious) {
              status = VALUE_STATE_SUSPECT;
              notifyReason = suspiciousResult.reason;
              this.notificationService.notify(
                "Sospechosa",
                transaction,
                ["telegram"],
                notifyReason
              );
            }
          }
          transaction.estado = status; // guarda el estado

          this.repository.save(transaction);
          // Añadir la nueva transacción al cache en memoria, para considerar en siguientes procesos
          allRows.push(transaction);

          const processedLabel = GmailApp.getUserLabelByName(PROCESSED_LABEL);
          thread.addLabel(processedLabel);
          // Marca especial si es alerta:
          if (status === VALUE_STATE_DUP) {
            thread.addLabel(GmailApp.getUserLabelByName("finanzas/duplicada"));
          } else if (status === VALUE_STATE_SUSPECT) {
            thread.addLabel(GmailApp.getUserLabelByName("finanzas/sospechosa"));
          }
        } else {
          const errorLabel = GmailApp.getUserLabelByName(ERROR_LABEL);
          Logger.log(JSON.stringify(message.getPlainBody()));
          thread.addLabel(errorLabel);
          Logger.log("Transacción ignorada por monto = 0");
        }
      });
    });
  }
}
