const mongoose = require("mongoose");

exports.connectDB = async callback => {
    try {        
        // Try to connect
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useFindAndModify: false,
            useCreateIndex: true,
            useUnifiedTopology: true
        });

        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        return callback(error);
    }
}