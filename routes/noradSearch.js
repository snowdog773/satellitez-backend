const express = require("express");
const app = express.Router();
const asyncMySQL = require("../utils/connection");
const axios = require("axios");
const noradValidate = require("../utils/joi");
app.get("/:id", async (req, res) => {
  const id = req.params.id;
  const validationCheck = await noradValidate(id);

  if (!id || !validationCheck) {
    return res.status(400).send([]); // Return early if validation fails
  }

  try {
    // 1. Check if we already have the details cached
    const detailQuery = await asyncMySQL(
      `SELECT NoradId FROM details WHERE NoradId = ?`,
      [id],
    );

    if (detailQuery.length === 0) {
      console.log("Fetching External API Data...");

      // Call both APIs in parallel to save time
      const [uphereRes, celestrakRes] = await Promise.allSettled([
        axios.get(
          `https://uphere-space1.p.rapidapi.com/satellite/${id}/details`,
          {
            headers: {
              "x-rapidapi-host": "uphere-space1.p.rapidapi.com",
              "x-rapidapi-key": process.env.UPHERE_KEY,
            },
          },
        ),
        axios.get(`https://celestrak.org/satcat/records.php?CATNR=${id}`),
      ]);

      // Check if Uphere failed
      if (uphereRes.status === "rejected") throw new Error("Uphere API Failed");

      const {
        type,
        country,
        intldes,
        orbital_period,
        launch_date,
        description,
        links,
      } = uphereRes.value.data;

      // Handle Celestrak's data carefully (it often returns an array)
      const cData =
        celestrakRes.status === "fulfilled" && celestrakRes.value.data[0]
          ? celestrakRes.value.data[0]
          : {}; // Fallback to empty object if not found

      await asyncMySQL(
        `INSERT INTO details (NoradId, type, country, intldes, orbital_period, launch_date, description, links, launch_site, inclination, apogee, perigee, rcs) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id,
          type,
          country,
          intldes,
          orbital_period,
          launch_date,
          description,
          JSON.stringify(links || []),
          cData.LAUNCH_SITE || "Unknown",
          cData.INCLINATION || 0,
          cData.APOGEE || 0,
          cData.PERIGEE || 0,
          cData.RCS || 0,
        ],
      );
    }

    // 2. Query the combined data from your tables
    // Optimization: You could use a single UNION query here instead of 3 separate calls
    let findSat = await asyncMySQL(
      `SELECT Name as name, TLE as tle, Norad as noradId, d.* FROM active a 
       LEFT JOIN details d ON a.Norad = d.NoradID 
       WHERE a.Norad = ?`,
      [id],
    );

    if (findSat.length === 0) {
      findSat = await asyncMySQL(/* Check visual table... */);
    }

    res.status(200).send(findSat);
  } catch (err) {
    console.error("Backend Error:", err.message);
    res
      .status(500)
      .send({ error: "Internal Server Error", details: err.message });
  }
});
module.exports = app;
