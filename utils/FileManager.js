const fs = require("fs");

class FileManager {
    static writeBase64Image(path, base64Data, callback) {
        fs.writeFile(path, base64Data, "base64", callback);
    }
}

module.exports = FileManager;