const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const publicEnquirySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Prospect name is required',
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Prospect name is required'
  }),
  email: Joi.string().trim().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'string.empty': 'Prospect email is required',
    'any.required': 'Prospect email is required'
  }),
  phone: Joi.string().trim().min(7).max(20).required().messages({
    'string.empty': 'Phone number is required',
    'string.min': 'Phone number must be at least 7 digits',
    'any.required': 'Phone number is required'
  }),
  courseInterest: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Course interest is required',
    'any.required': 'Course interest is required'
  }),
  message: Joi.string().trim().max(1000).allow('', null).optional(),
  source: Joi.string()
    .valid('online_form', 'counselor_link', 'direct_call', 'referral', 'other')
    .default('online_form')
});

const leadIdParamSchema = Joi.object({
  id: Joi.string().regex(objectIdPattern).required().messages({
    'string.pattern.base': 'Invalid Lead ID format. Must be a 24-character hexadecimal ObjectId',
    'any.required': 'Lead ID is required'
  })
});

const getLeadsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  courseInterest: Joi.string().trim().optional(),
  search: Joi.string().trim().optional()
});

module.exports = {
  publicEnquirySchema,
  leadIdParamSchema,
  getLeadsQuerySchema
};
