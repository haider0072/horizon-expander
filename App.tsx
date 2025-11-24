import React, { useState, useEffect, useRef } from 'react';
import { checkApiKey, requestApiKey, generateExpandedWallpaper } from './services/geminiService';
import { UploadZone } from './components/UploadZone';
import { WallpaperPreview } from './components/WallpaperPreview';
import { Button } from './components/Button';
import { AppState, StyleOption } from './types';

const STYLES: StyleOption[] = [
  { 
    id: 'consistent', 
    label: 'Consistent (Auto)', 
    prompt: 'Analyze the original image style and extend it perfectly. Do not apply any new artistic filters. Match the reality level, brush strokes, or camera characteristics exactly.' 
  },
  { 
    id: 'jjk', 
    label: 'Jujutsu Kaisen', 
    prompt: 'Use the dark, high-contrast, supernatural anime art style of Jujutsu Kaisen (MAPPA). Enhance with cursed energy effects or urban supernatural atmosphere if appropriate.' 
  },
  { 
    id: 'one_piece', 
    label: 'One Piece', 
    prompt: 'Use the vibrant, adventurous, and exaggerated anime art style of One Piece (Toei Animation). Bright colors, dramatic clouds, and clear line work.' 
  },
  { 
    id: 'demon_slayer', 
    label: 'Demon Slayer', 
    prompt: 'Use the high-budget, dynamic lighting, and particle-heavy art style of Demon Slayer (Ufotable). Focus on atmospheric lighting and crisp details.' 
  },
  { 
    id: 'ghibli', 
    label: 'Studio Ghibli', 
    prompt: 'Use the lush, painterly, and highly detailed background art style of Studio Ghibli. Focus on nature, soft lighting, and hand-painted aesthetics.' 
  },
  { 
    id: 'makoto', 
    label: 'Makoto Shinkai', 
    prompt: 'Use the hyper-realistic lighting, vibrant lens flares, and incredibly detailed cloudscapes typical of Makoto Shinkai films (Your Name).' 
  },
  { 
    id: 'cyberpunk', 
    label: 'Cyberpunk', 
    prompt: 'Use a futuristic, neon-lit, high-tech cyberpunk aesthetic. Add neon signs, rain-slicked surfaces, and technological details.' 
  },
  { 
    id: 'comic', 
    label: 'Comic Book', 
    prompt: 'Use a western comic book style with bold ink lines, halftime patterns, and dramatic shading.' 
  },
];

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedStyleId, setSelectedStyleId] = useState<string>('consistent');
  const [useProModel, setUseProModel] = useState<boolean>(false);

  useEffect(() => {
    const verifyKey = async () => {
      const hasIt = await checkApiKey();
      setHasKey(hasIt);
    };
    verifyKey();
  }, []);

  const handleConnect = async () => {
    try {
      setErrorMsg(null);
      await requestApiKey();
      // Race condition mitigation: assume success if no error thrown
      setHasKey(true);
    } catch (e) {
      console.error("Failed to select API Key", e);
      setErrorMsg("Failed to connect to Google AI. Please try again.");
    }
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setOriginalImage(e.target.result as string);
        // Reset previous generations if any
        setGeneratedImage(null);
        setAppState(AppState.IDLE); 
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!originalImage) return;

    setAppState(AppState.GENERATING);
    setErrorMsg(null);

    try {
      // Helper to get base64 data without the prefix
      const base64Data = originalImage.split(',')[1];
      const mimeType = originalImage.split(';')[0].split(':')[1];

      const selectedStyle = STYLES.find(s => s.id === selectedStyleId) || STYLES[0];

      const resultUrl = await generateExpandedWallpaper(base64Data, mimeType, selectedStyle.prompt, useProModel);
      
      setGeneratedImage(resultUrl);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      console.error("Gemini generation error:", err);
      setAppState(AppState.ERROR);
      
      const errorMessage = err.message || String(err);
      
      // Handle permission errors
      if (
        errorMessage.includes("Requested entity was not found") || 
        errorMessage.includes("403") ||
        errorMessage.includes("permission") || 
        errorMessage.includes("PERMISSION_DENIED")
      ) {
        if (useProModel) {
            setErrorMsg("High Res (Pro) mode requires a paid API key. Please switch to Standard or use a paid project key.");
        } else {
            setErrorMsg("Access denied. Please ensure your API key is valid.");
            setHasKey(false);
        }
      } else {
        setErrorMsg("Failed to generate wallpaper. The AI might be busy or the image too complex. Try again.");
      }
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `horizon-expander-${selectedStyleId}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setGeneratedImage(null);
    setAppState(AppState.IDLE);
    setErrorMsg(null);
  };

  // -- RENDER: API KEY WALL --
  if (!hasKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-dark-800 via-dark-900 to-black">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-2">
            <div className="w-16 h-16 bg-brand-600/20 rounded-2xl flex items-center justify-center mx-auto border border-brand-500/30 mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-brand-500">
                  <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576L8.279 5.044A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clipRule="evenodd" />
               </svg>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Horizon Expander</h1>
            <p className="text-gray-400 text-lg">
              Connect your Google Gemini API key to start creating seamless desktop wallpapers from your portrait photos.
            </p>
          </div>
          
          <div className="pt-6">
            <Button onClick={handleConnect} className="w-full text-lg py-4">
              Connect Google AI Studio
            </Button>
            {errorMsg && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm animate-pulse-slow">
                {errorMsg}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -- RENDER: MAIN APP --
  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-brand-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-dark-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
             <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" />
              </svg>
             </div>
             <span className="font-bold text-lg tracking-tight">Horizon Expander</span>
          </div>
          <button 
            onClick={() => window.open('https://ai.google.dev', '_blank')}
            className="text-xs font-medium text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1 rounded-full"
          >
            Powered by Gemini
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* ERROR MESSAGE (In App) */}
        {errorMsg && (
          <div className="max-w-2xl mx-auto mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-400 shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span className="text-red-200 text-sm">{errorMsg}</span>
          </div>
        )}

        {/* STATE: SUCCESS (RESULT) */}
        {appState === AppState.SUCCESS && generatedImage ? (
          <WallpaperPreview 
            generatedUrl={generatedImage} 
            onDownload={handleDownload} 
            onReset={handleReset}
          />
        ) : (
          /* STATE: INPUT & LOADING */
          <div className="flex flex-col lg:flex-row gap-12 items-start justify-center">
            
            {/* LEFT: Uploader / Preview */}
            <div className="w-full lg:w-1/2 space-y-6">
              {!originalImage ? (
                <UploadZone onFileSelected={handleFileSelect} />
              ) : (
                <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-dark-800">
                  <div className="absolute top-3 right-3 z-10">
                    <button 
                      onClick={() => setOriginalImage(null)}
                      className="p-2 bg-black/50 hover:bg-red-500/80 text-white rounded-full backdrop-blur-sm transition-colors"
                      title="Remove image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="aspect-[3/4] w-full max-w-sm mx-auto bg-dark-900 flex items-center justify-center">
                     <img src={originalImage} alt="Original" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="p-4 border-t border-white/5 bg-white/5">
                    <p className="text-xs text-center text-gray-400 uppercase tracking-wider font-medium">Original Portrait</p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Controls & Instructions */}
            <div className="w-full lg:w-1/2 space-y-8 lg:pt-8">
               <div>
                 <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                   Expand your world.
                 </h2>
                 <p className="text-gray-400 leading-relaxed text-lg">
                   Convert your favorite mobile photos into immersive desktop wallpapers. 
                   Select a style to guide the AI, or let it match your image automatically.
                 </p>
               </div>

               <div className="space-y-6">
                  {/* Step 1: Upload (Implied state if img present) */}
                  <div className={`flex items-start gap-4 p-4 rounded-lg border transition-colors duration-300 ${originalImage ? 'bg-brand-900/10 border-brand-500/30' : 'bg-white/5 border-white/5'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${originalImage ? 'bg-brand-500 text-white border-brand-400' : 'bg-brand-900/50 text-brand-400 border-brand-500/20'}`}>
                      {originalImage ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      ) : '1'}
                    </div>
                    <div>
                      <h4 className={`font-medium ${originalImage ? 'text-brand-200' : 'text-white'}`}>Upload Portrait</h4>
                      <p className="text-sm text-gray-400 mt-1">Upload a vertical image (3:4 or 9:16).</p>
                    </div>
                  </div>
                  
                  {/* Step 2: Style Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="w-6 h-6 rounded-full bg-brand-900/50 text-brand-400 flex items-center justify-center text-xs border border-brand-500/20 font-bold">2</div>
                       <h4 className="font-medium text-white">Select Art Style</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {STYLES.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyleId(style.id)}
                          className={`
                            px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border text-center truncate
                            ${selectedStyleId === style.id 
                              ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-900/40' 
                              : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10 hover:text-white'}
                          `}
                          title={style.label}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 3: Quality Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="w-6 h-6 rounded-full bg-brand-900/50 text-brand-400 flex items-center justify-center text-xs border border-brand-500/20 font-bold">3</div>
                       <h4 className="font-medium text-white">Quality Setting</h4>
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                      <button 
                        onClick={() => setUseProModel(false)}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${!useProModel ? 'bg-dark-800 text-white shadow-sm ring-1 ring-white/5' : 'text-gray-400 hover:text-white'}`}
                      >
                        Standard (Fast)
                      </button>
                      <button 
                        onClick={() => setUseProModel(true)}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${useProModel ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'text-gray-400 hover:text-white'}`}
                      >
                        <span>High Res (Pro)</span>
                        <span className="px-1.5 py-0.5 bg-black/30 rounded text-[10px] uppercase tracking-wide font-bold border border-white/10">2K</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 px-1">
                      {useProModel 
                        ? "Uses Gemini 3 Pro. Requires a paid project API key." 
                        : "Uses Gemini 2.5 Flash. Free and fast."}
                    </p>
                  </div>
               </div>

               <div className="pt-4 border-t border-white/5">
                 <Button 
                    onClick={handleGenerate} 
                    disabled={!originalImage || appState === AppState.GENERATING}
                    isLoading={appState === AppState.GENERATING}
                    className="w-full py-4 text-lg shadow-brand-500/25"
                  >
                    Generate Wallpaper
                  </Button>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;