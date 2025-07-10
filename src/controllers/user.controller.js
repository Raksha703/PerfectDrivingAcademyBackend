import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {User} from "../models/user.model.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import {Logsheet} from "../models/logsheet.model.js";
import nodemailer from 'nodemailer';
import randomize from 'randomatic'; 

const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None"
}

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async(req, res) => {

    let {
       username, name, age, address="", contactNumber, vehicleToLearn, termsAccepted, role, email, password, confirmPassword, experience, specialties, license, bio 
    } = req.body;

    if([name, email, username, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, 'All fields are required');
    }
    if(Number(age)<18){
        throw new ApiError(400, "Not eligible to drive")
    }
    const existingContact = await User.findOne({ contactNumber });

    if (existingContact) {
        throw new ApiError(400, 'Already registered with this contact number');
    }
    if (!/^[6-9]\d{9}$/.test(contactNumber.toString())) {
        throw new ApiError(400, 'Invalid contact number');
    }
    if(termsAccepted==="false"){
        throw new ApiError(400, 'Terms and Conditions are required to accept');
    }
    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
        throw new ApiError(400, 'Already registered with this email address');
    }
    if(!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)){
        throw new ApiError(400, 'Invalid email address');
    }
    if(!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{6,}$/)){
        throw new ApiError(400, 'Password must be at least 6 characters long and include uppercase, lowercase, number, and special character.');
    }
    if(password !== confirmPassword){
        throw new ApiError(400, 'Password does not match with confirm Password');
    }
    if(role=="Instructor" && (!experience || !specialties || !license || !bio)){
        throw new ApiError(400, 'Experience, specialties, license, bio fields are required for instructor');
    }
    if(role=="Instructor" && specialties){
        specialties = specialties.split(',').map(s => s.trim());
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    let avatarUrl = undefined;
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    if (avatarLocalPath) {
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if (!avatar?.url) {
            throw new ApiError(400, "Avatar upload failed");
        }
        avatarUrl = avatar.url;
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
	const hashPassword = await bcrypt.hash(req.body.password, salt);

    //create user
    const user = await User.create({
        name,
        avatar: avatarUrl,
        age, 
        address, 
        contactNumber, 
        vehicleToLearn, 
        role,
        email, 
        password: hashPassword,
        username,
        experience,
        specialties,
        license,
        bio,
        isApproved: process.env.OWNER_EMAIL === email ? true : false
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

const sendEmail = async ({ to, subject, text, html }) => {    

    const sent = await transporter.sendMail({
        from: process.env.MAIL_USER,
        to,
        subject,
        text,
        html,
    });
    
    if (!sent) {
      throw new ApiError(404, "Failed to send message to candidate");
    }

    return new ApiResponse(200, text, "Message sent to candidate successfully")
    
};

const approveUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isApproved = true;
  await user.save();

  await sendEmail({
      to: user.email,
      subject: "Registration Approved",
      text: `Hi ${user.name}, your registration has been approved!`,
      html: `<p>Hi <strong>${user.name}</strong>,</p><p>Your registration has been <strong>approved</strong>.</p><p>Welcome aboard!</p>`
    });

  return res.status(200).json(new ApiResponse(200, "User approved successfully"));
});

const updateUser = asyncHandler(async(req, res)=> {
    const { userId, name, bio, address, contactNumber, license, experience, specialties } = req.body;
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if(name) user.name = name;
    if(bio) user.bio = bio;
    if(address) user.address = address;
    if(contactNumber) user.contactNumber = contactNumber;
    if(license) user.license = license;
    if(experience) user.experience = experience;
    if(specialties) user.specialties = specialties;

    await user.save();
    
    if (!user) {
        throw new ApiError(404, "User does not got updated")
    }

    return res.status(200).json(new ApiResponse(200, user, "User updated successfully"));

})

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, password} = req.body

    if (!email) {
        throw new ApiError(400, "email is required")
    }

    const user = await User.findOne({email})

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    if(!user.isApproved){
        throw new ApiError(404, "User is still pending for the registration")
    }

   const isPasswordValid = bcrypt.compare(
		password,
		user.password
	);

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const auth = asyncHandler(async (req, res) => {

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new ApiError(401, "Invalid user");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, user, "User authorized")
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid auth");
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const getAllCandidates = asyncHandler(async(req, res) => {

	const users = await User.find({ role: "Candidate" })

    if (!users) {
        throw new ApiError(500, "Something went wrong while getting all users")
    }

    return res.status(201).json(
        new ApiResponse(200, users, "Got all the users Successfully")
    )

})

const getAllInstructors = asyncHandler(async(req, res) => {

	const users = await User.find({ role: "Instructor" })

    if (!users) {
        throw new ApiError(500, "Something went wrong while getting all users")
    }

    return res.status(201).json(
        new ApiResponse(200, users, "Got all the users Successfully")
    )

})

const deleteUser = asyncHandler( async (req, res) => {
    const user = await User.findById(req.params.userId);

    if (!user) {
        throw new ApiError(500, `User with id: ${req.params.userId} not found. No users were deleted.`);
    }
    
    const logsheetdleted = await Logsheet.deleteMany({ username: user.username });
    const userdleteed = await User.deleteOne({ _id: req.params.userId  });

    return res.status(200).json(
        new ApiResponse(200, "User and associated logsheets deleted Successfully")
    )

});

const getLogsheet = asyncHandler(async(req, res) => {
    const userId = req.params.userId;

	const user = await User.findOne({ _id: userId })

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const logsheetIds = user.logsheet || [];

    const logsheets = await Logsheet.find({ _id: { $in: logsheetIds } });

    if (!logsheets) {
        throw new ApiError(500, "Something went wrong while getting logsheet")
    }

    return res.status(201).json(
        new ApiResponse(200, logsheets, "Got all the logsheet successfully")
    )

})

const uploadLogsheet = asyncHandler( async (req, res) => {
  
    const { userId } = req.params;
    const { date, kmCovered, learning, timingFrom, timingTo } = req.body;

    const user = await User.findById(userId);
    if (!user){
        throw new ApiError(500, "User not found")
    } 
    
    const newLogsheet = new Logsheet({
      username: user.username, 
      date,
      kmCovered,
      learning,
      timingFrom,
      timingTo,
    });

    await newLogsheet.save();

    user.logsheet.push(newLogsheet._id);
    await user.save();

    if (!newLogsheet) {
        throw new ApiError(500, "Something went wrong while uploading logsheet")
    }

    return res.status(201).json(
        new ApiResponse(200, newLogsheet, "Logsheet added successfully")
    )
    
});

const updateLogsheet = asyncHandler(async (req, res) => {
  const { userId, logId } = req.params;
  const { date, kmCovered, learning, timingFrom, timingTo } = req.body;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if the user actually owns this logsheet
  if (!user.logsheet.includes(logId)) {
    throw new ApiError(403, "This logsheet does not belong to the user");
  }

  // Update the logsheet
  const logsheet = await Logsheet.findById(logId);
  if (!logsheet) {
    throw new ApiError(404, "Logsheet not found");
  }

  if (date) logsheet.date = date;
  if (kmCovered !== undefined) logsheet.kmCovered = kmCovered;
  if (learning !== undefined) logsheet.learning = learning;
  if (timingFrom) logsheet.timingFrom = timingFrom;
  if (timingTo) logsheet.timingTo = timingTo;

  await logsheet.save();

  res.status(200).json(
    new ApiResponse(200, logsheet, "Logsheet updated successfully")
  );
});

const deleteLogsheet = asyncHandler( async (req, res) => {
  
    const { userId, logId } = req.params;

    const logsheet = await Logsheet.deleteOne({ _id : logId });
    if (!logsheet){
        throw new ApiError(500, "Logsheet not found")
    } 

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { logsheet: logId } },
      { new: true }
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return res.status(201).json(
        new ApiResponse(200, logsheet, "Logsheet deleted successfully")
    )
    
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});
  
const sendOtp = asyncHandler( async (req, res) => {
    const { email } = req.body;
    const otp = randomize('0', 6);
    
    const mailOptions = {
      from: process.env.AUTH_EMAIL, 
      to: email,
      subject: 'OTP for Registration',
      text: `Hey\nYour OTP for Registration at Perfect Car Drivng Academy is ${otp}. \n\nRegards,\nMahesh Vishwakarma\nPerfect Car riving Training Academy,\nDhamnod`,
    };

    const sent = await transporter.sendMail(mailOptions);
      
    if (!sent) {
      throw new ApiError(404, "Otp not sent");
    }

    return res.status(201).json(
        new ApiResponse(200, otp, "Otp sent successfully")
    )
})

const sendMsg = asyncHandler(async (req, res) => {
    const { subject, email, msg } = req.body;

    if (!subject || !email || !msg) {
        throw new ApiError(400, "All fields (subject, email, message) are required");
    }

    const plainText = `Message from ${name || "Anonymous"} (${email}):\n\n${msg}`;
    const htmlContent = `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name || "Not provided"}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${msg}</p>
    `;

    const mailOptions = {
        from: email,
        to: process.env.AUTH_EMAIL,
        subject: subject,
        text: plainText,
        html: htmlContent
    };

    try {
        const sent = await transporter.sendMail(mailOptions);

        if (!sent) {
            throw new ApiError(500, "Message not sent");
        }

        return res.status(200).json(
            new ApiResponse(200, "Message sent successfully", null)
        );
    } catch (error) {
        throw new ApiError(500, "Internal Server Error while sending email");
    }
});

const markEligible = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isCertificateEligible = true;
  await user.save();

  await sendEmail({
      to: user.email,
      subject: "Eligible for Cetificate",
      text: `Hi ${user.name}, \nYou are now eligible to apply for the certificate. Visit the site or fill the form using the link https://forms.gle/AcFePXAn2uu9gBy99 to get the certificate. \n\nRegards,\nMahesh Vishwakarma\nPerfect Car riving Training Academy,\nDhamnod`
    });

  return res.status(200).json(new ApiResponse(200, "User approved for certification successfully"));
});

export {markEligible, updateUser, approveUser, sendMsg, sendOtp, registerUser, loginUser, logoutUser, auth, refreshAccessToken, getAllCandidates, getAllInstructors, deleteUser, getLogsheet, uploadLogsheet, updateLogsheet, deleteLogsheet};