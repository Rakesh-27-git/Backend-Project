import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const channelSubscribers = await Subscription.find({ channel: channelId });
  const totalSubscribers = channelSubscribers.length;

  const channelVideos = await Video.find({ owner: channelId });
  const totalVideos = channelVideos.length;

  const videoIds = channelVideos.map((video) => video._id);
  const totalViews = await Like.countDocuments({ video: { $in: videoIds } });

  return res.status(200).json(
    new ApiResponse(200, "Channel stats retrieved successfully", {
      totalSubscribers,
      totalVideos,
      totalViews,
    })
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const channelVideos = await Video.find({ owner: channelId });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Channel videos retrieved successfully",
        channelVideos
      )
    );
});

export { getChannelStats, getChannelVideos };
