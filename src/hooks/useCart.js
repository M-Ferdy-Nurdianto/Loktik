import { useState, useCallback } from 'react';

/**
 * Custom hook for managing ticket cart state.
 */
export const useCart = (initialTiers = []) => {
  const [quantities, setQuantities] = useState({});

  const updateQuantity = useCallback((tierId, delta, maxQuota) => {
    setQuantities((prev) => {
      const current = prev[tierId] || 0;
      const next = Math.max(0, current + delta);

      // Check max quota if specified
      if (maxQuota !== null && maxQuota !== undefined && next > maxQuota) {
        return prev;
      }
      // Maximum 10 tickets per tier per order to prevent hoarding
      if (next > 10) return prev;

      return { ...prev, [tierId]: next };
    });
  }, []);

  const resetCart = useCallback(() => {
    setQuantities({});
  }, []);

  const calculateTotal = useCallback(
    (tiers) => {
      let totalAmount = 0;
      let totalItems = 0;
      const selectedItems = [];

      tiers.forEach((tier) => {
        const qty = quantities[tier.id] || 0;
        if (qty > 0) {
          totalAmount += tier.price * qty;
          totalItems += qty;
          selectedItems.push({
            categoryId: tier.id,
            categoryName: tier.name,
            price: tier.price,
            quantity: qty,
          });
        }
      });

      return { totalAmount, totalItems, selectedItems };
    },
    [quantities]
  );

  return {
    quantities,
    updateQuantity,
    resetCart,
    calculateTotal,
  };
};
