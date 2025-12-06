import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "./src/constants.js";

dotenv.config({
    path: './.env'
});

const debugConnect = async () => {
    try {
        console.log("Expected DB Name from constants:", DB_NAME);
        const uri = `${process.env.MONGODB_URI}/${DB_NAME}`;
        console.log("Connecting to:", uri.replace(/:([^:@]{1,})@/, ":****@")); // Mask password
        
        const connectionInstance = await mongoose.connect(uri);
        console.log("Connected!");
        console.log("Mongoose Connection Name:", connectionInstance.connection.name);
        console.log("Mongoose Connection Host:", connectionInstance.connection.host);
        
        // List Collections
        const collections = await connectionInstance.connection.db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

        // Count Users
        const userCount = await connectionInstance.connection.db.collection("users").countDocuments();
        console.log("User Count in this DB:", userCount);
        
        // Find badalpandey via raw driver to bypass schema
        const badal = await connectionInstance.connection.db.collection("users").findOne({ username: "badalpandey" });
        console.log("Direct Search for 'badalpandey':", badal ? `FOUND (${badal._id})` : "NOT FOUND");

        if (badal) {
             const videos = await connectionInstance.connection.db.collection("videos").find({ owner: badal._id }).toArray();
             console.log(`Videos for badalpandey (${videos.length}):`);
             videos.forEach(v => console.log(` - Title: ${v.title}, Published: ${v.isPublished} (${typeof v.isPublished})`));
        }

    } catch (error) {
        console.log("Error:", error);
    }
    process.exit(0);
}

debugConnect();
