const FormData = require('form-data');
require('isomorphic-fetch');

const {LABEL_PRINTER_HOST = '127.0.0.1'} = process.env;

const urlPrefix = `http://${LABEL_PRINTER_HOST}:15216/lpapi`;

/**
 * 请求web服务器；
 * @param {string} action 请求方法；
 * @param {object} data 请求参数;
 */
const request = (action, data) => {
  const url = `${urlPrefix}/${action}`;
  const formData = new FormData();

  for (let k in data) {
    if (data.hasOwnProperty(k) && data[k] != null) {
      formData.append(k, v);
    }
  }

  return fetch(url, {
    method: 'post',
    headers: {
      'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: formData,
  })
    .then(res => res.json())
    .then(res => {
      if (res.statusCode !== 0) {
        throw res;
      } else {
        return res;
      }
    });
};

async function run() {
  const res = await request('IsPrinterOnline');

  console.log('xxx', res);
}

const api = {};

/**
 * 获取打印动作的顺时针旋转角度
 */
api.getItemOrientation = () => request('GetItemOrientation');

/**
 * 设置后续打印动作的顺时针旋转角度
 * @param {object} data 参数列表：
 *  {
 *      orientation,        // 旋转角度，value值为：0、90、180、270
 *  }
 */
api.setItemOrientation = data => request('setItemOrientation', data);

/**
 * 获取打印动作的水平对齐方式
 */
api.getItemHorizontalAlignment = () => request('GetItemHorizontalAlignment');

/**
 * 设置后续打印动作的水平对齐方式
 * @param {object} data 接口调用参数列表；
 *   {
 *       alignment      // 对其方式，0：左对齐，1：居中对其，2：右对齐；
 *   }
 */
api.setItemHorizontalAlignment = data => {
  data = typeof data === 'number' ? {alignment: data} : data;
  if (!data || data.alignment == null) return -1;

  return request('SetItemHorizontalAlignment', data);
};

/**
 * 获取当前打印动作的垂直对齐方式
 */
api.getItemVerticalAlignment = () => request('GetItemVerticalAlignment');

/**
 * 设置后续打印动作的垂直对齐方式
 * @param {object} data 接口调用参数列表；
 *   {
 *       alignment : 0   // 0：垂直居上;1：垂直居中；2：垂直居下
 *   }
 */
api.setItemVerticalAlignment = data => {
  data = typeof data === 'number' ? {alignment: data} : data;
  if (!data || data.alignment == null) return -1;

  return request('SetItemVerticalAlignment', data);
};

/**
 *  打开指定名称的打印机对象。
 * @param {object} data 参数列表；
 *  {
 *      printerName,        // 必填，通过 getPrinters获取到的打印机名称；
 *  }
 */
api.openPrinter = data => request('OpenPrinter', data);

/**
 * 得到当前使用的打印机名称.
 */
api.getPrinterName = () => request('GetPrinterName');

/**
 * 判断当前打印机是否打开。
 */
api.isPrinterOpened = () => request('IsPrinterOpened');

run();
