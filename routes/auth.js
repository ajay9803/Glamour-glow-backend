const express = require("express");
const authController = require("../controllers/auth");
const fileUploader = require("../middlewares/file_upload");

const router = express.Router();

router.post(
  "/signup",
  fileUploader.single("profileImage"),
  authController.signUp
);
router.post("/login", authController.login);

module.exports = router;
