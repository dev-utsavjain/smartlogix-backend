const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const SECRET = "mysecretkey";

exports.signupUser = async ({ name, email, password }) => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    return { success: false, message: "User already exists" };
  }

  const user_id = uuidv4();
  const token = uuidv4();
  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = new User({
    id: user_id,
    name,
    email,
    password: hashedPassword,
    isActive: true,
    token: token,
  });

  await newUser.save();

  return { message: "User registered successfully" };
};

exports.loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    return { success: false, message: "User not found, DO Signup first" };
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return { message: "Invalid password" };
  }

  const token = jwt.sign({
    id: user.id,
    name: user.name,
    email: user.email
  }, SECRET, { expiresIn: "1h" });

  const refreshtoken = jwt.sign(
    {
      id: user.id
    }, SECRET, {
    expiresIn: "24h"
  }
  );

  return {
    message: "Login successful",
    token,
    refreshtoken,
  };
};
