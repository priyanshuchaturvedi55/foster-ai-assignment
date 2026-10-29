const leadService = require('../services/lead.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Public Lead Enquiry Submission (Zero-auth)
 */
const createPublicEnquiry = asyncHandler(async (req, res) => {
  const newLead = await leadService.createPublicEnquiry(req.body);
  return ApiResponse.success(
    res,
    201,
    'Enquiry submitted successfully. A counselor will reach out shortly.',
    newLead
  );
});

/**
 * Fetch all unclaimed public leads (Authenticated Counselors)
 */
const getUnclaimedLeads = asyncHandler(async (req, res) => {
  const { leads, meta } = await leadService.getUnclaimedLeads(req.query);
  return ApiResponse.success(
    res,
    200,
    'Unclaimed public leads fetched successfully',
    leads,
    meta
  );
});

/**
 * Claim an unclaimed lead (Atomic Concurrency-safe)
 */
const claimLead = asyncHandler(async (req, res) => {
  const leadId = req.params.id;
  const counselorId = req.user._id;

  const claimedLead = await leadService.claimLead(leadId, counselorId);

  return ApiResponse.success(
    res,
    200,
    'Lead claimed successfully and moved to your private leads list',
    claimedLead
  );
});

/**
 * Fetch leads claimed by current counselor
 */
const getMyClaimedLeads = asyncHandler(async (req, res) => {
  const counselorId = req.user._id;
  const { leads, meta } = await leadService.getMyClaimedLeads(counselorId, req.query);

  return ApiResponse.success(
    res,
    200,
    'Your claimed leads fetched successfully',
    leads,
    meta
  );
});

/**
 * Fetch a single lead by ID
 */
const getLeadById = asyncHandler(async (req, res) => {
  const leadId = req.params.id;
  const counselorId = req.user._id;
  const userRole = req.user.role;

  const lead = await leadService.getLeadById(leadId, counselorId, userRole);

  return ApiResponse.success(
    res,
    200,
    'Lead details fetched successfully',
    lead
  );
});

module.exports = {
  createPublicEnquiry,
  getUnclaimedLeads,
  claimLead,
  getMyClaimedLeads,
  getLeadById
};
