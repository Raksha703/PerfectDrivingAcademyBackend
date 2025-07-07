import {Router} from "express";
import { uploadCourse, getAllCourses, deleteCourse, upadteCourse } from "../controllers/course.controller.js";
const router = Router()

router.route("/upload").post(
    uploadCourse
)

router.route("/all/:category").get(
    getAllCourses
)

router.route("/delete/:courseId").delete(
    deleteCourse
)

router.route("/update/:courseId").put(
    upadteCourse
)

export default router;