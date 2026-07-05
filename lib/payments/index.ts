import { PaymentProvider } from './types';
import { MockProvider } from './MockProvider';
import { StripeProvider } from './StripeProvider';

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER || 'mock';
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (provider === 'mock' || !stripeKey) {
    return new MockProvider();
  }

  return new StripeProvider();
}
