const mongoose = require("mongoose");

const ImageSchema = mongoose.Schema({
    text: {
        type: String,
    },
    url: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = connections.niosidor.model("Image", ImageSchema);