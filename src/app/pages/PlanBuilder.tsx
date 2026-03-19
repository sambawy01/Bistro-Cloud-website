import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { ChatMessage } from '../components/ChatMessage';
import { QuickReplies } from '../components/QuickReplies';
import { ProposalCard } from '../components/ProposalCard';
import { streamChat, getSessionId, checkClientRateLimit, saveMessages, loadMessages, type ChatMessage as ChatMsg } from '../../services/aiService';
import { parseAIMessage, type Proposal } from '../../services/aiMessageParser';

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;        // Display text (JSON fences stripped for assistant messages)
  rawContent?: string;    // Raw AI response (with JSON fences, for localStorage persistence)
  quickReplies: string[];
  proposal: Proposal | null;
  isWelcome?: boolean;
}

const WELCOME_CONTENT = "Welcome to Bistro Cloud's Plan Builder! I'll help you design the perfect catering plan for your team. This takes about 2 minutes.\n\nFirst — what's your company name?";

function makeWelcomeMessage(): DisplayMessage {
  return { role: 'assistant', content: WELCOME_CONTENT, quickReplies: [], proposal: null, isWelcome: true };
}

export function PlanBuilderPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>(() => {
    const stored = loadMessages('plan-builder');
    if (stored && stored.length > 0) {
      return stored.map((m) => {
        const parsed = m.role === 'assistant' ? parseAIMessage(m.content) : { text: m.content, quickReplies: [], proposal: null };
        return { role: m.role as 'user' | 'assistant', content: m.role === 'assistant' ? parsed.text : m.content, quickReplies: parsed.quickReplies, proposal: parsed.proposal };
      });
    }
    return [makeWelcomeMessage()];
  });
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [modifyCount, setModifyCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist messages — use rawContent for assistant messages so JSON fences survive round-trip
  useEffect(() => {
    const toSave = messages.filter((m) => !m.isWelcome).map((m) => ({
      role: m.role,
      content: m.rawContent || m.content,
    }));
    if (toSave.length > 0) saveMessages('plan-builder', toSave);
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streamingText]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    if (!checkClientRateLimit('plan-builder')) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "You've been chatty! For more help, message us on WhatsApp.",
        quickReplies: [],
        proposal: null,
      }]);
      return;
    }

    const userMsg: DisplayMessage = { role: 'user', content: text.trim(), quickReplies: [], proposal: null };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);
    setStreamingText('');

    const history: ChatMsg[] = messages
      .filter((m) => !m.isWelcome)
      .map((m) => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: text.trim() });

    let accumulated = '';

    await streamChat('plan-builder', history, getSessionId(), {
      onToken: (token) => {
        accumulated += token;
        setStreamingText(accumulated);
      },
      onDone: () => {
        const parsed = parseAIMessage(accumulated);
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: parsed.text,
          rawContent: accumulated,
          quickReplies: parsed.quickReplies,
          proposal: parsed.proposal,
        }]);
        setStreamingText('');
        setIsStreaming(false);
      },
      onError: (error) => {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: error,
          quickReplies: [],
          proposal: null,
        }]);
        setStreamingText('');
        setIsStreaming(false);
      },
    });
  };

  const handleModify = () => {
    setModifyCount((c) => c + 1);
    sendMessage("I'd like to modify this plan.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="w-full bg-[#F9F5F0] min-h-screen">
      {/* Hero Header */}
      <div className="bg-[#2C3E50] text-white py-12 md:py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2C3E50] to-[#1a252f]" />
        <div className="relative z-10">
          <p className="text-[#D94E28] font-semibold text-sm uppercase tracking-[3px] mb-3">AI-Powered</p>
          <h1 className="font-montserrat font-bold text-3xl md:text-4xl mb-2">Build Your Catering Plan</h1>
          <p className="text-gray-400 text-sm md:text-base">Get a custom proposal with pricing in about 2 minutes</p>
        </div>
      </div>

      {/* Chat Container — centered card */}
      <div className="max-w-2xl mx-auto px-4 -mt-6 relative z-10 pb-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Messages */}
          <div ref={scrollRef} className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
            {messages.map((msg, i) => (
              <React.Fragment key={i}>
                {msg.proposal ? (
                  <ProposalCard proposal={msg.proposal} onModify={handleModify} modifyCount={modifyCount} />
                ) : msg.isWelcome ? (
                  /* Styled welcome message */
                  <div className="text-center py-4">
                    <div className="w-14 h-14 bg-[#D94E28]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🍽️</span>
                    </div>
                    <h2 className="font-montserrat font-bold text-lg text-[#2C3E50] mb-2">
                      Welcome to the Plan Builder!
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
                      I'll help you design the perfect catering plan for your team. Let's start with a few questions.
                    </p>
                    <p className="text-[#2C3E50] font-semibold text-sm mt-4">
                      What's your company name?
                    </p>
                  </div>
                ) : (
                  <ChatMessage role={msg.role} content={msg.content} />
                )}
                {i === messages.length - 1 && msg.quickReplies.length > 0 && !isStreaming && (
                  <QuickReplies replies={msg.quickReplies} onSelect={sendMessage} disabled={isStreaming} />
                )}
              </React.Fragment>
            ))}

            {isStreaming && streamingText && (
              <ChatMessage role="assistant" content={streamingText} isStreaming />
            )}
          </div>

          {/* Input — inside the card, right below messages */}
          <div className="border-t border-gray-100 p-4 bg-[#FAFAF8]">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer..."
                disabled={isStreaming}
                autoFocus
                className="flex-1 px-5 py-3.5 rounded-xl bg-white border border-gray-200 focus:border-[#D94E28] focus:ring-1 focus:ring-[#D94E28]/20 outline-none text-sm transition-all disabled:opacity-50 font-medium placeholder:font-normal"
              />
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                className="w-12 h-12 rounded-xl bg-[#D94E28] text-white flex items-center justify-center shrink-0 hover:bg-[#c0392b] transition-all hover:shadow-lg hover:shadow-[#D94E28]/25 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
