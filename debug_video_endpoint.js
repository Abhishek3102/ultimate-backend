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
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/videotube`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}

const simulateGetAllVideos = async () => {
    await connectDB();

    const count = await User.countDocuments();
    const allUsers = await User.find({});
    console.log(`Connection Open. Count: ${count}`);
    allUsers.forEach(u => console.log(` - ${u.username}`)); // List them
    
    // Use exact names now that we know them (mostly)
    const badal = await User.findOne({ username: "badalpandey" });
    const wittug = await User.findOne({ username: "vittug" }); // Try 'vittug'

    if (!badal || !wittug) {
        console.log("Users not found");
        process.exit(1);
    }

    console.log("Channel (Badal):", badal._id);
    console.log("Subscriber (Wittug):", wittug._id);

    // Context from request
    const req = {
        user: wittug,
        query: {
            userId: badal._id.toString(), // As passes in query string
            query: "",
            page: 1,
            limit: 10
        }
    };

    console.log("--- Simulating Logic ---");

    const { userId, query } = req.query;
    const matchStage = {
        title: { $regex: query, $options: "i" }
    };

    let isOwner = false;
    
    // Privacy Check Logic (Copied from Controller)
    if (userId && mongoose.isValidObjectId(userId)) {
        const user = await User.findById(userId);
        if (user) {
             console.log("Target user found:", user.username, "Private:", user.isPrivate);
             
             if (req.user && req.user._id.toString() === userId.toString()) {
                  isOwner = true;
             }
             console.log("Is Owner:", isOwner);

             if (user.isPrivate && !isOwner) {
                 // Check Sub
                 console.log("User is private, checking subscription...");
                 const subscriberID = new mongoose.Types.ObjectId(req.user?._id);
                 const channelID = new mongoose.Types.ObjectId(userId);
                 
                 console.log("Checking Sub with:", {
                     subscriber: subscriberID,
                     channel: channelID
                 });

                 const isSubscribed = await Subscription.findOne({
                     subscriber: subscriberID,
                     channel: channelID,
                     status: "accepted"
                 });
                 
                 console.log("Is Subscribed Result:", !!isSubscribed);
                 if (!isSubscribed) {
                     console.log("Access Denied: Not Subscribed");
                     process.exit(0);
                 }
             }
             matchStage.owner = new mongoose.Types.ObjectId(userId);
        }
    }

    if (!isOwner) {
        matchStage.isPublished = true;
    }

    console.log("Match Stage:", matchStage);

    // Aggregation Logic
    const videos = await Video.aggregate([
        { $match: matchStage },
        { 
            $project: { title: 1, isPublished: 1, owner: 1 }
        }
    ]);

    console.log("Videos Found:", videos.length);
    videos.forEach(v => console.log(`- ${v.title} (Published: ${v.isPublished})`));

    process.exit(0);
}

simulateGetAllVideos();
