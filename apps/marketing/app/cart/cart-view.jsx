'use client';

import { useEffect } from 'react';
import { FiArrowRight, FiCheck, FiShoppingCart } from 'react-icons/fi';
import { plans } from './cart-data';

const panelUrl = process.env.NEXT_PUBLIC_PANEL_URL || 'https://panel.diworkin.com';
const cartStorageKey = 'diworkin-cart-plan';

export default function CartView({ selectedSlug = 'pro' }) {
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
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8b6a3d]">Cart</p>
                <h1 className="text-3xl font-black tracking-[-0.04em] text-[#0b0f0d] sm:text-4xl">Your selected package</h1>
              </div>
            </div>
            <a
              href="/#pricing"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(31,61,46,0.12)] bg-white px-4 py-2 text-sm font-semibold text-[#1f2b24] transition hover:border-[#1f3d2e] hover:text-[#1f3d2e]"
            >
              Back to pricing
              <FiArrowRight className="h-4 w-4" />
            </a>
          </div>
          <p className="max-w-3xl text-sm leading-7 text-[#64706a] sm:text-base">
            Review the package before continuing to the panel. Click another plan if you want to compare options.
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-[rgba(31,61,46,0.10)] bg-white p-6 shadow-[0_20px_60px_rgba(31,61,46,0.08)] sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4f8f6c]">Selected plan</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#1f2b24]">{selectedPlan.name}</h2>
                <p className="mt-2 text-sm leading-7 text-[#64706a]">{selectedPlan.description}</p>
              </div>
              <div className="rounded-full bg-[#1f3d2e] px-4 py-2 text-sm font-semibold text-white">
                {selectedPlan.price} {selectedPlan.period}
              </div>
            </div>

            <div className={`mt-6 rounded-[1.8rem] border border-[rgba(31,61,46,0.10)] bg-gradient-to-br ${selectedPlan.tone} p-5 sm:p-6`}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1f3d2e] shadow-[0_12px_28px_rgba(31,61,46,0.08)]">
                  <FiCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1f2b24]">What is included</p>
                  <p className="text-xs text-[#64706a]">Everything in this package is ready to continue.</p>
                </div>
              </div>

              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {selectedPlan.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-3 rounded-[1.1rem] border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#1f2b24]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#edf7ef] text-[#1f3d2e]">
                      <FiCheck className="h-4 w-4" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={`/payment/${selectedPlan.slug}`}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-[#1f3d2e] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(31,61,46,0.18)] transition hover:bg-[#153126]"
              >
                Proceed to payment
              </a>
              <a
                href={`${panelUrl}/register`}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(31,61,46,0.12)] bg-white px-5 py-3.5 text-sm font-semibold text-[#1f2b24] transition hover:border-[#1f3d2e] hover:text-[#1f3d2e]"
              >
                Continue to panel
              </a>
            </div>
          </section>

          <aside className="space-y-4">
            {plans.map((plan) => {
              const active = plan.slug === selectedPlan.slug;
              return (
                <a
                  key={plan.slug}
                  href={`/cart/${plan.slug}`}
                  className={`block rounded-[1.6rem] border p-5 shadow-[0_18px_44px_rgba(31,61,46,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(31,61,46,0.12)] ${
                    active
                      ? 'border-[#1f3d2e] bg-[#f4faf5]'
                      : 'border-[rgba(31,61,46,0.10)] bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b6a3d]">{plan.name}</p>
                      <h3 className="mt-1 text-xl font-semibold text-[#1f2b24]">{plan.price}</h3>
                      <p className="mt-1 text-sm text-[#64706a]">{plan.period}</p>
                    </div>
                    {active ? (
                      <span className="rounded-full bg-[#1f3d2e] px-3 py-1 text-xs font-semibold text-white">
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[#64706a]">{plan.description}</p>
                </a>
              );
            })}
          </aside>
        </div>
      </div>
    </main>
  );
}
