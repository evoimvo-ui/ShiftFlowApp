const Organization = require('../models/Organization');

module.exports = async (req, res, next) => {
  try {
    const { organizationId } = req.user;
    if (!organizationId) {
      return res.status(400).json({ code: 'missing_organization_id' });
    }

    const org = await Organization.findById(organizationId);
    if (!org) {
      return res.status(404).json({ code: 'organization_not_found' });
    }

    const { subscriptionStatus, trialEndsAt } = org.settings;

    switch (subscriptionStatus) {
      case 'trial': {
        if (new Date() < new Date(trialEndsAt)) {
          req.organization = org;
          return next();
        }
        return res.status(402).json({ code: 'trial_expired' });
      }
      case 'active': {
        req.organization = org;
        return next();
      }
      case 'past_due':
        return res.status(402).json({ code: 'past_due' });
      case 'canceled':
        return res.status(402).json({ code: 'canceled' });
      case 'paused':
        return res.status(402).json({ code: 'paused' });
      default:
        return res.status(402).json({ code: 'unknown_subscription_status' });
    }
  } catch (err) {
    console.error('checkSubscription error:', err);
    return res.status(500).json({ code: 'internal_error' });
  }
};
