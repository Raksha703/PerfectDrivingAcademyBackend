import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {Video} from "../models/video.model.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import fs from "fs";

console.log("in user controller backend")

const uploadVideo = asyncHandler(async(req, res) => {

    console.log(req.body)

    //take data from frontend
    const { candidate, description } = req.body;

    //validation
    if(!candidate.trim()){
        throw new ApiError(400, 'Candidate is required');
    }

    //video
    const videoLocalPath = req.files?.video?.[0]?.path;
    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    // Upload to Cloudinary
    const uploadedVideo = await uploadOnCloudinary(videoLocalPath, "video"); // specify 'video' as resource type if needed

    if (!uploadedVideo?.secure_url) {
        throw new ApiError(500, "Video upload to Cloudinary failed");
    }

    //create user
    const createdVideo = await Video.create({
        candidate,
        description,
        video: uploadedVideo.secure_url
    })

    if (!createdVideo) {
        throw new ApiError(500, "Something went wrong while uploading video")
    }

    return res.status(201).json(
        new ApiResponse(200, createdVideo, "Video uploaded Successfully")
    )

})

const getAllVideos = asyncHandler(async(req, res) => {

    const videos = await Video.find()

    if (!videos) {
        throw new ApiError(500, "Something went wrong while getting all videos")
    }

    return res.status(201).json(
        new ApiResponse(200, videos, "Got all the videos Successfully")
    )

})

const deleteVideo = asyncHandler( async (req, res) => {
    
    const video = await Video.deleteOne({ _id: req.params.videoId  });
    
    if (!video) {
        throw new ApiError(500, `User with id: ${req.params.videoId } not found. No video deleted.`);
    }

    return res.status(201).json(
        new ApiResponse(200, "Video deleted Successfully")
    )

});

const upadteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { candidate, description } = req.body;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(500, `Video with id: ${videoId} not found. No video updated.`);
  }

  // Update candidate name if provided
  if (candidate) {
    video.candidate = candidate;
  }

  if (description) {
    video.description = description;
  }

  if (req.files && req.files.video && req.files.video.length > 0) {

    //video
    const newvideoLocalPath = req.files.video[0].path;
    if (!newvideoLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    // Upload to Cloudinary
    const uploadedVideo = await uploadOnCloudinary(newvideoLocalPath, "video"); // specify 'video' as resource type if needed

    if (!uploadedVideo?.secure_url) {
        throw new ApiError(500, "Video upload to Cloudinary failed");
    }

    // Update with new path
    video.video = uploadedVideo.secure_url;
  }

  await video.save();

  return res.status(200).json(
    new ApiResponse(200, "Video updated successfully")
  );
});


export {uploadVideo, getAllVideos, deleteVideo, upadteVideo};