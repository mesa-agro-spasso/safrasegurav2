import type { MarketData } from '@/types/pricing';

// Mock market data - will be replaced with real API calls
export function getMarketData(): MarketData {
  return {
    usd_brl_spot: 4.97,
    usd_forward: {
      '2025-03': 5.02,
      '2025-05': 5.08,
      '2025-07': 5.15,
      '2025-09': 5.22,
      '2025-11': 5.28,
    },
    soybean_futures: {
      'ZSK25': 1042.50,
      'ZSN25': 1058.25,
      'ZSQ25': 1065.00,
      'ZSU25': 1048.75,
      'ZSX25': 1052.00,
    },
    corn_cbot_futures: {
      'ZCK25': 458.25,
      'ZCN25': 465.50,
      'ZCU25': 472.00,
      'ZCZ25': 478.75,
    },
    corn_b3_manual: {
      'CCMK25': 72.50,
      'CCMN25': 74.80,
      'CCMU25': 76.20,
    },
    updated_at: new Date().toISOString(),
  };
}

export function isMarketDataStale(updatedAt: string): boolean {
  const updated = new Date(updatedAt);
  const now = new Date();
  const diffHours = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);
  return diffHours > 4;
}
