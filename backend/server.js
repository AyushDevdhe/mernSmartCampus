const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("backend app is running");
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`server running on ${PORT}`);
});
