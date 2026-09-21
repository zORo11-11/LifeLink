const OrganNotification = require('../models/OrganNotification');

/**
 * GET /api/organ/notifications
 * Get notifications for the authenticated hospital.
 */
exports.getNotifications = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { unreadOnly, page = 1, limit = 50 } = req.query;

    const filter = { hospitalId };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await OrganNotification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const unreadCount = await OrganNotification.countDocuments({ hospitalId, isRead: false });

    return res.status(200).json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/organ/notifications/:id/read
 * Mark a single notification as read.
 */
exports.markAsRead = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { id } = req.params;

    const notif = await OrganNotification.findOneAndUpdate(
      { _id: id, hospitalId },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    const unreadCount = await OrganNotification.countDocuments({ hospitalId, isRead: false });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: notif,
      unreadCount
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/organ/notifications/mark-all-read
 * Mark all unread notifications for the hospital as read.
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const hospitalId = req.user.id;

    await OrganNotification.updateMany(
      { hospitalId, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      unreadCount: 0
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
