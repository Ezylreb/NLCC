'use client';

//             const result = await apiClient.student.saveAvatarCustomization(customization);

//             if (result.success) {
//                 // Success - customization saved
//                 console.log('Avatar customization saved successfully');
//             }
//         } catch (error) {
//             console.error('Failed to save customization:', error);
//             setError('Failed to save avatar customization');
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     useEffect(() => {
//         // Auto-save when customization changes (debounced)
//         const timer = setTimeout(() => {
//             handleSaveCustomization();
//         }, 1000);

//         return () => clearTimeout(timer);
//     }, [customization]);

//     //Katawan
//     const bodyOptions: AvatarPart[] = [
//         { id: '1', name: 'Standard', type: 'body', emoji: '/Character/Avatar/pants/pantsdefault.png', color: '#60a5fa' },
//         { id: '2', name: 'Athletic', type: 'body', emoji: '/Character/Avatar/pants/pantsdefault.png', color: '#ef4444' },
//         { id: '3', name: 'Chubby', type: 'body', emoji: '/Character/Avatar/pants/pantsdefault.png', color: '#f59e0b' }
//     ];

//     //Buhok
//     const hairOptions: AvatarPart[] = [
//         { id: '1', name: 'Kulot', type: 'hair', emoji: '🧑', color: '#8b4513' },
//         { id: '2', name: 'Straight', type: 'hair', emoji: '👧', color: '#000000' },
//         { id: '3', name: 'Curly', type: 'hair', emoji: '🤸', color: '#d4af37' },
//         { id: '4', name: 'Spiky', type: 'hair', emoji: '🤖', color: '#ff6b6b' }
//     ];

//     //Buhok Color
//     const hairColorOptions: AvatarPart[] = [
//         { id: '1', name: 'hBlack', type: 'hairColor', emoji: '🧑black', color: '#8b4513' },
//         { id: '2', name: 'hBrown', type: 'hairColor', emoji: '🧑brown', color: '#000000' },
//         { id: '3', name: 'hRed', type: 'hairColor', emoji: '🧑red', color: '#d4af37' },
//         { id: '4', name: 'hGray', type: 'hair', emoji: '🧑gray', color: '#ff6b6b' }
//     ];

//     // Eyes
//     const eyesOptions: AvatarPart[] = [
//         { id: '1', name: 'Happy', type: 'emotion', emoji: '😊', color: '' },
//         { id: '2', name: 'Cool', type: 'emotion', emoji: '😎', color: '' },
//         { id: '3', name: 'Thinking', type: 'emotion', emoji: '🤔', color: '' },
//         { id: '4', name: 'Excited', type: 'emotion', emoji: '🤩', color: '' },
//         { id: '5', name: 'Proud', type: 'emotion', emoji: '😌', color: '' }
//     ];

//     // Mouth
//     const mouthOptions: AvatarPart[] = [
//         { id: '1', name: 'Happy', type: 'emotion', emoji: '😊', color: '' },
//         { id: '2', name: 'Cool', type: 'emotion', emoji: '😎', color: '' },
//         { id: '3', name: 'Thinking', type: 'emotion', emoji: '🤔', color: '' },
//         { id: '4', name: 'Excited', type: 'emotion', emoji: '🤩', color: '' },
//         { id: '5', name: 'Proud', type: 'emotion', emoji: '😌', color: '' }
//     ];

//     // Damit
//     const outfitOptions: AvatarPart[] = [
//         { id: '1', name: 'Casual', type: 'outfit', emoji: '👕', color: '#3b82f6' },
//         { id: '2', name: 'Formal', type: 'outfit', emoji: '🎩', color: '#000000' },
//         { id: '3', name: 'Sports', type: 'outfit', emoji: '🏅', color: '#10b981' },
//         { id: '4', name: 'Superhero', type: 'outfit', emoji: '🦸', color: '#f59e0b' },
//         { id: '5', name: 'Wizard', type: 'outfit', emoji: '🧙', color: '#8b5cf6' }
//     ];

//     // Pants
//     const pantOptions: AvatarPart[] = [
//         { id: '1', name: 'Shorts', type: 'outfit', emoji: '/Character/Avatar/pants/pantsdefault.png', color: '#3b82f6' },
//         { id: '2', name: 'Skirt', type: 'outfit', emoji: '/Character/Avatar/pants/pants1.png', color: '#000000' }
//     ];

//      // Shoes
//     const shoeOptions: AvatarPart[] = [
//         { id: '1', name: 'Shorts', type: 'outfit', emoji: '/Character/Avatar/pants/pantsdefault.png', color: '#3b82f6' },
//         { id: '2', name: 'Skirt', type: 'outfit', emoji: '/Character/Avatar/pants/pants1.png', color: '#000000' }
//     ];

//     // Accessory
//     const accessoryOptions: AvatarPart[] = [
//         { id: '0', name: 'Wala', type: 'accessory', emoji: '', color: '' },
//         { id: '1', name: 'Glasses', type: 'accessory', emoji: '👓', color: '#000000' },
//         { id: '2', name: 'Hat', type: 'accessory', emoji: '🎓', color: '#8b4513' },
//         { id: '3', name: 'Crown', type: 'accessory', emoji: '👑', color: '#fbbf24' },
//         { id: '4', name: 'Headphones', type: 'accessory', emoji: '🎧', color: '#64748b' }
//     ];

//     const categoryOptions: Record<string, AvatarPart[]> = {
//         body: bodyOptions,
//         hair: hairOptions,
//         eyes: eyesOptions, // Reusing hair options for eyes for simplicity
//         mouth: mouthOptions, // Reusing hair options for mouth for simplicity
//         outfit: outfitOptions,
//         pants: pantOptions,
//         shoes: shoeOptions,
//         accessory: accessoryOptions,
//     };

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';

type AvatarCategory =
    | 'katawan'
    | 'hair'
    | 'eyes'
    | 'mouth'
    | 'damit'
    | 'pants'
    | 'shoes'
    | 'accessory';

interface AvatarPart {
    id: string;
    name: string;
    type: AvatarCategory;
    src: string;
}

interface AvatarCustomization {
    katawan: AvatarPart;
    hair: AvatarPart;
    eyes: AvatarPart;
    mouth: AvatarPart;
    damit: AvatarPart;
    pants: AvatarPart;
    shoes: AvatarPart;
    accessory: AvatarPart;
}

type AvatarItem = AvatarPart & {
    hides?: AvatarCategory[];
};

const katawanOptions: AvatarPart[] = [
    { id: '1', name: 'Boy 1', type: 'katawan', src: '/Character/Avatar/katawan/b1.png' },
    { id: '2', name: 'Boy 2', type: 'katawan', src: '/Character/Avatar/katawan/b2.png' },
    { id: '3', name: 'Boy 3', type: 'katawan', src: '/Character/Avatar/katawan/b3.png' },
    { id: '4', name: 'Boy 4', type: 'katawan', src: '/Character/Avatar/katawan/b4.png' },
    { id: '5', name: 'Boy 5', type: 'katawan', src: '/Character/Avatar/katawan/b5.png' },
    { id: '6', name: 'Boy 6', type: 'katawan', src: '/Character/Avatar/katawan/b6.png' },
    { id: '7', name: 'Boy 7', type: 'katawan', src: '/Character/Avatar/katawan/b7.png' },
    { id: '8', name: 'Boy 8', type: 'katawan', src: '/Character/Avatar/katawan/b8.png' },
    { id: '9', name: 'Boy 9', type: 'katawan', src: '/Character/Avatar/katawan/b9.png' },
];

const hairOptions: AvatarItem[] = [
    { id: '1', name: 'Hair 1', type: 'hair', src: '/Character/Avatar/hair/bH1.png' },
    { id: '2', name: 'Hair 2', type: 'hair', src: '/Character/Avatar/hair/gH1.png' },
];

const eyesOptions: AvatarPart[] = [
    { id: '1', name: 'Default', type: 'eyes', src: '/Character/Avatar/eyes/eB1.png' },
    { id: '2', name: 'Boy Black 1', type: 'eyes', src: '/Character/Avatar/eyes/eBBck1.png' },
    { id: '3', name: 'Girl Black 1', type: 'eyes', src: '/Character/Avatar/eyes/eGBck1.png' },
];

const mouthOptions: AvatarPart[] = [
    { id: '1', name: 'Default', type: 'mouth', src: '/Character/Avatar/mouth/m1.png' },
];

const damitOptions: AvatarPart[] = [
    { id: '1', name: 'Outfit 1', type: 'damit', src: '/Character/Avatar/damit/d1.png' },
    { id: '2', name: 'Outfit 2', type: 'damit', src: '/Character/Avatar/damit/d3.png' },
];

const pantsOptions: AvatarPart[] = [
    { id: '1', name: 'Pants 1', type: 'pants', src: '/Character/Avatar/pants/p1.png' },
    { id: '2', name: 'Pants 2', type: 'pants', src: '/Character/Avatar/pants/p2.png' },
];

const shoesOptions: AvatarPart[] = [
    { id: '1', name: 'Boy Shoes', type: 'shoes', src: '/Character/Avatar/shoes/sB1.png' },
    { id: '2', name: 'Girl Shoes', type: 'shoes', src: '/Character/Avatar/shoes/sG1.png' },
];

const accessoryOptions: AvatarItem[] = [
    { id: '0', name: 'None', type: 'accessory', src: '' },
    { id: '1', name: 'Beanie', type: 'accessory', src: '/Character/Avatar/accesories/eg1.png' },
    { id: '2', name: 'Glasses', type: 'accessory', src: '/Character/Avatar/accesories/eg2.png' },
];

const categoryLabels: Record<AvatarCategory, string> = {
    katawan: 'Katawan',
    hair: 'Buhok',
    eyes: 'Mata',
    mouth: 'Bibig',
    damit: 'Damit',
    pants: 'Pants',
    shoes: 'Shoes',
    accessory: 'Accessory',
};

const defaultCustomization = (): AvatarCustomization => ({
    katawan: katawanOptions[0],
    hair: hairOptions[0],
    eyes: eyesOptions[0],
    mouth: mouthOptions[0],
    damit: damitOptions[0],
    pants: pantsOptions[0],
    shoes: shoesOptions[0],
    accessory: accessoryOptions[0],
});

const categoryOptions: Record<AvatarCategory, AvatarItem[]> = {
    katawan: katawanOptions,
    hair: hairOptions,
    eyes: eyesOptions,
    mouth: mouthOptions,
    damit: damitOptions,
    pants: pantsOptions,
    shoes: shoesOptions,
    accessory: accessoryOptions,
};

const normalizePart = (value: any, fallback: AvatarPart): AvatarPart => {
    if (!value || typeof value !== 'object') {
        return fallback;
    }

    return {
        id: String(value.id ?? fallback.id),
        name: String(value.name ?? fallback.name),
        type: fallback.type,
        src: String(value.src ?? value.emoji ?? fallback.src ?? ''),
    };
};

export const StudentAvatarCustomization = () => {
    const [activeCategory, setActiveCategory] = useState<AvatarCategory>('katawan');
    const [customization, setCustomization] = useState<AvatarCustomization>(defaultCustomization);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const avatarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadAvatar = async () => {
            try {
                const studentApi = (apiClient.student as any);
                if (typeof studentApi.getAvatarCustomization !== 'function') {
                    return;
                }

                const result = await studentApi.getAvatarCustomization();
                if (result?.success && result.data) {
                    const fallback = defaultCustomization();
                    setCustomization({
                        katawan: normalizePart(result.data.katawan, fallback.katawan),
                        hair: normalizePart(result.data.hair, fallback.hair),
                        eyes: normalizePart(result.data.eyes, fallback.eyes),
                        mouth: normalizePart(result.data.mouth, fallback.mouth),
                        damit: normalizePart(result.data.damit, fallback.damit),
                        pants: normalizePart(result.data.pants, fallback.pants),
                        shoes: normalizePart(result.data.shoes, fallback.shoes),
                        accessory: normalizePart(result.data.accessory, fallback.accessory),
                    });
                }
            } catch (error) {
                console.error('Error loading avatar:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAvatar();
    }, []);

    const handleSaveAvatar = async () => {
        try {
            setIsSaving(true);
            setSaveMessage('');

            const studentApi = (apiClient.student as any);
            if (typeof studentApi.saveAvatarCustomization !== 'function') {
                setSaveMessage('❌ Save unavailable');
                return;
            }

            const result = await studentApi.saveAvatarCustomization(customization);
            if (result?.success) {
                setSaveMessage('✅ Avatar saved!');
            } else {
                setSaveMessage('❌ Failed to save');
            }
        } catch (error) {
            console.error('Error saving avatar:', error);
            setSaveMessage('❌ Error saving');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };

    const handleSelectPart = (part: AvatarItem) => {
        setCustomization((prev) => ({
            ...prev,
            [part.type]: part,
        }));
    };

    const hiddenLayers = useMemo(() => {
        const hidden = new Set<AvatarCategory>();
        Object.values(customization).forEach((part) => {
            const rule = (part as AvatarItem).hides;
            rule?.forEach((layer) => hidden.add(layer));
        });
        return hidden;
    }, [customization]);

    const renderOrder: AvatarCategory[] = [
        'katawan',
        'pants',
        'damit',
        'shoes',
        'accessory',
        'mouth',
        'eyes',
        'hair',
    ];

    if (isLoading) {
        return (
            <div className="min-h-full p-8 flex items-center justify-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                    <div className="text-6xl mb-4">⏳</div>
                    <p className="text-white text-xl">Loading avatar...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-full p-8">
            <h1 className="text-4xl font-black text-white mb-6">✨ Avatar Customization</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="p-6 rounded-xl">
                    <h2 className="text-white mb-4 text-center">Preview</h2>

                    <div
                        ref={avatarRef}
                        data-avatar
                        className="mx-auto relative w-64 h-64"
                        style={{ backgroundColor: 'transparent' }}
                    >
                        {renderOrder.map((key) => {
                            if (hiddenLayers.has(key)) return null;
                            const part = customization[key];
                            if (!part?.src) return null;

                            return (
                                <img
                                    key={key}
                                    src={part.src}
                                    crossOrigin="anonymous"
                                    className="absolute top-0 left-0 w-full h-full object-contain"
                                    alt={part.name}
                                />
                            );
                        })}
                    </div>

                    <button
                        onClick={handleSaveAvatar}
                        disabled={isSaving}
                        className="w-full mt-6 px-4 py-3 bg-brand-purple hover:shadow-lg hover:shadow-purple-500/40 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? '⏳ Saving...' : '💾 I-save ang Avatar'}
                    </button>

                    {saveMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 text-center text-sm font-semibold text-white"
                        >
                            {saveMessage}
                        </motion.div>
                    )}
                </div>

                <div className="lg:col-span-2">
                    <div className="flex flex-wrap gap-2 mb-6">
                        {(Object.keys(categoryOptions) as AvatarCategory[]).map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-3 py-2 rounded transition-colors ${
                                    activeCategory === category ? 'bg-purple-600 text-white' : 'bg-gray-700 text-slate-200'
                                }`}
                            >
                                {categoryLabels[category]}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeCategory}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="grid grid-cols-2 md:grid-cols-3 gap-4"
                        >
                            {categoryOptions[activeCategory].map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleSelectPart(option)}
                                    className={`p-4 rounded bg-gray-800 border transition-colors ${
                                        customization[activeCategory].id === option.id
                                            ? 'border-purple-500 bg-gray-700'
                                            : 'border-gray-700 hover:border-purple-400'
                                    }`}
                                >
                                    {option.src ? (
                                        <img src={option.src} className="w-16 h-16 mx-auto object-contain" alt={option.name} />
                                    ) : (
                                        <div className="w-16 h-16 mx-auto flex items-center justify-center text-slate-400">None</div>
                                    )}
                                    <p className="text-white text-sm text-center mt-2">{option.name}</p>
                                </button>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};