/*
import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}*/


import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// ✅ GET all videos with search, sort, pagination, and optional filtering by userId
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", userId } = req.query;

  const filter = {
    isPublished: true,
    title: { $regex: query, $options: "i" }, // case-insensitive search
  };

  if (userId && isValidObjectId(userId)) {
    filter.owner = userId;
  }

  const sortOptions = {
    [sortBy]: sortType === "asc" ? 1 : -1,
  };

  const videos = await Video.find(filter)
    .populate("owner", "username avatar")
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Video.countDocuments(filter);

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
    owner: req.user._id,
  });

  return res.status(201).json(
    new ApiResponse(201, createdVideo, "Video published successfully")
  );
});

// ✅ GET a single video by ID
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId).populate("owner", "username avatar");

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res.status(200).json(
    new ApiResponse(200, video, "Video fetched successfully")
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
