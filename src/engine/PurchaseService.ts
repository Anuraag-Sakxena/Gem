/**
 * PurchaseService — Abstract interface for in-app purchases.
 *
 * Production: StoreKit 2 (iOS) / Google Play Billing (Android).
 * Development: WebMockPurchaseService (instant success, no real charges).
 *
 * Each tier is a non-consumable IAP product. Entitlements are stored
 * locally and verified server-side in production.
 */

import { TierKey, TIER_PROFILES, TIER_ORDER } from './tierProfiles';

// ─── Types ────────────────────────────────────────────────────────────────

export interface ProductInfo {
  productId: string;
  tierKey: TierKey;
  displayName: string;
  displayPrice: string;
  priceAmountMicros: number;
  currencyCode: string;
}

export interface PurchaseResult {
  success: boolean;
  tierKey: TierKey;
  transactionId: string | null;
  error?: string;
}

export interface Entitlements {
  /** Set of tier keys the user has purchased */
  owned: Set<TierKey>;
  /** Highest tier owned (for tier ladder UI) */
  highestTier: TierKey;
}

// ─── Abstract Interface ──────────────────────────────────────────────────

export interface IPurchaseService {
  /** Initialize the purchase service (load products, restore purchases) */
  initialize(): Promise<void>;

  /** Get available products */
  getProducts(): Promise<ProductInfo[]>;

  /** Purchase a tier. Returns result with transaction ID on success. */
  purchase(tierKey: TierKey): Promise<PurchaseResult>;

  /** Restore previously purchased tiers */
  restore(): Promise<Entitlements>;

  /** Get current entitlements */
  getEntitlements(): Entitlements;

  /** Check if a specific tier is owned */
  isTierOwned(tierKey: TierKey): boolean;
}

// ─── Web Mock Implementation ────────────────────────────────────────────

/**
 * Mock purchase service for development/web.
 * All purchases succeed instantly with fake transaction IDs.
 * No real money is charged.
 */
export class WebMockPurchaseService implements IPurchaseService {
  private owned = new Set<TierKey>(['seed']);
  private products: ProductInfo[] = [];

  async initialize(): Promise<void> {
    // Build product list from tier profiles
    this.products = TIER_ORDER
      .filter((key) => key !== 'seed') // seed is free
      .map((key) => {
        const tier = TIER_PROFILES[key];
        return {
          productId: `com.gem.tier.${key}`,
          tierKey: key,
          displayName: `${tier.name} Tier`,
          displayPrice: tier.price,
          priceAmountMicros: this.parsePriceMicros(tier.price),
          currencyCode: 'USD',
        };
      });

    if (__DEV__) {
      console.log('[PurchaseService] Mock initialized with', this.products.length, 'products');
    }
  }

  async getProducts(): Promise<ProductInfo[]> {
    return [...this.products];
  }

  async purchase(tierKey: TierKey): Promise<PurchaseResult> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));

    if (tierKey === 'seed') {
      return { success: true, tierKey, transactionId: null };
    }

    // Mock success
    this.owned.add(tierKey);
    const txId = `mock_${tierKey}_${Date.now().toString(36)}`;

    if (__DEV__) {
      console.log('[PurchaseService] Mock purchase:', tierKey, '→', txId);
    }

    return { success: true, tierKey, transactionId: txId };
  }

  async restore(): Promise<Entitlements> {
    // In mock mode, just return current state
    return this.getEntitlements();
  }

  getEntitlements(): Entitlements {
    let highestIdx = 0;
    this.owned.forEach((key) => {
      const idx = TIER_ORDER.indexOf(key);
      if (idx > highestIdx) highestIdx = idx;
    });

    return {
      owned: new Set(this.owned),
      highestTier: TIER_ORDER[highestIdx],
    };
  }

  isTierOwned(tierKey: TierKey): boolean {
    return this.owned.has(tierKey);
  }

  private parsePriceMicros(price: string): number {
    const num = parseFloat(price.replace(/[$,]/g, ''));
    return isNaN(num) ? 0 : num * 1_000_000;
  }
}

// ─── Singleton ──────────────────────────────────────────────────────────

/** Global purchase service instance. Swap implementation for production. */
export const purchaseService: IPurchaseService = new WebMockPurchaseService();
