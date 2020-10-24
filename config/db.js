const mongoose = require("mongoose");

exports.connectDB = async () => {
    try {        
        const uri = process.env.NODE_ENV === "dev" ? 
            process.env.MONGO_URI_9SIDOR_DEV : process.env.MONGO_URI_9SIDOR_PROD;

        // Try to connect
        const conn = await mongoose.createConnection(uri, {
            useNewUrlParser: true,
            useFindAndModify: false,
            useCreateIndex: true,
            useUnifiedTopology: true
        });

        global.connections.niosidor = conn;

        console.log(`MongoDB connected: ${conn.host}`);
    } catch (error) {
        console.error(error)
    }
}