const express = require("express");
const app = express.Router();
const asyncMySQL = require("../utils/connection");
const axios = require("axios");
const noradValidate = require("../utils/joi");
app.get("/:id", async (req, res) => {
  const id = req.params.id;
  const validationCheck = await noradValidate(id);
  if (id && validationCheck) {
    res.status(200).send("validation passed");
  } else {
    res.status(400).send("invalid Norad ID submitted");
  }
});

module.exports = app;
