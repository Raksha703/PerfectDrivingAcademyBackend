import {Router} from "express";
const router = Router();
import { getUserLogsheet, uploadLogsheet, updateLogsheet, deleteLogsheet } from "../controllers/logsheet.controller.js";

router.route("/upload/:userId").post(
    uploadLogsheet
)

router.route("/edit/:userId").post(
    updateLogsheet
)

router.route("/delete/:userId").post(
    deleteLogsheet
)

router.route("/user/:userId").post(
    getUserLogsheet
)

export default router;