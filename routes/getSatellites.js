const express = require("express");
const app = express.Router();
const asyncMySQL = require("../utils/connection");
const getNoradId = require("../utils/getNoradId"); // pulls norad id from tle data
const tleToArray = require("../utils/tleToArray");
const axios = require("axios");
const key = process.env.N2YO_KEY;
//route is for any group of satellites selected by request parameter
app.get("/:type", async (req, res) => {
  try {
    const rawType = req.params.type;
    console.log("get sats route ran");
    //remove hyphens from type
    let type = rawType.split("-").join("");
    if (type === "1982092" || type === "1999025") {
      type = "a" + type;
    } // append a letter a to numerical queries - SQL doesn't like tables that start with numbers

    // get timestamp of last sql write

    const checkDB = await asyncMySQL(`SELECT MIN(Timestamp) FROM ${type}`);

    timeDiff = new Date() - checkDB[0]["MIN(Timestamp)"];

    if (timeDiff < 2.5 * 60 * 60 * 1000 && timeDiff > 30000) {
      //collect the data from the database if the data is older than 30 seconds and younger than 2 hours
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
        `https://celestrak.org/NORAD/elements/gp.php?GROUP=${rawType}&FORMAT=tle` //some queries are hyphenated so use raw version
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
    }
  } catch (err) {
    console.log("route failed", err);
    res.send("route failed");
  }
});

module.exports = app;
