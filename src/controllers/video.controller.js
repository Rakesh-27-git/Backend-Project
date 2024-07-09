import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

import { v2 as cloudinary } from "cloudinary";

const generateCloudinaryPublicId = (url) => {
  const urlParts = url.split("/");
  return urlParts[urlParts.length - 1].split(".")[0];
};

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  const filter = {};

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid user id");
    }

    filter.owner = userId;
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (query) {
      filter.$or = [
        { title: new RegExp(query, "i") },
        { description: new RegExp(query, "i") },
      ];
    }

    const sortOptions = {
      [sortBy]: sortType === "desc" ? -1 : 1,
    };

    const videos = await Video.find(filter)
      .populate("owner", "username")
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    return res
      .status(200)
      .json(new ApiResponse(200, `Videos retrieved successfully`, videos));
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  const videoFileLocalpath = req.files?.videoFile[0].path;
  const thumbnailLocalpath = req.files?.thumbnail[0].path;

  if (!videoFileLocalpath || !thumbnailLocalpath) {
    throw new ApiError(400, "Video file and thumbnail are required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalpath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalpath);

  console.log("Video file", videoFile);

  if (!videoFile) {
    throw new ApiError(500, "Error uploading video file");
  }
  if (!thumbnail) {
    throw new ApiError(500, "Error uploading thumbnail");
  }

  const duration = videoFile.duration;

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration,
    owner: req.user.id,
  });

  return res
    .status(201)
    .json(new ApiResponse(200, "Video uploaded successfully", video));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId).populate("owner", "username");

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Video retrieved successfully", video));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailLocalpath = req.file?.path;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  if (!thumbnailLocalpath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const newThumbnail = await uploadOnCloudinary(thumbnailLocalpath);

  if (!newThumbnail) {
    throw new ApiError(500, "Error while uploading thumbnail to cloudinary");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.videoFile) {
    try {
      const videoFilePublicId = generateCloudinaryPublicId(video.videoFile);
      await cloudinary.uploader.destroy(videoFilePublicId);
    } catch (error) {
      console.log("Error deleting video file from cloudinary", error);
    }
  }

  if (video.thumbnail) {
    try {
      const thumbnailPublicId = generateCloudinaryPublicId(video.thumbnail);
      await cloudinary.uploader.destroy(thumbnailPublicId);
    } catch (error) {
      console.log("Error deleting thumbnail from cloudinary", error);
    }
  }

  await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: newThumbnail.url,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Video updated successfully", video));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.videoFile) {
    try {
      const videoFilePublicId = generateCloudinaryPublicId(video.videoFile);
      await cloudinary.uploader.destroy(videoFilePublicId);
    } catch (error) {
      console.log("Error deleting video file from cloudinary", error);
    }
  }

  if (video.thumbnail) {
    try {
      const thumbnailPublicId = generateCloudinaryPublicId(video.thumbnail);
      await cloudinary.uploader.destroy(thumbnailPublicId);
    } catch (error) {
      console.log("Error deleting thumbnail from cloudinary", error);
    }
  }

  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Video deleted successfully", null));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: { isPublished: !video.isPublished } },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        `Video ${updatedVideo.isPublished ? "published" : "unpublished"}`
      )
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
