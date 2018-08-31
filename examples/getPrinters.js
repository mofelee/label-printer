const LPApi = require('../index');
const {debug} = require('./lib');

async function run() {
  const api = new LPApi();
  await api.isPrinterOnline();

  const res = await api.getPrinters();

  debug(res);
}

run().catch(console.error);
