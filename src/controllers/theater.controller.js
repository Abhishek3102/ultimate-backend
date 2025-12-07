import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Theater } from "../models/theater.model.js";
import { Video } from "../models/video.model.js";
import { v4 as uuidv4 } from 'uuid';

const createTheater = asyncHandler(async (req, res) => {
    const { videoId } = req.body;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Generate a short room ID (using uuid for uniqueness, could be shortened)
    const roomId = uuidv4().slice(0, 8); 

    const theater = await Theater.create({
        roomId,
        host: req.user._id,
        video: videoId,
        participants: [req.user._id]
    });

    return res.status(201).json(
        new ApiResponse(201, theater, "Watch party created successfully")
    );
});

const getTheater = asyncHandler(async (req, res) => {
    const { roomId } = req.params;

    const theater = await Theater.findOne({ roomId })
        .populate("host", "username fullName avatar")
        .populate("video") // Populate video details so frontend can play it
        .populate("participants", "username fullName avatar");

    if (!theater) {
        throw new ApiError(404, "Watch party not found");
    }

    return res.status(200).json(
        new ApiResponse(200, theater, "Watch party details fetched successfully")
    );
});

export {
    createTheater,
    getTheater
};
