const LPApi = require('../index');
const {debug, openPrinter} = require('./lib');

async function run() {
  const api = new LPApi();

  await openPrinter(api)

  var width = 45;
  var lineSpace = 5;
  var height = lineSpace * 4;

  // 开始打印任务；
  await api.startJob({width: width, height: height, orientation: 0})

  await api.drawLine({x1: 0, y1: lineSpace, x2: width, y2: lineSpace, lineWidth: 1});
  await api.drawDashLine({
    x1: 0,
    y1: lineSpace * 2,
    x2: width,
    y2: lineSpace * 2,
    lineWidth: 1,
    dashLen1: 0.5,
    dashLen2: 0.25,
  });
  await api.drawDashLine({
    x1: 0,
    y1: lineSpace * 3,
    x2: width,
    y2: lineSpace * 3,
    lineWidth: 1,
    dashLen1: 0.25,
    dashLen2: 0.5,
    dashLen3: 0.75,
    dashLen4: 1,
  });

  // 提交打印任务；
  return api.commitJob();
}

run().catch(console.error);
