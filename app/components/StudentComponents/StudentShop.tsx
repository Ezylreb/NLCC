'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';

interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    category: 'avatar' | 'power-up' | 'cosmetic' | 'background';
    icon?: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'uncommon' | 'common';
    owned?: boolean;
    image_url?: string;
}

interface StudentShopProps {
    userId: string;
}

export const StudentShop: React.FC<StudentShopProps> = ({ userId }) => {
    const [items, setItems] = useState<ShopItem[]>([]);
    const [coins, setCoins] = useState(0);
    const [activeCategory, setActiveCategory] = useState<'all' | 'avatar' | 'power-up' | 'cosmetic' | 'background'>('all');
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getCategoryIcon = (category: string): string => {
        switch (category) {
            case 'avatar': return '🧑';
            case 'power-up': return '⚡';
            case 'cosmetic': return '✨';
            case 'background': return '🎨';
            default: return '🎁';
        }
    };

    const getMockItems = (): ShopItem[] => [
        {
            id: '1',
            name: 'Cool Cap',
            description: 'Astig na sumbrero para sa iyong avatar',
            price: 50,
            category: 'avatar',
            icon: '🧢',
            rarity: 'common',
            owned: false,
        },
        {
            id: '2',
            name: 'Energy Boost',
            description: 'Dagdag lakas para sa mas mabilis na pag-aaral',
            price: 100,
            category: 'power-up',
            icon: '⚡',
            rarity: 'rare',
            owned: false,
        },
        {
            id: '3',
            name: 'Dragon Wings',
            description: 'Mga pakpak ng dragon para sa iyong avatar',
            price: 300,
            category: 'cosmetic',
            icon: '🐉',
            rarity: 'epic',
            owned: false,
        },
        {
            id: '4',
            name: 'Golden Crown',
            description: 'Kampanya para sa mga kampeon sa paaralan',
            price: 500,
            category: 'background',
            icon: '👑',
            rarity: 'legendary',
            owned: false,
        },
        {
            id: '5',
            name: 'Gamer Outfit',
            description: 'Maganda at cool na damit para sa gamers',
            price: 200,
            category: 'avatar',
            icon: '🕹️',
            rarity: 'uncommon',
            owned: false,
        },
        {
            id: '6',
            name: 'Pixel Background',
            description: 'Retro na pixel art background',
            price: 80,
            category: 'background',
            icon: '🎮',
            rarity: 'common',
            owned: false,
        },
        {
            id: '7',
            name: 'Rainbow Aura',
            description: 'Mystical na rainbow effect',
            price: 350,
            category: 'cosmetic',
            icon: '🌈',
            rarity: 'epic',
            owned: false,
        },
        {
            id: '8',
            name: 'XP Boost +25%',
            description: '1 oras ng 25% XP multiplier',
            price: 120,
            category: 'power-up',
            icon: '⚡',
            rarity: 'uncommon',
            owned: false,
        },
    ];

    useEffect(() => {
        const fetchShopData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch shop items
                const itemsResult = await apiClient.student.getShopItems();
                let shopItems = itemsResult.success && itemsResult.data ? itemsResult.data : getMockItems();
                
                // Fetch student inventory to mark owned items
                let ownedItemIds: string[] = [];
                try {
                    const inventoryResponse = await fetch('/api/student/inventory', {
                        headers: {
                            'x-student-id': userId,
                        },
                        cache: 'no-store',
                    });
                    if (inventoryResponse.ok) {
                        const inventoryResult = await inventoryResponse.json();
                        if (inventoryResult.success && inventoryResult.data) {
                            ownedItemIds = inventoryResult.data.map((inv: any) => String(inv.item_id));
                        }
                    }
                } catch (err) {
                    console.warn('Could not fetch inventory:', err);
                }

                // Mark owned items
                const enrichedItems = shopItems.map((item: any) => ({
                    ...item,
                    id: String(item.id),
                    icon: getCategoryIcon(item.category),
                    owned: ownedItemIds.includes(String(item.id)),
                }));
                setItems(enrichedItems);

                // Fetch student coins
                const statsResponse = await fetch('/api/student/stats', {
                    headers: {
                        'x-student-id': userId,
                    },
                    cache: 'no-store',
                });

                if (statsResponse.ok) {
                    const statsResult = await statsResponse.json();
                    if (statsResult.success && statsResult.data) {
                        setCoins(Number(statsResult.data.coins) || 0);
                    }
                }
            } catch (fetchError) {
                console.error('Failed to fetch shop data:', fetchError);
                setError('Failed to load shop. Showing mock data.');
                setItems(getMockItems());
            } finally {
                setIsLoading(false);
            }
        };

        fetchShopData();
    }, [userId]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedItem) {
                setSelectedItem(null);
            }
        };

        window.addEventListener('keydown', handleEscape);

        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, [selectedItem]);

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'common':
                return 'from-slate-400 to-slate-600';
            case 'uncommon':
                return 'from-green-400 to-green-600';
            case 'rare':
                return 'from-blue-400 to-blue-600';
            case 'epic':
                return 'from-purple-400 to-purple-600';
            case 'legendary':
                return 'from-yellow-400 to-orange-600';
            default:
                return 'from-slate-400 to-slate-600';
        }
    };

    const getRarityLabel = (rarity: string) => {
        switch (rarity) {
            case 'common':
                return 'Karaniwan';
            case 'rare':
                return 'Bihira';
            case 'epic':
                return 'Epiko';
            case 'legendary':
                return 'Legendaryong';
            default:
                return rarity;
        }
    };

    const handleBuyItem = async (item: ShopItem) => {
        if (coins >= item.price) {
            try {
                const response = await apiClient.student.purchaseItem(item.id, 1);
                if (response.success) {
                    // Update coins and mark item as owned
                    setCoins(coins - item.price);
                    const updatedItems = items.map((i) =>
                        i.id === item.id ? { ...i, owned: true } : i
                    );
                    setItems(updatedItems);
                    // Show success feedback
                    console.log(`Successfully purchased ${item.name}!`);
                    // Immediately close modal after purchase
                    setSelectedItem(null);
                } else {
                    setError(`Purchase failed: ${response.error || 'Unknown error'}`);
                }
            } catch (err) {
                console.error('Purchase error:', err);
                setError('Failed to process purchase. Please try again.');
            }
        }
    };

    const filteredItems = items.filter((item) => {
        if (activeCategory === 'all') return true;
        return item.category === activeCategory;
    });

    return (
        <div className="min-h-full p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2">🏪 Tindahan</h1>
                        <p className="text-slate-400">Bumili ng mga kahanga-hangang item gamit ang iyong coins</p>
                    </div>
                    <div className="text-center bg-yellow-500/20 border border-yellow-500/40 rounded-lg px-6 py-4">
                        <p className="text-yellow-400 font-bold">💰 Mga Coins</p>
                        <p className="text-2xl font-black text-white">{coins}</p>
                    </div>
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {(['all', 'avatar', 'power-up', 'cosmetic', 'background'] as const).map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                                activeCategory === category
                                    ? 'bg-brand-purple text-white shadow-lg shadow-purple-500/40'
                                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                            }`}
                        >
                            {category === 'all' ? 'Lahat' : category === 'avatar' ? 'Avatar' : category === 'power-up' ? '⚡ Power-up' : category === 'cosmetic' ? '✨ Cosmetic' : '🌅 Background'}
                        </button>
                    ))}
                </div>

                {/* Shop Items Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-white/20 border-t-brand-purple rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredItems.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.06 }}
                                onClick={() => setSelectedItem(item)}
                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                                    item.owned
                                        ? 'bg-green-500/10 border-green-500/40'
                                        : 'bg-linear-to-b from-white/10 to-white/5 border-white/20 hover:border-brand-purple/50'
                                }`}
                            >
                                {/* Rarity Border */}
                                    <div className={`absolute inset-0 rounded-xl bg-linear-to-b ${getRarityColor(item.rarity)} opacity-0 group-hover:opacity-10 transition-opacity`} />

                                {/* Item Icon */}
                                <div className="text-5xl mb-3 text-center">{item.icon}</div>

                                {/* Item Info */}
                                <h3 className="font-bold text-white mb-1 text-center">{item.name}</h3>
                                <p className="text-xs text-slate-400 text-center mb-3 line-clamp-2">{item.description}</p>

                                {/* Rarity Badge */}
                                <div className="flex justify-center mb-3">
                                    <span className={`text-xs font-bold px-2 py-1 rounded bg-linear-to-r ${getRarityColor(item.rarity)} text-white`}>
                                        {getRarityLabel(item.rarity)}
                                    </span>
                                </div>

                                {/* Price / Owned */}
                                {item.owned ? (
                                    <div className="bg-green-500/20 border border-green-500/40 rounded-lg py-2 text-center">
                                        <p className="text-green-400 font-bold text-sm">✓ Ang Iyong Ari-arian</p>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg py-2 text-center">
                                        <p className="text-yellow-400 font-bold text-sm">💰 {item.price}</p>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Item Details Modal */}
                {selectedItem && selectedItem.id && !selectedItem.owned && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4"
                        onClick={() => setSelectedItem(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 border border-white/20 rounded-xl p-8 max-w-md w-full"
                        >
                            <div className="text-6xl text-center mb-4">{selectedItem.icon}</div>
                            <h2 className="text-2xl font-black text-white text-center mb-2">{selectedItem.name}</h2>
                            <p className="text-slate-400 text-center mb-6">{selectedItem.description}</p>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                    <span className="text-slate-400">Rarity:</span>
                                    <span className="font-bold text-white">{getRarityLabel(selectedItem.rarity)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                    <span className="text-slate-400">Presyo:</span>
                                    <span className="font-bold text-yellow-400">💰 {selectedItem.price}</span>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all"
                                >
                                    Kanselahin
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleBuyItem(selectedItem);
                                    }}
                                    disabled={coins < selectedItem.price}
                                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                                        coins >= selectedItem.price
                                            ? 'bg-brand-purple hover:shadow-lg hover:shadow-purple-500/40 text-white'
                                            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    Bumili
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};
