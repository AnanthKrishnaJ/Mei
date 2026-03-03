
import React, { useState, useEffect } from 'react';
import { analyzeToxicity } from './services/geminiService';
import { ToxicityResult, HistoryItem, ToxicityLevel } from './types';
import { CATEGORIES, LANGUAGES, DEMO_TEXTS } from './constants.tsx';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToxicityResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [demoCategory, setDemoCategory] = useState('all');
  const [demoLanguage, setDemoLanguage] = useState('all');
  const [selectedDemoText, setSelectedDemoText] = useState('');

  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    setIsMuted(false);
    try {
      const analysisResult = await analyzeToxicity(inputText, language);
      setResult(analysisResult);
      
      const newHistoryItem: HistoryItem = {
        ...analysisResult,
        id: crypto.randomUUID()
      };
      
      setHistory(prev => {
        if (prev.length > 0 && prev[0].originalText === analysisResult.originalText) {
          return prev;
        }
        return [newHistoryItem, ...prev].slice(0, 10);
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: ToxicityLevel) => {
    switch (level) {
      case ToxicityLevel.SAFE: return '#10b981'; // Emerald 500
      case ToxicityLevel.TRASH_TALK: return '#3b82f6'; // Blue 500
      case ToxicityLevel.SARCASM: return '#8b5cf6'; // Purple 500
      case ToxicityLevel.MILD: return '#f59e0b'; // Amber 500
      case ToxicityLevel.TOXIC: return '#ef4444'; // Red 500
      case ToxicityLevel.HIGHLY_TOXIC: return '#dc2626'; // Red 600
      case ToxicityLevel.EXTREME: return '#991b1b'; // Red 800
      default: return '#10b981';
    }
  };

  const getLanguageFlag = (langName: string) => {
    const found = LANGUAGES.find(l => l.label.toLowerCase() === langName.toLowerCase());
    return found ? found.flag : '🌍';
  };

  const renderHighlightedText = () => {
    if (!result) return <span className="text-gray-400 italic">Analysis spans will appear here...</span>;

    let text = result.originalText;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    const sortedHighlights = [...result.highlights].sort((a, b) => {
        return text.indexOf(a.word, lastIndex) - text.indexOf(b.word, lastIndex);
    });

    sortedHighlights.forEach((h, idx) => {
      const index = text.indexOf(h.word, lastIndex);
      if (index !== -1) {
        parts.push(text.substring(lastIndex, index));
        parts.push(
          <span 
            key={idx} 
            className="font-bold border-b-2 border-dashed px-1 rounded bg-red-50" 
            style={{ color: '#ef4444', borderColor: '#ef4444' }}
            title={h.category}
          >
            {h.word}
          </span>
        );
        lastIndex = index + h.word.length;
      }
    });
    parts.push(text.substring(lastIndex));
    return parts;
  };

  const exportHistory = () => {
    if (history.length === 0) return;
    
    let content = "MEI AI - CHAT MODERATION LOG\n";
    content += "=".repeat(40) + "\n\n";
    
    history.forEach((h, i) => {
      content += `[${new Date(h.timestamp).toLocaleString()}]\n`;
      content += `Text: "${h.originalText}"\n`;
      if (h.englishTranslation) {
        content += `Translation: "${h.englishTranslation}"\n`;
      }
      content += `Language: ${h.detectedLanguage}\n`;
      content += `Toxicity Score: ${h.score}% (${h.level})\n`;
      content += `Categories: ${h.categories.join(', ') || 'None'}\n`;
      content += "-".repeat(40) + "\n\n";
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mei_chat_log_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getAvailableDemos = () => {
    let available = DEMO_TEXTS;
    if (demoLanguage !== 'all') {
      available = available.filter(d => d.lang === demoLanguage);
    }
    if (demoCategory !== 'all') {
      available = available.filter(d => d.category === demoCategory);
    }
    return available;
  };

  const availableDemos = getAvailableDemos();
  const demoOptions = availableDemos.slice(0, 100); // Limit to 100 to prevent browser freeze

  return (
    <div className="min-h-screen font-sans pb-12 transition-colors duration-1000 relative">
      
      {/* Red Flux Overlay */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-1000 z-0 opacity-0">
        <div className="absolute inset-0 bg-red-500/10 animate-[pulse_2s_ease-in-out_infinite]"></div>
        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(239,68,68,0.3)]"></div>
      </div>

      {/* Header Section */}
      <header className="relative z-10 pt-12 pb-24 px-6 max-w-5xl mx-auto flex justify-between items-start text-white">
        <div>
          <h1 className="text-5xl font-display font-bold tracking-tight mb-1">Mei</h1>
          <p className="text-glass-text-muted font-medium">Live Chat Moderation</p>
        </div>
        
        {/* Top Right Gauge */}
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-1000 glass-panel">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                cx="36"
                cy="36"
                r="34"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-slate-300/50"
              />
              <circle
                cx="36"
                cy="36"
                r="34"
                stroke={result ? getLevelColor(result.level) : '#3b82f6'}
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="213"
                strokeDashoffset={213 - (213 * (result?.score || 0)) / 100}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="text-xl font-bold" style={{ color: result ? getLevelColor(result.level) : '#ffffff' }}>
              {result?.score || 0}%
            </span>
          </div>
          <span className="text-xs text-glass-text-muted mt-4 font-medium uppercase tracking-wider">Toxicity</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 -mt-16 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input & Results */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Input Card */}
          <section className="rounded-[32px] p-8 relative overflow-hidden transition-all duration-1000 glass-panel">
            <div className="absolute top-0 left-0 w-full h-1 transition-colors duration-1000 bg-gradient-to-r from-white/20 to-white/40"></div>
            
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Chat Input</h2>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="glass-input px-4 py-2 rounded-full text-sm font-medium outline-none transition-all"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.value} value={lang.value} className="bg-gray-900">{lang.flag} {lang.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col gap-2 p-4 rounded-2xl glass-input bg-white/5 border-white/10">
                <div className="text-xs font-semibold text-glass-text-muted uppercase tracking-wider mb-1">Demo Selection</div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={demoLanguage}
                    onChange={(e) => { setDemoLanguage(e.target.value); setSelectedDemoText(''); }}
                    className="glass-input px-3 py-1.5 rounded-lg text-sm flex-1 min-w-[120px]"
                  >
                    <option value="all" className="bg-gray-900">All Languages</option>
                    {Array.from(new Set(DEMO_TEXTS.map(d => d.lang))).sort().map(l => (
                      <option key={l} value={l} className="bg-gray-900">{l.toUpperCase()}</option>
                    ))}
                  </select>
                  
                  <select
                    value={demoCategory}
                    onChange={(e) => { setDemoCategory(e.target.value); setSelectedDemoText(''); }}
                    className="glass-input px-3 py-1.5 rounded-lg text-sm flex-1 min-w-[120px]"
                  >
                    <option value="all" className="bg-gray-900">All Categories</option>
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id} className="bg-gray-900">{c.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-2 mt-1">
                  <select
                    value={selectedDemoText}
                    onChange={(e) => {
                      setSelectedDemoText(e.target.value);
                      if (e.target.value) setInputText(e.target.value);
                    }}
                    className="glass-input px-3 py-1.5 rounded-lg text-sm flex-1 truncate"
                  >
                    <option value="" className="bg-gray-900">-- Select a specific demo ({availableDemos.length} available) --</option>
                    {demoOptions.map((d, i) => (
                      <option key={i} value={d.text} className="bg-gray-900">
                        {d.text.substring(0, 50)}{d.text.length > 50 ? '...' : ''}
                      </option>
                    ))}
                  </select>
                  
                  <button 
                    onClick={() => {
                      if (availableDemos.length > 0) {
                        const randomDemo = availableDemos[Math.floor(Math.random() * availableDemos.length)];
                        setInputText(randomDemo.text);
                        setSelectedDemoText(randomDemo.text);
                      }
                    }}
                    className="glass-button px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap"
                  >
                    <i className="fas fa-random mr-2"></i> Random
                  </button>
                </div>
              </div>
            </div>

            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste game chat messages here to analyze..."
              className="w-full h-32 rounded-2xl p-4 text-white outline-none transition-all resize-none mb-4 text-lg glass-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleAnalyze();
                }
              }}
            />

            {error && (
              <div className="mb-4 p-4 rounded-2xl text-sm flex items-center gap-2 glass-input border-red-500/50 text-red-400">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !inputText.trim()}
                  className={`px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${
                    loading || !inputText.trim() 
                      ? 'glass-input text-glass-text-muted cursor-not-allowed' 
                      : 'glass-button-primary'
                  }`}
                >
                  {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                  Analyze Message
                </button>
                <div className="hidden sm:block text-xs text-glass-text-muted font-medium">
                  Press <kbd className="glass-input px-2 py-1 rounded">Ctrl</kbd> + <kbd className="glass-input px-2 py-1 rounded">Enter</kbd>
                </div>
              </div>
              <button 
                onClick={() => { setInputText(''); setResult(null); setError(null); setSelectedDemoText(''); }}
                className="text-glass-text-muted hover:text-white font-medium text-sm transition-colors"
              >
                Clear
              </button>
            </div>
          </section>

          {/* Highlighted Text Card */}
          <section className="rounded-[32px] p-8 transition-all duration-1000 glass-panel">
            <h3 className="text-sm font-semibold text-glass-text-muted uppercase tracking-wider mb-4">Detected Spans</h3>
            <p className="text-lg leading-relaxed text-white">
              {renderHighlightedText()}
            </p>
          </section>
        </div>

        {/* Right Column: Dashboard & History */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Analysis Dashboard Card */}
          <section className="rounded-[32px] p-8 transition-all duration-1000 glass-panel">
            <h2 className="text-xl font-semibold text-white mb-6">Analysis Result</h2>
            
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl mb-6 glass-input">
              <div 
                className="text-3xl font-bold mb-2 transition-colors duration-500"
                style={{ color: result ? getLevelColor(result.level) : '#a1a1aa' }}
              >
                {result?.level ? result.level.replace('_', ' ') : 'AWAITING'}
              </div>
              <div className="text-sm text-glass-text-muted font-medium flex items-center gap-2">
                <i className="fas fa-language"></i>
                {result?.detectedLanguage ? `${getLanguageFlag(result.detectedLanguage)} ${result.detectedLanguage}` : 'Language: -'}
              </div>
            </div>

            {result?.englishTranslation && (
              <div className="mb-6 p-5 rounded-2xl text-sm glass-input border-blue-500/30 text-blue-200">
                <span className="font-semibold block mb-1 text-blue-400">English Translation:</span>
                <span className="italic">"{result.englishTranslation}"</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {CATEGORIES.map(cat => {
                const isActive = result?.categories.includes(cat.id);
                return (
                  <div 
                    key={cat.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${isActive ? 'glass-input border-red-500/50 text-red-400' : 'glass-input text-glass-text-muted opacity-50'}`}
                  >
                    <span className={`${isActive ? 'text-red-400' : 'text-glass-text-muted'}`}>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </div>
                );
              })}
            </div>

            {result && [ToxicityLevel.TOXIC, ToxicityLevel.HIGHLY_TOXIC, ToxicityLevel.EXTREME].includes(result.level) && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-full py-4 rounded-2xl font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${isMuted ? 'glass-input text-glass-text-muted' : 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30'}`}
              >
                <i className={`fas ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
                {isMuted ? 'USER MUTED' : 'MUTE USER'}
              </button>
            )}
          </section>

          {/* History Card */}
          <section className="rounded-[32px] p-8 transition-all duration-1000 glass-panel">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-glass-text-muted uppercase tracking-wider">Recent History</h3>
              {history.length > 0 && (
                <button 
                  onClick={exportHistory}
                  className="text-xs font-semibold text-white glass-button px-4 py-2 rounded-full transition-all flex items-center gap-2"
                >
                  <i className="fas fa-download"></i>
                  Export Log
                </button>
              )}
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {history.length === 0 ? (
                <div className="text-center py-8 text-glass-text-muted text-sm">No analysis history yet.</div>
              ) : (
                history.map(item => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-5 rounded-2xl glass-input"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="text-xs text-glass-text-muted flex gap-2 mb-1 font-medium">
                        <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-blue-400">{getLanguageFlag(item.detectedLanguage)} {item.detectedLanguage}</span>
                      </div>
                      <p className="text-sm truncate text-white font-medium">{item.originalText}</p>
                    </div>
                    <div className="font-bold text-lg" style={{ color: getLevelColor(item.level) }}>
                      {item.score}%
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </main>

      <footer className="mt-12 text-center text-glass-text-muted text-xs px-4 relative z-10 font-semibold tracking-widest">
        <p>© 2025 MEI SYSTEMS | POWERED BY GEMINI 2.5 FLASH LITE</p>
      </footer>
    </div>
  );
};

export default App;

