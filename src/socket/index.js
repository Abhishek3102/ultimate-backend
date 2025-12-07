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

    io.on("connection", async (socket) => {
        console.log(`User connected: ${socket.user.username}`);
        
        // Mark user as online
        await User.findByIdAndUpdate(socket.user._id, { isOnline: true });
        socket.broadcast.emit("user_status_change", { userId: socket.user._id, isOnline: true });
        
        // Join a room with their own user ID to receive direct messages
        const roomName = socket.user._id.toString();
        socket.join(roomName);
        console.log(`User ${socket.user.username} joined room: ${roomName}`);

        socket.on("join_conversation", ({ receiverId }) => {
            // Optional
        });

        socket.on("send_message", async ({ receiverId, content, audioUrl }) => {
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
                    content: content || "", // Allow empty if audioUrl
                    audioUrl: audioUrl || undefined
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
        
        socket.on("mark_read", async ({ messageIds, otherUserId }) => {
            try {
               if(!messageIds || !messageIds.length) return;
               
               const readAt = new Date();
               
               await Message.updateMany(
                   { 
                       _id: { $in: messageIds },
                       "readBy.user": { $ne: socket.user._id }
                   },
                   { 
                       $push: { 
                           readBy: { 
                               user: socket.user._id, 
                               readAt: readAt 
                           } 
                       } 
                   }
               );
               
               // Notify the sender that I have read their messages
               io.to(otherUserId).emit("messages_read", { 
                   messageIds, 
                   readBy: socket.user._id,
                   readAt: readAt
               });
               
            } catch (error) {
                console.error("Mark read error", error);
            }
        });

        socket.on("disconnect", async () => {
            console.log("User disconnected:", socket.user.username);
            await User.findByIdAndUpdate(socket.user._id, { 
                isOnline: false, 
                lastActive: new Date() 
            });
            socket.broadcast.emit("user_status_change", { userId: socket.user._id, isOnline: false, lastActive: new Date() });
        });
    });

    return io;
};

export { initializeSocket };
