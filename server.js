const express = require("express");
const app = express();

console.log(__dirname)

//const Milena = require(__dirname + "/Milena/app")();
const NioSidor = require("./9sidor/app")();
//const LudDictionary = require("./LudDictionary/app")();

//app.use("/milena", Milena.app);
app.use("/9sidor", NioSidor.app);
//app.use("/lud-dictionary", LudDictionary.app)

const port = process.env.app_port || 8080;

app.listen(port, () => console.log("LudvigDB main server running on port", port));