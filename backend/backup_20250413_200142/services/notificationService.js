const Notification = require('../models/notificationModel');

/**
 * Save a new notification to the database
 * @param {Object} notification - Notification object
 * @returns {Object} Saved notification
 */
async function saveNotification(notification) {
  try {
    const newNotification = new Notification({
      id: notification.id,
      type: notification.type,
      senderId: notification.senderId,
      senderName: notification.senderName,
      recipientId: notification.recipientId,
      postId: notification.postId,
      commentText: notification.commentText,
      messagePreview: notification.messagePreview,
      timestamp: new Date(notification.timestamp || Date.now()),
      read: notification.read || false
    });
    
    return await newNotification.save();
  } catch (error) {
    console.error('Error saving notification:', error);
    throw error;
  }
}

/**
 * Get all notifications for a specific user
 * @param {String} userId - The user's ID
 * @returns {Array} List of notifications
 */
async function getNotificationsForUser(userId) {
  try {
    return await Notification.find({ recipientId: userId })
      .sort({ timestamp: -1 }) // Most recent first
      .limit(30); // Limit to 30 notifications
  } catch (error) {
    console.error('Error retrieving notifications:', error);
    return [];
  }
}

/**
 * Mark a notification as read
 * @param {String} notificationId - ID of the notification to mark as read
 * @returns {Object} Updated notification
 */
async function markNotificationAsRead(notificationId) {
  try {
    return await Notification.findOneAndUpdate(
      { id: notificationId },
      { read: true },
      { new: true }
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 * @param {String} userId - User ID
 * @returns {Object} Update result
 */
async function markAllNotificationsAsRead(userId) {
  try {
    return await Notification.updateMany(
      { recipientId: userId, read: false },
      { read: true }
    );
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Get all unread notifications for a specific user
 * @param {String} userId - The user's ID
 * @returns {Array} List of unread notifications
 */
async function getUnreadNotifications(userId) {
  try {
    return await Notification.find({ 
      recipientId: userId,
      read: false
    })
    .sort({ timestamp: -1 }) // Most recent first
    .limit(50); // Limit to 50 unread notifications
  } catch (error) {
    console.error('Error retrieving unread notifications:', error);
    return [];
  }
}

module.exports = {
  saveNotification,
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotifications
}; 