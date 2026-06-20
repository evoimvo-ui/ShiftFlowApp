const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

// Inicijalizacija web-push
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Funkcija za slanje jedne push notifikacije
async function sendPushNotification(subscription, title, body, data = {}) {
  try {
    const payload = JSON.stringify({
      title,
      body,
      data,
      icon: '/SFicon-512.png',
      badge: '/SFicon-512.png'
    });
    
    await webpush.sendNotification(subscription, payload);
    return { success: true };
  } catch (err) {
    console.error('Error sending push notification:', err);
    // Ako je subscription nevažeći, možemo ga izbrisati
    if (err.statusCode === 410 || err.statusCode === 404) {
      return { success: false, invalidSubscription: true };
    }
    return { success: false };
  }
}

// Funkcija za slanje push notifikacije svim uređajima korisnika
async function sendPushToUser(userId, title, body, data = {}) {
  try {
    const subscriptions = await PushSubscription.find({ userId });
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const result = await sendPushNotification(sub.subscription, title, body, data);
        // Ako je subscription nevažeći, izbriši ga
        if (result.invalidSubscription) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
        return result;
      })
    );
    
    return { 
      success: true, 
      sentCount: results.filter(r => r.status === 'fulfilled' && r.value.success).length 
    };
  } catch (err) {
    console.error('Error sending push to user:', err);
    return { success: false };
  }
}

module.exports = { sendPushNotification, sendPushToUser };