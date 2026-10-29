class ApiResponse {
  constructor(statusCode, message = 'Success', data = null, meta = null) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    if (data !== null) {
      this.data = data;
    }
    if (meta !== null) {
      this.meta = meta;
    }
  }

  static success(res, statusCode, message, data, meta) {
    return res.status(statusCode).json(new ApiResponse(statusCode, message, data, meta));
  }
}

module.exports = ApiResponse;
