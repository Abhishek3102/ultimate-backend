import mongoose, {isValidObjectId} from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";

import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getConversationMessages = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const conversation = await Conversation.findOne({
        participants: { $all: [req.user._id, userId] }
    });

    if (!conversation) {
        return res.status(200).json(
            new ApiResponse(200, [], "No conversation found")
        );
    }

    const messages = await Message.find({
        conversation: conversation._id
    })
    .sort({ createdAt: 1 })
    .populate("sender", "username avatar fullName");

    return res.status(200).json(
        new ApiResponse(200, messages, "Messages fetched successfully")
    );
});

const uploadMessageAudio = asyncHandler(async (req, res) => {
    const audioLocalPath = req.file?.path;

    if (!audioLocalPath) {
        throw new ApiError(400, "Audio file is required");
    }

    const audio = await uploadOnCloudinary(audioLocalPath);
    
    if (!audio) {
        throw new ApiError(500, "Failed to upload audio");
    }

    return res.status(200).json(
        new ApiResponse(200, { audioUrl: audio.url }, "Audio uploaded successfully")
    );
});

const deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(404, "Message not found");
    }

    if (message.sender.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own messages");
    }

    await Message.findByIdAndDelete(messageId);

    // Notify participants
    const io = req.app.get("io");
    if (io) { // Check if io exists to prevent crash if not set
         // We need to notify the other participant. 
         // The message document doesn't populate conversation fully to get receiver ID easily unless we query conversation.
         // Or simpler: The frontend can emit the delete event?
         // No, secure way is backend.
         // Let's find conversation to get participants.
         const conversation = await Conversation.findById(message.conversation);
         if(conversation){
             conversation.participants.forEach(participantId => {
                 if(participantId.toString() !== req.user._id.toString()){
                     io.to(participantId.toString()).emit("message_deleted", { messageId });
                 }
             });
         }
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Message deleted successfully")
    );
});

export {
    getConversationMessages,
    uploadMessageAudio,
    deleteMessage
};
