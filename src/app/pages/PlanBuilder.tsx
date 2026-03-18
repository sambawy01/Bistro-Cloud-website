import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { ChatMessage } from '../components/ChatMessage';
import { QuickReplies } from '../components/QuickReplies';
import { ProposalCard } from '../components/ProposalCard';
import { streamChat, getSessionId, checkClientRateLimit, saveMessages, loadMessages, type ChatMessage as ChatMsg } from '../../services/aiService';
import { parseAIMessage, type Proposal } from '../../services/aiMessageParser';

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const toSave = messages.filter((m) => !m.isWelcome).map((m) => ({ role: m.role, content: m.content }));
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

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="w-full bg-[#F9F5F0] min-h-screen flex flex-col">
      <div className="bg-[#2C3E50] text-white py-6 px-4 text-center">
        <h1 className="font-montserrat font-bold text-2xl md:text-3xl">Build Your Catering Plan</h1>
        <p className="text-gray-300 text-sm mt-1">Powered by AI — takes about 2 minutes</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((msg, i) => (
          <React.Fragment key={i}>
            {msg.proposal ? (
              <ProposalCard proposal={msg.proposal} onModify={handleModify} modifyCount={modifyCount} />
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

      <div className="border-t border-gray-200 bg-white p-4">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
            disabled={isStreaming}
            className="flex-1 px-4 py-3 rounded-full bg-[#F9F5F0] border border-gray-200 focus:border-[#D94E28] focus:ring-0 outline-none text-sm transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="w-11 h-11 rounded-full bg-[#D94E28] text-white flex items-center justify-center shrink-0 hover:bg-[#c0392b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
