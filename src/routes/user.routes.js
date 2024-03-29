import {Router} from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {registerUser,loginUser,logoutUser,refreshAccessToken} from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middlewares.js"

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// secured routes;
router.route("/logout").post(verifyJWT,logoutUser);


export default router;
