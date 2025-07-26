function main() {
  const extractorService = new ExtractorService({
    repository: new TransactionRepository({
      id: SPREADSHEET_ID,
      sheetname: SHEET_NAME,
    }),
  });

  extractorService.run();
}
