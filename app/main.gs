function main() {
  const extractorService = new ExtractorService({
    repository: new TransactionRepository({
      id: SPREADSHEET_ID,
      sheetname: SHEET_NAME,
    }),
    notificationService: new NotificationService({
      telegramToken: TELEGRAM_TOKEN,
      telegramChatId: TELEGRAM_CHAT_ID,
    }),
  });

  extractorService.run();
}
