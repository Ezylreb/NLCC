// 'use client';

// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { apiClient } from '@/lib/api-client';

// interface StudentAvatarCustomizationProps {
//     studentId?: string;
// }

// interface AvatarPart {
//     id: string;
//     name: string;
//     type: 'body' | 'hair' | 'outfit' | 'accessory' | 'emotion' | 'hairColor' | 'eyes' | 'mouth' | 'pants' | 'shoes';
//     emoji: string;
//     color?: string;
// }

// interface AvatarCustomization {
//     body: AvatarPart;
//     hair: AvatarPart;
//     hairColor: AvatarPart;
//     eyes: AvatarPart;
//     mouth: AvatarPart;
//     outfit: AvatarPart;
//     pants: AvatarPart;
//     shoes: AvatarPart;
//     accessory: AvatarPart;
//     emotion: AvatarPart;
// }

// export const StudentAvatarCustomization: React.FC<StudentAvatarCustomizationProps> = ({ studentId }) => {
//     const [customization, setCustomization] = useState<AvatarCustomization>({
//         body: { id: '1', name: 'Standard', type: 'body', emoji: '/Character/Avatar/katawan/b1.png', color: '#60a5fa' },
//         hair: { id: '1', name: 'Kulot', type: 'hair', emoji: '/Character/Avatar/hair/bH1.png', color: '#8b4513' },
//         hairColor: { id: '1', name: 'hBlack', type: 'hair', emoji: '/Character/Avatar/hair/bH1.png', color: '#8b4513' },
//         eyes: { id: '1', name: 'hBlack', type: 'hair', emoji: '🧑Black', color: '#8b4513' },
//         mouth: { id: '1', name: 'hBlack', type: 'hair', emoji: '🧑Black', color: '#8b4513' },
//         outfit: { id: '1', name: 'Casual', type: 'outfit', emoji: '👕', color: '#3b82f6' },
//         pants: { id: '1', name: 'Shorts', type: 'outfit', emoji: '/Character/Avatar/pants/pantsdefault.png', color: '#3b82f6' },
//         shoes: { id: '1', name: 'Shorts', type: 'outfit', emoji: '/Character/Avatar/pants/pantsdefault.png', color: '#3b82f6' },
//         accessory: { id: '0', name: 'Wala', type: 'accessory', emoji: '', color: '' },
//         emotion: { id: '1', name: 'Happy', type: 'emotion', emoji: '😊', color: '' }
//     });

//     const [activeCategory, setActiveCategory] = useState<'body' | 'hair' | 'outfit' | 'accessory' | 'emotion'>('body');
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [isSaving, setIsSaving] = useState(false);

//     useEffect(() => {
//         // If studentId is provided as prop, ensure it's in localStorage
//         if (studentId && typeof window !== 'undefined') {
//             try {
//                 const userStr = localStorage.getItem('nllc_user');
//                 if (userStr) {
//                     const user = JSON.parse(userStr);
//                     if (!user.id) {
//                         user.id = studentId;
//                         localStorage.setItem('nllc_user', JSON.stringify(user));
//                     }
//                 } else {
//                     // No user in localStorage, create a temporary entry with just the ID
//                     localStorage.setItem('nllc_user', JSON.stringify({ id: studentId }));
//                 }
//             } catch (e) {
//                 console.error('Failed to update localStorage with student ID:', e);
//             }
//         }
//     }, [studentId]);

//     useEffect(() => {
//         // Fetch saved avatar customization
//         const fetchAvatarCustomization = async () => {
//             try {
//                 setIsLoading(true);
//                 setError(null);

//                 // Use provided studentId prop or fall back to localStorage
//                 let id = studentId;
//                 if (!id) {
//                     const savedUser = localStorage.getItem('nllc_user');
//                     if (savedUser) {
//                         try {
//                             const user = JSON.parse(savedUser);
//                             id = user.id;
//                         } catch (e) {
//                             console.error('Failed to parse user from localStorage:', e);
//                         }
//                     }
//                 }

//                 if (!id) {
//                     setError('User session not found. Please log in again.');
//                     return;
//                 }

//                 const result = await apiClient.student.getAvatarCustomization();

//                 if (result.success && result.data) {
//                     // Transform API data to component format
//                     setCustomization(result.data);
//                 }
//             } catch (error) {
//                 console.error('Failed to fetch avatar customization:', error);
//                 setError('Using default avatar customization');
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         fetchAvatarCustomization();
//     }, [studentId]);

//     const handleSaveCustomization = async () => {
//         try {
//             setIsSaving(true);

//             // Ensure we have a valid student ID before saving
//             const savedUser = localStorage.getItem('nllc_user');
//             if (!savedUser) {
//                 console.error('User session not found');
//                 return;
//             }

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

//     const handleSelectPart = (part: AvatarPart) => {
//         setCustomization({
//             ...customization,
//             [part.type]: part
//         });
//     };

//     const getCategoryLabel = (category: string) => {
//         const labels: Record<string, string> = {
//             body: 'Katawan',
//             hair: 'Buhok',
//             outfit: 'Damit',
//             accessory: 'Accessory',
//             emotion: 'Emosyon'
//         };
//         return labels[category] || category;
//     };

//     return (
//         <div className="min-h-full p-8">
//             <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.6 }}
//             >
//                 {/* Header */}
//                 <div className="mb-8">
//                     <h1 className="text-4xl font-black text-white mb-2">✨ Avatar Customization</h1>
//                     <p className="text-slate-400">I-personalisa ang iyong avatar</p>
//                 </div>

//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                     {/* Preview Section */}
//                     <motion.div
//                         initial={{ opacity: 0, x: -20 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         className="lg:col-span-1"
//                     >
//                         <div className="bg-gradient-to-b from-brand-purple/20 to-brand-sky/10 border border-brand-purple/40 rounded-2xl p-8 sticky top-8">
//                             <h2 className="text-white font-bold mb-6 text-center">Inyong Avatar</h2>

//                             {/* Avatar Preview */}
//                             <div className="flex flex-col items-center justify-center py-12 bg-slate-900/50 rounded-xl mb-6 min-h-[250px]">
//                                 <motion.div
//                                     key={`${customization.body.id}-${customization.hair.id}-${customization.outfit.id}`}
//                                     initial={{ scale: 0.8, opacity: 0 }}
//                                     animate={{ scale: 1, opacity: 1 }}
//                                     transition={{ duration: 0.4 }}
//                                     className="text-center"
//                                 >
//                                     <div className="text-7xl mb-4">{customization.body.emoji}</div>
//                                     <div className="flex gap-4 justify-center mb-4">
//                                         <div className="text-5xl">{customization.hair.emoji}</div>
//                                         <div className="text-5xl">{customization.outfit.emoji}</div>
//                                         {customization.accessory.emoji && <div className="text-5xl">{customization.accessory.emoji}</div>}
//                                     </div>
//                                     <div className="text-6xl">{customization.emotion.emoji}</div>
//                                 </motion.div>
//                             </div>

//                             {/* Avatar Stats */}
//                             <div className="space-y-2 text-sm">
//                                 <div className="flex justify-between text-slate-400">
//                                     <span>Katawan:</span>
//                                     <span className="text-white font-semibold">{customization.body.name}</span>
//                                 </div>
//                                 <div className="flex justify-between text-slate-400">
//                                     <span>Buhok:</span>
//                                     <span className="text-white font-semibold">{customization.hair.name}</span>
//                                 </div>
//                                 <div className="flex justify-between text-slate-400">
//                                     <span>Damit:</span>
//                                     <span className="text-white font-semibold">{customization.outfit.name}</span>
//                                 </div>
//                                 {customization.accessory.id !== '0' && (
//                                     <div className="flex justify-between text-slate-400">
//                                         <span>Accessory:</span>
//                                         <span className="text-white font-semibold">{customization.accessory.name}</span>
//                                     </div>
//                                 )}
//                                 <div className="flex justify-between text-slate-400 pt-2 border-t border-white/10">
//                                     <span>Emosyon:</span>
//                                     <span className="text-white font-semibold">{customization.emotion.name}</span>
//                                 </div>
//                             </div>

//                             {/* Save Button */}
//                             <button className="w-full mt-6 px-4 py-3 bg-brand-purple hover:shadow-lg hover:shadow-purple-500/40 text-white rounded-lg font-bold transition-all">
//                                 💾 I-save ang Avatar
//                             </button>
//                         </div>
//                     </motion.div>

//                     {/* Customization Options */}
//                     <motion.div
//                         initial={{ opacity: 0, x: 20 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         className="lg:col-span-2"
//                     >
//                         {/* Category Tabs */}
//                         <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
//                             {(['body', 'hair', 'outfit', 'accessory', 'emotion'] as const).map((category) => (
//                                 <button
//                                     key={category}
//                                     onClick={() => setActiveCategory(category)}
//                                     className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${activeCategory === category
//                                             ? 'bg-brand-purple text-white shadow-lg shadow-purple-500/40'
//                                             : 'bg-white/10 text-slate-300 hover:bg-white/20'
//                                         }`}
//                                 >
//                                     {getCategoryLabel(category)}
//                                 </button>
//                             ))}
//                         </div>

//                         {/* Options Grid */}
//                         <AnimatePresence mode="wait">
//                             <motion.div
//                                 key={activeCategory}
//                                 initial={{ opacity: 0, y: 20 }}
//                                 animate={{ opacity: 1, y: 0 }}
//                                 exit={{ opacity: 0, y: -20 }}
//                                 className="grid grid-cols-2 md:grid-cols-3 gap-4"
//                             >
//                                 {categoryOptions[activeCategory]?.map((option, idx) => (
//                                     <motion.button
//                                         key={option.id}
//                                         initial={{ opacity: 0, scale: 0.9 }}
//                                         animate={{ opacity: 1, scale: 1 }}
//                                         transition={{ delay: idx * 0.05 }}
//                                         onClick={() => handleSelectPart(option)}
//                                         className={`p-6 rounded-xl border-2 transition-all ${customization[activeCategory].id === option.id
//                                                 ? 'bg-brand-purple/30 border-brand-purple shadow-lg shadow-purple-500/30'
//                                                 : 'bg-white/5 border-white/20 hover:border-brand-purple/50 hover:bg-white/10'
//                                             }`}
//                                     >
//                                         <div className="text-5xl mb-2 text-center">{option.emoji}</div>
//                                         <p className="text-sm font-semibold text-white text-center">{option.name}</p>
//                                     </motion.button>
//                                 ))}
//                             </motion.div>
//                         </AnimatePresence>
//                     </motion.div>
//                 </div>

//                 {/* Tips Section */}
//                 <motion.div
//                     initial={{ opacity: 0 }}
//                     animate={{ opacity: 1 }}
//                     transition={{ delay: 0.6 }}
//                     className="mt-12 p-6 bg-brand-purple/10 border border-brand-purple/30 rounded-xl"
//                 >
//                     <p className="text-brand-purple font-bold mb-2">💡 Tips:</p>
//                     <ul className="text-slate-300 text-sm space-y-1">
//                         <li>• I-personalize ang iyong avatar upang mas maging kawili-wili ang karanasan</li>
//                         <li>• Maaari kang magbago ng avatar anumang oras</li>
//                         <li>• Makakatipid ka ng mga bagong accessories sa pamamagitan ng pagtatapos ng mga misyon</li>
//                     </ul>
//                 </motion.div>
//             </motion.div>
//         </div>
//     );
// };
// 'use client';

// import React, { useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';

// interface AvatarPart {
//     id: string;
//     name: string;
//     type:
//         | 'katawan'
//         | 'hair'
//         | 'eyes'
//         | 'mouth'
//         | 'damit'
//         | 'pants'
//         | 'shoes'
//         | 'accessory';
//     src: string;
// }

// interface AvatarCustomization {
//     katawan: AvatarPart;
//     hair: AvatarPart;
//     eyes: AvatarPart;
//     mouth: AvatarPart;
//     damit: AvatarPart;
//     pants: AvatarPart;
//     shoes: AvatarPart;
//     accessory: AvatarPart;
// }

// export const StudentAvatarCustomization = () => {
//     const [activeCategory, setActiveCategory] =
//         useState<keyof AvatarCustomization>('katawan');

//     const [customization, setCustomization] = useState<AvatarCustomization>({
//         katawan: {
//             id: '1',
//             name: 'Default Boy',
//             type: 'katawan',
//             src: '/Character/Avatar/DefaultBoy.png'
//         },
//         hair: {
//             id: '1',
//             name: 'Hair 1',
//             type: 'hair',
//             src: '/Character/Avatar/hair/bH1.png'
//         },
//         eyes: {
//             id: '1',
//             name: 'Eyes Default',
//             type: 'eyes',
//             src: '/Character/Avatar/kilay/KilayDefault.png'
//         },
//         mouth: {
//             id: '1',
//             name: 'Mouth Default',
//             type: 'mouth',
//             src: '/Character/Avatar/mouth/m1.png'
//         },
//         damit: {
//             id: '1',
//             name: 'Default Outfit',
//             type: 'damit',
//             src: '/Character/Avatar/damit/d1.png'
//         },
//         pants: {
//             id: '1',
//             name: 'Default Pants',
//             type: 'pants',
//             src: '/Character/Avatar/pants/pantsdefault.png'
//         },
//         shoes: {
//             id: '1',
//             name: 'Default Shoes',
//             type: 'shoes',
//             src: '/Character/Avatar/shoes/s1.png'
//         },
//         accessory: {
//             id: '0',
//             name: 'None',
//             type: 'accessory',
//             src: ''
//         }
//     });

//     // ================= OPTIONS =================

//     const katawanOptions: AvatarPart[] = [
//         {
//             id: '1',
//             name: 'Boy',
//             type: 'katawan',
//             src: '/Character/Avatar/DefaultBoy.png'
//         },
//         {
//             id: '2',
//             name: 'Girl',
//             type: 'katawan',
//             src: '/Character/Avatar/DefaultGirl.png'
//         }
//     ];

//     const hairOptions: AvatarPart[] = [
//         {
//             id: '1',
//             name: 'Hair 1',
//             type: 'hair',
//             src: '/Character/Avatar/hair/bH1.png'
//         },
//         {
//             id: '2',
//             name: 'Hair 2',
//             type: 'hair',
//             src: '/Character/Avatar/hair/gH1.png'
//         }
//     ];

//     const eyesOptions: AvatarPart[] = [
//         {
//             id: '1',
//             name: 'Default',
//             type: 'eyes',
//             src: '/Character/Avatar/kilay/KilayDefault.png'
//         }
//     ];

//     const mouthOptions: AvatarPart[] = [
//         {
//             id: '1',
//             name: 'Default',
//             type: 'mouth',
//             src: '/Character/Avatar/mouth/m1.png'
//         }
//     ];

//     const damitOptions: AvatarPart[] = [
//         {
//             id: '1',
//             name: 'Outfit 1',
//             type: 'damit',
//             src: '/Character/Avatar/damit/d1.png'
//         }
//     ];

//     const pantsOptions: AvatarPart[] = [
//         {
//             id: '1',
//             name: 'Default Pants',
//             type: 'pants',
//             src: '/Character/Avatar/pants/pantsdefault.png'
//         }
//     ];

//     const shoesOptions: AvatarPart[] = [
//         {
//             id: '1',
//             name: 'Default Shoes',
//             type: 'shoes',
//             src: '/Character/Avatar/shoes/s1.png'
//         }
//     ];

//     const accessoryOptions: AvatarPart[] = [
//         {
//             id: '0',
//             name: 'None',
//             type: 'accessory',
//             src: ''
//         }
//     ];

//     const categoryOptions: Record<string, AvatarPart[]> = {
//         katawan: katawanOptions,
//         hair: hairOptions,
//         eyes: eyesOptions,
//         mouth: mouthOptions,
//         damit: damitOptions,
//         pants: pantsOptions,
//         shoes: shoesOptions,
//         accessory: accessoryOptions
//     };

//     // ================= HANDLER =================

//     const handleSelectPart = (part: AvatarPart) => {
//         setCustomization((prev) => ({
//             ...prev,
//             [part.type]: part
//         }));
//     };

//     // ================= UI =================

//     return (
//         <div className="p-8">
//             <h1 className="text-3xl text-white mb-6">
//                 Avatar Customization
//             </h1>

//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                 {/* PREVIEW */}
//                 <div className="bg-slate-900 p-6 rounded-xl">
//                     <h2 className="text-white mb-4 text-center">
//                         Preview
//                     </h2>

//                     <div className="relative w-40 h-40 mx-auto">
//                         {/* Layered Avatar */}
//                         {Object.values(customization).map((part, index) =>
//                             part.src ? (
//                                 <img
//                                     key={index}
//                                     src={part.src}
//                                     className="absolute top-0 left-0 w-full h-full object-contain"
//                                     alt=""
//                                 />
//                             ) : null
//                         )}
//                     </div>
//                 </div>

//                 {/* OPTIONS */}
//                 <div className="lg:col-span-2">
//                     {/* Tabs */}
//                     <div className="flex flex-wrap gap-2 mb-6">
//                         {Object.keys(categoryOptions).map((cat) => (
//                             <button
//                                 key={cat}
//                                 onClick={() =>
//                                     setActiveCategory(
//                                         cat as keyof AvatarCustomization
//                                     )
//                                 }
//                                 className={`px-3 py-2 rounded ${
//                                     activeCategory === cat
//                                         ? 'bg-purple-600'
//                                         : 'bg-gray-700'
//                                 }`}
//                             >
//                                 {cat}
//                             </button>
//                         ))}
//                     </div>

//                     {/* Options */}
//                     <AnimatePresence mode="wait">
//                         <motion.div
//                             key={activeCategory}
//                             className="grid grid-cols-2 md:grid-cols-3 gap-4"
//                         >
//                             {categoryOptions[activeCategory].map(
//                                 (option) => (
//                                     <button
//                                         key={option.id}
//                                         onClick={() =>
//                                             handleSelectPart(option)
//                                         }
//                                         className="p-4 bg-gray-800 rounded"
//                                     >
//                                         {option.src && (
//                                             <img
//                                                 src={option.src}
//                                                 className="w-16 h-16 mx-auto"
//                                                 alt={option.name}
//                                             />
//                                         )}
//                                         <p className="text-white text-sm text-center mt-2">
//                                             {option.name}
//                                         </p>
//                                     </button>
//                                 )
//                             )}
//                         </motion.div>
//                     </AnimatePresence>
//                 </div>
//             </div>
//         </div>
//     );
// };

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AvatarPart {
    id: string;
    name: string;
    type:
    | 'katawan'
    | 'hair'
    | 'eyes'
    | 'mouth'
    | 'damit'
    | 'pants'
    | 'shoes'
    | 'accessory';
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
    hides?: (keyof AvatarCustomization)[];
};

export const StudentAvatarCustomization = () => {
    const [activeCategory, setActiveCategory] =
        useState<keyof AvatarCustomization>('katawan');

    const [customization, setCustomization] = useState<AvatarCustomization>({
        katawan: {
            id: '1',
            name: 'Default Boy',
            type: 'katawan',
            src: '/Character/Avatar/katawan/b1.png'
        },
        hair: {
            id: '1',
            name: 'Hair 1',
            type: 'hair',
            src: '/Character/Avatar/hair/bH1.png'
        },
        eyes: {
            id: '1',
            name: 'Eyes Default',
            type: 'eyes',
            src: '/Character/Avatar/eyes/eBBck1.png'
        },
        mouth: {
            id: '1',
            name: 'Mouth Default',
            type: 'mouth',
            src: '/Character/Avatar/mouth/m1.png'
        },
        damit: {
            id: '1',
            name: 'Default Outfit',
            type: 'damit',
            src: '/Character/Avatar/damit/d1.png'
        },
        pants: {
            id: '1',
            name: 'Default Pants',
            type: 'pants',
            src: '/Character/Avatar/pants/p1.png'
        },
        shoes: {
            id: '1',
            name: 'Default Shoes',
            type: 'shoes',
            src: '/Character/Avatar/shoes/sB1.png'
        },
        accessory: {
            id: '0',
            name: 'None',
            type: 'accessory',
            src: '/Character/Avatar/accesories/eg1.png'
        }
    });

    // LAYER ORDER (IMPORTANT)
    const renderOrder: (keyof AvatarCustomization)[] = [
        'katawan',
        'pants',
        'damit',
        'shoes',
        'accessory',
        'mouth',
        'eyes',
        'hair'
    ];

    // OPTIONS
    const katawanOptions: AvatarPart[] = [
        { id: '1', name: 'Boy 1', type: 'katawan', src: '/Character/Avatar/katawan/b1.png' },
        { id: '2', name: 'Boy 2', type: 'katawan', src: '/Character/Avatar/katawan/b2.png' },
        { id: '3', name: 'Boy 3', type: 'katawan', src: '/Character/Avatar/katawan/b3.png' },
        { id: '4', name: 'Boy 4', type: 'katawan', src: '/Character/Avatar/katawan/b4.png' },
        { id: '5', name: 'Boy 5', type: 'katawan', src: '/Character/Avatar/katawan/b5.png' },
        { id: '6', name: 'Boy 6', type: 'katawan', src: '/Character/Avatar/katawan/b6.png' },
        { id: '7', name: 'Boy 7', type: 'katawan', src: '/Character/Avatar/katawan/b7.png' },
        { id: '8', name: 'Boy 8', type: 'katawan', src: '/Character/Avatar/katawan/b8.png' },
        { id: '9', name: 'Boy 9', type: 'katawan', src: '/Character/Avatar/katawan/b9.png' }
    ];

    const hairOptions: AvatarItem[] = [
        { id: '1', name: 'Hair 1', type: 'hair', src: '/Character/Avatar/hair/bH1.png' },
        { id: '2', name: 'Hair 2', type: 'hair', src: '/Character/Avatar/hair/gH1.png' }
    ];

    const eyesOptions: AvatarPart[] = [
        { id: '1', name: 'Default', type: 'eyes', src: '/Character/Avatar/eyes/eB1.png' },
        { id: '2', name: 'Boy Black 1', type: 'eyes', src: '/Character/Avatar/eyes/eBBck1.png' },
        { id: '3', name: 'Girl Black 1', type: 'eyes', src: '/Character/Avatar/eyes/eGBck1.png' },
        { id: '4', name: 'Brown1', type: 'eyes', src: '/Character/Avatar/eyes/eGBr2.png' },
        { id: '5', name: 'Brown1', type: 'eyes', src: '/Character/Avatar/eyes/eGBr1.png' },
        { id: '6', name: 'Brown1', type: 'eyes', src: '/Character/Avatar/eyes/eGBr1.png' },
    ];

    const mouthOptions: AvatarPart[] = [
        { id: '1', name: 'Default', type: 'mouth', src: '/Character/Avatar/mouth/m1.png' }
    ];

    const damitOptions: AvatarPart[] = [
        { id: '1', name: 'Outfit 1', type: 'damit', src: '/Character/Avatar/damit/d1.png' },
        { id: '2', name: 'Outfit 3', type: 'damit', src: '/Character/Avatar/damit/d3.png' },
        { id: '3', name: 'Outfit 4', type: 'damit', src: '/Character/Avatar/damit/d4.png' }
    ];

    const pantsOptions: AvatarPart[] = [
        { id: '1', name: 'Pants1', type: 'pants', src: '/Character/Avatar/pants/p1.png' },
        { id: '2', name: 'Pants2', type: 'pants', src: '/Character/Avatar/pants/p2.png' }
    ];

    const shoesOptions: AvatarPart[] = [
        { id: '1', name: 'BoyShoes', type: 'shoes', src: '/Character/Avatar/shoes/sB1.png' },
         { id: '2', name: 'GirlShoes', type: 'shoes', src: '/Character/Avatar/shoes/sG1.png' }
    ];

    const hatOptions: AvatarItem[] = [
        {
            id: 'eyeglass1',
            name: 'None',
            type: 'accessory',
            src: '',
            //hides: ['hair']
        },
        {
            id: 'eyeglass2',
            name: 'Beanie',
            type: 'accessory',
            src: '/Character/Avatar/accesories/eg1.png',
            //hides: ['hair']
        },
        {
            id: 'eyeglass3',
            name: 'None',
            type: 'accessory',
            src: '/Character/Avatar/accesories/eg2.png',
            // hides: ['hair', 'eyes', 'mouth']
        }
        
    ];

    const categoryOptions: Record<string, AvatarPart[]> = {
        katawan: katawanOptions,
        hair: hairOptions,
        eyes: eyesOptions,
        mouth: mouthOptions,
        damit: damitOptions,
        pants: pantsOptions,
        shoes: shoesOptions,
        accessory: hatOptions
    };

    const handleSelectPart = (part: AvatarPart) => {
        setCustomization((prev) => ({
            ...prev,
            [part.type]: part
        }));
    };

    // HANDLE HIDDEN LAYERS
    const hiddenLayers = new Set<keyof AvatarCustomization>();

    Object.values(customization).forEach((part) => {
        const rule = (part as AvatarItem).hides;
        if (rule) {
            rule.forEach((layer) => hiddenLayers.add(layer));
        }
    });

    return (
        <div className="min-h-full p-8">
            {/* HEADER */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-4xl font-black text-white mb-2">
                    ✨ Avatar Customization
                </h1>
                <p className="text-slate-400 mb-8">
                    I-personalisa ang iyong avatar
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* PREVIEW CARD */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="bg-gradient-to-b from-brand-purple/20 to-brand-sky/10 border border-brand-purple/40 rounded-2xl p-8 sticky top-8">
                        <h2 className="text-white font-bold mb-6 text-center">
                            Inyong Avatar
                        </h2>

                        <div className="bg-slate-900/50 rounded-xl p-6 relative w-80 h-80 mx-auto">

                            {renderOrder.map((key) => {
                                if (hiddenLayers.has(key)) return null;

                                const part = customization[key];
                                if (!part?.src) return null;

                                return (
                                    <img
                                        key={key}
                                        src={part.src}
                                        className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
                                        style={{ zIndex: renderOrder.indexOf(key) }}
                                        alt=""
                                    />
                                );
                            })}
                        </div>

                        {/* SAVE BUTTON */}
                        <button className="w-full mt-6 px-4 py-3 bg-brand-purple hover:shadow-lg hover:shadow-purple-500/40 text-white rounded-lg font-bold transition-all">
                            💾 I-save ang Avatar
                        </button>
                    </div>
                </motion.div>

                {/* OPTIONS */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-2"
                >
                    {/* CATEGORY BUTTONS */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        {Object.keys(categoryOptions).map((cat) => (
                            <button
                                key={cat}
                                onClick={() =>
                                    setActiveCategory(cat as keyof AvatarCustomization)
                                }
                                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${activeCategory === cat
                                    ? 'bg-brand-purple text-white shadow-lg shadow-purple-500/40'
                                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* OPTIONS GRID */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeCategory}
                            className="grid grid-cols-2 md:grid-cols-3 gap-4"
                        >
                            {categoryOptions[activeCategory].map((option, idx) => (
                                <motion.button
                                    key={option.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => handleSelectPart(option)}
                                    className={`p-6 rounded-xl border-2 transition-all ${customization[activeCategory].id === option.id
                                        ? 'bg-brand-purple/30 border-brand-purple shadow-lg shadow-purple-500/30'
                                        : 'bg-white/5 border-white/20 hover:border-brand-purple/50 hover:bg-white/10'
                                        }`}
                                >
                                    {option.src && (
                                        <img
                                            src={option.src}
                                            className="w-16 h-16 mx-auto mb-2"
                                            alt={option.name}
                                        />
                                    )}
                                    <p className="text-sm font-semibold text-white text-center">
                                        {option.name}
                                    </p>
                                </motion.button>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};
