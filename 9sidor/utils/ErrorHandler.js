class ErrorHandler
{
    /**
     * Throw if an error occurred
     * 
     * @param {{}} res - The express response object
     * 
     * @return {{ error: string, stack: string }}
     */
    static apiResponseError(response)
    {
        return response.error || { message: "Internal Server Error" };
    }

    /**
     * Convert errors into objects that can be send
     * 
     * @param {{}} error - The error that occurred
     * 
     * @return {{ error: string, stack: string }}
     */
    static errorToJSON(error)
    {
        // Convert the error to JSON
        const json = JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));

        // If not in development mode

        if (process.env.NODE_ENV != "development")
            delete json.stack; // Remove the stack for safety purposes if not in development mode

        return json;
    }

    /**
     * Handle errors occurring in routes by sending a custom error response to the client
     * 
     * @param {{}} res - The express response object
     * @param {{ message: string, stack: string }} error - The JSON error object
     * @param {*} otherData - Any other data to send
     */
    static handleRouteError(res, error, otherData)
    {
        // Log the error
        console.error(error);

        // 500 - Internal server error
        res.status(500).json({
            success: false,
            error: this.errorToJSON(error),
            otherData
        });
    }

    /**
     * Return the error message for when a token is invalid
     * 
     * @param {string} token - The api token
     * 
     * @return {{ success: false, token: string, error: { message: "Invalid token specified" } }} 
     */
    static invalidToken(token)
    {
        return {
            success: false,
            token: token,  
            error: "Invalid token specified"
        };
    }

    /**
     * Return the error message for when a token isn't specified
     * 
     * @return {{ success: false, error: { message: "No token specified" } }} 
     */
    static noToken()
    {
        return {
            success: false,
            error: "No token specified"
        };
    }

    /**
     * Return the error message for when a color is invalid
     * 
     * @param {{}} res - The express response object
     * @return {{ success: false, error: { message: "Ogiltig färg angiven" } }} 
     */
    static invalidColor(res = null)
    {
        const response =  {
            success: false,
            error: { message: "Ogiltig färg angiven" }
        };

        // Send a response if a res object is specified, otherwise return the json response
        return res ? res.status(400).json(response) : response;
    }

    /**
     * Return the error message for a normal server error
     * 
     * @param {{}} error - The error that occurred
     * 
     * @return {{ success: false, error: {} }} 
     */
    static serverError(error)
    {
        return { 
            success: false, 
            error: error,
        }; 
    }
}

module.exports = ErrorHandler;