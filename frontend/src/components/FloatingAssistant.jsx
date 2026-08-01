import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  SparklesIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { assistantAPI } from '../services/api';
import { renderBold } from '../utils/chatFormatting';
import { useAuth } from '../hooks/useAuth.jsx';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

const QUICK_PROMPTS = [
  'I lent 50,000 FRW to John yesterday',
  'I withdrew 20,000 from my savings',
  'What is my profit this month?',
  'Show my weekly expenses',
  'Register a new business for me',
  'What can you do?',
];

function buildWelcome(name) {
  return `Hi ${name ? name.split(' ')[0] : 'there'}! 👋 I'm your FinController assistant — always here to help you.\n\nI can fill forms for you, answer questions, and guide you — all in plain language:\n\n• **💰 Loans** — "I lent 30,000 FRW to Alice"\n• **🏦 Savings** — "Withdraw 20,000 from my savings"\n• **📊 Reports** — "What's my profit this month?"\n• **🏪 Business** — "Start a new business selling shoes"\n• **📝 Anything else** — "I spent 15,000 on food"\n\nAsk me anything, or tap a suggestion below.`;
}

function FloatingAssistant() {
  const location = useLocation();
  const { user } = useAuth();
  const isAssistantPage = location.pathname === '/assistant';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: '', actions: [] }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const firstName = (user && (user.name || '').split(' ')[0]) || '';

  // Set the welcome message (greets the user by name)
  useEffect(() => {
    setMessages([{ role: 'assistant', content: buildWelcome(firstName), actions: [] }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close the panel if the user navigates to the full Assistant page
  useEffect(() => {
    if (isAssistantPage) {
      setOpen(false);
    }
  }, [isAssistantPage]);

  // Auto-nudge: show the widget once per browser session after login
  useEffect(() => {
    if (!sessionStorage.getItem('sm_assistant_nudged') && !isAssistantPage) {
      const t = setTimeout(() => setOpen(true), 1200);
      sessionStorage.setItem('sm_assistant_nudged', '1');
      return () => clearTimeout(t);
    }
  }, [isAssistantPage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open, showCapabilities]);

  // Load conversation history when opened for the first time
  useEffect(() => {
    let cancelled = false;
    if (open && !sessionStorage.getItem('sm_assistant_loaded')) {
      setLoadingHistory(true);
      assistantAPI
        .getMessages()
        .then((response) => {
          if (cancelled) return;
          const history = response.data?.data || [];
          if (history.length > 0) {
            setMessages(
              history.map((m) => ({
                role: m.role,
                content: m.content,
                actions: m.actions || [],
              }))
            );
          }
        })
        .catch(() => {
          // Ignore history load errors (fresh conversation)
        })
        .finally(() => {
          if (!cancelled) setLoadingHistory(false);
          sessionStorage.setItem('sm_assistant_loaded', '1');
        });
    }
    return () => {
      cancelled = true;
    };
  }, [open]);

  const send = async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;
    setMessages((prev) => [...prev, { role: 'user', content: trimmed, actions: [] }]);
    setInput('');
    setLoading(true);
    try {
      const response = await assistantAPI.chat(trimmed);
      const data = response.data?.data;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data?.reply || 'Sorry, I could not process that.', actions: data?.actions || [] },
      ]);
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${errMsg}. Please try again.`, actions: [] },
      ]);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = async () => {
    try {
      await assistantAPI.clearMessages();
      setMessages([{ role: 'assistant', content: buildWelcome(firstName), actions: [] }]);
      toast.success('Conversation cleared');
    } catch (error) {
      toast.error('Failed to clear conversation');
    }
  };

  const capabilities = [
    { label: 'Create a loan', example: 'I lent 30,000 FRW to Alice' },
    { label: 'Add a contact', example: 'Add John, phone +250788123456, as a debtor' },
    { label: 'Record income/expense', example: 'I received 50,000 salary today' },
    { label: 'Savings deposit/withdraw', example: 'Withdraw 20,000 from my savings' },
    { label: 'Register a business', example: 'Start a business selling shoes' },
    { label: 'Track a project', example: 'Start a project to build a house' },
    { label: 'Schedule a reminder', example: 'Remind me to follow up with John on Friday' },
    { label: 'Asset given to someone', example: 'I lent my laptop to Alice' },
    { label: 'Petty cash', example: 'Add 50,000 to petty cash' },
    { label: 'Financial report', example: 'What is my profit this month?' },
    { label: 'Weekly/daily spending', example: 'Show my weekly expenses' },
    { label: 'Register an asset', example: 'I bought a laptop worth 300,000' },
    { label: 'Send SMS to contacts', example: 'Send a message to my farmers telling them payment is ready' },
    { label: 'Message a number', example: 'Send SMS to 0790706170 saying we meet tomorrow at 9' },
  ];

  return (
    <>
      {/* Launcher button (hidden on the full Assistant page) */}
      {!open && !isAssistantPage && (
        <button
          onClick={() => setOpen(true)}
          className="group fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-xl shadow-primary-500/30 transition hover:scale-105 hover:shadow-2xl"
          title="Ask the AI assistant"
        >
          <ChatBubbleLeftRightIcon className="h-7 w-7 transition group-hover:scale-110" />
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
          </span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 flex h-[min(80vh,640px)] w-[min(94vw,420px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-primary-600 to-indigo-600 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {firstName ? `Hi ${firstName} — how can I help?` : 'AI Assistant'}
                </p>
                <p className="text-[11px] text-primary-100">Your smart guide · fills forms & reports for you</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearConversation}
                className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
                title="Clear conversation"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
                title="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Capabilities guide */}
          {showCapabilities && (
            <div className="max-h-44 overflow-y-auto border-b border-gray-100 bg-indigo-50/60 px-4 py-3">
              <div className="mb-2 flex items-center gap-1.5">
                <LightBulbIcon className="h-4 w-4 text-indigo-600" />
                <p className="text-xs font-semibold text-indigo-900">Things you can ask me</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {capabilities.map((cap) => (
                  <button
                    key={cap.label}
                    onClick={() => {
                      setShowCapabilities(false);
                      send(cap.example);
                    }}
                    className="rounded-lg border border-indigo-200 bg-white px-2 py-1 text-left text-[11px] text-indigo-800 transition hover:bg-indigo-100"
                    title={cap.example}
                  >
                    {cap.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-3 py-4">
            {loadingHistory ? (
              <div className="flex justify-center py-6">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              messages.map((m, i) => {
                const isUser = m.role === 'user';
                return isUser ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary-600 px-3 py-2 text-sm text-white shadow-sm">
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-start">
                    <div className="flex max-w-[92%] gap-2">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-indigo-600">
                        <SparklesIcon className="h-4 w-4 text-white" />
                      </div>
                      <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm">
                        {m.content.split('\n').map((line, j) => {
                          if (line.trim().startsWith('•')) {
                            return (
                              <div key={j} className="my-0.5 flex gap-1.5">
                                <span className="text-primary-500">•</span>
                                <span className="whitespace-pre-wrap break-words">{renderBold(line.trim().slice(1).trim())}</span>
                              </div>
                            );
                          }
                          if (line.trim() === '') return <div key={j} className="h-1.5" />;
                          return <p key={j} className="whitespace-pre-wrap break-words">{renderBold(line)}</p>;
                        })}
                        {m.actions?.length > 0 && (
                          <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
                            {m.actions.map((a, j) => (
                              <div
                                key={j}
                                className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                                  a.status === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {a.status === 'error' ? '⚠️ ' : '✓ '}
                                {a.summary}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                </div>
              </div>
            )}
          </div>

          {/* Quick prompts */}
          {messages.length <= 2 && !loading && (
            <div className="border-t border-gray-100 bg-white px-3 pt-2">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    className="rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-700 transition hover:bg-primary-100"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-200 bg-white px-3 py-2.5">
            <div className="flex items-end gap-2">
              <button
                onClick={() => setShowCapabilities((v) => !v)}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                  showCapabilities
                    ? 'border-indigo-300 bg-indigo-100 text-indigo-700'
                    : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
                title="What can you do?"
              >
                <LightBulbIcon className="h-5 w-5" />
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask me anything..."
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white transition hover:bg-primary-700 disabled:opacity-40"
              >
                {loading ? <LoadingSpinner size="sm" /> : <PaperAirplaneIcon className="h-5 w-5" />}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between px-0.5">
              <p className="text-[10px] text-gray-400">I can create loans, contacts, savings & more for you</p>
              <Link
                to="/assistant"
                onClick={() => setOpen(false)}
                className="flex items-center gap-0.5 text-[11px] font-medium text-primary-600 transition hover:text-primary-700"
              >
                Open full assistant
                <ArrowTopRightOnSquareIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FloatingAssistant;
