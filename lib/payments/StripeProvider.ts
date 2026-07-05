import { PaymentProvider, CheckoutSession } from './types';

export class StripeProvider implements PaymentProvider {
  private stripe: any;

  constructor() {
    // We dynamically require stripe to avoid breaking if it's not installed yet,
    // since the user might want to rely purely on the MockProvider for now.
    try {
      const Stripe = require('stripe');
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2023-10-16'
      });
    } catch (e) {
      console.warn("Stripe module not found. Run `npm i stripe` to use StripeProvider.");
    }
  }

  async createCheckoutSession(userId: string, email: string, priceId: string, returnUrl: string): Promise<CheckoutSession> {
    if (!this.stripe) throw new Error("Stripe is not initialized.");
    
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
      customer_email: email,
      client_reference_id: userId,
      metadata: { userId }
    });

    return { url: session.url };
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
    if (!this.stripe) throw new Error("Stripe is not initialized.");
    
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  }

  async verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<any> {
    if (!this.stripe) throw new Error("Stripe is not initialized.");
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
