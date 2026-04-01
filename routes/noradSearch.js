const express = require("express");
const app = express.Router();
const asyncMySQL = require("../utils/connection");
const axios = require("axios");
const noradValidate = require("../utils/joi");

app.get("/:id", async (req, res) => {
  const id = req.params.id;

  // 1. Immediate Guard: If no ID, don't even run the validator
  if (!id) return res.status(400).send({ error: "No ID provided" });

  try {
    const validationCheck = await noradValidate(id);
    if (!validationCheck)
      return res.status(400).send({ error: "Invalid NORAD ID" });

    // 2. Check Cache
    const detailQuery = await asyncMySQL(
      `SELECT NoradId FROM details WHERE NoradId = ?`,
      [id],
    );

    if (detailQuery && detailQuery.length === 0) {
      console.log("API CALLED for ID:", id);

      // 3. Robust API Fetching
      const options = {
        method: "GET",
        url: `https://uphere-space1.p.rapidapi.com/satellite/${id}/details`,
        headers: {
          "x-rapidapi-host": "uphere-space1.p.rapidapi.com",
          "x-rapidapi-key": process.env.UPHERE_KEY || "", // Fallback to empty string
        },
        timeout: 5000, // Prevent hanging
      };

      // Use a nested try/catch for APIs so one failure doesn't kill the whole route
      try {
        const details = await axios.request(options);
        const uData = details?.data || {}; // Safety fallback

        const otherDetails = await axios.get(
          `https://celestrak.org/satcat/records.php?CATNR=${id}`,
          { timeout: 5000 },
        );

        // Safety: check if data exists and has at least one element
        const cData =
          otherDetails?.data && otherDetails.data.length > 0
            ? otherDetails.data[0]
            : {};

        await asyncMySQL(
          `INSERT INTO details (NoradId, type, country, intldes, orbital_period, launch_date, description, links, launch_site, inclination, apogee, perigee, rcs) 
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            id,
            uData.type || "N/A",
            uData.country || "Unknown",
            uData.intldes || "",
            uData.orbital_period || 0,
            uData.launch_date || null,
            uData.description || "",
            JSON.stringify(uData.links || []),
            cData.LAUNCH_SITE || "Unknown",
            cData.INCLINATION || 0,
            cData.APOGEE || 0,
            cData.PERIGEE || 0,
            cData.RCS || 0,
          ],
        );
      } catch (apiErr) {
        console.error("External API Error:", apiErr.message);
        // We don't necessarily want to 'return' here; we might still want to
        // try and fetch what we have in the main tables below.
      }
    }

    // 4. Final Query (Parameterized for safety)
    // Using a JOIN to find the satellite in any of the 3 main tables
    const query = `
      SELECT Name as name, TLE as tle, Norad as noradId, d.* FROM (
        SELECT Name, TLE, Norad FROM active WHERE Norad = ?
        UNION
        SELECT Name, TLE, Norad FROM visual WHERE Norad = ?
        UNION
        SELECT Name, TLE, Norad FROM last30days WHERE Norad = ?
      ) as sat
      LEFT JOIN details d ON sat.Norad = d.NoradID
    `;

    const findSat = await asyncMySQL(query, [id, id, id]);

    res.status(200).send(findSat || []);
  } catch (err) {
    // 5. Improved Error Logging for Docker
    console.error("CRITICAL BACKEND ERROR:", err.message);
    if (err.stack) console.error(err.stack);

    // Check if headers already sent to avoid secondary crashes
    if (!res.headersSent) {
      res
        .status(500)
        .send({ error: "Internal Server Error", msg: err.message });
    }
  }
});

module.exports = app;
