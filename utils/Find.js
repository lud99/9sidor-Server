const Article = require("../modules/Article");
const Subject = require("../modules/Subject");
const Image = require("../modules/Image");

const ErrorHandler = require("./ErrorHandler");

class Find
{
    static async prepare(_subject = "all", query) 
    {
        try {
            // Get the subject name and make it lowercase
            const subjectName = removeSpecialCharacters((_subject || "all").toLowerCase());
        
            // Options
        
            // Get the page (offset)
            const page = parseInt(query.page) || 1;
        
            // Get the number of results per page
            const limit = parseInt(query.limit) || 9;
        
            // Find the subject
            const subject = await Subject.findOne({ nameNormalized: subjectName });

            const isSpecialSubject = subjectName == "all";
            
            // If no subject was found
            if (!subject && !isSpecialSubject) 
                throw { message: "Ogiltig kategori angiven" };
        
            // Only find articles with a specific subject if one is specified, otherwise find all articles
            const findQuery = !isSpecialSubject ? { subject: subject._id, hidden: false } : { hidden: false };

            return {
                subjectName,
                page,
                limit,
                subject,
                findQuery,
                isSpecialSubject
            };
        } catch (error) {
            return { error: error };
        }
    }

    static async getArticles(subject = "all", query, callback, options = this.defaultOptions.getArticles)
    {
        try {
            // Get all the necessary data to perform a find
            const prep = await Find.prepare(subject, query);

            const { error, page, limit, findQuery } = prep;

            // Check for errors
            if (error) throw error;
    
            // Find all articles with the same subject as the one specified
            Article.
                find(options.customMongooseQuery || findQuery). // Find
                skip(page < 0 ? 0 : (page - 1) * limit). // Only get results for the specified page
                limit(limit < 0 ? 0 : limit). // Limit the results. If the limit is less than 0, find all articles without a limit
                sort({ createdAt: -1 }). // Sort the results so that the most recent article is first
                populate("subject").populate("image"). // Replace the subject and image ids with the real documents (if specified)
                exec((err, articles) => callback(err, articles, prep)); // Callback
        } catch (error) {
            // Handle error
            return callback(error);
        }
    }

    static async getOneArticle(mongooseQuery, callback) 
    {
        try {
            // Find all articles with the same subject as the one specified
            Article.
                findOne(mongooseQuery). // Find one article
                populate("subject").populate("image"). // Replace the subject and image ids with the real documents (if specified)
                exec((err, article) => callback(err, article)); // Callback
        } catch (error) {
            // Handle error
            return callback(error);
        }
    }

    static async getSubjects(callback)
    {
        try {
            const subjects = await Subject.find();

            callback(null, subjects);
        } catch (error) {
            // Handle error
            return callback(error);
        }
    }
}

Find.defaultOptions = {
    getArticles: { 
        populate: "subject image",
    }
}

const removeSpecialCharacters = string => {
    // Remove å, ä, ö and accents
    let res = string.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Remove emojis
    return res.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
}

module.exports = Find;