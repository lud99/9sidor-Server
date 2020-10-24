const Subject = require("../modules/Subject");

// Get subjects
const GetSubjects = require("../utils/GetSubjects");

// Error handling
const ErrorHandler = require("../utils/ErrorHandler");

/**
 * Get subjects with default formatting
 * 
 * @route GET /api/v1/subjects/default
 * @access Public 
*/
exports.getSubjectsDefault = async (req, res) => {
    // Get subjects
    GetSubjects.get(req.originalUrl, (err, response) => {
        // Handle error
        if (err) return ErrorHandler.handleRouteError(res, err);

        res.status(200).json(response);
    });
}

/**
 * Add a new subject
 * 
 * @route POST /api/v1/subjects/add
 * @access Public 
*/
exports.addSubject = async (req, res, next) => {
    try {
        const data = req.body;

        if (!data.name) throw { message: "No name specified" };

        // Get the subject name and capitalize it
        const name = data.name.toString().toLowerCase().capitalize();

        // Make the subject name lowercase
        const nameLowercase = name.toLowerCase();

        // Remove any emojis or special characters from the subject name
        const nameNormalized = nameLowercase.removeSpecialCharacters(); 

        const url = "/kategori/" + nameNormalized;

        // Get the background color
        const backgroundColor = data.backgroundColor.toString();

        // Get all subjects
        GetSubjects.get(req.originalUrl, async (err, response) => {
            // Handle error
            if (err) return ErrorHandler.handleRouteError(res, err);

            const subjects = response.data;
    
            // Check if it is an invalid color
            if (!backgroundColor.validHexColor())
                return ErrorHandler.invalidColor(res); // Send error response

            // Create the subject
            const subject = await Subject.create({
                name: name,
                url: url,
                nameLowercase: nameLowercase,
                nameNormalized: nameNormalized,
                backgroundColor: backgroundColor,
                index: subjects.length
            });

            console.log("Successfully added the subject '%s'", name);

            cache.clear();

            // Send response
            return res.status(200).json({
                success: true,
                data: subject
            });
        }); 
    } catch (error) {
        // Handle error
        ErrorHandler.handleRouteError(res, error);
    }
}

exports.update = async (req, res, next) => {
    try {
        const subjects = await Subject.find();

        for (let i = 0; i < subjects.length; i++) {
            const subject = subjects[i];

            subject.url = `/kategori/${subject.nameNormalized}`;
            
            await subject.save();
        }

        res.status(200).json({
            success: true,
            count: subjects.length,
            data: await Subject.find()
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
}