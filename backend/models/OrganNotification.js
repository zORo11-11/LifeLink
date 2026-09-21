const mongoose = require('mongoose');

const organNotificationSchema = new mongoose.Schema(
  {
    // Target hospital for this notification
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Target hospital reference is required'],
      index: true
    },

    // Associated entity references
    allocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrganAllocation',
      default: null
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrganRecipient',
      default: null
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrganDonor',
      default: null
    },

    // Notification Type
    type: {
      type: String,
      enum: [
        'OFFER_RECEIVED',
        'OFFER_ACCEPTED',
        'OFFER_DECLINED',
        'OFFER_EXPIRED',
        'TRANSPORT_STARTED',
        'ALLOCATION_COMPLETED'
      ],
      required: [true, 'Notification type is required']
    },

    // Message Body
    message: {
      type: String,
      required: [true, 'Notification message is required']
    },

    // Read State
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

organNotificationSchema.index({ hospitalId: 1, isRead: 1 });

module.exports = mongoose.models.OrganNotification || mongoose.model('OrganNotification', organNotificationSchema);
