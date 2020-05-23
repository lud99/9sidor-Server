const mongoose = require("mongoose");

const SubjectSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Ett namn måste anges"] 
    },
    nameLowercase: {
        type: String,
        required: [true, "Ett namn med små bokstäver måste anges"] 
    },
    nameNormalized: {
        type: String,
        required: [true, "Ett normaliserat namn måste anges"] 
    },
    backgroundColor: {
        type: String,
        required: [true, "En bakgroundsfärg måste anges"]
    },
    url: {
        type: String,
        required: [true, "En url måste anges"]
    },
    index: {
        type: Number,
        required: [true, "Ett index måste anges"]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = connections.niosidor.model("Subject", SubjectSchema);