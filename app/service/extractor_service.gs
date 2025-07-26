class ExtractorService {
  constructor(data) {
    this.respository = data.repository;
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
      // TO_PROCESS_LABEL + " -label:" + PROCESSED_LABEL
      TO_PROCESS_LABEL
    );
    if (threads.length === 0) {
      Logger.log("No hay hilos por procesar.");
      return;
    }
    threads.forEach((thread) => {
      const messages = thread.getMessages();
      messages.forEach((message) => {
        Logger.log("Procesando mensaje: " + message.getFrom());
        var from = message.getFrom();
        var domain = this._extractDomainFromFromString(from);
        Logger.log("Dominio detectado: " + domain);
        var extractor = this._getExtractorForDomain(domain);
        var trans = extractor.parse(message);
        Logger.log("Transacción extraída: " + JSON.stringify(trans));
        if (trans && Number(trans.monto) !== 0) {
          this.respository.save(trans);
        } else {
          const errorLabel = GmailApp.getUserLabelByName(ERROR_LABEL);
          thread.addLabel(errorLabel);
          Logger.log("Transacción ignorada por monto = 0");
        }
      });
    });
  }
}
