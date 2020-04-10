const mongoose = require("mongoose");

const WordSchema = mongoose.Schema({
    word: { 
        type: String, 
        unique: true,
        required: [true, "Please specify a word"] 
    },
    wordLowercase: {
        type: String, 
        unique: true,
        required: [true, "Please specify a lowercase version of the word"] 
    },
    type: { 
        type: String, 
        enum: [/* English */ "Adjective", "Noun", "Verb", /* Swedish */ "Adjektiv", "Substantiv"]
    },
    definition: { 
        type: String,
        required: [true, "Please specify a definition"]
    },
    exampleSentence: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Word", WordSchema);