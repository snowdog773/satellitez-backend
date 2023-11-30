const express = require("express");
const app = express.Router();
const asyncMySQL = require("../utils/connection");
const getNoradId = require("../utils/getNoradId"); // pulls norad id from tle data
const axios = require("axios");
const tleToArray = require("../utils/tleToArray");

app.get("/", async (req, res) => {
  try {
    await asyncMySQL(`TRUNCATE TABLE ${req.query.type}`);
    const { data } = await axios.get(
      `https://celestrak.org/NORAD/elements/gp.php?GROUP=${req.query.type}&FORMAT=tle`
    );
    //   const ids = data.map((e) => getNoradId(e));
    const orderedData = tleToArray(data);
    const noradIds = orderedData.map((e) => getNoradId(e.tle));
    noradIds.forEach((e) => {
      asyncMySQL(`INSERT INTO ${req.query.type} (NoradId) VALUES (?)`, [e]);
    });

    res.send(`${req.query.type} category updated`);
  } catch (err) {
    res.send(err);
  }
});
module.exports = app;
//this route is for periodic updating of categories of satellite. At time of writing I am running

//http://localhost:6001/updateCategories?type=visual from insomnia
