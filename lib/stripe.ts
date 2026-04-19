import Stripe from 'stripe';

// Lazy init — evita crash SSR/Edge durante il build
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY non configurata');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
      typescript: true,
    });
  }
  return _stripe;
}

// Alias comodo per le route
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop];
  },
});

export const STRIPE_PLANS = {
  base: {
    name: 'BASE',
    price: 9,
    priceId: process.env.STRIPE_PRICE_BASE ?? '',
    description: '1 utente · 20 commesse · Funzioni core',
    features: ['ERP base', '20 commesse', '1 operatore', 'PDF preventivi'],
    color: '#6B7280',
  },
  start: {
    name: 'START',
    price: 29,
    priceId: process.env.STRIPE_PRICE_START ?? '',
    description: '3 utenti · Commesse illimitate',
    features: ['ERP completo', 'Commesse illimitate', '3 operatori', 'MESSAGGI', 'MONTAGGI'],
    color: '#3B7FE0',
    bestSeller: true,
  },
  pro: {
    name: 'PRO',
    price: 59,
    priceId: process.env.STRIPE_PRICE_PRO ?? '',
    description: '10 utenti · Add-on settore incluso',
    features: ['Tutto START', '10 operatori', 'RETE agenti', 'Add-on settore', 'Assistente AI'],
    color: '#D08008',
  },
  titan: {
    name: 'TITAN',
    price: 89,
    priceId: process.env.STRIPE_PRICE_TITAN ?? '',
    description: 'Utenti illimitati · CNC incluso',
    features: ['Tutto PRO', 'Operatori illimitati', 'CNC', 'ADMIN', 'API access', 'Priorità supporto'],
    color: '#1A1A1C',
  },
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;

export async function createOrRetrieveCustomer(
  aziendaId: string,
  email: string,
  nomeAzienda: string
): Promise<string> {
  const s = getStripe();
  const existing = await s.customers.search({
    query: `metadata['azienda_id']:'${aziendaId}'`,
    limit: 1,
  });

  if (existing.data.length > 0) return existing.data[0].id;

  const customer = await s.customers.create({
    email,
    name: nomeAzienda,
    metadata: { azienda_id: aziendaId },
  });

  return customer.id;
}

export function getPlanFromPriceId(priceId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.priceId === priceId) return key as PlanKey;
  }
  return null;
}
