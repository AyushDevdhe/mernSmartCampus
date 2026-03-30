const express = require("express");
const connectDB = require("./config/database");
require("dotenv").config();

const app = express();

app.use(express.json());
connectDB();

app.get("/", (req, res) => {
  res.send("backend app is running");
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`server running on ${PORT}`);
});
