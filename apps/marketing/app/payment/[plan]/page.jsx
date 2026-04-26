import PaymentView from '../payment-view';
import { plans } from '../../cart/cart-data';

export function generateStaticParams() {
  return plans.map((plan) => ({ plan: plan.slug }));
}

export default function PaymentPlanPage({ params }) {
  return <PaymentView selectedSlug={params?.plan || 'pro'} />;
}
