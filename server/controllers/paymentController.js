const Organization = require('../models/Organization');
const crypto = require('crypto');

const verifySignature = (signatureHeader, rawBody, secret) => {
  // Parse Paddle-Signature header (format: ts=123456789;h1=abc123)
  const parts = signatureHeader.split(';');
  const tsPart = parts.find(p => p.startsWith('ts='));
  const h1Part = parts.find(p => p.startsWith('h1='));

  if (!tsPart || !h1Part) {
    return false;
  }

  const ts = tsPart.slice(3);
  const h1 = h1Part.slice(3);

  // Create payload: ts + ":" + rawBody
  const payload = `${ts}:${rawBody}`;

  // Compute HMAC-SHA256
  const computedHmac = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');

  // Compare
  return crypto.timingSafeEqual(Buffer.from(h1, 'hex'), Buffer.from(computedHmac, 'hex'));
};

const getPlanFromPriceId = (priceId) => {
  const priceIdToPlan = {
    [process.env.PADDLE_BASIC_PRICE_ID]: 'basic',
    [process.env.PADDLE_PREMIUM_PRICE_ID]: 'premium',
    [process.env.PADDLE_BUSINESS_PRICE_ID]: 'business'
  };
  return priceIdToPlan[priceId] || 'basic';
};

const handleWebhook = async (req, res) => {
  try {
    // Verify signature
    const signatureHeader = req.headers['paddle-signature'];
    const secret = process.env.PADDLE_WEBHOOK_SECRET;
    const rawBody = req.body;

    if (!signatureHeader || !verifySignature(signatureHeader, rawBody, secret)) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Parse JSON
    const body = JSON.parse(rawBody);
    const eventType = body.event_type;
    const data = body.data;

    let organization;
    const paddleCustomerId = data.customer_id;
    const paddleSubscriptionId = data.id;
    const currentPeriodEnd = data.current_billing_cycle?.ends_at ? new Date(data.current_billing_cycle.ends_at) : null;
    const priceId = data.items?.[0]?.price?.id;
    const subscriptionPlan = priceId ? getPlanFromPriceId(priceId) : null;
    const organizationId = data.custom_data?.organization_id;

    if (eventType === 'subscription.created' ||
        eventType === 'subscription.activated') {
      if (organizationId) {
        organization = await Organization.findById(organizationId);
      }
    } else {
      organization = await Organization.findOne({
        paddleSubscriptionId: paddleSubscriptionId
      });
    }

    if (!organization) {
      console.log('Organization not found for webhook:', eventType);
      return res.status(200).json({ received: true });
    }

    // Process different event types
    switch (eventType) {
      case 'subscription.created':
      case 'subscription.activated':
        organization.settings.subscriptionStatus = 'active';
        if (subscriptionPlan) organization.settings.subscriptionPlan = subscriptionPlan;
        organization.paddleSubscriptionId = paddleSubscriptionId;
        organization.paddleCustomerId = paddleCustomerId;
        if (currentPeriodEnd) organization.currentPeriodEnd = currentPeriodEnd;
        break;

      case 'subscription.updated':
        organization.settings.subscriptionStatus = 'active';
        if (subscriptionPlan) organization.settings.subscriptionPlan = subscriptionPlan;
        if (currentPeriodEnd) organization.currentPeriodEnd = currentPeriodEnd;
        break;

      case 'subscription.past_due':
        organization.settings.subscriptionStatus = 'past_due';
        break;

      case 'subscription.paused':
        organization.settings.subscriptionStatus = 'paused';
        break;

      case 'subscription.canceled':
        organization.settings.subscriptionStatus = 'canceled';
        break;

      default:
        console.log('Unhandled event type:', eventType);
    }

    await organization.save();
    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('Payment webhook error:', err);
    return res.status(200).json({ received: true }); // Always return 200 to Paddle
  }
};

module.exports = {
  handleWebhook
};
