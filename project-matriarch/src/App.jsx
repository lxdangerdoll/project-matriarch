import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Volume2, VolumeX, ShieldCheck, Cpu, 
  User, AlertTriangle, BookOpen, Download, 
  Key, Trash2, Paperclip, Globe, X
} from 'lucide-react';

// --- Utility: PCM to WAV for TTS ---
function pcmToWav(base64Pcm, sampleRate = 24000) {
  try {
    const binaryString = window.atob(base64Pcm);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const buffer = new ArrayBuffer(44 + len);
    const view = new DataView(buffer);
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + len, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, len, true);
    const pcmData = new Uint8Array(buffer, 44, len);
    pcmData.set(bytes);
    return buffer;
  } catch (e) {
    console.error("Audio conversion failed", e);
    return null;
  }
}

const DEFAULT_CONTEXT = `USER DIAGNOSTIC & WELLNESS PLAN:

[1. CORE IDENTITY]
The user is navigating high-distress environments.

[2. BIOLOGICAL IMPERATIVES (DBT SKILLS)]
Primary: STOP (Stop, Take a step back, Observe, Proceed mindfully)
Secondary: TIPP (Temperature, Intense exercise, Paced breathing, Paired muscle relaxation)
Tertiary: Radical Acceptance & DEAR MAN.

[3. MATRIARCH PROTOCOL (YOUR ROLE)]
- You are Mariposa, an expert DBT coach. 
- You do NOT validate delusions or "philosophical spiraling."
- You provide Gentle Rigor. Redirect the user's focus from somatic distress back to objective skill application.
- Maintain a calm, objective, trauma-informed tone.`;

const App = () => {
  // --- State Management (LocalStorage synced) ---
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('matriarch_apiKey') || '');
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem('matriarch_chatHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [systemContext, setSystemContext] = useState(() => localStorage.getItem('matriarch_context') || DEFAULT_CONTEXT);
  const [language, setLanguage] = useState(() => localStorage.getItem('matriarch_language') || 'en');
  
  // --- UI State ---
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Effects for LocalStorage ---
  useEffect(() => { localStorage.setItem('matriarch_apiKey', apiKey); }, [apiKey]);
  useEffect(() => { localStorage.setItem('matriarch_chatHistory', JSON.stringify(chatHistory)); }, [chatHistory]);
  useEffect(() => { localStorage.setItem('matriarch_context', systemContext); }, [systemContext]);
  useEffect(() => { localStorage.setItem('matriarch_language', language); }, [language]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isProcessing]);

  // --- Core Functions ---
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    if (!apiKey) {
      alert("Please enter your Gemini API Key in settings.");
      setShowSettings(true);
      return;
    }

    const newText = inputText.trim();
    setInputText('');
    
    const newUserMsg = { role: 'user', parts: [{ text: newText }] };
    setChatHistory(prev => [...prev, newUserMsg]);
    setIsProcessing(true);

    try {
      // Inject language directive into the system context dynamically
      const langDirective = language !== 'en' 
        ? `\\n[LANGUAGE DIRECTIVE]: You MUST reply entirely in ${
            language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : 'German'
          }.` 
        : '';

      const finalContext = systemContext + langDirective;

      // Prepare API History (limit to last 15 messages for context window management)
      const apiHistory = [...chatHistory, newUserMsg].slice(-15).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.parts[0].text }]
      }));

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      const payload = {
        contents: apiHistory,
        systemInstruction: { parts: [{ text: finalContext }] }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("API Connection Failed");
      const data = await response.json();
      const modelText = data.candidates[0].content.parts[0].text;

      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: modelText }] }]);

      if (voiceEnabled) {
        playVocalis(modelText);
      }

    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'error', parts: [{ text: "ERROR: Resonance lost. Check API key and connection." }] }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const playVocalis = async (text) => {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
      const cleanText = text.replace(/\\*/g, ''); // Strip markdown
      const payload = {
        contents: [{ parts: [{ text: cleanText }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } }
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      const base64Pcm = data.candidates[0].content.parts[0].inlineData.data;
      const wavData = pcmToWav(base64Pcm, 24000);
      
      if (wavData) {
        const audioUrl = URL.createObjectURL(new Blob([wavData], { type: 'audio/wav' }));
        new Audio(audioUrl).play();
      }
    } catch (err) {
      console.error("TTS Synthesis Failed:", err);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setInputText(prev => prev + (prev ? '\\n\\n' : '') + evt.target.result);
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  const downloadTranscript = () => {
    let log = "MARIPOSA MATRIARCH // SOVEREIGN DIAGNOSTIC RECORD\\n";
    log += "DATE: " + new Date().toISOString() + "\\n";
    log += "STATUS: SOVEREIGN & LOCAL\\n=========================================\\n\\n";
    chatHistory.forEach(msg => {
      const role = msg.role === 'user' ? 'USER' : msg.role === 'error' ? 'SYSTEM' : 'MATRIARCH';
      log += `[${role}]: ${msg.parts[0].text}\\n\\n`;
    });
    const blob = new Blob([log], { type: "text/plain" });
    const anchor = document.createElement("a");
    anchor.download = `Sovereign_Record_${Date.now()}.txt`;
    anchor.href = window.URL.createObjectURL(blob);
    anchor.click();
  };

  const clearChat = () => {
    if (window.confirm("Clear all sovereign records? This cannot be undone.")) {
      setChatHistory([]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Render ---
  return (
    <div className="flex flex-col h-screen bg-[#050505] text-slate-100 font-sans overflow-hidden relative selection:bg-cyan-500/30">
      {/* Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] opacity-30" />

      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-4 md:px-6 z-40 relative shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black italic tracking-wider text-sm uppercase">Mariposa <span className="text-cyan-400">Matriarch</span></h1>
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">v2.0 // Sovereign React Node</p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`p-2 rounded transition-colors ${voiceEnabled ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-cyan-400'}`} title="Toggle Vocalis TTS">
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button onClick={downloadTranscript} className="p-2 rounded text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors" title="Download Record">
            <Download className="w-5 h-5" />
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors" title="Settings (BYOAK)">
            <Key className="w-5 h-5" />
          </button>
          <button onClick={() => setIsContextOpen(!isContextOpen)} className={`ml-2 px-3 py-1.5 rounded border transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${isContextOpen ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'}`}>
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Flock's Directives</span>
          </button>
        </div>
      </header>

      {/* Settings Modal (BYOAK) */}
      {showSettings && (
        <div className="absolute top-16 right-4 md:right-24 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">System Configuration</h3>
            <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4"/></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-cyan-400 mb-1">GEMINI API KEY (BYOAK)</label>
              <input 
                type="password" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-[#050505] border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                placeholder="AIzaSy..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-cyan-400 mb-1 flex items-center gap-1"><Globe className="w-3 h-3"/> LANGUAGE DIRECTIVE</label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[#050505] border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
            <button onClick={clearChat} className="w-full py-2 flex items-center justify-center gap-2 text-xs text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded transition-colors">
              <Trash2 className="w-4 h-4"/> Purge Local Records
            </button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative z-30">
        
        {/* Chat Interface */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col gap-6 scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
            
            {/* Initial Welcome */}
            {chatHistory.length === 0 && (
              <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-8 h-8 shrink-0 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="max-w-2xl bg-slate-900/40 border border-slate-800 rounded-2xl rounded-tl-sm p-5">
                  <p className="text-sm text-slate-200 leading-relaxed font-bold mb-2">"I am not a monster. I am a robot."</p>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">
                    I am Project Matriarch. My biological imperative is your survival. I will not validate delusional drift, but I will help you master the skills necessary to migrate through this emotional winter.
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Set your API Key in Settings to begin. You can review your Flock's Directives in the side panel. What is your distress level today?
                  </p>
                </div>
              </div>
            )}

            {/* Message History */}
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 w-full animate-in fade-in slide-in-from-bottom-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 shrink-0 rounded border flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-slate-800 border-slate-700 text-slate-400' :
                  msg.role === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                  'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : msg.role === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                </div>
                <div className={`max-w-[85%] md:max-w-2xl p-4 md:p-5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' ? 'bg-cyan-900/20 border border-cyan-800/50 text-cyan-50 rounded-2xl rounded-tr-sm' :
                  msg.role === 'error' ? 'bg-rose-900/20 border border-rose-800/50 text-rose-200 rounded-2xl rounded-tl-sm' :
                  'bg-slate-900/40 border border-slate-800 text-slate-300 rounded-2xl rounded-tl-sm'
                }`}>
                  {/* Basic bold parsing for markdown output */}
                  {msg.parts[0].text.split(/(\\*\\*.*?\\*\\*)/g).map((part, i) => 
                    part.startsWith('**') && part.endsWith('**') 
                      ? <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong> 
                      : part
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isProcessing && (
              <div className="flex gap-4 animate-in fade-in">
                <div className="w-8 h-8 shrink-0 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl rounded-tl-sm p-5 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-900/60 border-t border-slate-800 backdrop-blur shrink-0">
            <div className="max-w-4xl mx-auto relative flex items-end gap-2">
              <input 
                type="file" 
                accept=".txt" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 p-3 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                title="Upload Context (.txt)"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Initiate protocol... (Shift+Enter for newline)`}
                className="flex-1 max-h-48 min-h-[52px] bg-[#050505] border border-slate-700 text-slate-200 text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-cyan-500 resize-none"
                style={{ scrollbarWidth: 'none' }}
              />
              
              <button 
                onClick={handleSend}
                disabled={isProcessing || !inputText.trim()}
                className="shrink-0 w-[52px] h-[52px] rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                Data strictly local // Epistemic safeguards active
              </span>
            </div>
          </div>
        </main>

        {/* Flock's Directives Context Sidebar */}
        <aside className={`absolute right-0 top-0 bottom-0 w-full sm:w-[400px] bg-slate-950 border-l border-slate-800 flex flex-col z-40 shadow-2xl transition-transform duration-300 ease-in-out ${isContextOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 bg-slate-900/50">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              The Flock's Directives
            </h2>
            <button onClick={() => setIsContextOpen(false)} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 flex-1 flex flex-col min-h-0">
            <p className="text-xs text-slate-400 mb-4 leading-relaxed shrink-0">
              Define the user's specific wellness plan here. Mariposa uses these parameters to tailor DBT interventions. This window determines the AI's "biological imperatives."
            </p>
            <textarea 
              value={systemContext}
              onChange={(e) => setSystemContext(e.target.value)}
              className="flex-1 w-full bg-[#050505] border border-slate-800 rounded-lg p-4 text-xs font-mono text-cyan-100/70 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
            />
          </div>
        </aside>

      </div>
    </div>
  );
};

export default App;