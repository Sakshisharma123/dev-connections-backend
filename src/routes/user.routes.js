const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getAllUsers,
  getCurrentUser,
  updateCurrentUser,
  updateUserAvatar,
} = require("../controllers/user.controller");
const upload = require("../middlewares/multer.middleware");
const verifyJwt = require("../middlewares/auth.middleware");
const router = express.Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/reset-password").post(changeCurrentPassword);
router.route("/feed").get(getAllUsers);
router.route("/details/:id").get(getCurrentUser).put(updateCurrentUser);
router.route("/avatar").patch(verifyJwt, upload.single("avatar"), updateUserAvatar)

module.exports = router;
