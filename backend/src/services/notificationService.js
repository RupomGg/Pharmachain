import { AlertQueue } from '../models/AlertQueue.js';

/**
 * Notification Service - Mock Email/SMS Alerts
 * 
 * In production, replace with:
 * - SendGrid for email
 * - Twilio for SMS
 * - Firebase for push notifications
 */

/**
 * Process pending alerts from queue
 * 
 * @returns {Promise<Object>} Processing result
 */
export async function processAlerts() {
  const pendingAlerts = await AlertQueue.find({ 
    status: 'PENDING',
    attempts: { $lt: 3 } // Max 3 attempts
  }).limit(100); // Process in batches

  console.log(`[NOTIFICATION] Processing ${pendingAlerts.length} pending alerts`);

  let sent = 0;
  let failed = 0;

  for (const alert of pendingAlerts) {
    try {
      // ============ Mock Notification (Replace in Production) ============
      await sendMockNotification(alert);

      // Mark as sent
      await AlertQueue.findByIdAndUpdate(alert._id, {
        status: 'SENT',
        sentAt: new Date()
      });

      sent++;

    } catch (error) {
      console.error(`❌ Failed to send alert ${alert._id}:`, error.message);

      // Increment attempts
      const newAttempts = alert.attempts + 1;
      const newStatus = newAttempts >= 3 ? 'FAILED' : 'PENDING';

      await AlertQueue.findByIdAndUpdate(alert._id, {
        $inc: { attempts: 1 },
        status: newStatus,
        error: error.message
      });

      failed++;
    }
  }

  console.log(`✅ Sent: ${sent}, ❌ Failed: ${failed}`);

  return { sent, failed, total: pendingAlerts.length };
}

/**
 * Mock notification sender
 * 
 * In production, replace with actual email/SMS service
 */
async function sendMockNotification(alert) {
  console.log('\n' + '='.repeat(60));
  console.log(`[MOCK] ${alert.alertType} ALERT`);
  console.log('='.repeat(60));
  console.log(`To: ${alert.recipient}`);
  console.log(`Batch ID: ${alert.batchId}`);
  console.log(`Message: ${alert.message}`);
  console.log(`Created: ${alert.createdAt.toISOString()}`);
  console.log('='.repeat(60) + '\n');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // In production, use:
  /*
  if (alert.alertType === 'RECALL') {
    // Send email via SendGrid
    await sendgrid.send({
      to: lookupEmail(alert.recipient),
      from: 'alerts@pharmachain.com',
      subject: `URGENT: Batch #${alert.batchId} Recall Notice`,
      text: alert.message,
      html: `<strong>${alert.message}</strong>`
    });

    // Send SMS via Twilio
    await twilio.messages.create({
      to: lookupPhone(alert.recipient),
      from: process.env.TWILIO_PHONE_NUMBER,
      body: alert.message
    });
  }
  */
}

/**
 * Send custom alert
 * 
 * @param {Object} alertData - Alert data
 * @returns {Promise<Object>} Created alert
 */
export async function sendAlert(alertData) {
  const alert = await AlertQueue.create({
    ...alertData,
    status: 'PENDING',
    attempts: 0,
    createdAt: new Date()
  });

  // Process immediately (or queue for batch processing)
  await processAlerts();

  return alert;
}

/**
 * Get alert statistics
 * 
 * @returns {Promise<Object>} Alert stats
 */
export async function getAlertStats() {
  const [pending, sent, failed] = await Promise.all([
    AlertQueue.countDocuments({ status: 'PENDING' }),
    AlertQueue.countDocuments({ status: 'SENT' }),
    AlertQueue.countDocuments({ status: 'FAILED' })
  ]);

  return {
    pending,
    sent,
    failed,
    total: pending + sent + failed
  };
}

export const notificationService = {
  processAlerts,
  sendAlert,
  getAlertStats
};
