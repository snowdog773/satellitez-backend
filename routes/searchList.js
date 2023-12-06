const express = require("express");
const app = express.Router();
const asyncMySQL = require("../utils/connection");

app.get("/:query", async (req, res) => {
  const query = req.params.query;
  if (query) {
    console.log(query);
    try {
      const list = await asyncMySQL(
        `SELECT Name as name, Norad as noradId FROM active WHERE Name LIKE '${query}%'`
      );
      res.send(list);
    } catch (err) {
      res.send("field empty");
    }
  } else {
    return;
  }
});

module.exports = app;
