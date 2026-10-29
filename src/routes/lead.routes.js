const { Router } = require('express');
const leadController = require('../controllers/lead.controller');
const validate = require('../middlewares/validate.middleware');
const {
  publicEnquirySchema,
  leadIdParamSchema,
  getLeadsQuerySchema
} = require('../validations/lead.validation');
const { authenticate } = require('../middlewares/auth.middleware');
const { publicEnquiryLimiter } = require('../middlewares/rateLimiter.middleware');

const router = Router();

/**
 * @route   POST /api/v1/leads/public-enquiry
 * @desc    Public endpoint for prospective students to submit enquiry (Zero-auth)
 * @access  Public
 */
router.post(
  '/public-enquiry',
  publicEnquiryLimiter,
  validate(publicEnquirySchema, 'body'),
  leadController.createPublicEnquiry
);

/**
 * @route   GET /api/v1/leads/unclaimed
 * @desc    Fetch all unclaimed/public enquiries in the CRM pool
 * @access  Private (Counselor only)
 */
router.get(
  '/unclaimed',
  authenticate,
  validate(getLeadsQuerySchema, 'query'),
  leadController.getUnclaimedLeads
);

/**
 * @route   GET /api/v1/leads/claimed
 * @desc    Fetch enquiries claimed by the logged-in counselor (Private queue)
 * @access  Private (Counselor only)
 */
router.get(
  '/claimed',
  authenticate,
  validate(getLeadsQuerySchema, 'query'),
  leadController.getMyClaimedLeads
);

/**
 * @route   PATCH /api/v1/leads/:id/claim
 * @desc    Claim an unclaimed lead atomically
 * @access  Private (Counselor only)
 */
router.patch(
  '/:id/claim',
  authenticate,
  validate(leadIdParamSchema, 'params'),
  leadController.claimLead
);

/**
 * @route   GET /api/v1/leads/:id
 * @desc    Get detailed lead by ID (enforcing counselor privacy)
 * @access  Private (Counselor only)
 */
router.get(
  '/:id',
  authenticate,
  validate(leadIdParamSchema, 'params'),
  leadController.getLeadById
);

module.exports = router;
