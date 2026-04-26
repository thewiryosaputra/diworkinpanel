'use client';

import { useEffect } from 'react';
import { FiArrowRight, FiCheck, FiCreditCard, FiShield, FiShoppingCart } from 'react-icons/fi';
import { plans } from '../cart/cart-data';

const panelUrl = process.env.NEXT_PUBLIC_PANEL_URL || 'https://panel.diworkin.com';
const cartStorageKey = 'diworkin-cart-plan';

const paymentMethods = [
  {
    title: 'Card payment',
    description: 'Pay instantly with a debit or credit card.',
    tone: 'bg-[#f4faf5] text-[#1f3d2e]',
    icon: FiCreditCard,
  },
  {
    title: 'Bank transfer',
    description: 'Use manual transfer and confirm with the team.',
    tone: 'bg-[#fcfaf6] text-[#8b6a3d]',
    icon: FiShield,
  },
];

export default function PaymentView({ selectedSlug = 'pro' }) {
  const selectedPlan = plans.find((item) => item.slug === selectedSlug) || plans[1];

  useEffect(() => {
    document.body.classList.add('cart-page');
    window.localStorage.setItem(cartStorageKey, selectedPlan.slug);

    return () => {
      document.body.classList.remove('cart-page');
    };
  }, [selectedPlan.slug]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(207,232,213,0.5),transparent_28%),linear-gradient(180deg,#f8faf8_0%,#ffffff_32%,#f4faf5_100%)] px-4 py-10 text-[#1f2b24] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-[rgba(31,61,46,0.10)] bg-white/90 p-6 shadow-[0_20px_60px_rgba(31,61,46,0.08)] backdrop-blur sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1f3d2e] text-white shadow-[0_14px_28px_rgba(31,61,46,0.18)]">
                <FiShoppingCart className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8b6a3d] px-1 text-[0.65rem] font-bold leading-none text-white shadow-[0_10px_20px_rgba(139,106,61,0.24)]">
                  1
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8b6a3d]">Payment</p>
                <h1 className="text-3xl font-black tracking-[-0.04em] text-[#0b0f0d] sm:text-4xl">Complete your order</h1>
              </div>
            </div>
            <a
              href={`/cart/${selectedPlan.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(31,61,46,0.12)] bg-white px-4 py-2 text-sm font-semibold text-[#1f2b24] transition hover:border-[#1f3d2e] hover:text-[#1f3d2e]"
            >
              Back to cart
              <FiArrowRight className="h-4 w-4" />
            </a>
          </div>
          <p className="max-w-3xl text-sm leading-7 text-[#64706a] sm:text-base">
            Review the selected package, choose a payment method, and continue to checkout. Your selected plan is saved as one cart item.
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-[rgba(31,61,46,0.10)] bg-white p-6 shadow-[0_20px_60px_rgba(31,61,46,0.08)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4f8f6c]">Selected plan</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#1f2b24]">{selectedPlan.name}</h2>
                <p className="mt-2 text-sm leading-7 text-[#64706a]">{selectedPlan.description}</p>
              </div>
              <div className="rounded-full bg-[#1f3d2e] px-4 py-2 text-sm font-semibold text-white">
                {selectedPlan.price} {selectedPlan.period}
              </div>
            </div>

            <div className="mt-6 rounded-[1.8rem] border border-[rgba(31,61,46,0.10)] bg-[#f8fbf7] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b6a3d]">Payment summary</p>
              <div className="mt-4 grid gap-3 text-sm text-[#1f2b24] sm:grid-cols-2">
                <div className="rounded-[1rem] border border-[rgba(31,61,46,0.08)] bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#64706a]">Plan</p>
                  <p className="mt-1 font-semibold">{selectedPlan.name}</p>
                </div>
                <div className="rounded-[1rem] border border-[rgba(31,61,46,0.08)] bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#64706a]">Amount</p>
                  <p className="mt-1 font-semibold">
                    {selectedPlan.price} {selectedPlan.period}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-[1.2rem] border border-[#dbe9de] bg-white px-4 py-4 text-sm text-[#64706a]">
                <FiShield className="mt-0.5 h-5 w-5 shrink-0 text-[#4f8f6c]" />
                <p>
                  Payment details here can be connected to a gateway later. This page is ready for checkout, confirmation, or manual payment handling.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={`${panelUrl}/register`}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-[#1f3d2e] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(31,61,46,0.18)] transition hover:bg-[#153126]"
              >
                Pay and continue
              </a>
              <a
                href="/#pricing"
                className="inline-flex items-center justify-center rounded-full border border-[rgba(31,61,46,0.12)] bg-white px-5 py-3.5 text-sm font-semibold text-[#1f2b24] transition hover:border-[#1f3d2e] hover:text-[#1f3d2e]"
              >
                Compare packages
              </a>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-[rgba(31,61,46,0.10)] bg-white p-6 shadow-[0_20px_60px_rgba(31,61,46,0.08)] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8b6a3d]">Payment methods</p>
              <div className="mt-4 space-y-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <div
                      key={method.title}
                      className={`flex items-start gap-3 rounded-[1.2rem] border border-[rgba(31,61,46,0.08)] px-4 py-4 ${method.tone}`}
                    >
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-white/80">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{method.title}</p>
                        <p className="mt-1 text-xs leading-5 opacity-80">{method.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[rgba(31,61,46,0.10)] bg-white p-6 shadow-[0_20px_60px_rgba(31,61,46,0.08)] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4f8f6c]">Included</p>
              <ul className="mt-4 space-y-3 text-sm text-[#1f2b24]">
                {selectedPlan.points.map((point) => (
                  <li key={point} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#edf7ef] text-[#1f3d2e]">
                      <FiCheck className="h-4 w-4" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
