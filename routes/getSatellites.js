const express = require("express");
const app = express.Router();
const asyncMySQL = require("../utils/connection");
const getNoradId = require("../utils/getNoradId"); // pulls norad id from tle data
const tleToArray = require("../utils/tleToArray");
const axios = require("axios");
const key = process.env.N2YO_KEY;
//route is for any group of satellites selected by request parameter
app.get("/:type", async (req, res) => {
  const type = req.params.type;
  // get timestamp of last sql write
  const checkDB = await asyncMySQL(`SELECT MIN(Timestamp) FROM ${type}`);

  timeDiff = new Date() - checkDB[0]["MIN(Timestamp)"];
  if (timeDiff < 2.5 * 60 * 60 * 1000) {
    //collect the data from the database
    const data = await asyncMySQL(
      `SELECT Name as name, TLE as tle, Norad as noradId FROM ${type}`
    );
    console.log("stored data retrieved");
    res.send(data);
  } else {
    //purge old database data
    await asyncMySQL(`TRUNCATE TABLE ${type}`);

    //collect and convert data from the celestrak API
    const { data } = await axios.get(
      type === "last30days"
        ? `https://celestrak.org/NORAD/elements/gp.php?GROUP=last-30-days&FORMAT=tle` //SQL doesn't like hyphens!!!
        : `https://celestrak.org/NORAD/elements/gp.php?GROUP=${type}&FORMAT=tle`
    );
    const orderedData = tleToArray(data);

    res.send(orderedData);
    try {
      orderedData.forEach((e) =>
        asyncMySQL(`INSERT INTO ${type} (Name, TLE, Norad) VALUES (?,?,?);`, [
          e.name,
          e.tle,
          e.noradId,
        ])
      );
    } catch (error) {
      console.log(error);
    }
    // console.log(orderedData);
  }
});

module.exports = app;
