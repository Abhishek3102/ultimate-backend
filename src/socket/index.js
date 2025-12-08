import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import { Conversation } from "../models/conversation.model.js";
import { Pulse } from "../models/pulse.model.js";
import { generateEmbedding, calculateSimilarity } from "../utils/gemini.js";

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
        // --- Cinema / Watch Party Events ---
        socket.on("cinema:join", ({ roomId }) => {
            socket.join(roomId);
            console.log(`User ${socket.user.username} (ID: ${socket.user._id}) joined theater room: ${roomId}`);
            // Notify others
            socket.to(roomId).emit("cinema:user-joined", { userId: socket.user._id, username: socket.user.username });
        });

        socket.on("cinema:action", ({ type, currentTime, roomId }) => {
            // Broadcast to everyone ELSE in the room (syncing them to sender)
            socket.to(roomId).emit("cinema:action", { type, currentTime, senderId: socket.user._id });
        });

        // Chat
        socket.on("cinema:message", ({ roomId, text }) => {
            io.to(roomId).emit("cinema:message", {
                sender: { _id: socket.user._id, username: socket.user.username, avatar: socket.user.avatar },
                text,
                createdAt: new Date()
            });
        });

        // Heartbeat (Host sends this periodically)
        socket.on("cinema:heartbeat", ({ roomId, currentTime, isPlaying }) => {
            socket.to(roomId).emit("cinema:heartbeat", { 
                hostId: socket.user._id, 
                currentTime, 
                isPlaying 
            });
        });

        socket.on("cinema:request_sync", ({ roomId }) => {
            // New user asks "What's the current time?"
            // Broadcast to everyone (or just host) to send back state
            socket.to(roomId).emit("cinema:request_sync", { requesterId: socket.user._id });
        });

        socket.on("cinema:sync_state", ({ roomId, currentTime, isPlaying, requesterId }) => {
            // Host (or someone) replies to specific requester
            io.to(requesterId).emit("cinema:sync_state", { currentTime, isPlaying });
        });


        // --- Voice Chat / WebRTC Events ---
        socket.on("voice:join", ({ roomId }) => {
            // Notify others in room that I joined voice
            // They will initiate offers to me
            socket.to(roomId).emit("voice:user-connected", { userId: socket.user._id });
        });

        socket.on("voice:offer", ({ to, offer }) => {
            io.to(to).emit("voice:offer", { from: socket.user._id, offer });
        });

        socket.on("voice:answer", ({ to, answer }) => {
            io.to(to).emit("voice:answer", { from: socket.user._id, answer });
        });

        socket.on("voice:ice-candidate", ({ to, candidate }) => {
            io.to(to).emit("voice:ice-candidate", { from: socket.user._id, candidate });
        });

        // --- MindMeld Events ---
        socket.on("pulse:submit", async ({ content }) => {
            try {
                console.log(`Pulse received from ${socket.user.username}: ${content}`);
                
                // 1. Generate Vector
                const embedding = await generateEmbedding(content);
                
                // 2. Save Pulse
                const newPulse = await Pulse.create({
                    content,
                    embedding,
                    userId: socket.user._id,
                    status: "pending"
                });

                // 3. The Dragnet: Find recent pending pulses (last 10 mins)
                const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
                const pendingPulses = await Pulse.find({
                    status: "pending",
                    userId: { $ne: socket.user._id },
                    createdAt: { $gte: tenMinsAgo }
                }).populate("userId", "username");

                // 4. Similarity Check
                let bestMatch = null;
                let maxSim = -1;

                for (const otherPulse of pendingPulses) {
                    const similarity = calculateSimilarity(embedding, otherPulse.embedding);
                    // Threshold: 0.70
                    if (similarity > 0.70 && similarity > maxSim) {
                        maxSim = similarity;
                        bestMatch = otherPulse;
                    }
                }

                if (bestMatch) {
                    // MATCH FOUND!
                    console.log(`MindMeld Match Found! Sim: ${maxSim}`);
                    
                    // Update Status
                    newPulse.status = "matched";
                    newPulse.matchedWith = bestMatch.userId._id;
                    await newPulse.save();

                    bestMatch.status = "matched";
                    bestMatch.matchedWith = socket.user._id;
                    await bestMatch.save();

                    // Room ID
                    const roomId = `meld_${newPulse._id}_${bestMatch._id}`;

                    // Emit to THIS user
                    socket.join(roomId);
                    socket.emit("mindmeld:found", { 
                        roomId, 
                        matchedContent: bestMatch.content,
                        similarity: maxSim 
                    });

                    // Emit to OTHER user
                    const otherUserId = bestMatch.userId._id.toString();
                    io.in(otherUserId).socketsJoin(roomId); 
                    
                    io.to(otherUserId).emit("mindmeld:found", {
                        roomId,
                        matchedContent: newPulse.content,
                        similarity: maxSim
                    });

                } else {
                    socket.emit("pulse:saved", { message: "Pulse sent to the universe..." });
                }

            } catch (error) {
                console.error("Pulse Error:", error);
                socket.emit("error", { message: "Failed to process pulse" });
            }
        });

        socket.on("mindmeld:message", ({ roomId, text }) => {
            io.to(roomId).emit("mindmeld:message", {
                senderId: socket.user._id,
                text,
                createdAt: new Date()
            });
        });

        socket.on("mindmeld:reveal", ({ roomId }) => {
            io.to(roomId).emit("mindmeld:reveal", {
                user: {
                    _id: socket.user._id,
                    username: socket.user.username,
                    avatar: socket.user.avatar
                }
            });
        });

        socket.on("mindmeld:leave", ({ roomId }) => {
             socket.to(roomId).emit("mindmeld:left");
             socket.leave(roomId);
        });
    });

    return io;
};

export { initializeSocket };
