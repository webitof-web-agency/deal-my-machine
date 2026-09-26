export type BillingLocation = {
  state: string;
  city: string;
};

type BillingLocationInput = {
  state?: string | null | undefined;
  city?: string | null | undefined;
};

export const normalizeBillingLocation = (
  input: BillingLocationInput,
): { ok: true; value: BillingLocation } | { ok: false; error: string } => {
  const state = input.state?.trim() || '';
  const city = input.city?.trim() || '';

  if (!state || !city) {
    return {
      ok: false,
      error: 'Billing state and city are required before payment.',
    };
  }

  return { ok: true, value: { state, city } };
};
