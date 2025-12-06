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

const debugSetup = async () => {
    await connectDB();
    
    // Find users
    // Find users by partial match or username
    const users = await User.find({});
    console.log(`Total users found: ${users.length}`); 
    users.forEach(u => console.log(`User: ${u.username} (${u.fullName}) ID: ${u._id}`));

    const badal = users.find(u => u.username.toLowerCase().includes("bad")); // Loose match
    if (!badal) {
        console.log("Badal NOT FOUND via 'bad' search");
        process.exit(1);
    }
    console.log(`Found Badal: ${badal.username} (${badal._id})`);

    console.log("Checking Subscribers...");
    const subs = await mongoose.model("Subscription").find({ channel: badal._id });
    console.log(`Found ${subs.length} subscriptions.`);
    
    for (const s of subs) {
        console.log(`Subscription: ${s._id}, SubscriberID: ${s.subscriber}, Status: ${s.status}`);
        const subscriber = await User.findById(s.subscriber);
        if (subscriber) {
             console.log(` -> User: ${subscriber.username} (IsPrivate: ${subscriber.isPrivate})`);
        } else {
             console.log(` -> User NOT FOUND! Orphaned subscription?`);
        }
    }

    // Check Videos again
    const videos = await Video.find({ owner: badal._id });
    console.log(`Badal Videos: ${videos.length}`);
    videos.forEach(v => console.log(` - ${v.title} (Published: ${v.isPublished})`));

    process.exit(0);
}

debugSetup();
