import { useState } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = async () => {
    window.electronAPI?.maximize();
    const maximized = await window.electronAPI?.isMaximized();
    setIsMaximized(!!maximized);
  };
  const handleClose = () => window.electronAPI?.close();

  return (
    <div className="h-8 gradient-primary flex items-center justify-between select-none shrink-0"
         style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="flex items-center gap-2 px-4">
        <img src="./logo.png" alt="ArmiGo Logo" className="w-6 h-6 rounded-md bg-white/20 object-contain" />
        <span className="text-white/90 text-xs font-semibold tracking-wide">ArmiGo Desktop</span>
      </div>
      <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button onClick={handleMinimize}
                className="h-full px-4 text-white/70 hover:bg-white/10 transition-colors flex items-center">
          <Minus size={14} />
        </button>
        <button onClick={handleMaximize}
                className="h-full px-4 text-white/70 hover:bg-white/10 transition-colors flex items-center">
          {isMaximized ? <Copy size={12} /> : <Square size={12} />}
        </button>
        <button onClick={handleClose}
                className="h-full px-4 text-white/70 hover:bg-red-500 hover:text-white transition-colors flex items-center">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
