import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Video } from "../models/video.model.js";

const getNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // 1. Follow Requests (Pending Subscriptions)
    const followRequests = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId),
                status: "pending" // Only show pending requests
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
                pipeline: [
                    { $project: { username: 1, fullName: 1, avatar: 1 } }
                ]
            }
        },
        { $unwind: "$subscriberDetails" },
        // Check if I am also following them (for "Follow Back" logic)
        {
            $lookup: {
                from: "subscriptions",
                let: { subscriberId: "$subscriber" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$subscriber", new mongoose.Types.ObjectId(userId)] },
                                    { $eq: ["$channel", "$$subscriberId"] }
                                ]
                            }
                        }
                    }
                ],
                as: "isFollowing"
            }
        },
        {
            $addFields: {
                type: "FOLLOW_REQUEST",
                isFollowingBack: { $gt: [{ $size: "$isFollowing" }, 0] }
            }
        },
        {
            $project: {
                _id: 1,
                type: 1,
                subscriber: "$subscriberDetails",
                createdAt: 1,
                isFollowingBack: 1,
                status: 1
            }
        }
    ]);

    // 2. Recent Likes
    // We need to find likes on OUR videos/tweets/comments
    // Strategy: Find all content IDs owned by us, then find likes on them.
    // Optimization: This can be heavy. We'll limit to last 20 likes.

    // A. Find my Video IDs
    const myVideos = await Video.find({ owner: userId }).select("_id").lean();
    const myVideoIds = myVideos.map(v => v._id);

    // B. Find my Tweet IDs
    const myTweets = await Tweet.find({ owner: userId }).select("_id").lean();
    const myTweetIds = myTweets.map(t => t._id);

    const likes = await Like.aggregate([
        {
            $match: {
                $or: [
                    { video: { $in: myVideoIds } },
                    { tweet: { $in: myTweetIds } }
                ],
                likedBy: { $ne: new mongoose.Types.ObjectId(userId) }
            }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 20 },
        {
            $lookup: {
                from: "users",
                localField: "likedBy",
                foreignField: "_id",
                as: "user",
                pipeline: [{ $project: { username: 1, avatar: 1 } }]
            }
        },
        { $unwind: "$user" },
        // Lookup Video Details for Thumbnail
        {
             $lookup: {
                 from: "videos",
                 localField: "video",
                 foreignField: "_id",
                 as: "videoDetails",
                 pipeline: [{ $project: { thumbnail: 1 } }]
             }
        },
         {
             $unwind: {
                 path: "$videoDetails",
                 preserveNullAndEmptyArrays: true
             }
         },
        {
            $addFields: {
                type: "LIKE"
            }
        },
        {
            $project: {
                _id: 1,
                type: 1,
                user: 1,
                createdAt: 1,
                video: 1,
                tweet: 1,
                videoDetails: 1 // Include the thumbnail
            }
        }
    ]);

    // 3. Recent Comments
    const comments = await Comment.aggregate([
        {
            $match: {
                $or: [
                    { video: { $in: myVideoIds } },
                    { tweet: { $in: myTweetIds } }
                ],
                owner: { $ne: new mongoose.Types.ObjectId(userId) }
            }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 20 },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "user",
                pipeline: [{ $project: { username: 1, avatar: 1 } }]
            }
        },
        { $unwind: "$user" },
         // Lookup Video Details for Thumbnail
         {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [{ $project: { thumbnail: 1 } }]
            }
       },
        {
            $unwind: {
                path: "$videoDetails",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                type: "COMMENT"
            }
        },
        {
            $project: {
                _id: 1,
                type: 1,
                user: 1,
                content: 1,
                createdAt: 1,
                video: 1,
                tweet: 1,
                videoDetails: 1 // Include thumbnail
            }
        }
    ]);

    // Merge and Sort
    const allNotifications = [...followRequests, ...likes, ...comments].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json(
        new ApiResponse(200, allNotifications, "Notifications fetched successfully")
    );
});

export { getNotifications };
