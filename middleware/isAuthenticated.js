const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const token = req.headers.authorization.replace("Bearer ", "");

    const getUser = await User.findOne({ token: token }).select("-salt -hash");

    if (!getUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = getUser;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
