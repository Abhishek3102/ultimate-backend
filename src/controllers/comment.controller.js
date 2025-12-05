import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const isValidObjectId = mongoose.isValidObjectId;

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await Comment.find({ video: videoId })
    .populate("owner", "fullName avatar username")
    .sort({ createdAt: -1})
    .skip(skip)
    .limit(parseInt(limit));

    const totalComments = await Comment.countDocuments({ video: videoId});

    return res.status(200).json(
        new ApiResponse(200, {
            totalComments,
            page : parseInt(page),
            limit : parseInt(limit),
            comments,
        }, "Comments fetched successfully")
    );
});

const getTweetComments = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {page = 1, limit = 10} = req.query;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await Comment.find({ tweet: tweetId })
    .populate("owner", "fullName avatar username")
    .sort({ createdAt: -1})
    .skip(skip)
    .limit(parseInt(limit));

    const totalComments = await Comment.countDocuments({ tweet: tweetId});

    return res.status(200).json(
        new ApiResponse(200, {
            totalComments,
            page : parseInt(page),
            limit : parseInt(limit),
            comments,
        }, "Tweet comments fetched successfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
    // Add comment to video
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID");
    }

    const userId = req.user._id;
    const { content } = req.body;

    if(!content?.trim()){
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    });

    return res.status(201).json(
        new ApiResponse(201, comment, "Comment created successfully")
    )
})

const addTweetComment = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Tweet ID");
    }

    const userId = req.user._id;
    const { content } = req.body;

    if(!content?.trim()){
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.create({
        content,
        tweet: tweetId,
        owner: userId
    });

    return res.status(201).json(
        new ApiResponse(201, comment, "Comment added to tweet successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const userId = req.user._id;
    const { content } = req.body;
    const {videoId} = req.params;
    const { commentId } = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID");
    }

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid User ID");
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment ID");
    }

    try {
        const comment = await Comment.findById(commentId);
    
      if (!comment) {
        throw new ApiError(404, "Comment not found");
      }
    
        if(!content || typeof content != "string" || content.trim() === ""){
            throw new ApiError(400, "Comment content is required and must be a non-empty string");
        }
    
        if (comment.user.toString() !== userId.toString()) {
            throw new ApiError(404, "You are not authorized to update this comment");
        }
    
        comment.comment_content = content;
        await comment.save();
    
        return res.status(200).json(
            new ApiResponse(200, null, "Comment updated successfully")
        );
    } catch (error) {
        throw new ApiError(500, "Error while updating comment");
    }
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const userId = req.user._id;
    const { content } = req.body;
    const {videoId} = req.params;
    const { commentId } = req.params;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment ID");
    }
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid User ID");
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID");
    }

    try {
        const comment = await Comment.findById(commentId);
    
      if (!comment) {
        throw new ApiError(404, "Comment not found");
      }
    
      if (comment.user.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment");
      }
    
      await comment.deleteOne();
    
      return res.status(200).json(
        new ApiResponse(200, null, "Comment deleted successfully")
      );
    } catch (error) {
        throw new ApiError(500, "Error deleting comment");
    }

})

export {
    getVideoComments, 
    getTweetComments,
    addComment, 
    addTweetComment,
    updateComment,
    deleteComment
    }
