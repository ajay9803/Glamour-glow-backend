const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    const theError = new Error("No token provided.");
    theError.statusCode = 401;
    throw theError;
  }
  const token = req.get("Authorization").split(" ")[1];

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, "rino9803");

    if (!decodedToken) {
      const error = new Error("Not authorized.");
      error.statusCode = 401;
      throw error;
    } else {
      req.userId = decodedToken.userId;
      req.status = decodedToken.status;
      next();
    }
  } catch (e) {
    e.statusCode = 500;
    throw e;
  }
};
