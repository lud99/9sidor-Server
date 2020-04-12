const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const { connectDB } = require("./config/db");

// Load env
dotenv.config({ path: __dirname + "/config/config.env" });

// Connect to database
connectDB();

// Basic utils
const Utils = require("./utils/Utils");

// Setup cache
const Cache = require("./utils/Cache").init();

const app = express();

// CORS
app.use(cors());

// Body parser
app.use(express.json());

// Routes
app.use("/api/v1/articles", require("./routes/articles")); // Articles
app.use("/api/v1/subjects", require("./routes/subjects")); // Subjects
app.use("/api/v1/debug", require("./routes/debug")); // Debug

// Redirect to the default 9sidor.ml if at "/"
app.get("/", (req, res) => res.status(301).redirect("https://9sidor.ml"));

module.exports = () => {
    const module = {};

    module.startServer = () => app.listen(process.env.PORT || 5000, () => console.log("9sidor server running on port ", process.env.PORT || 5000));

    module.app = app;

    return module;
}