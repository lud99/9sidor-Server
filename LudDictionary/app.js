const express = require("express");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

console.log(__dirname)
 
// Load env
dotenv.config({ path: __dirname + "/config/config.env" });

// Connect to database
connectDB();

const app = express();

// Static
app.use(express.static("client"));

// Body parser
app.use(express.json());

// Routes
app.use("/api/v1/words", require("./routes/words"));

const PORT = process.env.PORT || 5000;

app.get("/add-word", (req, res) => {
    res.sendFile(__dirname + "/client/add-word.html");
});

module.exports = () => {
    const module = {};

    module.startServer = () => app.listen(PORT, () => console.log("LudDictionary server running on port", PORT));

    module.app = app;

    return module;
}