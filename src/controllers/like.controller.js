import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID");
    }

    const userId = req.user._id;

    const alreadyLiked = await Like.findOne({
        liked : videoId,
        user : userId,
    });

    if(alreadyLiked) {
        await alreadyLiked.deleteOne();
        return res.status(200).json(
            new ApiResponse(200, null, "Like removed successfully")
        );
    }
        await Like.create({
            liked : videoId,
            user : userId,
        });

        return res.status(201).json(
            new ApiResponse(201, null, "Like added to the Video")
        );
    


})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment ID");
    }

    const userId = req.user._id;

    try {
        const alreadyLikedComment = await Like.findOne({
            likedComment : commentId,
            user : userId,
        });
    
        if(alreadyLikedComment){
            await alreadyLikedComment.deleteOne();
            return res.status(200).json(
                new ApiResponse(200, null, "Like removed from comment")
            );
        }
    
        else{
            await Like.create({
                likedComment : commentId,
                user : userId,
            });
    
            return res.status(201).json(
                new ApiResponse(201, null, "Like added to the Comment")
            );
        }
    
    } catch (error) {
        throw new ApiError(500, "Failed to toggle like on comment");
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet ID");
    }

    const userId = req.user._id;

    try {
        const alreadyLikedTweet = await Like.findOneAndDelete({
            likedTweet : tweetId,
            user : userId,
        });

        if(alreadyLikedTweet){
            return res.status(200).json(
                new ApiResponse(200, null, "Liked removed from tweet")
            );
        }
            await Like.create({
                likedTweet : tweetId,
                user : userId,
            });

            return res.status(201).json(
                new ApiResponse(201, null, "Like added to tweet")
            )
        
    } catch (error) {
        throw new ApiError(500, "Error while toggling like on Tweet");
    }
}
);

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id;

    if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

    try {
        const allLikedVideos = await Like.find({user : userId})
        .populate("video", "title description url thumbnail")
        .select("video createdAt");
    
        if (!allLikedVideos.length){
            return res.status(404).json(
                new ApiResponse(404, "No liked videos found")
            );
        }
    
        return res.status(200).json(
            new ApiResponse(200, allLikedVideos, "Liked videos fetched successfully")
        );
    } catch (error) {
       throw new ApiError(500, null, "Error fetching liked videos");
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}