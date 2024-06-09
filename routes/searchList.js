const express = require("express");
const app = express.Router();
const asyncMySQL = require("../utils/connection");

app.get("/:query", async (req, res) => {
  const query = req.params.query;
  if (query) {
    console.log(query);
    try {
      let list = await asyncMySQL(
        `SELECT Name as name, Norad as noradId FROM active WHERE Name LIKE '${query}%'`
      );
      if (list.length === 0) {
        list = await asyncMySQL(
          `SELECT Name as name, Norad as noradId FROM visual WHERE Name LIKE '${query}%'`
        );
      }
      if (list.length === 0) {
        list = await asyncMySQL(
          `SELECT Name as name, Norad as noradId FROM last30days WHERE Name LIKE '${query}%'`
        );
      }
      res.send(list);
    } catch (err) {
      res.send("field empty");
    }
  } else {
    return;
  }
});

module.exports = app;
