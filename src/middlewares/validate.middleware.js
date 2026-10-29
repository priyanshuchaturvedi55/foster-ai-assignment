const ApiError = require('../utils/ApiError');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, '')
      }));

      return next(new ApiError(400, 'Validation Error', errorDetails));
    }

    // Assign sanitized and validated values back to the request object
    req[source] = value;
    next();
  };
};

module.exports = validate;

