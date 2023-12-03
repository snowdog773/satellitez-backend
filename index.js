const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const app = express();
require("dotenv").config();
app.use(express.json());
app.use(cors());

app.use("/getSatellites", require("./routes/getSatellites"));
app.use("/updateCategories", require("./routes/updateCategories"));
app.use("/noradSearch", require("./routes/noradSearch"));
app.listen(process.env.PORT || 6001, () => {
  console.log("server running");
});

function stop() {
  // Run some code to clean things up before server exits or restarts
  // console.log("stopping timer");
  // clearInterval(hourTimer); // THAT KILLS THE TIMER
  console.log("⬇ Killing process");
  process.exit(); // THEN EXITS THE PROCESS.
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
process.on("SIGQUIT", stop);

process.once("SIGUSR2", function () {
  // Run some code to do a different kind of cleanup on nodemon restart:
  process.kill(process.pid, "SIGUSR2");
});
