import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    // user.accessToken = accessToken
    await user.save({ validateBeforeSave: false });
    console.log("access_token:",accessToken);
    return { accessToken, refreshToken };
  } catch (err) {
    console.log("errror:", err);
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token."
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  // validation - not empty
  // check if user already exists:username,email
  // check for images,check for avatars
  // upload them to cloudinary
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullName, email, username, password } = req.body;
  console.log(req.body);
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existedUser = await User.findOne({
    $or: [{ username: `${username}` }, { email: `${email}` }],
  });

  if (existedUser) {
    console.log(existedUser);
    throw new ApiError(409, "User with email or username already exists");
  }
  //   console.log("hello");
  console.log(req.files);
  //   console.log("yellow");
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath =  req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  //   const avatar = "h"
  //   const coverImage = "h"

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required.", avatar);
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  console.log("user created", user);
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  console.log(createdUser);
  if (!createdUser) {
    throw new ApiError(505, "something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered successfully"));
});

// login user function
// req body ->data
// username or email
// find the user
// password check
// access and refresh token
// send cookies
const loginUser = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { email, password, username } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user doesn't exists");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password entered.");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "user logged in Successfully"
      )
    );
});

// logout function
// clear cookies
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken= asyncHandler(async(req,res)=>{
 const incomingrefreshToken= req.cookies.refreshToken||req.body.refreshToken;

 if(!incomingrefreshToken){
  throw new ApiError(401,"unauthorized request")
 }
 try {
  const decodedToken = jwt.verify(incomingrefreshToken,process.env.REFRESH_TOKEN_SECRET);
 
  const user = await User.findById(decodedToken?._id);
  if(!user){
   throw new ApiError(401,"Invalid refresh token")
  }
  if(incomingrefreshToken===user?.refreshToken){
   throw new ApiError(401,"Refresh Token is expired or used.");
  }
 
  const options = {
   httpOnly:true,
   secure:true
  }
 
  const {accessToken,newrefreshToken}=await generateAccessAndRefreshTokens(user._id)
  return res.status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",newrefreshToken,options)
  .json(
   new ApiResponse(200,
     {accessToken,newrefreshToken},
     "Access token refreshed successfully")
  )
 } catch (error) {
  console.log("error in try:",error.message);
  throw new ApiError(401,"Invalid refresh Token");
 }
})


const changeCurrentPassword = asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword} = req.body;
  const user = await User.findById(req.user?._id)
  const PasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if(!PasswordCorrect){
    throw new ApiError(400,"Invalid password entered")
  }

  user.password = newPassword;
  const a = await user.save({validateBeforeSave:false});
  return res
  .status(200)
  .json(new ApiResponse(200,"Password has been changed successfully."))


})

const getCurrentUser = asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(200,req.user,"current user fetched successfully")
})

const UpdateAccountDetails = asyncHandler(async(req,res)=>{
  const {fullName,email}= req.body;
  if(!fullName||!email){
    throw new ApiError(400,"All Field are required")
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
        fullName:fullName,
        email:email
      }
    },{
      new:true
    }
    ).select("-password");
  return res.status(200)
  .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
  // get the new avtar file from the frontend using multer 
  // save it on cloud
  // find user
  // replace cloud url with new one
 const newAvatarFile =  req.file?.path;
 if(!newAvatarFile){
  throw new ApiError(401,"Avatar file is required for path")
 }
 const newCloudinary = await uploadOnCloudinary(newAvatarFile);
 if(!newCloudinary.url){
  throw new ApiError(402,"Error while uploading on avatar")
 }

 const user=await User.findByIdAndUpdate(req.user?._id,{
  $set:{
    avatar:newCloudinary.url
  }
 },{new:true}).select("-password");

 return res.status(200)
 .json(new ApiResponse(200,"avtar file changed successfully."))
})

const updateUserCoverImage= asyncHandler(async(req,res)=>{
  // get the new avtar file from the frontend using multer 
  // save it on cloud
  // find user
  // replace cloud url with new one
 const newcoverImage =  req.file?.path;
 if(!newcoverImage){
  throw new ApiError(401,"cover Image is required for path")
 }
 const newCloudinary = await uploadOnCloudinary(newcoverImage);
 if(!newCloudinary.url){
  throw new ApiError(402,user,"Error while uploading on avatar")
 }

 const user=await User.findByIdAndUpdate(req.user?._id,{
  $set:{
    coverImage:newCloudinary.url
  }
 },{new:true}).select("-password");

 return res.status(200)
 .json(new ApiResponse(200,user,"cover Image file changed successfully."))
})
export { registerUser, loginUser, logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,UpdateAccountDetails,updateUserAvatar ,updateUserCoverImage};
