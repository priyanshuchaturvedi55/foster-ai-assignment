const Lead = require('../models/lead.model');
const ApiError = require('../utils/ApiError');

class LeadService {
  /**
   * Create a prospective student lead from the public enquiry form (Zero-auth)
   */
  async createPublicEnquiry(leadData) {
    const lead = await Lead.create({
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
      courseInterest: leadData.courseInterest,
      message: leadData.message || '',
      source: leadData.source || 'online_form',
      isClaimed: false,
      claimedBy: null,
      claimedAt: null,
      status: 'UNCLAIMED'
    });

    return lead;
  }

  /**
   * Fetch all public/unclaimed leads with pagination and filtering
   */
  async getUnclaimedLeads({ page = 1, limit = 10, courseInterest, search }) {
    const query = { isClaimed: false };

    if (courseInterest) {
      query.courseInterest = { $regex: courseInterest, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [leads, totalLeads] = await Promise.all([
      Lead.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalLeads / limit) || 1;

    return {
      leads,
      meta: {
        totalLeads,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * ATOMIC CONCURRENCY-SAFE LEAD CLAIMING
   * Uses findOneAndUpdate with { _id, isClaimed: false } to guarantee that only
   * one counselor can claim an enquiry even under high concurrent load.
   */
  async claimLead(leadId, counselorId) {
    const updatedLead = await Lead.findOneAndUpdate(
      {
        _id: leadId,
        isClaimed: false
      },
      {
        $set: {
          isClaimed: true,
          claimedBy: counselorId,
          claimedAt: new Date(),
          status: 'CLAIMED'
        }
      },
      {
        returnDocument: 'after',
        runValidators: true
      }
    ).populate('claimedBy', 'name email role');

    if (!updatedLead) {
      // Determine if the lead was missing entirely or already claimed
      const existingLead = await Lead.findById(leadId).populate('claimedBy', 'name email');
      if (!existingLead) {
        throw new ApiError(404, `Lead not found with id: ${leadId}`);
      }
      
      const claimedByName = existingLead.claimedBy ? existingLead.claimedBy.name : 'another counselor';
      throw new ApiError(
        409,
        `Conflict: This lead has already been claimed by ${claimedByName}. It is no longer publicly available.`
      );
    }

    return updatedLead;
  }

  /**
   * Fetch leads claimed by the logged-in counselor (Private queue)
   */
  async getMyClaimedLeads(counselorId, { page = 1, limit = 10, courseInterest, search }) {
    const query = {
      isClaimed: true,
      claimedBy: counselorId
    };

    if (courseInterest) {
      query.courseInterest = { $regex: courseInterest, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [leads, totalLeads] = await Promise.all([
      Lead.find(query)
        .populate('claimedBy', 'name email')
        .sort({ claimedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalLeads / limit) || 1;

    return {
      leads,
      meta: {
        totalLeads,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Fetch single lead with privacy enforcement
   */
  async getLeadById(leadId, counselorId, userRole = 'counselor') {
    const lead = await Lead.findById(leadId).populate('claimedBy', 'name email');
    if (!lead) {
      throw new ApiError(404, `Lead not found with id: ${leadId}`);
    }

    // Privacy rule: If claimed by another counselor, regular counselors cannot access it
    if (
      lead.isClaimed &&
      lead.claimedBy &&
      lead.claimedBy._id.toString() !== counselorId.toString() &&
      userRole !== 'admin'
    ) {
      throw new ApiError(
        403,
        'Access Denied: This lead is private and has been claimed by another counselor.'
      );
    }

    return lead;
  }
}

module.exports = new LeadService();
