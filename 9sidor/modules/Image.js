const mongoose = require("mongoose");

const ImageSchema = mongoose.Schema({
    text: {
        type: String,
    },
    url: {
        type: String,
        required: [true, "En url måste anges"]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Image", ImageSchema);