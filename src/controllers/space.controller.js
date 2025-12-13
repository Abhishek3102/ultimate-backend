import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Space } from "../models/space.model.js";

const createSpace = asyncHandler(async (req, res) => {
    const { name, isPublic } = req.body;
    
    // Create new space
    const space = await Space.create({
        name: name || "Untitled Space",
        owner: req.user._id,
        isPublic: isPublic !== undefined ? isPublic : true,
        members: [req.user._id],
        canvasState: []
    });

    return res
        .status(201)
        .json(new ApiResponse(201, space, "Space created successfully"));
});

const getSpaceById = asyncHandler(async (req, res) => {
    const { spaceId } = req.params;
    
    // In demo, we might use UUID from client, but Mongoose usually uses ObjectId.
    // For now we'll support both standard search (if UUID string) or _id.
    // However, our model defines _id as ObjectId by default if not specified.
    // BUT our task is to support the new feature seamlessly.
    // The previous frontend mock generated a UUID.
    // For persistent storage, we will rely on Mongoose _id.
    
    const space = await Space.findById(spaceId).populate("owner", "username avatar");

    if (!space) {
        throw new ApiError(404, "Space not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, space, "Space fetched successfully"));
});

const updateSpaceState = asyncHandler(async (req, res) => {
    const { spaceId } = req.params;
    const { nodes, backgroundUrl, connections } = req.body;

    console.log(`[UPDATE SPACE] ID: ${spaceId}`);
    console.log(`[UPDATE SPACE] Payload:`, { 
        nodesCount: nodes?.length, 
        connectionsCount: connections?.length, 
        hasBg: !!backgroundUrl 
    });

    const space = await Space.findById(spaceId);

    if (!space) {
        throw new ApiError(404, "Space not found");
    }

    // Only owner or member can update (simplified for now)
    if (nodes) space.canvasState = nodes;
    if (connections) space.connections = connections;
    if (backgroundUrl !== undefined) space.backgroundUrl = backgroundUrl;

    try {
        await space.save();
    } catch (error) {
        console.error(`[UPDATE SPACE ERROR] SpaceId: ${spaceId}`, error);
        throw error;
    }

    return res
        .status(200)
        .json(new ApiResponse(200, space, "Space updated successfully"));
});

const getUserSpaces = asyncHandler(async (req, res) => {
    const spaces = await Space.find({ 
        $or: [
            { owner: req.user._id },
            { members: req.user._id },
            { isPublic: true } // For demo, show all public spaces too
        ] 
    }).sort("-createdAt");

    return res
        .status(200)
        .json(new ApiResponse(200, spaces, "User spaces fetched successfully"));
});

export {
    createSpace,
    getSpaceById,
    updateSpaceState,
    getUserSpaces
};
