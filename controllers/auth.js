const User = require("../models/user");
const userValidationSchema = require("../validators/user_validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const nodemailer = require("nodemailer");
const user = require("../models/user");
require("dotenv").config(".env");
const userEmail = process.env.USER_EMAIL;
const userEmailPass = process.env.USER_EMAIL_PASS;
const jwtTokenSecret = process.env.JWT_TOKEN_SECRET;

exports.signUp = async (req, res, next) => {
  try {
    // Check if a file is provided
    if (!req.file) {
      const error = new Error("No file found.");
      error.statusCode = 422;
      throw error;
    }

    // Validate user data
    const { error } = userValidationSchema.validate({
      ...req.body,
      profileImage: path.basename(req.file.filename),
    });

    if (error) {
      // Send only the first validation error message
      const theError = new Error(
        error.details[0].message || "User validation failed."
      );
      theError.statusCode = 422;
      throw theError;
    }

    // Check if the email already exists
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const theError = new Error("Email already exists.");
      theError.statusCode = 409;
      throw theError;
    }

    // Hash the password
    const hashedPass = await bcrypt.hash(req.body.password, 12);
    if (!hashedPass) {
      const error = new Error("Error while hashing password.");
      error.statusCode = 500;
      throw error;
    }

    // Create and save the new user
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      status: req.body.status,
      password: hashedPass,
      profileImage: path.basename(req.file.filename),
    });

    const createdUser = await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        email: createdUser.email,
        userId: createdUser._id.toString(),
        status: createdUser.status,
      },
      jwtTokenSecret,
      {
        // expiresIn: "1h",
      }
    );

    res.status(201).json({
      message: "User created successfully.",
      user: createdUser,
      token: token,
    });
  } catch (e) {
    // Set status code if not defined and send error response
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    res.status(e.statusCode).json({
      message: e.message,
    });
    next(e);
  }
};


exports.login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      const theError = new Error("User couldn't be found.");
      theError.statusCode = 404;
      throw theError;
    }
    const isEqual = await bcrypt.compare(req.body.password, user.password);
    if (!isEqual) {
      const theError = new Error("Please enter the correct password.");
      theError.statusCode = 401;
      throw theError;
    } else {
      const token = await jwt.sign(
        {
          email: user.email,
          userId: user._id.toString(),
          status: user.status,
        },
        jwtTokenSecret,
        {
          // expiresIn: "1h",
        }
      );
      res
        .status(200)
        .json({ message: "User login successful.", user: user, token: token });
    }
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.initiateResetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }

    const resetToken = await jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
        status: user.status,
      },
      jwtTokenSecret,
      {
        expiresIn: "5m",
      }
    );

    await sendResetEmail(email, resetToken);

    res.status(200).json({ message: "Reset email sent successfully." });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.resetPassword = async (req, res, next) => {
  console.log(req.body);
  try {
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const { newPassword } = req.body;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully." });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

const sendResetEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    auth: {
      user: userEmail,
      pass: userEmailPass,
    },
  });
  const resetLink = `http://localhost:3000/reset-password?token=${token}`;

  const mailOptions = {
    from: {
      name: "Elegant Essentials",
      email: userEmail,
    },
    to: email,
    subject: "Password Reset",
    html: `<p>Hello User,</p><p>To reset your password, click on the following link: <a href="${resetLink}">${resetLink}</a></p><p>From Elegant Essentials</p>`,
  };

  return transporter.sendMail(mailOptions);
};
