import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import { Conversation } from "../models/conversation.model.js";

const initializeSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            credentials: true
        }
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
            
            if (!token) {
                return next(new Error("Unauthorized"));
            }

            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decodedToken?._id).select("-password");

            if (!user) {
                return next(new Error("User not found"));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error("Authentication failed"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.user.username}`);
        
        // Join a room with their own user ID to receive direct messages
        const roomName = socket.user._id.toString();
        socket.join(roomName);
        console.log(`User ${socket.user.username} joined room: ${roomName}`);

        socket.on("join_conversation", ({ receiverId }) => {
            // Optional: User might want to join a specific conversation room
            // But addressing by UserID is often simpler for 1-on-1
        });

        socket.on("send_message", async ({ receiverId, content }) => {
            try {
                // 1. Find or create conversation
                let conversation = await Conversation.findOne({
                    participants: { $all: [socket.user._id, receiverId] }
                });

                if (!conversation) {
                    conversation = await Conversation.create({
                        participants: [socket.user._id, receiverId]
                    });
                }

                // 2. Save message
                const newMessage = await Message.create({
                    sender: socket.user._id,
                    conversation: conversation._id,
                    content
                });

                // Update last message in conversation
                conversation.lastMessage = newMessage._id;
                await conversation.save();

                // Populate sender details for frontend convenience
                await newMessage.populate("sender", "username avatar fullName");

                // 3. Emit to receiver
                console.log(`Emitting message to receiver: ${receiverId}`);
                io.to(receiverId).emit("receive_message", newMessage);
                
                // 4. Emit back to sender (confirm sent)
                socket.emit("message_sent", newMessage);

            } catch (error) {
                console.error("Socket message error:", error);
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.user.username);
        });
    });

    return io;
};

export { initializeSocket };
