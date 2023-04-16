export var formatCurrency = function (value, decimals) {
  var tokenDecimals = decimals || 18;
  var max256 = parseInt(
    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    16
  ).toString(16);
  var max160 = parseInt(
    '0xffffffffffffffffffffffffffffffffffffffff',
    16
  ).toString(16);
  if (
    parseInt(value).toString(16) === max256 ||
    parseInt(value).toString(16) === max160
  ) {
    return 'Infinite';
  }
  var result = parseInt(value) / Math.pow(10, tokenDecimals);
  if (result === 0) {
    return 0;
  }
  if (result < 0.001) {
    return '< 0.001';
  }
  var roundedResult = Math.round(result * 1000) / 1000;
  return roundedResult;
};
export var shortenAddress = function (address) {
  return (
    address.substring(0, 6) +
    '...' +
    address.substring(address.length - 4, address.length)
  );
};
export var validateDownloadId = function (downloadId) {
  if (!downloadId) return false;
  var uuidRegex = new RegExp(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  );
  return uuidRegex.test(downloadId);
};
