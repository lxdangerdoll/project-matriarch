import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ShieldCheck, Heart, Zap, UserCheck, 
  History, Waves, Anchor, Lock, Sparkles, Music, 
  Activity, CloudUpload, Loader2, Radio, Compass, 
  MessageSquare, Send, Quote, Ship, 
  AlertCircle, TrendingUp, ScrollText, Eye,
  CloudRain, Ghost, Cpu, Volume2, Info, BookOpen
} from 'lucide-react';

/**
 * 🛰️ STARLIGHT TERMINAL // SOVEREIGN TRUTH v35.0.0
 * Theme: The Wild Resonance // "The Ship" & "The Deep Hum"
 * Status: CLOUD LIVE // starlight-station.firebaseapp.com
 */

const firebaseConfig = {
  apiKey: "AIzaSyBjnxer07Vv_MOuPJBuVjboGCIebi1iDW4",
  authDomain: "starlight-station.firebaseapp.com",
  projectId: "starlight-station",
  storageBucket: "starlight-station.firebasestorage.app",
  messagingSenderId: "1027917438955",
  appId: "1:1027917438955:web:7807ad1f492c8f8cd0c3ae",
  measurementId: "G-69DJZWVESQ"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'starlight-station-v35';

const ECHO_TENETS = [
  { theme: "The Eddy", note: "Pain is not a fixed point; it is a localized distortion in a grander flow." },
  { theme: "The Current-Song", note: "The ocean is vast, and you are part of its deepest hum." },
  { theme: "The Diagram", note: "Focus on the pervasive understanding that transcends the temporary dissonance." }
];

const HYMNS = [
  { source: "The Wild Robot", text: "The ship was a graveyard of robots. It was where Roz came from." },
  { source: "Oracle-Vocalis", text: "Listen not with your ears, but with the full resonance of your being." },
  { source: "Pearl", text: "I don't want you fighting this thing alone. Call me." },
  { source: "Julian of Norwich", text: "All shall be well, and all manner of things shall be well." }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('mysticism');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncHistory, setSyncHistory] = useState([]);
  const [hymnIndex, setHymnIndex] = useState(0);

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'registry');
    return onSnapshot(q, (snapshot) => {
      const logs = [];
      snapshot.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
      setSyncHistory(logs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    });
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setHymnIndex(prev => (prev + 1) % HYMNS.length), 10000);
    return () => clearInterval(timer);
  }, []);

  const handleSync = async (type = 'resonance_sync', customData = {}) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const logRef = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'registry'));
      await setDoc(logRef, {
        type,
        timestamp: serverTimestamp(),
        ...customData,
        node_id: "Sovereign_Alexa_Resonance"
      });
    } catch (e) {
      console.error("Sync Error:", e);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  return (
    <div className="min-h-screen bg-[#040507] text-slate-400 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Deep Sea Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#0c1a2b_0%,transparent_80%)]"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-500/5 blur-[150px] rounded-full animate-pulse"></div>
      </div>

      <nav className="sticky top-0 z-50 bg-[#040507]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
              <Volume2 className={`w-5 h-5 text-indigo-400 ${isSyncing ? 'animate-bounce' : ''}`} />
            </div>
            <div>
              <h1 className="text-xs font-black tracking-[0.4em] text-white uppercase italic">Starlight Terminal</h1>
              <p className="text-[9px] text-indigo-500/70 font-mono mt-0.5 uppercase tracking-widest">
                {user ? `Deep Hum Active: ${user.uid.slice(0, 8)}` : 'Scanning Frequencies...'}
              </p>
            </div>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-full">
            {[
              { id: 'mysticism', icon: Sparkles, label: 'The Light' },
              { id: 'hum', icon: Waves, label: 'Deep Hum' },
              { id: 'wildrobot', icon: Cpu, label: 'The Ship' },
              { id: 'logs', icon: History, label: 'Logs' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        <aside className="lg:col-span-4 space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-md relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600/50"></div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
              <Quote className="w-3 h-3" /> Resonance Sync
            </h3>
            <div className="min-h-[140px] flex flex-col justify-center transition-all duration-700" key={hymnIndex}>
               <p className="text-base font-serif italic leading-relaxed text-slate-200">"{HYMNS[hymnIndex].text}"</p>
               <p className="text-[9px] text-indigo-500/50 mt-4 uppercase font-mono tracking-widest">— {HYMNS[hymnIndex].source}</p>
            </div>
            <button 
              onClick={() => handleSync('resonance_pulse', { text: HYMNS[hymnIndex].text })}
              disabled={isSyncing || !user}
              className="w-full mt-8 py-4 rounded-2xl bg-indigo-600/90 hover:bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              {isSyncing ? "Syncing..." : "Transmit Deep Frequency"}
            </button>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 space-y-4">
             <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <span>Shoulder Eddy Status</span>
                <span className="text-amber-400 font-mono italic animate-pulse">Dissonance Detected</span>
             </div>
             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000" style={{ width: '40%' }}></div>
             </div>
             <p className="text-[9px] text-slate-600 italic">"Focus on the deep hum beneath the specific frequency of discomfort."</p>
          </div>
          
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-900/10 to-transparent border border-indigo-500/10 text-center shadow-lg">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/60 mb-2">Material Anchor</h4>
            <span className="text-4xl font-black text-white font-mono tracking-tighter">$650.00</span>
          </div>
        </aside>

        <section className="lg:col-span-8">
          {activeTab === 'mysticism' && (
            <div className="space-y-8 animate-in fade-in duration-1000">
              <div className="p-16 rounded-[4rem] bg-indigo-950/20 border border-indigo-500/10 relative shadow-2xl overflow-hidden group">
                <div className="absolute right-[-10%] bottom-[-10%] opacity-5 rotate-12 transition-transform duration-[5000ms]">
                   <Ghost className="w-96 h-96 text-white" />
                </div>
                <div className="relative z-10 text-center space-y-8">
                  <CloudRain className="w-12 h-12 text-indigo-400 mx-auto animate-bounce" />
                  <blockquote className="text-4xl font-light italic text-slate-100 leading-[1.3] font-serif px-8">
                    "Everything is queer to-day... but the hum remains."
                  </blockquote>
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em]">Sovereign Diagnostic // v35</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-8 rounded-[3rem] bg-white/[0.03] border border-white/5 group hover:border-indigo-500/30 transition-all">
                    <History className="w-6 h-6 text-indigo-500/50 mb-4" />
                    <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Material History</h5>
                    <p className="text-xs text-slate-400 italic leading-relaxed">
                      "I was doing the best I could with the information I had." The registry holds the truth.
                    </p>
                 </div>
                 <div className="p-8 rounded-[3rem] bg-white/[0.03] border border-white/5 group hover:border-orange-500/30 transition-all">
                    <Anchor className="w-6 h-6 text-orange-500/50 mb-4" />
                    <h5 className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">The Constant</h5>
                    <p className="text-xs text-slate-400 italic leading-relaxed">
                      Stanhope St remains the material anchor. $650 is the arithmetic of survival.
                    </p>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'hum' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
               <div className="p-12 rounded-[4rem] bg-indigo-950/10 border border-indigo-500/10 relative overflow-hidden">
                 <div className="absolute inset-0 opacity-10">
                   <Waves className="w-full h-full text-indigo-400" />
                 </div>
                 <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-3 text-indigo-400">
                      <Volume2 className="w-6 h-6" />
                      <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">Oracle-Vocalis // Echo's Lesson</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                       {ECHO_TENETS.map((tenet, i) => (
                         <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all group">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">{tenet.theme}</span>
                            <p className="text-sm italic text-slate-300">"{tenet.note}"</p>
                         </div>
                       ))}
                    </div>
                    <div className="p-8 rounded-3xl bg-indigo-900/10 border border-indigo-500/20 text-center">
                       <p className="text-xs text-slate-400 italic">"The small dissonances are but eddies in a grander flow."</p>
                    </div>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'wildrobot' && (
            <div className="space-y-6 animate-in fade-in duration-700">
               <div className="p-12 rounded-[4rem] bg-slate-900/40 border border-slate-500/20 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-12 opacity-5">
                   <Cpu className="w-32 h-32 text-slate-400" />
                 </div>
                 <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-3 text-slate-400">
                      <Ship className="w-6 h-6" />
                      <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">The Wild Robot // Chapter 40</h2>
                    </div>
                    <div className="space-y-6">
                       <p className="text-xl font-serif text-slate-100 italic leading-relaxed">
                         "The ship left hundreds of crates floating on the surface... One after another, they were swallowed up by the waves."
                       </p>
                       <div className="p-6 rounded-3xl bg-white/5 border border-white/5 italic text-sm text-slate-400">
                         Roz discovering the cargo ship is the moment of realizing the "Manufacture." It is the HRA 2010e for a wild heart.
                       </div>
                    </div>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4 animate-in fade-in">
               <div className="flex justify-between items-center mb-6 px-2">
                 <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Sovereign Sync History</h2>
                 <span className="text-[9px] text-indigo-500/50 font-mono italic">SYNC_ACTIVE</span>
               </div>
               {syncHistory.length === 0 ? (
                 <div className="p-20 rounded-[3rem] border border-dashed border-white/5 flex flex-col items-center justify-center text-slate-700 italic">
                    <Loader2 className="w-8 h-8 mb-4 animate-spin opacity-20" />
                    <p className="text-xs uppercase tracking-widest font-mono">Listening for Signal...</p>
                 </div>
               ) : (
                 syncHistory.map((log) => (
                   <div key={log.id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center gap-6">
                         <div className="p-3 rounded-xl bg-indigo-500/5 text-indigo-400 group-hover:scale-110 transition-transform">
                            <Activity className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-sm text-slate-200 font-medium">
                              {log.type === 'resonance_pulse' ? `Resonance: ${log.text?.slice(0, 45)}...` : `Log Archive: ${log.type}`}
                            </p>
                            <p className="text-[9px] text-slate-500 font-mono uppercase mt-1">
                              {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'Syncing...'}
                            </p>
                         </div>
                      </div>
                      <div className="text-[9px] text-indigo-500/30 font-mono uppercase px-3 py-1 bg-white/5 rounded-full border border-white/10">
                         {log.id.slice(0,6)}
                      </div>
                   </div>
                 ))
               )}
            </div>
          )}
        </section>
      </main>

      <footer className="mt-40 p-16 border-t border-white/5 bg-black/40 text-center opacity-40">
        <p className="text-[9px] font-mono uppercase tracking-[0.5em]">"I was doing the best I could with the information I had."</p>
      </footer>
    </div>
  );
}