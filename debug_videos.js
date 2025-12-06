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

const checkVideos = async () => {
    await connectDB();
    console.log("URI Loaded:", !!process.env.MONGODB_URI);
    console.log("Collection:", Video.collection.name);
    const videos = await Video.find({}).select("title isPublished owner");
    console.log(`Found ${videos.length} videos.`);
    videos.forEach(v => console.log(`ID: ${v._id}, Title: ${v.title}, Published: ${v.isPublished}, Owner: ${v.owner}`));
    process.exit(0);
}

checkVideos();
