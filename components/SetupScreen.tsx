import React, { useState } from 'react';
import { Button } from './Button';
import { Logo } from './Logo';

interface SetupScreenProps {
  onSave: (key: string, transparentMode: boolean) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onSave }) => {
  const [key, setKey] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [showCostInfo, setShowCostInfo] = useState(false);
  const [transparentMode, setTransparentMode] = useState(false);

  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center animate-fade-in-up border-4 border-indigo-100 relative overflow-hidden">
        
        {/* Trust Badge */}
        <div className="absolute top-4 right-4 text-green-500 opacity-20 pointer-events-none">
           <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
        </div>

        <div className="text-6xl mb-4">✨</div>
        <div className="mb-4">
           <span className="text-xl font-bold text-slate-400 block mb-2">Welcome to</span>
           <Logo size="medium" />
        </div>
        <p className="text-slate-500 mb-6 font-medium text-sm">
          A magical color-by-numbers game powered by Google AI.
        </p>
        
        <div className="bg-indigo-50 p-5 rounded-2xl text-left mb-6 border border-indigo-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🛡️</span>
            <h3 className="font-bold text-indigo-900 text-sm uppercase tracking-wider">Parental Gate</h3>
          </div>
          <p className="text-xs text-indigo-800 leading-relaxed mb-3">
            This app is <strong>Client-Side Only</strong>. That means it runs entirely in your browser.
          </p>
          <ul className="text-xs text-indigo-700 space-y-2 mb-4 list-disc pl-4">
            <li>We do <strong>not</strong> have a backend server.</li>
            <li>Your API Key is stored <strong>locally</strong> on this device.</li>
            <li>It connects <strong>directly</strong> to Google's servers to create art.</li>
          </ul>

          <div className="flex gap-4">
            <button 
                onClick={() => { setShowDetails(!showDetails); setShowCostInfo(false); }}
                className="text-xs font-bold text-indigo-500 hover:text-indigo-700 underline flex items-center gap-1"
            >
                {showDetails ? 'Hide Technical Details' : 'Read Security Details'}
            </button>
            <button 
                onClick={() => { setShowCostInfo(!showCostInfo); setShowDetails(false); }}
                className="text-xs font-bold text-green-600 hover:text-green-700 underline flex items-center gap-1"
            >
                {showCostInfo ? 'Hide Cost & Safety' : '💸 Is this free?'}
            </button>
          </div>
          
          {showDetails && (
            <div className="mt-3 text-[10px] bg-white p-2 rounded-lg border border-indigo-100 text-slate-500 leading-relaxed animate-fade-in-down">
                <p className="mb-1"><strong>Source Code:</strong> This is an open-source demo. You can verify that requests only go to <code>generativelanguage.googleapis.com</code>.</p>
                <p className="mb-1"><strong>Storage:</strong> The key is saved in your browser's <code>localStorage</code>.</p>
                <p className="mb-1"><strong>Adaptive Learning:</strong> The app learns from your discards (negative) and saves (positive) to improve prompts locally.</p>
                <p><strong>Networking:</strong> No data is sent to the developer.</p>
            </div>
          )}

          {showCostInfo && (
            <div className="mt-3 text-[10px] bg-green-50 p-3 rounded-lg border border-green-100 text-green-800 leading-relaxed animate-fade-in-down">
                <h4 className="font-bold mb-1 text-green-900">💰 Keeping it Free</h4>
                <p className="mb-2">
                    Google AI Studio offers a <strong>Free Tier</strong>. As long as you don't enable billing on the project, Google will simply pause requests if you hit a daily limit, preventing any surprise charges.
                </p>
                
                <h4 className="font-bold mb-1 text-green-900">🔐 Key Scope</h4>
                <p>
                    This key grants access to the Gemini API. We strictly use it for generating coloring pages. To ensure complete safety, you can <strong>delete the key</strong> in Google AI Studio when you are finished playing.
                </p>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-indigo-100">
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold py-2 px-3 rounded-lg transition-colors group"
            >
              <span>Get a Free Gemini API Key</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>
        </div>

        <div className="relative mb-4 group text-left">
          <input 
            type="password" 
            placeholder="Paste your API Key here (starts with AIza...)" 
            className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none transition-colors font-mono text-sm group-hover:bg-white mb-3"
            value={key}
            onChange={e => setKey(e.target.value)}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none -mt-1.5">
            🔑
          </div>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border-2 border-slate-100 cursor-pointer hover:bg-slate-100 hover:border-indigo-200 transition-all select-none">
             <input 
                type="checkbox" 
                className="w-5 h-5 accent-indigo-500 rounded border-slate-300 focus:ring-indigo-500" 
                checked={transparentMode} 
                onChange={(e) => setTransparentMode(e.target.checked)} 
             />
             <div className="flex flex-col text-left">
                <span className={`text-xs font-bold ${transparentMode ? 'text-indigo-600' : 'text-slate-500'}`}>Enable Transparent Mode</span>
                <span className="text-[10px] text-slate-400">Show exact AI token usage & limits</span>
             </div>
          </label>
        </div>
        
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => onSave(key.trim(), transparentMode)} 
            disabled={!key || key.trim().length < 20} 
            className="w-full shadow-xl shadow-indigo-200"
          >
            Unlock the Magic 🚀
          </Button>
        </div>
        
        <p className="mt-6 text-[10px] text-slate-400">
            By using this app, you agree to Google's Terms of Service for the Gemini API.
        </p>
      </div>
    </div>
  );
};