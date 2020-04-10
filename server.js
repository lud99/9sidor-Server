const express = require("express");
const app = express();

const Milena = require("./Milena/app")();
//const LudDictionary = require("./LudDictionary/app")();

app.use("/milena", Milena.app);
//app.use("/lud-dictionary", LudDictionary.app)

const port = process.env.app_port || 8080;

app.listen(port, () => console.log("LudvigDB main server running on port", port));