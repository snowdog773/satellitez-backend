const express = require("express");
const app = express.Router();
const asyncMySQL = require("../utils/connection");
const axios = require("axios");
const noradValidate = require("../utils/joi");
app.get("/:id", async (req, res) => {
  const id = req.params.id;
  const validationCheck = await noradValidate(id);
  if (id && validationCheck) {
    //check details table for cached details, if not call uphere.space api
    // to get sat details and write to SQL details table
    const detailQuery = await asyncMySQL(
      `SELECT NoradId FROM details WHERE NoradId=${id}`
    );
    if (detailQuery.length === 0) {
      console.log("API CALLED");
      const options = {
        method: "GET",
        url: `https://uphere-space1.p.rapidapi.com/satellite/${id}/details`,
        headers: {
          "x-rapidapi-host": "uphere-space1.p.rapidapi.com",
          "x-rapidapi-key": process.env.UPHERE_KEY,
        },
      };
      const details = await axios.request(options); //from uphere docs
      const {
        type,
        country,
        intldes,
        orbital_period,
        launch_date,
        description,
        links,
      } = details.data;

      await asyncMySQL(
        `INSERT INTO details (NoradId, type, country, intldes, orbital_period, launch_date, description, links) VALUES (?,?,?,?,?,?,?,?)`,
        [
          id,
          type,
          country,
          intldes,
          orbital_period,
          launch_date,
          description,
          JSON.stringify(links),
        ]
      );
    }
    console.log(detailQuery);
    const findSat = await asyncMySQL(
      `SELECT Name as name, TLE as tle, Norad as noradId, details.type, details.country, details.intldes, details.orbital_period, details.launch_date, details.links, details.description FROM active LEFT JOIN details ON active.Norad = details.NoradID WHERE Norad=${id}`
    );

    res.status(200).send(findSat);
  } else {
    res.status(400).send("invalid Norad ID submitted");
  }
});

module.exports = app;
