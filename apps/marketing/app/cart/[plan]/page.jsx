import CartView from '../cart-view';
import { plans } from '../cart-data';

export function generateStaticParams() {
  return plans.map((plan) => ({ plan: plan.slug }));
}

export default function CartPlanPage({ params }) {
  return <CartView selectedSlug={params?.plan || 'pro'} />;
}
