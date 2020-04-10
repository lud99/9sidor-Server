const express = require("express");
const app = express();

const Milena = require("./Milena/app")();
//const LudDictionary = require("./LudDictionary/app")();

app.use("/milena", Milena.app);
//app.use("/lud-dictionary", LudDictionary.app)

const port = process.env.app_port || 8080;

app.listen(4000, () => console.log("LudvigDB main server running on port 4000"));