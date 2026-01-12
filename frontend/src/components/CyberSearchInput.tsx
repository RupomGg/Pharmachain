import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Scan, Loader2, ArrowRight } from 'lucide-react'

interface CyberSearchInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const PLACEHOLDERS = [
  "Enter Batch ID...",
  "Paste Transaction Hash...",
  "Search Product Name..."
];

export const CyberSearchInput = ({ value, onChange, onSubmit, isLoading }: CyberSearchInputProps) => {
  const [isFocused, setIsFocused] = useState(false)
  
  // --- Typewriter Effect Logic ---
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [currentPlaceholder, setCurrentPlaceholder] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [typingSpeed, setTypingSpeed] = useState(150)

  useEffect(() => {
    let timer: any;

    const handleType = () => {
      const fullText = PLACEHOLDERS[placeholderIndex];
      
      setCurrentPlaceholder(prev => 
        isDeleting ? fullText.substring(0, prev.length - 1) : fullText.substring(0, prev.length + 1)
      );

      setTypingSpeed(isDeleting ? 50 : 100);

      if (!isDeleting && currentPlaceholder === fullText) {
        timer = setTimeout(() => setIsDeleting(true), 2000); // Pause at end
      } else if (isDeleting && currentPlaceholder === '') {
        setIsDeleting(false);
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
      } else {
        timer = setTimeout(handleType, typingSpeed);
      }
    };

    timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [currentPlaceholder, isDeleting, placeholderIndex, typingSpeed]);


  return (
    <form onSubmit={onSubmit} className="relative w-full max-w-3xl group mx-auto">
      
      {/* 1. Rotating Glow Border (Active State) */}
      <AnimatePresence>
        {isFocused && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute -inset-0.5 rounded-full overflow-hidden blur-sm z-0"
            >
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="w-full h-full absolute inset-[-50%]"
                    style={{
                        background: 'conic-gradient(from 0deg, transparent 0deg, #14b8a6 90deg, #3b82f6 180deg, transparent 360deg)',
                        width: '200%',
                        height: '200%',
                        top: '-50%',
                        left: '-50%'
                    }}
                />
            </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Container */}
      <div 
        className={`relative z-10 flex items-center h-20 bg-slate-900/60 backdrop-blur-xl rounded-full border transition-all duration-500 overflow-hidden
        ${isFocused 
            ? 'border-transparent shadow-[0_0_50px_-10px_rgba(20,184,166,0.3)]' 
            : 'border-white/10 shadow-[0_0_40px_-10px_rgba(20,184,166,0.1)] hover:border-white/20'
        }`}
      >
        
        {/* Search Icon */}
        <div className="pl-6 md:pl-8 pr-4 text-slate-500 group-hover:text-slate-400 transition-colors">
            <Search className={`w-6 h-6 ${isFocused ? 'text-teal-400' : ''}`} />
        </div>

        {/* Text Input */}
        <div className="flex-1 relative h-full flex items-center">
            {/* Typewriter Placeholder */}
            {!value && (
                <span className="absolute left-0 text-slate-500 font-mono text-lg pointer-events-none opacity-50">
                    {currentPlaceholder}
                    <span className="animate-pulse">|</span>
                </span>
            )}

            <input 
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full bg-transparent border-none outline-none text-xl text-white font-mono placeholder-transparent relative z-20"
            />

            {/* Radar Scan Line (Focus Animation) */}
            <AnimatePresence>
                {isFocused && (
                     <motion.div 
                        initial={{ left: 0, opacity: 0 }}
                        animate={{ 
                            left: ["0%", "100%", "0%"],
                            opacity: [0, 1, 0]
                        }}
                        transition={{ 
                            duration: 3, 
                            ease: "linear", 
                            repeat: Infinity 
                        }}
                        className="absolute top-2 bottom-2 w-0.5 bg-gradient-to-b from-transparent via-teal-400 to-transparent blur-[1px] pointer-events-none z-10"
                     />
                )}
            </AnimatePresence>
        </div>

        {/* Action Button */}
        <div className="pr-2 md:pr-3">
            <button 
                type="submit"
                disabled={isLoading}
                className="relative overflow-hidden h-14 px-8 rounded-full font-bold tracking-wider text-sm transition-all duration-300 group/btn"
                style={{
                    background: isLoading 
                        ? 'rgba(20, 184, 166, 0.1)' 
                        : 'linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                    color: isLoading ? '#2dd4bf' : '#94a3b8'
                }}
            >
                {/* Button Tech Border */}
                <div className="absolute inset-0 rounded-full border border-white/5 group-hover/btn:border-teal-500/30 transition-colors" />
                
                {/* Gradient Fill on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 ${isLoading ? 'hidden' : ''}`} />

                {/* Content */}
                <div className="relative z-10 flex items-center gap-2 group-hover/btn:text-white transition-colors">
                    {isLoading ? (
                        <>
                            <Scan className="w-5 h-5 animate-spin-reverse" />
                            <span className="hidden md:inline font-mono">SCANNING</span>
                        </>
                    ) : (
                        <>
                            <span>SEARCH</span>
                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </>
                    )}
                </div>
            </button>
        </div>

      </div>
    </form>
  )
}
