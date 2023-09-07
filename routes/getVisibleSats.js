const express = require("express");
const app = express.Router();

const axios = require("axios");
const key = process.env.N2YO_KEY;
app.get("/", async (req, res) => {
  const { data } = await axios.get(
    // `https://api.n2yo.com/rest/v1/satellite/tle/[25544,48274]&apiKey=${key}`
    `https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle`
    // `https://celestrak.org/NORAD/elements/gp.php?GROUP=1982-092&FORMAT=tle` //russian anti satellite debris field
    // `https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle` //all active
    // `https://celestrak.org/NORAD/elements/supplemental/sup-gp.php?FILE=starlink&FORMAT=tle` //starlink
  );
  const splitData = data.split("\r\n");
  const orderedData = [];
  let i = 0,
    len = splitData.length;
  while (i < len) {
    const item = {
      name: splitData[i],
      tle: splitData[i + 1] + "\r\n" + splitData[i + 2],
    };
    orderedData.push(item);
    i += 3;
  }
  console.log(orderedData);
  res.send(orderedData);
});

module.exports = app;
