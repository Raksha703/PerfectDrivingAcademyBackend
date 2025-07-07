import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
/*
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))*/

app.use(cors())

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended : true, limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes

import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import courseRouter from "./routes/course.routes.js";

//routes declaration
// https:localhost:  8000/api/v1/users/register
console.log("in app.js backend")

app.use("/api/user", userRouter)
app.use("/api/video", videoRouter)
app.use("/api/course", courseRouter);

export {app }
