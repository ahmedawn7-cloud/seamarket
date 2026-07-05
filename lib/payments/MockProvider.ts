import { PaymentProvider, CheckoutSession } from './types';

export class MockProvider implements PaymentProvider {
  async createCheckoutSession(userId: string, email: string, priceId: string, returnUrl: string): Promise<CheckoutSession> {
    console.log(`[MockProvider] Creating checkout session for ${email} with price ${priceId}`);
    return {
      url: `${returnUrl}?mock_session_id=mock_success_${Date.now()}`
    };
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
    console.log(`[MockProvider] Creating portal session for ${customerId}`);
    return {
      url: returnUrl
    };
  }

  async verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<any> {
    console.log(`[MockProvider] Verifying webhook signature`);
    try {
      return JSON.parse(payload);
    } catch {
      return { type: 'mock.event' };
    }
  }
}
