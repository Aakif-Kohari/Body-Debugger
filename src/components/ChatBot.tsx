import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Sparkles, Loader2, Activity } from 'lucide-react';
import { geminiService } from '../services/gemini';
import { cn } from '../lib/utils';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Namaste! I'm your Body Debugger AI. Feeling off today? Maybe I can help you find out why. Or just upload your last blood report!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const context = {
        hydration: "6/8 glasses",
        sleep: "7.2 hours",
        recentLab: "Vitamin D low (12 ng/mL)"
      };
      
      const response = await geminiService.chatWithContext(input, context);
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (error) {
      console.error("Chat failed", error);
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, my brain is feeling a bit bugged. Let's try that again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="glass mb-4 w-[350px] md:w-[400px] h-[550px] flex flex-col rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] border-white/10"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-white/10 to-transparent p-6 flex items-center justify-between text-white border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-teal/10 flex items-center justify-center text-primary-teal shadow-[0_0_15px_rgba(45,212,191,0.2)]">
                  <Sparkles size={18} />
                </div>
                <div>
                   <h3 className="font-black text-sm leading-none">Body Debugger AI</h3>
                   <p className="text-[10px] text-primary-teal font-black uppercase mt-1 tracking-widest">Always Learning</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-8 h-8 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-primary-teal text-bg-dark rounded-tr-none font-bold shadow-lg shadow-primary-teal/10" 
                      : "bg-white/5 text-text-main rounded-tl-none border border-white/10"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-4 rounded-3xl rounded-tl-none border border-white/10 animate-pulse">
                    <Loader2 size={16} className="animate-spin text-primary-teal" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 bg-gradient-to-t from-white/5 to-transparent border-t border-white/10">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 pr-12 text-sm focus:outline-none focus:border-primary-teal/50 transition-all placeholder:text-text-muted/30 font-bold"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 w-10 h-10 bg-primary-teal text-bg-dark rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-lg disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass text-primary-teal w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-all border-white/10"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
}
