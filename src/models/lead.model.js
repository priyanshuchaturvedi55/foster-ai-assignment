const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Prospect name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Prospect email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    courseInterest: {
      type: String,
      required: [true, 'Course interest is required'],
      trim: true
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      default: ''
    },
    source: {
      type: String,
      enum: ['online_form', 'counselor_link', 'direct_call', 'referral', 'other'],
      default: 'online_form'
    },
    isClaimed: {
      type: Boolean,
      default: false,
      index: true
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    claimedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['UNCLAIMED', 'CLAIMED', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'CLOSED'],
      default: 'UNCLAIMED'
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// High performance compound indexes for CRM querying
leadSchema.index({ isClaimed: 1, createdAt: -1 });
leadSchema.index({ claimedBy: 1, claimedAt: -1 });

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
