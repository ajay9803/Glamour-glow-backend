const express = require("express");
const authController = require("../controllers/auth");
const fileUploader = require("../middlewares/file_upload");
const isAuth = require("../middlewares/is_auth");

const router = express.Router();

router.post(
  "/signup",
  fileUploader.single("profileImage"),
  authController.signUp
);
router.post("/login", authController.login);
router.post("/initiate-reset-password", authController.initiateResetPassword);
router.put("/reset-password", isAuth, authController.resetPassword);

module.exports = router;
