const PushSubscription = require('../models/PushSubscription');

// Sačuvaj subscription
exports.saveSubscription = async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user.id;

    // Provjeri da li već postoji isti subscription za ovog korisnika
    const existing = await PushSubscription.findOne({
      userId,
      'subscription.endpoint': subscription.endpoint
    });

    if (existing) {
      // Ako postoji, ažuriraj ga
      existing.subscription = subscription;
      await existing.save();
      return res.status(200).json({ success: true, message: 'Subscription updated' });
    }

    // Kreiraj novi subscription
    const newSubscription = new PushSubscription({
      userId,
      subscription
    });

    await newSubscription.save();
    res.status(201).json({ success: true, message: 'Subscription saved' });
  } catch (err) {
    console.error('Error saving subscription:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Obriši subscription
exports.deleteSubscription = async (req, res) => {
  try {
    const { endpoint } = req.body;
    const userId = req.user.id;

    await PushSubscription.deleteOne({
      userId,
      'subscription.endpoint': endpoint
    });

    res.status(200).json({ success: true, message: 'Subscription deleted' });
  } catch (err) {
    console.error('Error deleting subscription:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};