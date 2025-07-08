import {Router} from "express";
import { uploadVideo, deleteVideo, getAllVideos, upadteVideo } from "../controllers/video.controller.js";
import {upload} from "../middlewares/multer.middleware.js";

const router = Router()

router.route("/upload").post(
    upload.fields([
        {
            name: "video",
            maxCount:1
        }
    ]),
    uploadVideo
)

router.route("/all").get(
    getAllVideos
)

router.route("/delete/:videoId").delete(
    deleteVideo
)

router.route("/update/:videoId").put(
    upload.fields([
        {
            name: "video",
            maxCount:1
        }
    ]),
    upadteVideo
)

export default router;