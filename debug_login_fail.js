import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { User } from "./src/models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the same env file the server (likely) uses
dotenv.config({ path: path.join(__dirname, '.env') });

const debugConnection = async () => {
    console.log("--- DEBUG START ---");
    console.log("Process ENV URI:", process.env.MONGODB_URI);
    
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // 1. Count All Users
        const count = await User.countDocuments();
        console.log(`Total Users in DB: ${count}`);

        // 2. Find specific admin
        const targetEmail = "admin@arena.com";
        const user = await User.findOne({ email: targetEmail });

        if (user) {
            console.log("✅ User Found!");
            console.log("ID:", user._id);
            console.log("Email:", `"${user.email}"`);
            console.log("Email Char Codes:", [...user.email].map(c => c.charCodeAt(0)));
        } else {
            console.log("❌ User NOT Found via findOne({ email: ... })");
            
            // 3. Dump all users to see what's actually there
            const allUsers = await User.find().select("email username");
            console.log("--- Dumping All User Emails ---");
            allUsers.forEach(u => {
                console.log(`- "${u.email}" (Username: ${u.username})`);
            });
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
    console.log("--- DEBUG END ---");
};

debugConnection();
