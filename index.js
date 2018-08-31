const FormData = require('form-data');

require('isomorphic-fetch');

const {LABEL_PRINTER_HOST = '127.0.0.1'} = process.env;

const PARAMETERS_IS_NOT_VALID = new Error('PARAMETERS_IS_NOT_VALID');

const defaultLineWidth = 0.3;
const defaultCornerRadius = 1.5;

function formatGetParams(data) {
  data = data || {};
  var values = '';
  for (var key in data) {
    if (data.hasOwnProperty(key) && data[key] != null) {
      var element = data[key];
      values += '&' + key + '=' + data[key];
    }
  }

  return values.length > 0 ? values.substr(1) : values;
}

class LPApi {
  constructor(apiHost) {
    this.apiHost = apiHost || LABEL_PRINTER_HOST;

    /**
     * 打印参数ID：
     * GapType 纸张类型ID，值 0-3,255
     * PrintDarkness 打印浓度，值：6-15
     * PrintSpeed 打印速度，值：1-5
     */
    this.ParamID = {
      gapType: 1, ///< 纸张类型, 对应的value值有效区域为：0-3，255表示随打印机；具体可参考属性GapType；
      printDarkness: 2, ///< 打印浓度，对应的value值有效区域为： 0-14，255表示随打印机；
      printSpeed: 3, ///< 打印速度，对应的value值有效区域为：0-4，255表示随打印机；
    };

    this.GapType = {
      unset: 255, ///< 随打印机
      none: 0, ///< 连续纸，没有分隔
      hole: 1, ///< 定位孔
      gap: 2, ///< 间隙纸
      black: 3, ///< 黑标纸
    };
  }

  /**
   * 请求web服务器；
   * @param {string} action 请求方法；
   * @param {object} data 请求参数;
   */
  request(action, data) {
    const url = `http://${this.apiHost}:15216/lpapi/${action}`;
    const formData = formatGetParams(data);

    return fetch(url, {
      method: 'post',
      headers: {
        'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: formData,
    })
      .then(res => res.json())
      .then(res => {
        console.log('==============')
        console.log(action, data)
        console.log(res)
        if (res.statusCode !== 0) {
          res.action = action;
          res.data = data;

          throw res;
        } else {
          return res;
        }
      });
  }

  /**
   * 获取打印动作的顺时针旋转角度
   */
  getItemOrientation() {
    this.request('GetItemOrientation');
  }

  /**
   * 设置后续打印动作的顺时针旋转角度
   * @param {object} data 参数列表：
   *  {
   *      orientation,        // 旋转角度，value值为：0、90、180、270
   *  }
   */
  setItemOrientation(data) {
    return this.request('setItemOrientation', data);
  }

  /**
   * 获取打印动作的水平对齐方式
   */
  getItemHorizontalAlignment() {
    return this.request('GetItemHorizontalAlignment');
  }

  /**
   * 设置后续打印动作的水平对齐方式
   * @param {object} data 接口调用参数列表；
   *   {
   *       alignment      // 对其方式，0：左对齐，1：居中对其，2：右对齐；
   *   }
   */
  setItemHorizontalAlignment(data) {
    data = typeof data === 'number' ? {alignment: data} : data;
    if (!data || data.alignment == null) return -1;

    return this.request('SetItemHorizontalAlignment', data);
  }

  /**
   * 获取当前打印动作的垂直对齐方式
   */
  getItemVerticalAlignment() {
    return this.request('GetItemVerticalAlignment');
  }

  /**
   * 设置后续打印动作的垂直对齐方式
   * @param {object} data 接口调用参数列表；
   *   {
   *       alignment : 0   // 0：垂直居上;1：垂直居中；2：垂直居下
   *   }
   */
  setItemVerticalAlignment(data) {
    data = typeof data === 'number' ? {alignment: data} : data;
    if (!data || data.alignment == null) throw PARAMETERS_IS_NOT_VALID;

    return this.request('SetItemVerticalAlignment', data);
  }

  /**
   *  打开指定名称的打印机对象。
   * @param {object} data 参数列表；
   *  {
   *      printerName,        // 必填，通过 getPrinters获取到的打印机名称；
   *  }
   */
  openPrinter(data) {
    return this.request('OpenPrinter', data);
  }

  /**
   * 得到当前使用的打印机名称.
   */
  getPrinterName() {
    return this.request('GetPrinterName');
  }

  /**
   * 判断当前打印机是否打开。
   */
  isPrinterOpened() {
    return this.request('IsPrinterOpened');
  }

  /**
   *
   * 判断当前打印机是否在线
   */
  isPrinterOnline() {
    return this.request('IsPrinterOnline');
  }

  /**
   * 关闭当前使用的打印机
   * 注意：关闭打印机时，当前还有未打印的任务/数据将会被自动提交打印，同时所有参数设置将会被保留。
   */
  closePrinter() {
    return this.request('ClosePrinter');
  }

  /**
   * 获取打印机列表；
   * @param {object} data 参数列表；
   *  {
   *      onlyOnline,     // 是否只获取在线（已连接）的打印机；
   *      onlySupported,  // 是否只获取支持的打印机？
   *      onlyLocal,      // 是否仅返回本地打印机？
   *  }
   */
  getPrinters(data) {
    return this.request('GetPrinters', data);
  }

  /**
   * 获取打印参数；
   *
   * @param {object} data 参数列表；
   *      {
   *          id         // 打印参数ID，ID值可参考 ParamID 属性；
   *      }
   * @return {number} 正常返回值应该大于等于0，返回值小于0表示失败；
   */
  getParam(data) {
    if (!data || data.id == null) throw PARAMETERS_IS_NOT_VALID;

    return this.request('GetParam', data);
  }

  /**
   * 设置打印参数；
   *
   * @param {object} data 参数列表；
   *      {
   *          id,         // 打印机参数ID，ID值可参考 ParamID 属性；
   *          value       // id值所对应打印机参数的value，具体可参考 ParamID；
   *      }
   * @return {boolean} 成功与否？
   */
  setParam(data) {
    if (!data || data.id == null || data.value == null)
      throw PARAMETERS_IS_NOT_VALID;

    return this.request('SetParam', data);
  }

  /**
   * 获取已连接打印机的纸张类型；
   * @return {number} 返回结果可以参考：GapType属性；
   */
  getGapType() {
    var id = this.ParamID.gapType;
    return this.getParam({id: id});
  }

  /**
   * 修改已连接打印机的纸张类型；
   * @param {data | number} data 纸张类型参数；
   *      {
   *          value       // 必须，纸张类型值；
   *      }
   * @return {boolean}
   */
  setGapType(data) {
    data =
      typeof data === 'number' || typeof data === 'string'
        ? {value: data}
        : data;
    if (!data || data.value == null) throw PARAMETERS_IS_NOT_VALID;

    data.id = this.ParamID.gapType;
    return this.setParam(data);
  }

  /**
   * 返回已连接打印机的打印浓度；
   * @return {number} 打印机浓度值说明可参考 ParamID;
   */
  getPrintDarkness() {
    var id = this.ParamID.printDarkness;
    return this.getParam({id: id});
  }

  /**
   * 修改已连接打印机的打印浓度；
   * @param {data | number} data 打印浓度；
   *      {
   *          value       // 必须，打印浓度value值；
   *      }
   * @return {boolean}
   */
  setPrintDarkness(data) {
    data =
      typeof data === 'number' || typeof data === 'string'
        ? {value: data}
        : data;
    if (!data || data.value == null) throw PARAMETERS_IS_NOT_VALID;

    data.id = this.ParamID.printDarkness;
    return this.setParam(data);
  }

  /**
   * 返回已连接打印机的打印速度；
   * @return {number} 打印机速度值说明可参考 ParamID;
   */
  getPrintSpeed() {
    var id = this.ParamID.printSpeed;
    return this.getParam({id: id});
  }

  /**
   * 修改已连接打印机的打印速度；
   * @param {data | number} data 打印速度；
   *      {
   *          value       // 必须，打印速度value值；
   *      }
   * @return {boolean}
   */
  setPrintSpeed(data) {
    data =
      typeof data === 'number' || typeof data === 'string'
        ? {value: data}
        : data;
    if (!data || data.value == null) throw PARAMETERS_IS_NOT_VALID;

    data.id = this.ParamID.printSpeed;
    return this.setParam(data);
  }

  /**
   * 开始一打印任务.
   * @param {object} data 参数列表；
   *      打印任务相关参数：
   *      {
   *          width,          // 必填，标签纸宽度；
   *          height,         // 可选，默认等同于width；
   *          orientation,    // 可选，默认为0；value值为0/90/180/270；
   *          jobName         // 可选，打印任务名称；
   *      }
   *  使用说明：开始打印任务时，如果没有打开打印机对象，则本函数会自动打开当前系统安装的第一个 印。
   *  开始打印任务时，当前还有未打印的任务/数据将会被全部丢弃。
   */
  startJob(data) {
    data = typeof data === 'number' ? {width: data} : data;
    if (!data || !data.width) throw PARAMETERS_IS_NOT_VALID;

    data.scaleUnit = 1;
    data.width *= 100;
    data.height = data.height ? data.height * 100 : data.width;
    data.gapLen = typeof data.gapLen === 'number' ? data.gapLen * 100 : 0;
    data.orientation = data.orientation || 0;
    data.jobName = data.jobName || 'LPAPIWeb';

    return this.request('StartJob', data).statusCode === 0;
  }

  /**
   *  取消一打印任务
   *  使用说明：当前还有未打印的任务/数据将会被全部丢弃，但是所有参数设置将会被保留。
   */
  abortJob() {
    return this.request('AbortJob');
  }

  /**
   * 提交打印任务，进行真正的打印。
   */
  commitJob() {
    return this.request('CommitJob');
  }

  /**
   * 开始一打印页面。
   *  使用说明：如果之前没有调用 StartJob，则本函数会自动调用 StartJob，然后再开始一打印页面。此后调用 EndPage 结束打印时，打印任务会被自动提交打印。
   *  页面旋转角度非 0 打印时，必须在打印动作之前设置打印页面尺寸信息。
   */
  startPage() {
    return this.request('StartPage');
  }

  /**
   * 结束一打印页面。
   *  使用注意：如果之前没有调用 StartJob 而直接调用 StartPage，则本函数会自动提交打印。
   */
  endPage() {
    return this.request('EndPage');
  }

  /*********************************************************************
   * 绘制相关内容。
   *********************************************************************/
  /**
   * 打印文本字符串
   *
   * @param {object} data 打印字符串相关参数列表；
   *   {
   *       text,       // 必填，字符串类型的打印数据；
   *       x,          // 可选，打印矩形框水平位置（单位毫米(mm)），默认为0；
   *       y,          // 可选，打印矩形框垂直位置（单位毫米(mm)），默认为0；
   *       width,      // 可选，打印矩形框水平宽度（单位毫米(mm)），默认为0，表示为本显示宽度；
   *       height,     // 可选，打印矩形框垂直高度（单位毫米(mm)），默认为0，表示文本的显示高度；
   *       fontName,   // 可选，字体名称，默认为黑体；
   *       fontHeight, // 必填，字体高度；
   *       fontStyle   // 可选，字体样式；
   *                   // 0：一般； 1：粗体； 2：斜体；3：粗斜体；4：下划线；8：删除线。
   *   }
   */
  drawText(data) {
    if (data.text == null) throw PARAMETERS_IS_NOT_VALID;

    data.x = (data.x || 0) * 100;
    data.y = (data.y || 0) * 100;
    data.width = (data.width || 0) * 100;
    data.height = (data.height || 0) * 100;
    data.fontHeight = (data.fontHeight || 0) * 100;
    data.fontStyle = data.fontStyle ? data.fontStyle : 0;

    return this.request('DrawText', data);
  }

  /**
   * 打印一维条码。
   * @param {object} data 打印一维码时需提供的一维码相关参数列表；
   *
   *   {
   *       text,           // 必填，一维码内容字符串；
   *       type,           // 可选，一维码类型，默认根据字符串自动采用最佳方式；
   *       x,              // 可选，打印一维码水平位置（单位毫米(mm)），默认为0；
   *       y,              // 可选，打印一维码垂直位置（单位毫米(mm)），默认为0；
   *       width,          // 必填，打印一维码水平宽度（单位毫米(mm)）；
   *       height,         // 可选，打印一维码水平宽度，默认等同于width
   *       textHeight      // 可选，一维码中显示的字符信息高度，默认为0；
   *   }
   */
  draw1DBarcode(data) {
    if (data.text == null) throw PARAMETERS_IS_NOT_VALID;

    data.x = (data.x || 0) * 100;
    data.y = (data.y || 0) * 100;
    data.width = (data.width || 0) * 100;
    data.height = data.height ? data.height * 100 : data.width;
    data.textHeight =
      typeof data.textHeight === 'number' ? data.textHeight * 100 : 0;
    data.type = data.type || 60;

    return this.request('Draw1DBarcode', data);
  }

  /**
   * 打印 QrCode 二维码。
   * @param {object} data 打印二维码需提供的打印参数列表；
   *      {
   *          text,       // 必填，打印内容；
   *          x,          // 可选，打印起始位置，默认为左上角；
   *          y,          // 可选，打印起始位置，默认为左上角；
   *          width,      // 必填，二维码宽度；
   *          height,     // 可选，二维码高度，默认等同于width
   *      }
   */
  draw2DQRCode(data) {
    if (data.text == null) throw PARAMETERS_IS_NOT_VALID;

    data.x = (data.x || 0) * 100;
    data.y = (data.y || 0) * 100;
    data.width = (data.width || 0) * 100;
    data.height = data.height ? data.height * 100 : data.width;

    return this.request('Draw2DQRCode', data);
  }

  /**
   * 打印 Pdf417 二维码。
   * @param {object} data 打印PDF417所需打印参数列表；
   *      {
   *          text,       // 必填，二维码内容；
   *          x,          // 可选，默认为打印区域的左上角；
   *          y,          // 可选，默认为打印区域的左上角；
   *          width,      // 必填，二维码宽度；
   *          height,     // 可选，二维码高度，默认等同于width
   *      }
   */
  draw2DPdf417(data) {
    if (data.text == null) throw PARAMETERS_IS_NOT_VALID;

    data.x = (data.x || 0) * 100;
    data.y = (data.y || 0) * 100;
    data.width = (data.width || 0) * 100;
    data.height = data.height ? data.height * 100 : data.width;

    return this.request('Draw2DPdf417', data);
  }

  /**
   * 以指定的线宽，打印矩形框。
   * @param {object} data 矩形框打印参数列表；
   *      {
   *          x,          // 可选，矩形框起始位置，默认为打印区域的左上角；
   *          y,          // 可选，矩形框起始位置，默认为打印区域的左上角；
   *          width,      // 必填，矩形框宽度；
   *          height,     // 可选，矩形框高度，默认等同于width
   *          lineWidth,  // 可选，矩形框线宽；
   *      }
   */
  drawRectangle(data) {
    data.x = (data.x || 0) * 100;
    data.y = (data.y || 0) * 100;
    data.width = (data.width || 0) * 100;
    data.height = data.height ? data.height * 100 : data.width;
    data.lineWidth = (data.lineWidth || defaultLineWidth) * 100;

    return this.request('DrawRectangle', data);
  }

  /**
   * 打印填充的矩形框。
   *
   * @param {object} data 填充矩形打印参数列表；
   *      {
   *          x,          // 可选，矩形的起始位置，默认为左上角；
   *          y,          // 可选，矩形的起始位置，默认为左上角；
   *          width,      // 必填，矩形宽度；
   *          height,     // 可选，矩形高度，默认等同于width
   *      }
   */
  fillRectangle(data) {
    data.x = (data.x || 0) * 100;
    data.y = (data.y || 0) * 100;
    data.width = (data.width || 0) * 100;
    data.height = data.height ? data.height * 100 : data.width;

    return this.request('FillRectangle', data);
  }

  /**
   * 以指定的线宽，打印圆角矩形框
   *
   * @param {object} data 打印圆角矩形时所需要提供的参数列表；
   *      {
   *           x,              // 可选，打印椭圆矩形框水平位置
   *           y,              // 可选，打印椭圆矩形框垂直位置
   *           width,          // 必填，打印椭圆矩形框水平宽度
   *           height,         // 可选，打印椭圆矩形框垂直高度，默认等同于width
   *           cornerWidth,    // 可选，圆角宽度
   *           cornerHeight    // 可选，圆角高度
   *           lineWidth       // 可选，矩形的线宽
   *       }
   */
  drawRoundRectangle(data) {
    data.x = (data.x || 0) * 100;
    data.y = (data.y || 0) * 100;
    data.width = (data.width || 0) * 100;
    data.height = data.height ? data.height * 100 : data.width;
    data.cornerWidth =
      (typeof data.cornerWidth === 'number'
        ? data.cornerWidth
        : defaultCornerRadius) * 100;
    data.cornerHeight =
      typeof data.cornerHeight === 'number'
        ? data.cornerHeight * 100
        : data.cornerWidth;
    data.lineWidth = (data.lineWidth || defaultLineWidth) * 100;

    return this.request('DrawRoundRectangle', data);
  }

  /**
   * 打印填充的圆角矩形框
   * @param {object} data 打印填充矩形时所需要提供的参数列表；
   *      {
   *           x,              // 必填，打印椭圆矩形框水平位置
   *           y,              // 必填，打印椭圆矩形框垂直位置
   *           width,          // 必填，打印椭圆矩形框水平宽度
   *           height,         // 可选，打印椭圆矩形框垂直高度，默认等同于width
   *           cornerWidth,    // 可选，圆角宽度
   *           cornerHeight    // 可选，圆角高度
   *       }
   */
  fillRoundRectangle(data) {
    data.x = (data.x || 0) * 100;
    data.y = (data.y || 0) * 100;
    data.width = (data.width || 0) * 100;
    data.height = data.height ? data.height * 100 : data.width;
    data.cornerWidth =
      (typeof data.cornerWidth === 'number'
        ? data.cornerWidth
        : defaultCornerRadius) * 100;
    data.cornerHeight =
      typeof data.cornerHeight === 'number'
        ? data.cornerHeight * 100
        : data.cornerWidth;

    return this.request('FillRoundRectangle', data);
  }

  /**
   * 以指定的线宽，打印椭圆
   * @param {object} data 椭圆打印相关参数列表；
   *      {
   *          x,          // 必填，打印椭圆矩形框水平位置
   *          y,          // 必填，打印椭圆矩形框垂直位置
   *          width,      // 必填，打印椭圆矩形框水平宽度
   *          height,     // 可选，打印椭圆矩形框垂直高度，默认等同于width
   *          lineWidth   // 可选，椭圆的线宽
   *      }
   */
  drawEllipse(data) {
    data.x = (data.x || 0) * 100;
    data.y = (data.y || 0) * 100;
    data.width = (data.width || 0) * 100;
    data.height = data.height ? data.height * 100 : data.width;
    data.lineWidth = (data.lineWidth || defaultLineWidth) * 100;

    return this.request('DrawEllipse', data);
  }

  /**
   * 打印填充的椭圆
   * @param {object} data 打印填充椭圆时所需要提供的参数列表；
   *      {
   *          x,          // 必填，打印椭圆矩形框水平位置
   *          y,          // 必填，打印椭圆矩形框垂直位置
   *          width,      // 必填，打印椭圆矩形框水平宽度
   *          height,     // 可选，打印椭圆矩形框垂直高度，默认等同于width
   *      }
   */
  fillEllipse(data) {
    data.x = (data.x || 0) * 100;
    data.y = (data.y || 0) * 100;
    data.width = (data.width || 0) * 100;
    data.height = data.height ? data.height * 100 : data.width;

    return this.request('FillEllipse', data);
  }

  /**
   *  打印线（直线/斜线）
   * @param {object} data 打印直线所需参数列表：
   *      {
   *          x1,         // 必填，线的起点
   *          y1,         // 必填，线的起点
   *          x2,         // 必填，线的终点
   *          y2,         // 必填，线的终点
   *          lineWidth,  // 可选，线条的宽度；
   *      }
   */
  drawLine(data) {
    data.x1 = (data.x1 || 0) * 100;
    data.y1 = (data.y1 || 0) * 100;
    data.x2 = (data.x2 || 0) * 100;
    data.y2 = (data.y2 || 0) * 100;
    data.lineWidth = (data.lineWidth || defaultLineWidth) * 100;

    return this.request('DrawLine', data);
  }

  /**
   *  打印点划线
   * @param {object} data 打印点画线的时候需要提供的参数列表；
   *      {
   *          x1,             // 必填，线的起点
   *          y1,             // 必填，线的起点
   *          x2,             // 必填，线的终点
   *          y2,             // 必填，线的终点
   *          lineWidth,      // 可选，点画线线条的宽度,如果未指定，则采用默认线条宽度；
   *          dashLen,        // 可选，number类型的数组；
   *          dashLen1,       // 可选，点画线中第一段线的长度,默认为0.25；
   *          dashLen2,       // 可选，点画线中第二段线的长度,默认等同于dashLen1;
   *          dashLen3,       // 可选，点画线中第三段线的长度,默认等同于dashLen1;
   *          dashLen4,       // 可选，点画线中第四段线的长度,默认等同于dashLen2;
   *      }
   */
  drawDashLine(data) {
    data.x1 = (data.x1 || 0) * 100;
    data.y1 = (data.y1 || 0) * 100;
    data.x2 = (data.x2 || 0) * 100;
    data.y2 = (data.y2 || 0) * 100;
    data.lineWidth =
      typeof data.lineWidth === 'number'
        ? data.lineWidth * 100
        : defaultLineWidth * 100;

    if (data.dashLen instanceof Array) {
      for (var i = 0; i < data.dashLen.length; i++) {
        data.dashLen[i] = data.dashLen[i] * 100;
      }
      data.dashLen = data.dashLen.join(',');
    } else {
      data.dashLen1 =
        typeof data.dashLen1 === 'number' ? data.dashLen1 * 100 : 25;
      data.dashLen2 =
        typeof data.dashLen2 === 'number' ? data.dashLen2 * 100 : data.dashLen1;
      data.dashLen3 =
        typeof data.dashLen3 === 'number' ? data.dashLen3 * 100 : data.dashLen1;
      data.dashLen4 =
        typeof data.dashLen4 === 'number' ? data.dashLen4 * 100 : data.dashLen2;
    }

    return this.request('DrawDashLine', data);
  }

  /**
   *  打印指定文件的图片
   * @param {object} data 打印图片的时候需要提供的参数列表；
   *      {
   *          imageFile,          // 必填，图片url路径；
   *          x,                  // 可选，打印位图水平位置（单位毫米(mm)）
   *          y,                  // 可选，打印位图垂直位置（单位毫米(mm)）
   *          width,              // 可选，打印位图水平宽度（单位毫米(mm)）。默认为 0，则采用加载的位图的宽度
   *          height,             // 可选，打印位图垂直高度（单位毫米(mm)）。默认为 0，则采用加载的位图的高度
   *          threshold           // 可选，黑白打印的灰度阀值，默认为192；0 表示使用参数设置中的值；256 表示取消黑白打印，用灰度打印；257 表示直接打印图片原来的颜色
   *      }
   * @使用注意：
   *       如果之前没有调用 StartPage 而直接进行打印，则打印函数会自动调用 StartPage开始一打印页面，然后进行打印。
   *       打印位置和宽度高度是基于当前页面的位置和方向，不考虑页面和打印动作的旋转角度。
   *       图片打印时会被缩放到指定的宽度和高度。
   *       标签打印都是黑白打印，因此位图会被转变成灰度图片（RGB三分量相同，0～255取值的颜色）之后，然后根据一阀值将位图再次转换黑白位图再进行打印。默认灰度阀值为 192，也就是说 >= 192 的会被认为是白色，而 < 192 的会被认为是黑色。
   */
  drawImage(data) {
    if (data.imageFile == null) throw PARAMETERS_IS_NOT_VALID;

    data.x = (data.x || 0) * 100;
    data.y = (data.y || 0) * 100;
    data.width = (data.width || 0) * 100;
    data.height = (data.height || 0) * 100;
    data.threshold = typeof data.threshold === 'number' ? data.threshold : 192;

    return this.request('DrawImage', data);
  }
}

module.exports = LPApi;
