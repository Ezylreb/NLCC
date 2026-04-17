'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';

interface AvatarItem {
  id: string;
  name: string;
  type: 'hair' | 'eyes' | 'head' | 'clothing' | 'expression' | 'accessory';
  value: string;
  color?: string;
  cost: number;
  description: string;
  locked: boolean;
}

interface AvatarShopProps {
  studentId: string;
  balance: number;
  onPurchase?: (item: AvatarItem) => void;
}

export const AvatarShop: React.FC<AvatarShopProps> = ({ studentId, balance, onPurchase }) => {
  const [items, setItems] = useState<AvatarItem[]>([]);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const availableItems: AvatarItem[] = [
    // Hairstyles
    {
      id: 'hair_long',
      name: 'Long Hair',
      type: 'hair',
      value: 'long',
      cost: 100,
      description: 'Elegant long hairstyle',
      locked: false
    },
    {
      id: 'hair_curly',
      name: 'Curly Hair',
      type: 'hair',
      value: 'curly',
      cost: 100,
      description: 'Bouncy curly hair',
      locked: false
    },
    {
      id: 'hair_afro',
      name: 'Afro Hair',
      type: 'hair',
      value: 'afro',
      cost: 120,
      description: 'Classic afro style',
      locked: false
    },

    // Hair Colors
    {
      id: 'hair_color_gold',
      name: 'Golden Hair',
      type: 'hair',
      value: '#FFD700',
      color: '#FFD700',
      cost: 50,
      description: 'Shiny golden hair color',
      locked: false
    },
    {
      id: 'hair_color_silver',
      name: 'Silver Hair',
      type: 'hair',
      value: '#C0C0C0',
      color: '#C0C0C0',
      cost: 75,
      description: 'Mystical silver hair',
      locked: false
    },
    {
      id: 'hair_color_pink',
      name: 'Pink Hair',
      type: 'hair',
      value: '#FF69B4',
      color: '#FF69B4',
      cost: 100,
      description: 'Vibrant pink hair color',
      locked: false
    },

    // Eyes
    {
      id: 'eyes_cat',
      name: 'Cat Eyes',
      type: 'eyes',
      value: 'cat',
      cost: 80,
      description: 'Mysterious cat-like eyes',
      locked: false
    },
    {
      id: 'eyes_sparkle',
      name: 'Sparkle Eyes',
      type: 'eyes',
      value: 'sparkle',
      cost: 100,
      description: 'Magical sparkling eyes',
      locked: false
    },

    // Expressions
    {
      id: 'expr_grin',
      name: 'Big Grin',
      type: 'expression',
      value: 'grin',
      cost: 50,
      description: 'Big cheerful grin',
      locked: false
    },
    {
      id: 'expr_wow',
      name: 'Surprised',
      type: 'expression',
      value: 'wow',
      cost: 50,
      description: 'Amazed expression',
      locked: false
    },

    // Head Colors
    {
      id: 'head_color_blue',
      name: 'Blue Skin',
      type: 'head',
      value: '#2196F3',
      color: '#2196F3',
      cost: 60,
      description: 'Cool blue skin tone',
      locked: false
    },
    {
      id: 'head_color_green',
      name: 'Green Skin',
      type: 'head',
      value: '#4CAF50',
      color: '#4CAF50',
      cost: 60,
      description: 'Natural green complexion',
      locked: false
    },

    // Clothing
    {
      id: 'clothing_dress',
      name: 'Dress',
      type: 'clothing',
      value: 'dress',
      cost: 75,
      description: 'Elegant dress outfit',
      locked: false
    },
    {
      id: 'clothing_hoodie',
      name: 'Hoodie',
      type: 'clothing',
      value: 'hoodie',
      cost: 90,
      description: 'Cozy hoodie sweatshirt',
      locked: false
    },

    // Special Rare Items
    {
      id: 'special_rainbow_hair',
      name: '🌈 Rainbow Hair',
      type: 'hair',
      value: 'rainbow',
      cost: 500,
      description: 'Limited edition rainbow hair',
      locked: false
    },
    {
      id: 'special_golden_body',
      name: '✨ Golden Body',
      type: 'head',
      value: '#FFD700',
      color: '#FFD700',
      cost: 250,
      description: 'Legendary golden appearance',
      locked: false
    }
  ];

  useEffect(() => {
    const fetchOwnedItems = async () => {
      try {
        const response = await apiClient.avatar.getItems(studentId);
        if (response.success) {
          setOwnedItems(response.data?.items || []);
        }
      } catch (error) {
        console.error('Failed to fetch owned items:', error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchOwnedItems();
      setItems(availableItems);
    }
  }, [studentId]);

  const handlePurchase = async (item: AvatarItem) => {
    if (balance < item.cost) {
      alert('❌ Not enough points!');
      return;
    }

    if (ownedItems.includes(item.id)) {
      alert('✅ You already own this item!');
      return;
    }

    try {
      const result = await apiClient.avatar.purchaseItem(studentId, item.id);

      if (result.success) {
        setOwnedItems([...ownedItems, item.id]);
        onPurchase?.(item);
        alert(`🎉 Purchased ${item.name}!`);
      } else {
        throw new Error(result.error || 'Purchase failed');
      }
    } catch (error) {
      alert('Failed to purchase item');
    }
  };

  const filteredItems = selectedFilter === 'all'
    ? items
    : items.filter(item => item.type === selectedFilter);

  const filterTypes = ['all', 'hair', 'eyes', 'head', 'clothing', 'expression', 'accessory'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">🛍️ Avatar Shop</h1>
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-yellow-400">💰 {balance} Points</span>
          <span className="text-sm text-slate-400">Complete lessons to earn more points!</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {filterTypes.map(type => (
          <button
            key={type}
            onClick={() => setSelectedFilter(type)}
            className={`px-4 py-2 rounded-lg font-bold transition-all capitalize ${
              selectedFilter === type
                ? 'bg-brand-purple text-white shadow-lg'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            {type === 'all' ? 'All Items' : type}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="text-center text-white">Loading items...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => {
            const isOwned = ownedItems.includes(item.id);
            const canAfford = balance >= item.cost;

            return (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`rounded-xl border-2 p-4 transition-all ${
                  isOwned
                    ? 'border-green-500 bg-green-500/10'
                    : canAfford
                      ? 'border-blue-500 bg-blue-500/10 hover:border-blue-400'
                      : 'border-red-500/50 bg-red-500/5 opacity-60'
                }`}
              >
                {/* Item Preview */}
                <div className="mb-4 h-24 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center">
                  {item.color && (
                    <div className="w-12 h-12 rounded-full" style={{ backgroundColor: item.color }} />
                  )}
                  {item.type === 'expression' && <span className="text-3xl">{item.value === 'grin' ? '😄' : item.value === 'wow' ? '😮' : '😊'}</span>}
                  {!item.color && item.type !== 'expression' && (
                    <span className="text-3xl">✨</span>
                  )}
                </div>

                {/* Item Info */}
                <h3 className="text-white font-bold mb-1">{item.name}</h3>
                <p className="text-sm text-slate-300 mb-4 h-8">{item.description}</p>

                {/* Status and Cost */}
                <div className="flex justify-between items-center">
                  {isOwned ? (
                    <span className="text-green-400 font-bold text-sm">✅ Owned</span>
                  ) : (
                    <span className={`font-bold text-sm ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>
                      💰 {item.cost}
                    </span>
                  )}

                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={isOwned || !canAfford}
                    className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
                      isOwned
                        ? 'bg-green-500/30 text-green-300 cursor-default'
                        : canAfford
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-red-500/30 text-red-300 cursor-not-allowed'
                    }`}
                  >
                    {isOwned ? 'Own' : canAfford ? 'Buy' : 'Locked'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
