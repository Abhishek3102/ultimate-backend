import mongoose, {isValidObjectId} from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";

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

export {
    getConversationMessages
};
