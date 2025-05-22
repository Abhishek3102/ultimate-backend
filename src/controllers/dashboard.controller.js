/*
import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
})

export {
    getChannelStats, 
    getChannelVideos
    }
*/

import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ✅ Get stats for a channel: total videos, views, likes, subscribers
const getChannelStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Count total videos uploaded by user
  const totalVideos = await Video.countDocuments({ owner: userId });

  // Sum of all video views uploaded by user
  const totalViewsAgg = await Video.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
      },
    },
  ]);

  const totalViews = totalViewsAgg[0]?.totalViews || 0;

  // Count total likes on videos by this user
  const userVideos = await Video.find({ owner: userId }).select("_id");
  const videoIds = userVideos.map((video) => video._id);

  const totalLikes = await Like.countDocuments({
    video: { $in: videoIds },
  });

  // Count total subscribers
  const totalSubscribers = await Subscription.countDocuments({
    channel: userId,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      totalVideos,
      totalViews,
      totalLikes,
      totalSubscribers,
    }, "Channel stats fetched successfully")
  );
});

// ✅ Get all videos uploaded by the current channel/user
const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const videos = await Video.find({ owner: userId })
    .sort({ createdAt: -1 }) // Latest first
    .select("title thumbnail views isPublished createdAt duration");

  return res.status(200).json(
    new ApiResponse(200, videos, "Channel videos fetched successfully")
  );
});

export {
  getChannelStats,
  getChannelVideos
};
