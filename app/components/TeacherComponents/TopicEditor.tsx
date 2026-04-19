'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface TopicData {
  id: string;
  title: string;
  content: string;
  images: string[];
  audio: string;
  quotes: { text: string; audio: string }[];
  isExpanded: boolean;
}

interface TopicEditorProps {
  topic: TopicData;
  index: number;
  total: number;
  onChange: (topic: TopicData) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

export const TopicEditor: React.FC<TopicEditorProps> = ({
  topic,
  index,
  total,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const quoteAudioInputRef = useRef<HTMLInputElement>(null);
  const lastSyncedContent = useRef<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeQuoteAudioIdx, setActiveQuoteAudioIdx] = useState<number>(-1);

  // Sync content into the contentEditable div when:
  // - The topic becomes expanded (collapsed → expanded, ref becomes available)
  // - Content changes externally (not from user typing)
  useEffect(() => {
    if (contentRef.current && topic.content !== lastSyncedContent.current) {
      contentRef.current.innerHTML = topic.content;
      lastSyncedContent.current = topic.content;
    }
  }, [topic.content, topic.isExpanded]);

  const update = (partial: Partial<TopicData>) => {
    onChange({ ...topic, ...partial });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        update({ images: [...topic.images, reader.result as string] });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      update({ audio: reader.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    update({ images: topic.images.filter((_, i) => i !== idx) });
  };

  const addQuote = () => {
    update({ quotes: [...topic.quotes, { text: '', audio: '' }] });
  };

  const updateQuote = (idx: number, value: string) => {
    const newQuotes = [...topic.quotes];
    newQuotes[idx] = { ...newQuotes[idx], text: value };
    update({ quotes: newQuotes });
  };

  const removeQuote = (idx: number) => {
    update({ quotes: topic.quotes.filter((_, i) => i !== idx) });
  };

  const handleQuoteAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeQuoteAudioIdx < 0) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const newQuotes = [...topic.quotes];
      newQuotes[activeQuoteAudioIdx] = { ...newQuotes[activeQuoteAudioIdx], audio: reader.result as string };
      update({ quotes: newQuotes });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Toolbar formatting
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
    update({ content: contentRef.current?.innerHTML || '' });
  };

  const handleContentChange = () => {
    const html = contentRef.current?.innerHTML || '';
    lastSyncedContent.current = html;
    update({ content: html });
  };

  // Collapsed view
  if (!topic.isExpanded) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
        {/* Move buttons */}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed text-sm"
            title="Move up"
          >↑</button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed text-sm"
            title="Move down"
          >↓</button>
        </div>

        {/* Topic title */}
        <div
          className="flex-1 cursor-pointer"
          onClick={() => update({ isExpanded: true })}
        >
          <span className="text-white font-bold text-sm">
            {topic.title || `Topic ${index + 1}`}
          </span>
          <span className="text-slate-500 text-xs ml-3">
            {topic.content ? 'Has content' : 'Empty'}
            {topic.images.length > 0 && ` · ${topic.images.length} image${topic.images.length > 1 ? 's' : ''}`}
            {topic.audio && ' · Audio'}
            {topic.quotes.length > 0 && ` · ${topic.quotes.length} quote${topic.quotes.length > 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Actions */}
        <button
          type="button"
          onClick={() => update({ isExpanded: true })}
          className="text-brand-purple hover:text-brand-purple/80 text-xs font-bold"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-red-400 hover:text-red-300 text-sm"
          title="Delete topic"
        >🗑</button>
      </div>
    );
  }

  // Expanded editor view
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
      {/* Top bar: move, delete, close */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-800/80">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onMoveUp} disabled={index === 0}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed" title="Move up">↑</button>
          <button type="button" onClick={onMoveDown} disabled={index === total - 1}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed" title="Move down">↓</button>
          <button type="button" onClick={() => { setShowDeleteConfirm(true); }}
            className="p-1 text-slate-400 hover:text-red-400" title="Delete">✕</button>
          <span className="text-slate-600 text-xs ml-1">⋮</span>
        </div>
        <button
          type="button"
          onClick={() => update({ isExpanded: false })}
          className="text-slate-400 hover:text-white text-xs font-bold"
        >
          Close
        </button>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="px-4 py-3 bg-red-950/30 border-b border-red-900/40 flex items-center justify-between">
          <span className="text-red-300 text-sm">Delete this topic?</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowDeleteConfirm(false)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded bg-slate-700">Cancel</button>
            <button type="button" onClick={onDelete}
              className="text-xs text-white px-3 py-1 rounded bg-red-600 hover:bg-red-500">Delete</button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-b border-slate-700 bg-slate-900/50">
        <button type="button" onClick={() => execCommand('formatBlock', 'h3')} className="toolbar-btn" title="Heading">
          <span className="text-xs font-bold">TT</span>
        </button>
        <button type="button" onClick={() => execCommand('bold')} className="toolbar-btn" title="Bold">
          <span className="font-bold text-sm">B</span>
        </button>
        <button type="button" onClick={() => execCommand('italic')} className="toolbar-btn" title="Italic">
          <span className="italic text-sm">I</span>
        </button>
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="toolbar-btn" title="Bullet List">
          ≡
        </button>
        <button type="button" onClick={() => execCommand('insertOrderedList')} className="toolbar-btn" title="Numbered List">
          ⅓
        </button>
        <button type="button" onClick={() => execCommand('insertHorizontalRule')} className="toolbar-btn" title="Horizontal Rule">
          —
        </button>
        <span className="w-px h-5 bg-slate-700 mx-1" />
        <button type="button" onClick={() => imageInputRef.current?.click()} className="toolbar-btn" title="Add Image">
          🖼
        </button>
        <button type="button" onClick={addQuote} className="toolbar-btn" title="Add Quote">
          ❝
        </button>
        <button type="button" onClick={() => audioInputRef.current?.click()} className="toolbar-btn" title="Add Audio">
          🎵
        </button>
      </div>

      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
      <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
      <input ref={quoteAudioInputRef} type="file" accept="audio/*" onChange={handleQuoteAudioUpload} className="hidden" />

      <div className="p-4 space-y-4">
        {/* Topic Title */}
        <input
          type="text"
          value={topic.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder={`Topic ${index + 1} title (e.g. Topic-Suriin)`}
          className="w-full bg-transparent text-white font-bold text-lg border-none outline-none placeholder:text-slate-600"
        />

        {/* Rich text content area */}
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentChange}
          onBlur={handleContentChange}
          className="min-h-[120px] text-slate-200 text-sm leading-relaxed outline-none [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-brand-purple [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-400"
          data-placeholder="Write the topic content here..."
        />

        {/* Quotes section */}
        {topic.quotes.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quotes</p>
            {topic.quotes.map((quote, qi) => (
              <div key={qi} className="space-y-1">
                <div className="flex items-start gap-2">
                  <span className="text-brand-purple text-lg mt-1">❝</span>
                  <textarea
                    value={quote.text}
                    onChange={(e) => updateQuote(qi, e.target.value)}
                    placeholder="Enter quotation text..."
                    rows={2}
                    className="flex-1 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm resize-none focus:border-brand-purple outline-none"
                  />
                  <button type="button" onClick={() => {
                    setActiveQuoteAudioIdx(qi);
                    setTimeout(() => quoteAudioInputRef.current?.click(), 0);
                  }}
                    className="text-slate-400 hover:text-brand-purple text-sm mt-1" title="Add audio to quote">🎵</button>
                  <button type="button" onClick={() => removeQuote(qi)}
                    className="text-slate-500 hover:text-red-400 text-sm mt-1">✕</button>
                </div>
                {quote.audio && (
                  <div className="flex items-center gap-2 ml-7 bg-slate-900/60 rounded-lg px-3 py-1 border border-slate-700">
                    <span className="text-xs text-slate-400">🔊 Quote audio</span>
                    <audio src={quote.audio} controls className="h-7 flex-1" />
                    <button type="button" onClick={() => {
                      const newQuotes = [...topic.quotes];
                      newQuotes[qi] = { ...newQuotes[qi], audio: '' };
                      update({ quotes: newQuotes });
                    }} className="text-slate-500 hover:text-red-400 text-xs">✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Images preview */}
        {topic.images.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Images</p>
            <div className="grid grid-cols-3 gap-2">
              {topic.images.map((img, ii) => (
                <div key={ii} className="relative group rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
                  <img src={img} alt={`Topic image ${ii + 1}`} className="w-full h-24 object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(ii)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audio preview */}
        {topic.audio && (
          <div className="flex items-center gap-3 bg-slate-900/60 rounded-lg px-3 py-2 border border-slate-700">
            <span className="text-lg">🎵</span>
            <span className="text-sm text-slate-300 flex-1">Audio attached</span>
            <audio src={topic.audio} controls className="h-8 max-w-[200px]" />
            <button
              type="button"
              onClick={() => update({ audio: '' })}
              className="text-slate-500 hover:text-red-400 text-sm"
            >✕</button>
          </div>
        )}
      </div>

      <style jsx>{`
        .toolbar-btn {
          padding: 4px 8px;
          border-radius: 6px;
          color: #94a3b8;
          font-size: 14px;
          transition: all 0.15s;
          cursor: pointer;
          background: transparent;
          border: none;
        }
        .toolbar-btn:hover {
          background: rgba(100, 116, 139, 0.3);
          color: white;
        }
        [data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #475569;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};
