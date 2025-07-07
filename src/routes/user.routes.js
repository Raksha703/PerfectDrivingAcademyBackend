import {Router} from "express";
import { sendMsg, updateUser, sendOtp, registerUser, loginUser, logoutUser, auth, refreshAccessToken, getAllCandidates, getAllInstructors, deleteUser, getLogsheet, uploadLogsheet, updateLogsheet, deleteLogsheet, approveUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

console.log("in user route backend")

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(
    loginUser
)

router.route("/logout").post(
    verifyJWT,
    logoutUser
)

router.route("/auth").get(
    verifyJWT,
    auth
)

router.route("/update").put(
    updateUser
)

router.route("refresh-token").post(
    refreshAccessToken
)

router.route("/allCandidates").get(
    getAllCandidates
)

router.route("/allInstructors").get(
    getAllInstructors
)

router.route("/delete/:userId").delete(
    deleteUser
)

router.route("/logsheet/:userId").get(
    getLogsheet
)

router.route("/logsheet/upload/:userId").post(
    uploadLogsheet
)

router.route("/logsheet/update/:userId/:logId").put(
    updateLogsheet
)

router.route("/logsheet/delete/:userId/:logId").delete(
    deleteLogsheet
)

router.route("/sendOtp").post(
    sendOtp
)

router.route("/sendMsg").post(
    sendMsg
)

router.route("/approveUser/:userId").patch(
    approveUser
)

export default router;