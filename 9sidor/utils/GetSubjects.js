const Find = require("./Find");

class GetSubjects
{
    static get(url, callback, options = this.defaultOptions.get)
    {
        // Check if a cache for the specified url exists
        if (cache.exists(url) && options.useCache) {
            //console.log("Loading from cache", url);

            // Get the cached response
            const response = cache.get(url);

            // Run the callback
            return callback(null, response);
        }

        // Find all the matching subjects
        Find.getSubjects((err, subjects) => {
            try {
                // Handle the error if one occurs
                if (err) throw err;

                // JSON Response
                const response = {
                    success: true,
                    count: subjects.length,
                    data: subjects
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
        }, { populate: options.populate });
    }
}

GetSubjects.defaultOptions = {
    get: { 
        useCache: true
    }
}

module.exports = GetSubjects;