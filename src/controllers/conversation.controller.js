import { Conversation } from "../models/conversation.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getUserConversations = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    console.log("Fetching conversations for user:", userId);

    const conversations = await Conversation.find({
        participants: { $in: [userId] }
    })
    .populate("participants", "fullName username avatar email")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

    console.log("Found conversations count:", conversations.length);

    return res.status(200).json(
        new ApiResponse(200, conversations, "Conversations fetched successfully")
    );
});

export {
    getUserConversations
}
