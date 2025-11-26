// Revamped UI for NovaAI ChatBot
// Modern, clean layout with better spacing, smoother card structure, and improved message bubbles.

import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, X, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const palette = {
  bg: "#F7F5FF",
  card: "#FFFFFF",
  cardHover: "#F1ECFF",

  text: "#3B2F5D",
  text2: "#6B5E85",

  accent: "#A78BFA",
  accentSoft: "#DDD5FF",
  accentDeep: "#7C5BDA",

  border: "#E5E1F7",

  chartLine: "#A78BFA",
  chartFill: "rgba(167,139,250,0.18)",
  chartGrid: "#E5E1F7",

  progressTrack: "#EDE8FF",
  progressFill: "#A78BFA"
};

const genAI = new GoogleGenerativeAI("");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const cleanHTML = (html) => {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  temp.querySelectorAll("script, iframe, style").forEach((el) => el.remove());
  return temp.innerHTML;
};

const extractText = (html) => {
  const t = document.createElement("div");
  t.innerHTML = html;
  return t.textContent;
};

// Function to remove HTML tags and extract plain text
const removeHTMLTags = (html) => {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
};

export default function ChatBot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMsg = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = {
      role: "user",
      content: input,
      id: Date.now(),
      time: new Date(),
    };

    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const prompt = `You are NovaAI. Provide helpful, concise responses.`;
      const res = await model.generateContent(prompt + input);
      let out = res.response.candidates?.[0]?.content?.parts?.[0]?.text || "Error.";
      
      // Remove HTML tags and clean the response
      out = removeHTMLTags(out);
      
      setMessages((p) => [...p, { 
        role: "model", 
        content: out, 
        id: Date.now(), 
        time: new Date() 
      }]);
    } catch (err) {
      setMessages((p) => [...p, { 
        role: "model", 
        content: "Something went wrong. Please try again.", 
        id: Date.now(), 
        time: new Date() 
      }]);
    }

    setLoading(false);
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="flex flex-col h-screen" style={{ background: palette.bg, color: palette.text }}>

      {/* HEADER */}
      <header className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: palette.border, background: palette.card }}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl" style={{ background: palette.accent }}>
            <Bot className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">NovaAI</h1>
            <p className="text-xs" style={{ color: palette.text2 }}>Smart AI Assistant</p>
          </div>
        </div>

        {messages.length > 0 && (
          <Button onClick={clearChat} className="rounded-lg px-3 py-2" variant="ghost">
            <X />
          </Button>
        )}
      </header>

      {/* MESSAGES */}
      <main className="flex-1 overflow-y-auto p-5 space-y-6">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>

              <div className="max-w-[75%]">
                {/* AI Message with Logo and Name */}
                {m.role === "model" && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: palette.accent }}>
                      <Bot className="text-white" size={12} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: palette.accentDeep }}>NovaAI</span>
                  </div>
                )}

                <div
                  className="p-4 rounded-2xl shadow-sm border"
                  style={{
                    background: m.role === "user" ? palette.accent : palette.card,
                    color: m.role === "user" ? "white" : palette.text,
                    borderColor: palette.border,
                  }}
                >
                  <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                  <div className="text-[10px] mt-2 opacity-70">{m.time.toLocaleTimeString()}</div>
                </div>

                {/* COPY BUTTON - Only for AI messages */}
                {m.role === "model" && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(m.content);
                      setCopiedId(m.id);
                      setTimeout(() => setCopiedId(null), 1500);
                    }}
                    className="mt-1 text-xs flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: palette.text2 }}
                  >
                    {copiedId === m.id ? <Check size={14} /> : <Copy size={14} />} 
                    {copiedId === m.id ? "Copied!" : "Copy"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex items-center gap-3 opacity-70" style={{ color: palette.text2 }}>
            <Loader2 className="animate-spin" size={16} /> 
            Thinking...
          </div>
        )}

        <div ref={endRef} />
      </main>

      {/* INPUT */}
      <footer className="p-4 border-t" style={{ borderColor: palette.border, background: palette.card }}>
        <form onSubmit={sendMsg} className="flex gap-3 items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-xl"
            style={{ background: palette.bg, borderColor: palette.border }}
          />
          <Button 
            type="submit" 
            className="rounded-xl px-4" 
            disabled={loading}
            style={{ background: palette.accent }}
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          </Button>
        </form>
      </footer>

    </div>
  );
}
