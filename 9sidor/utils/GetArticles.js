const Find = require("./Find");

const ArticleDataFormatter = require("./ArticleDataFormatter");

class GetArticles
{
    static get(url, subject = "all", callback, options = this.defaultOptions.get)
    {
        // Check if a cache for the specified url exists
        if (cache.exists(url) && options.useCache) {
            //console.log("Loading from cache", url);

            // Get the cached response
            const response = cache.get(url);

            // Run the callback
            return callback(null, response);
        }

        const query = url.getSearchQuery();

        // Initialize callback
        const mongooseCallback = (err, articles) => {
            try {
                // Handle the error if one occurs
                if (err) throw err;

                if (!articles) throw { message: "Kunde inte hitta artikeln" };

                // Format the article data
                const data = ArticleDataFormatter.format(articles.length == undefined ? [articles] : articles, options.articleFormat); 

                // JSON Response
                const response = {
                    success: true,
                    count: data.length,
                    data: articles.length == undefined ? data[0] : data
                };

                // Only cache the data if specified
                if (options.useCache) {
                    // Cache the data
                    cache.update(url, response);

                    //console.log("Updating the cache for", url);
                } else {
                    //console.log("Not using cache for", url);
                }

                // Run the callback
                callback(null, response);
            } catch (error) {
                // Handle error
                return callback(error, { data: [] });
            }
        };

        // Find all the matching articles
        if (!options.getOne && !options.customMongooseQuery)
            Find.getArticles(subject, query, mongooseCallback, options);
        else   
            Find.getOneArticle(options.customMongooseQuery, mongooseCallback)
    }

    static options() {
        return {
            get: { 
                useCache: true, 
                articleFormat: ArticleDataFormatter.formats.default, 
                populate: "subject image",
                customMongooseQuery: null,
                getOne: false
            }
        }
    }
}

module.exports = GetArticles;