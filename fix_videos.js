import mongoose from "mongoose";
import { Video } from "./src/models/video.model.js";
import dotenv from "dotenv";

dotenv.config({
    path: './.env'
});

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/videotube`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}

const fixVideos = async () => {
    await connectDB();
    const result = await Video.updateMany({}, { $set: { isPublished: true } });
    console.log(`Updated ${result.modifiedCount} videos to isPublished: true`);
    process.exit(0);
}

fixVideos();
