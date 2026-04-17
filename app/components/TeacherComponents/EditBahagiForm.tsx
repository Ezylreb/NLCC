'use client';

import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface EditBahagiFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  bahagi: any;
  isLoading?: boolean;
}

export const EditBahagiForm: React.FC<EditBahagiFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bahagi,
  isLoading = false
}) => {
  const [title, setTitle] = useState(bahagi?.title || '');
  const [description, setDescription] = useState(bahagi?.description || '');
  const [iconPreview, setIconPreview] = useState(bahagi?.icon_path || '/Character/NLLCTeachHalf1.png');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const predefinedIcons = [
    '/Character/NLLCTeachHalf1.png',
    '/Character/NLLCTeachHalf2.png',
    '/Character/NLLCTeachHalf3.png',
    '/Character/NLLCTeachHalf4.png'
  ];

  const handleIconSelect = (iconPath: string) => {
    setIconPreview(iconPath);
    setIconFile(null);
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setIconPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    const submitData: any = {
      id: bahagi.id,
      title,
      description
    };

    // Only include iconPath if it has changed or is not null
    if (iconPreview) {
      submitData.iconPath = iconPreview;
    }

    console.log('📝 Submitting bahagi data:', submitData);

    // If there's a new file to upload
    if (iconFile) {
      setUploading(true);
      try {
        console.log('📤 Uploading icon file...');

        const uploadResult = await apiClient.upload.uploadFile(iconFile, 'icon');

        if (uploadResult.success) {
          const uploadedUrl = uploadResult.data?.url || uploadResult.data?.path || uploadResult.data?.file_url;
          console.log('✅ Icon uploaded:', uploadResult);
          submitData.iconPath = uploadedUrl;
        } else {
          throw new Error(uploadResult.error || 'Upload failed');
        }
      } catch (err) {
        console.error('Icon upload error:', err);
        alert(`Failed to upload icon: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    console.log('🚀 Final submit data:', submitData);
    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-2xl text-slate-500 hover:text-white transition-colors"
        >
          ✕
        </button>

        <h2 className="text-3xl font-black text-white tracking-tight mb-2">Edit Bahagi</h2>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-8">
          Update Bahagi details and icon
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bahagi title"
              className="w-full bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all placeholder:text-slate-700"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold focus:border-brand-purple outline-none transition-all placeholder:text-slate-700 resize-none"
            />
          </div>

          {/* Icon Selection Section */}
          <div className="border-t border-slate-700 pt-6">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-4">
              Bahagi Icon
            </label>

            {/* Icon Preview */}
            <div className="mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex items-center justify-center">
              <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-purple-500/30">
                <img
                  src={iconPreview}
                  alt="Icon preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/Character/NLLCTeachHalf1.png';
                  }}
                />
              </div>
            </div>

            {/* Predefined Icons */}
            <div className="mb-4">
              <p className="text-xs text-slate-400 font-bold mb-3">Predefined Icons:</p>
              <div className="grid grid-cols-4 gap-2">
                {predefinedIcons.map((icon, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleIconSelect(icon)}
                    className="relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all"
                    style={{
                      borderColor: iconPreview === icon ? '#a855f7' : '#334155'
                    }}
                  >
                    <img
                      src={icon}
                      alt={`Icon ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/Character/NLLCTeachHalf1.png';
                      }}
                    />
                    {iconPreview === icon && (
                      <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                        <span className="text-2xl">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Custom Icon */}
            <div>
              <p className="text-xs text-slate-400 font-bold mb-3">Upload Custom Icon:</p>
              <label className="relative block w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-900/50">
                  <Upload className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-300">Drop image or click to upload</p>
                  <p className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-sm uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || uploading}
              className="flex-1 px-4 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading || uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <span>💾</span> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
