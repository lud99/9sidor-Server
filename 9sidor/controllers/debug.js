// Error handling
const ErrorHandler = require("../utils/ErrorHandler");

/**
 * Clear the cache
 * 
 * @route POST /api/v1/debug/cache/clear
 * @access Public 
*/
exports.clearCache = async (req, res) => {
    try {
        // Clear the cache
        cache.clear();

        console.log("Successfully cleared the cache");

        res.status(200).json({
            success: true
        });
    } catch (error) {
        ErrorHandler.handleRouteError(res, error);
    }
}