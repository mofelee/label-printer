const debug = obj => {
  console.log('==========================');
  console.log(JSON.stringify(obj, null, 2));
  console.log('==========================');
};

const openPrinter = async api => {
  const res = await api.getPrinterName();

  await api.openPrinter({printerName: res.resultInfo});
};

module.exports = {
  debug,
  openPrinter,
};
