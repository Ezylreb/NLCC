'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader } from 'lucide-react';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';

interface BahagiIconSelectorProps {
    bahagiId: number;
    currentIcon?: string;
    currentIconType?: string;
    onClose: () => void;
    onSuccess?: (iconPath: string, iconType: string) => void;
    userId: string;
}

export const BahagiIconSelector: React.FC<BahagiIconSelectorProps> = ({
    bahagiId,
    currentIcon,
    currentIconType = 'default',
    onClose,
    onSuccess,
    userId
}) => {
    const [selectedIcon, setSelectedIcon] = useState<string>(currentIcon || '');
    const [selectedType, setSelectedType] = useState<'default' | 'custom'>(
        (currentIconType as 'default' | 'custom') || 'default'
    );
    const [customFile, setCustomFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const predefinedIcons = [
        { name: 'NLLCTeachHalf1.png', path: '/Character/NLLCTeachHalf1.png' },
        { name: 'NLLCTeachHalf2.png', path: '/Character/NLLCTeachHalf2.png' },
        { name: 'NLLCTeachHalf3.png', path: '/Character/NLLCTeachHalf3.png' },
        { name: 'NLLCTeachHalf4.png', path: '/Character/NLLCTeachHalf4.png' }
    ];

    const handlePredefinedSelect = (iconName: string, iconPath: string) => {
        setSelectedIcon(iconName);
        setSelectedType('default');
        setCustomFile(null);
        setPreview('');
    };

    const handleCustomFileSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError('Image must be less than 2MB');
            return;
        }

        setCustomFile(file);
        setSelectedType('custom');
        setSelectedIcon(file.name);

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!selectedIcon) {
            setError('Please select an icon');
            return;
        }

        setLoading(true);
        try {
            let iconUrl = '';

            if (selectedType === 'custom' && customFile) {
                // Upload custom image
                const uploadResult = await apiClient.upload.uploadFile(customFile, 'image');
                if (!uploadResult.success) throw new Error('Upload failed');
                iconUrl = uploadResult.data?.url || uploadResult.data?.path || uploadResult.data?.file_url;
            } else if (selectedType === 'default') {
                // Use predefined icon path
                const icon = predefinedIcons.find(i => i.name === selectedIcon);
                iconUrl = icon?.path || selectedIcon;
            }

            // Update bahagi with new icon
            const updateResult = await apiClient.bahagi.update(bahagiId, {
                image_url: iconUrl
            });

            if (!updateResult.success) throw new Error(updateResult.error || 'Failed to update Bahagi icon');
            onSuccess?.(iconUrl, selectedType);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save icon');
        } finally {
            setLoading(false);
        }
    };

    const getDisplayPath = () => {
        if (selectedType === 'default') {
            const icon = predefinedIcons.find(i => i.name === selectedIcon);
            return icon?.path;
        }
        return preview || selectedIcon;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex justify-between items-center rounded-t-lg">
                    <h2 className="text-2xl font-bold">Select Bahagi Icon</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Preview Section */}
                    {getDisplayPath() && (
                        <div className="flex justify-center">
                            <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300">
                                <img
                                    src={getDisplayPath()!}
                                    alt="Icon preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-gray-300">
                        <button
                            onClick={() => {
                                setSelectedType('default');
                                setCustomFile(null);
                                setPreview('');
                            }}
                            className={`px-4 py-2 font-medium border-b-2 transition ${
                                selectedType === 'default'
                                    ? 'border-purple-600 text-purple-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Predefined Icons
                        </button>
                        <button
                            onClick={() => setSelectedType('custom')}
                            className={`px-4 py-2 font-medium border-b-2 transition ${
                                selectedType === 'custom'
                                    ? 'border-purple-600 text-purple-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Upload Custom
                        </button>
                    </div>

                    {/* Predefined Icons */}
                    {selectedType === 'default' && (
                        <div className="grid grid-cols-2 gap-4">
                            {predefinedIcons.map(icon => (
                                <button
                                    key={icon.name}
                                    onClick={() => handlePredefinedSelect(icon.name, icon.path)}
                                    className={`relative p-4 rounded-lg border-2 transition overflow-hidden ${
                                        selectedIcon === icon.name
                                            ? 'border-purple-600 bg-purple-50'
                                            : 'border-gray-300 hover:border-purple-400'
                                    }`}
                                >
                                    <div className="relative w-full h-32 bg-gray-100 rounded mb-2">
                                        <img
                                            src={icon.path}
                                            alt={icon.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <p className="text-sm font-medium text-center truncate">
                                        {icon.name.replace('.png', '')}
                                    </p>
                                    {selectedIcon === icon.name && (
                                        <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                                            ✓
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Custom Upload */}
                    {selectedType === 'custom' && (
                        <div className="space-y-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-purple-300 rounded-lg p-8 hover:border-purple-600 transition text-center"
                            >
                                <Upload className="mx-auto mb-2 text-purple-600" size={32} />
                                <p className="text-sm font-medium text-gray-700">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    PNG, JPG, GIF (Max 2MB)
                                </p>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={e => {
                                    if (e.target.files?.[0]) {
                                        handleCustomFileSelect(e.target.files[0]);
                                    }
                                }}
                                className="hidden"
                            />
                            {customFile && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm font-medium text-green-700">
                                        ✓ File selected: {customFile.name}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-300 p-6 flex justify-end gap-3 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !selectedIcon}
                        className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-medium"
                    >
                        {loading ? (
                            <>
                                <Loader size={18} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Icon'
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
