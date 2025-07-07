import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {Course} from "../models/course.model.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import fs from "fs";

const uploadCourse = asyncHandler(async(req, res) => {
    console.log(req.body)

    //take data from frontend
    let {
       name, description, timing, features, kmPerDay, days, category 
    } = req.body;

    //validation
    if([name, description, timing].some((field) => field?.trim() === "")){
        throw new ApiError(400, 'Name, description, timing, features fields are required');
    }

    //check if user exists
    const existedCourse = await Course.findOne({ name })

    if (existedCourse) {
        throw new ApiError(409, "Course with same name already exists")
    }


    // Convert features to array if it's a comma-separated string
    let featureArray = [];
    
    if (Array.isArray(features)) {
      featureArray = features;
    } else if (typeof features === "string") {
      featureArray = features.split(",").map(f => f.trim()).filter(f => f);
    } else {
      throw new ApiError(400, "Features must be a string or an array");
    }

    //create course
    const course = await Course.create({
        category: category,
        name, 
        description, 
        timing, 
        features: featureArray, 
        kmPerDay, 
        days, 
    })

    if (!course) {
        throw new ApiError(500, "Something went wrong while uploading course")
    }

    return res.status(201).json(
        new ApiResponse(200, course, "Course uploaded Successfully")
    )

})

const getAllCourses = asyncHandler(async(req, res) => {
    const category = req.params.category;
    const courses = await Course.find({category})

    if (!courses) {
        throw new ApiError(500, "Something went wrong while getting all courses")
    }

    return res.status(201).json(
        new ApiResponse(200, courses, "Got all the courses Successfully")
    )

})

const deleteCourse = asyncHandler( async (req, res) => {
    
    const course = await Course.deleteOne({ _id: req.params.courseId  });
    
    if (!course) {
        throw new ApiError(500, `Course with id: ${req.params.courseId } not found. No course deleted.`);
    }

    return res.status(201).json(
        new ApiResponse(200, "Course deleted Successfully")
    )

});

const upadteCourse = asyncHandler(async (req, res) => {
  let { name, description, timing, features, kmPerDay, days, category } = req.body;

  const courseId = req.params.courseId;

  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(500, `Course with id: ${courseId} not found. No course updated.`);
  }

  // Update candidate name if provided
  if (name) {
    course.name = name;
  }
  if (description) {
    course.description = description;
  }
  if (timing) {
    course.timing = timing;
  }
  if (features) {
    course.features = features;
  }
  if (kmPerDay) {
    course.kmPerDay = kmPerDay;
  }
  if (days) {
    course.days = days;
  }

  await course.save();

  return res.status(200).json(
    new ApiResponse(200, "Video updated successfully")
  );
});

export {uploadCourse, getAllCourses, deleteCourse, upadteCourse};