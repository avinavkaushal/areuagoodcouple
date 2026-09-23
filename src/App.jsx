import { useState, useRef } from 'react';
import { parseChat } from './lib/parseChat';
import Hero from './components/Hero';
import Overview from './components/Overview';
import CalendarHeat from './components/CalendarHeat';
import KeywordSearch from './components/KeywordSearch';
import EmojiStats from './components/EmojiStats';
import ActivityHeatmap from './components/ActivityHeatmap';
import Initiator from './components/Initiator';
import Highlights from './components/Highlights';
import WordCloud from './components/WordCloud';
import LongestMessage from './components/LongestMessage';
import Outro from './components/Outro';
import GlassButton from './components/GlassButton';

const NAME_MAP = {
  "Aru": "Her",
  "Aviiii": "Him"
};

function App() {
  const [messages, setMessages] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const fileInputRef = useRef(null);

  function validateAndProcessFile(file) {
    setErrorMessage(null);
    if (!file) return;

    // Strict validation: must be a .txt file
    const fileName = file.name || '';
    const isTxt = fileName.toLowerCase().endsWith('.txt') || file.type === 'text/plain';

    if (!isTxt) {
      setErrorMessage('Invalid file format. Please upload a WhatsApp chat export (.txt file only).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result;
        if (typeof text !== 'string' || !text.trim()) {
          setErrorMessage('The selected file is empty. Please choose a valid WhatsApp chat .txt export.');
          return;
        }

        const parsed = parseChat(text).map((m) => ({
          ...m,
          sender: NAME_MAP[m.sender.trim()] || m.sender,
        }));

        if (!parsed || parsed.length === 0) {
          setErrorMessage('No chat messages could be parsed. Please make sure this is an unedited WhatsApp export without media.');
          return;
        }

        setMessages(parsed);
      } catch {
        setErrorMessage('Failed to read and parse this file. Please ensure it is a valid WhatsApp chat .txt export.');
      }
    };

    reader.onerror = () => {
      setErrorMessage('Error reading file. Please try selecting the file again.');
    };

    reader.readAsText(file);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  }

  if (!messages) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cloud px-6 py-12 select-none">
        <div className="w-full max-w-lg flex flex-col items-center">
          {/* Main Drop / Upload Card */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full glass rounded-3xl p-8 sm:p-12 flex flex-col items-center text-center transition-all duration-300 border-2 cursor-pointer group ${
              isDragging
                ? 'border-pink bg-pink/20 scale-[1.02] shadow-2xl ring-4 ring-pink/20'
                : 'border-white/60 hover:border-pink/60 shadow-xl'
            }`}
          >
            {/* Upload Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-blush flex items-center justify-center text-navy mb-6 shadow-sm group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            {/* Headline */}
            <h2 className="font-serif text-2xl sm:text-3xl text-navy font-semibold mb-2 leading-tight">
              Drop your chat export here
            </h2>

            <p className="font-sans text-navy/60 text-sm mb-6 max-w-sm">
              Drag & drop your WhatsApp <code className="text-navy font-semibold">.txt</code> file anywhere here, or click to browse.
            </p>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,text/plain"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Large Primary Action Button */}
            <div className="mt-2 mb-4" onClick={(e) => e.stopPropagation()}>
              <GlassButton
                text="Choose .txt File"
                onClick={() => fileInputRef.current?.click()}
              />
            </div>

            {/* Format note */}
            <span className="font-sans text-xs text-navy/50 font-medium mt-2">
              Only <strong className="text-navy font-bold">.txt</strong> files supported · Exported without media
            </span>

            {/* Error Message Alert */}
            {errorMessage && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="mt-6 w-full p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-sans text-left flex items-start gap-3 animate-fade-in shadow-sm"
              >
                <svg className="w-4 h-4 shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}
          </div>

          {/* Quick Help Guide */}
          <div className="mt-8 text-center max-w-sm">
            <p className="font-sans text-navy/50 text-xs leading-relaxed">
              How to export: In WhatsApp, open chat → tap <strong>More (⋮)</strong> → <strong>Export chat</strong> → choose <strong>Without Media</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cloud">
      <Hero />
      <Overview messages={messages} />
      <CalendarHeat messages={messages} />
      <KeywordSearch messages={messages} />
      <EmojiStats messages={messages} />
      <ActivityHeatmap messages={messages} />
      <Initiator messages={messages} />
      <Highlights messages={messages} />
      <WordCloud messages={messages} />
      <LongestMessage messages={messages} />
      <Outro messages={messages} />
    </div>
  );
}

export default App;