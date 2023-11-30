const getNoradId = require("../utils/getNoradId"); // pulls norad id from tle data
function tleToArray(data) {
  const splitData = data.split("\r\n");

  const orderedData = [];
  let i = 0,
    len = splitData.length;
  while (i < len) {
    const item = {
      name: splitData[i],
      tle: splitData[i + 1] + "\r\n" + splitData[i + 2],
      noradId: getNoradId(splitData[i + 1]),
    };
    orderedData.push(item);
    i += 3;
  }
  orderedData.pop(); //removes last element of orderedArray which comes back as undefined
  return orderedData;
}
module.exports = tleToArray;
