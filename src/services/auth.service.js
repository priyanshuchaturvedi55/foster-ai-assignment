const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');

class AuthService {
  async register({ name, email, password, role }) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, 'An employee account with this email address already exists.');
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'counselor'
    });

    const token = user.generateAuthToken();

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    };
  }

  async login({ email, password }) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new ApiError(401, 'Invalid email or password credentials.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password credentials.');
    }

    const token = user.generateAuthToken();

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    };
  }

  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User profile not found.');
    }
    return user;
  }
}

module.exports = new AuthService();

