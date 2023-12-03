const express = require("express");
const app = express.Router();
const asyncMySQL = require("../utils/connection");
const axios = require("axios");
const noradValidate = require("../utils/joi");
app.get("/:id", async (req, res) => {
  const id = req.params.id;
  const validationCheck = await noradValidate(id);
  if (id && validationCheck) {
    const findSat = await asyncMySQL(`SELECT * FROM active WHERE Norad=${id}`);
    res.status(200).send(findSat);
  } else {
    res.status(400).send("invalid Norad ID submitted");
  }
});

module.exports = app;
