const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");

const { connectDB } = require("./config/db");

// Load env
dotenv.config({ path: __dirname + "/config/config.env" });
dotenv.config({ path: __dirname + "/config/secrets.env" });

// Basic utils
const Utils = require("./utils/Utils");

// Setup cache
const Cache = require("./utils/Cache").init();

const app = express();

// CORS
app.use(cors());

// Static
app.use("/static", express.static(__dirname + "/static"));

// Morgan (Logging)
app.use(morgan('[9sidor] :method :url :status :res[content-length] :response-time ms :date[web]'));

// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Redirect to the default 9sidor.ml if at "/"
app.get("/", (req, res) => res.status(301).redirect("https://9sidor.ml"));

// Set up global connections variable
if (!global.connections) global.connections = {};

// Connect to database
connectDB().then(() => {
    // Routes
    app.use("/api/v1/articles", require("./routes/articles"));
    app.use("/api/v1/subjects", require("./routes/subjects"));
    app.use("/api/v1/debug", require("./routes/debug"));
});

module.exports = () => {
    const module = {};

    const port = process.env.app_port || process.env.PORT || 5000;

    module.startServer = () => app.listen(port, () => console.log("9sidor server running on port ", port));

    module.app = app;

    return module;
}