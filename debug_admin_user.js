import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { User } from "./src/models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const checkAdminUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // Check for username 'arena_admin'
        const byUsername = await User.findOne({ username: "arena_admin" });
        console.log("User found by username 'arena_admin':", byUsername ? { 
            id: byUsername._id, 
            username: byUsername.username, 
            email: byUsername.email,
            role: byUsername.role 
        } : "NOT FOUND");

        // Check for email 'admin@arena.com'
        const byEmail = await User.findOne({ email: "admin@arena.com" });
        console.log("User found by email 'admin@arena.com':", byEmail ? { 
            id: byEmail._id, 
            username: byEmail.username, 
            email: byEmail.email,
            role: byEmail.role
        } : "NOT FOUND");

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
};

checkAdminUser();
