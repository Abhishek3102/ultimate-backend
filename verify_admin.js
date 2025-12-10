import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { User } from "./src/models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const verifyLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB for Login Check");

        const admin = await User.findOne({ username: "arena_admin" });
        if (!admin) {
            console.log("User 'arena_admin' not found!");
            process.exit(1);
        }

        console.log("Found User:", admin.username);
        
        const isMatch = await admin.isPasswordCorrect("password123");
        console.log("Password 'password123' match:", isMatch);

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
};

verifyLogin();
