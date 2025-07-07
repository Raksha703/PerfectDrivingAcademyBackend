import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Logsheet} from "../models/logsheet.model.js";

const getUserLogsheet = asyncHandler( async(req, res) => {
    const userId = req.params.userId;

    const logsheet = await Logsheet.find({userId})

    if(!logsheet){
        return new ApiError(500, "Something went wrong while getting all logsheet");
    }

    return res.status(201).json(
        new ApiResponse(200, courses, "Got all the logsheets successfully")
    )
    
})

const uploadLogsheet = asyncHandler( async(req, res) => {
    const userId = req.params.userId;
    
})

const updateLogsheet = asyncHandler( async(req, res) => {
    const userId = req.params.userId;
    
})

const deleteLogsheet = asyncHandler( async(req, res) => {
    const userId = req.params.userId;
    
})

export {
    getUserLogsheet,
    uploadLogsheet,
    updateLogsheet,
    deleteLogsheet
}