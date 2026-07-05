export interface CheckoutSession {
  url: string;
}

export interface PaymentProvider {
  createCheckoutSession(userId: string, email: string, priceId: string, returnUrl: string): Promise<CheckoutSession>;
  createCustomerPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }>;
  verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<any>;
}
