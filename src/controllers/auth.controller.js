const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return ApiResponse.success(res, 201, 'Employee registered successfully', result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return ApiResponse.success(res, 200, 'Employee logged in successfully', result);
});

const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, 200, 'Counselor profile fetched successfully', {
    user: req.user
  });
});

module.exports = {
  register,
  login,
  getMe
};
