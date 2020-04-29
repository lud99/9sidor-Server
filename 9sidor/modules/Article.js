const mongoose = require("mongoose");

const ArticleSchema = mongoose.Schema({
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
    },
    image: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Image",
    },
    title: {
        type: String,
        required: [true, "En titel måste anges"] 
    },
    titleLowercase: {
        type: String,
        required: [true, "En titel med små bokstäver måste anges"] 
    },
    titleNormalized: {
        type: String,
        required: [true, "En normaliserad titel måste anges"] 
    },
    mainText: {
        type: String,
        require: [true, "En text måste anges"]
    },
    mainTextNormalized: {
        type: String,
        require: [true, "En text med små bokstäver och utan nya rader måste anges"]
    },
    previewText: {
        type: String,
    },
    url: {
        type: String
    },
    oldUrl: {
        type: String
    },
    showOnStartPage: {
        type: Boolean,
        default: true
    },
    hidden: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    displayDate: {
        type: String
    }
});

module.exports = mongoose.model("Article", ArticleSchema);