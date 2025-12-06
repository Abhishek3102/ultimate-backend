import mongoose from "mongoose";
import { Video } from "./src/models/video.model.js";
import { User } from "./src/models/user.model.js";
import { Subscription } from "./src/models/subscription.model.js";
import dotenv from "dotenv";

dotenv.config({
    path: './.env'
});

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/chai-backend`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}

const dumpData = async () => {
    await connectDB();
    
    console.log("--- USERS ---");
    const users = await User.find({});
    const userMap = {};
    users.forEach(u => {
        userMap[u._id.toString()] = u.username;
        console.log(`ID: ${u._id}, Username: ${u.username}, FullName: ${u.fullName}`);
    });

    console.log("\n--- VIDEOS ---");
    const videos = await Video.find({});
    videos.forEach(v => {
        const ownerName = userMap[v.owner.toString()] || "UNKNOWN";
        console.log(`ID: ${v._id}, Title: ${v.title}, Published: ${v.isPublished}, Owner: ${ownerName} (${v.owner})`);
    });

    console.log("\n--- SUBSCRIPTIONS ---");
    const subs = await Subscription.find({});
    subs.forEach(s => {
        const subName = userMap[s.subscriber?.toString()] || "UNKNOWN";
        const channelName = userMap[s.channel?.toString()] || "UNKNOWN";
        console.log(`Sub: ${subName} -> Channel: ${channelName}, Status: ${s.status}`);
    });

    process.exit(0);
}

dumpData();
