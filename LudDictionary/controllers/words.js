const Word = require("../modules/Word");

// @desc Get all words
// @route GET /api/v1/words
// @access Public 
exports.getAllWords = async (req, res, next) => {
    try {
        const words = await Word.find().sort({ "createdAt": -1 });
        
        res.status(200).json({
            success: true,
            count: words.length,
            data: words
        });
    } catch (error) {
        console.error(err);

        res.status(500).json({
            error: "Server error"
        });
    }
}

// @desc Add a word
// @route POST /api/v1/words
// @access Public 
exports.addWord = async (req, res, next) => {
    try {
        const data = req.body;

        const wordFormatted = capitalize(data.word);
        const wordLowercase = data.word.toLowerCase();
        const wordType = capitalize(data.type.replaceAll(" "));
        const wordDefinition = capitalize(data.definition);
        const exampleSentence = capitalize(data.exampleSentence);

        const word = await Word.create({
            word: wordFormatted,
            wordLowercase: wordLowercase,
            type: wordType,
            definition: wordDefinition,
            exampleSentence: exampleSentence
        });

        console.log("Successfully added the word '%s'", wordFormatted);

        return res.status(200).json({
            success: true,
            data: word
        });
    } catch (err) {
        console.error(err);
    
        res.status(500).json({
            error: err.message
        });
    }
}

// @desc Search for a word
// @route GET /api/v1/words/search
// @access Public 
exports.searchWord = async (req, res, next) => {
    try {
        const searchQuery = req.query.q ? req.query.q.toLowerCase() : "";

        const page = parseInt(req.query.page) || 1;
        const count = parseInt(req.query.count) || 20

        console.log("Searching for '%s'. Page number %s, %s results per page", searchQuery, page, count);

        Word.find({
            wordLowercase: {
                "$regex": searchQuery, 
                "$options": "i"
            }
        })
        .sort({ "createdAt": -1 })
        .skip((page - 1) * count)
        .limit(count)
        
        .exec((err, results) => {
            if (err) throw err;

            return res.status(200).json({
                success: true,
                count: results ? results.length : 0,
                data: results
            });
        });
    } catch (err) {
        console.error(err);
    
        res.status(500).json({
            error: err.message
        });
    }
}

// @desc Update all words
// @route POST /api/v1/words/update
// @access Public 
exports.updateWords = async (req, res, next) => {
    try {
        const words = await Word.find();

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            
            word.wordLowercase = word.word.toLowerCase();
            await word.save();
        }
        
        res.status(200).json({
            success: true,
            count: words.length,
            data: await Word.find()
        });
    } catch (err) {
        console.error(err);
    
        res.status(500).json({
            error: err.message
        });
    }
}

const capitalize = string => string[0].toUpperCase() + string.slice(1); 

String.prototype.replaceAll = function (target, replace = "") { return this.split(target).join(replace); }