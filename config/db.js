const mongoose = require("mongoose");

exports.connectDB = async () => {
    try {        
        console.log(process.env.MONGO_URI_9SIDOR)
        // Try to connect
        const conn = await mongoose.createConnection(process.env.MONGO_URI_9SIDOR, {
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