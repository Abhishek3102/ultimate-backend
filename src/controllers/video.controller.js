

import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// ✅ GET all videos with search, sort, pagination, and optional filtering by userId
// ✅ GET all videos with search, sort, pagination, and optional filtering by userId
// ✅ GET all videos with search, sort, pagination, and optional filtering by userId
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", userId } = req.query;
  
  console.log("getAllVideos called:");
  console.log(" - Query:", req.query);
  console.log(" - User (req.user):", req.user ? req.user._id : "GUEST");

  const matchStage = {
    title: { $regex: query, $options: "i" }, // case-insensitive search
  };

  // Default to published only
  let isOwner = false;

  // Check privacy/ownership if filtering by userId
  if (userId && isValidObjectId(userId)) {
      const user = await User.findById(userId);
      if (user) {
          // Check if requester is owner
          if (req.user && req.user._id.toString() === userId.toString()) {
              isOwner = true;
          }

          if (user.isPrivate && !isOwner) {
              // If private and not owner, check subscription
              if (!req.user) {
                  return res.status(200).json(new ApiResponse(200, { total: 0, page: parseInt(page), limit: parseInt(limit), videos: [] }, "User is private"));
              }

               const isSubscribed = await Subscription.findOne({
                   subscriber: new mongoose.Types.ObjectId(req.user._id),
                   channel: new mongoose.Types.ObjectId(userId),
                   status: "accepted"
               });
               if (!isSubscribed) {
                   return res.status(200).json(new ApiResponse(200, { total: 0, page: parseInt(page), limit: parseInt(limit), videos: [] }, "User is private"));
               }
          }matchStage.owner = new mongoose.Types.ObjectId(userId);
      }
  }

  // If not owner, only show published videos
  if (!isOwner) {
      matchStage.isPublished = true;
  }

  const sortOptions = {
    [sortBy]: sortType === "asc" ? 1 : -1,
  };

  const videos = await Video.aggregate([
    {
      $match: matchStage
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              "avatar": 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "comments",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        commentsCount: {
          $size: "$comments",
        },
        owner: {
          $first: "$ownerDetails",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false
          }
        }
      },
    },
    {
      $project: {
        ownerDetails: 0,
        likes: 0,
        comments: 0
      }
    },
    {
      $sort: sortOptions
    },
    {
      $skip: (parseInt(page) - 1) * parseInt(limit)
    },
    {
      $limit: parseInt(limit)
    }
  ]);

  const total = await Video.countDocuments(matchStage);

  return res.status(200).json(
    new ApiResponse(200, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      videos, 
    }, "Videos fetched successfully")
  );
});

// ✅ POST/publish a new video (with thumbnail & video file upload)
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const thumbnailPath = req.files?.thumbnail?.[0]?.path;
  const videoPath = req.files?.videoFile?.[0]?.path;

  if (!thumbnailPath || !videoPath) {
    throw new ApiError(400, "Thumbnail and Video file are required");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailPath);
  const video = await uploadOnCloudinary(videoPath);

  if (!thumbnail?.url || !video?.url) {
    throw new ApiError(500, "Upload failed");
  }

  const createdVideo = await Video.create({
    title,
    description,
    thumbnail: thumbnail.url,
    videoFile: video.url,
    duration: video.duration, // Cloudinary provides duration
    isPublished: true,
    owner: req.user._id,
  });

  return res.status(201).json(
    new ApiResponse(201, createdVideo, "Video published successfully")
  );
});

// ✅ GET a single video by ID
// ✅ GET a single video by ID
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId)
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              "avatar": 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "comments",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        commentsCount: {
          $size: "$comments",
        },
        owner: {
          $first: "$ownerDetails",
        },
        isLiked: { // Check if current user liked it (if req.user exists)
             $cond: {
                 if: { $in: [req.user?._id, "$likes.likedBy"] },
                 then: true,
                 else: false
             }
        }
      },
    },
    {
      $project: {
        ownerDetails: 0,
        likes: 0,
        comments: 0
      }
    }
  ]);

  if (!video?.length) {
    throw new ApiError(404, "Video not found");
  }

  return res.status(200).json(
    new ApiResponse(200, video[0], "Video fetched successfully")
  );
});

// ✅ PATCH update video details (title, description, thumbnail)
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailPath = req.files?.thumbnail?.[0]?.path;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Only the owner can update
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to update this video");
  }

  if (title) video.title = title;
  if (description) video.description = description;

  if (thumbnailPath) {
    const thumbnail = await uploadOnCloudinary(thumbnailPath);
    if (thumbnail?.url) {
      video.thumbnail = thumbnail.url;
    }
  }

  await video.save();

  return res.status(200).json(
    new ApiResponse(200, video, "Video updated successfully")
  );
});

// ✅ DELETE a video by ID
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to delete this video");
  }

  await video.deleteOne();

  return res.status(200).json(
    new ApiResponse(200, null, "Video deleted successfully")
  );
});

// ✅ PATCH toggle publish/unpublish status
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Toggle status
  video.isPublished = !video.isPublished;
  await video.save();

  return res.status(200).json(
    new ApiResponse(200, video, `Video is now ${video.isPublished ? "Published" : "Unpublished"}`)
  );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
