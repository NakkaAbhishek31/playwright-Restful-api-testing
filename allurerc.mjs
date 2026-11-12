export default {
  name: 'Restful Booker API tests',
  output: './allure-report',
  historyPath: './allure-history/history.jsonl',
  appendHistory: true,
  plugins: {
    classic: {
      options: {
        reportName: 'Restful Booker API tests',
        singleFile: false,
      },
    },
  },
};
