const express = require("express");
const app = express.Router();

const axios = require("axios");
const key = process.env.N2YO_KEY;
app.get("/", async (req, res) => {
  const { data } = await axios.get(
    `https://api.n2yo.com/rest/v1/satellite/tle/25544&apiKey=${key}`
  );
  console.log(data);
  res.send(data);
});

module.exports = app;
