import { useState, useEffect, useRef } from 'react';
import { PaperAirplaneIcon, SparklesIcon, TrashIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { assistantAPI } from '../services/api';
import { renderBold } from '../utils/chatFormatting';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const QUICK_PROMPTS = [
  'I lent 50,000 FRW to John yesterday',
  'I withdrew 20,000 from my savings',
  'What is my profit this month?',
  'Show my weekly expenses',
  'Register a new business for me',
  'Record that I spent 15,000 on food',
];

const WELCOME_MESSAGE = `Hi! 👋 I'm your FinController assistant.

Tell me things in plain language and I'll take care of the rest — for example:

• **"I lent 30,000 FRW to Alice"** — I'll create the loan (and the contact if needed)
• **"I withdrew 20,000 from savings"** — I'll ask which account, then record it
• **"What's my profit this month?"** — I'll pull a full financial report
• **"Start a new business selling shoes"** — I'll register it for you

Just type or tap a suggestion below.`;

function MessageBubble({ message, isUser }) {
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary-600 px-4 py-2.5 text-sm text-white shadow-sm">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    );
  }

  // Render the assistant message with simple markdown-ish formatting:
  // lines starting with • become list items, **bold** becomes bold.
  const lines = message.content.split('\n');

  return (
    <div className="flex justify-start">
      <div className="flex max-w-[85%] gap-2.5">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-indigo-600">
          <SparklesIcon className="h-5 w-5 text-white" />
        </div>
        <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm">
          {lines.map((line, i) => {
            if (line.trim().startsWith('•')) {
              return (
                <div key={i} className="my-1 flex gap-2">
                  <span className="text-primary-500">•</span>
                  <span className="whitespace-pre-wrap break-words">{renderBold(line.trim().slice(1).trim())}</span>
                </div>
              );
            }
            if (line.trim() === '') return <div key={i} className="h-2" />;
            return (
              <p key={i} className="whitespace-pre-wrap break-words">
                {renderBold(line)}
              </p>
            );
          })}

          {message.actions && message.actions.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-2.5">
              {message.actions.map((action, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                    action.status === 'error'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  <span>{action.status === 'error' ? '⚠️' : '✓'}</span>
                  <span className="whitespace-pre-wrap break-words">{action.summary}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex gap-2.5">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-indigo-600">
          <SparklesIcon className="h-5 w-5 text-white" />
        </div>
        <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
        </div>
      </div>
    </div>
  );
}

function Assistant() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME_MESSAGE, actions: [] }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await assistantAPI.getMessages();
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
      } catch (error) {
        // Ignore history load errors (fresh conversation)
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
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
        {
          role: 'assistant',
          content: `⚠️ ${errMsg}. Please try again.`,
          actions: [],
        },
      ]);
      toast.error(errMsg);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearConversation = async () => {
    try {
      await assistantAPI.clearMessages();
      setMessages([{ role: 'assistant', content: WELCOME_MESSAGE, actions: [] }]);
      toast.success('Conversation cleared');
    } catch (error) {
      toast.error('Failed to clear conversation');
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 shadow-md">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">AI Assistant</h1>
            <p className="text-xs text-gray-500">Powered by Groq · I fill forms & reports for you</p>
          </div>
        </div>
        <button
          onClick={clearConversation}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          title="Clear conversation"
        >
          <TrashIcon className="h-4 w-4" />
          Clear
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50 px-4 py-6 sm:px-6">
        {loadingHistory ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((message, i) => (
              <MessageBubble key={i} message={message} isUser={message.role === 'user'} />
            ))}
            {loading && <TypingIndicator />}
          </div>
        )}
      </div>

      {/* Quick prompts */}
      {messages.length <= 2 && !loading && (
        <div className="border-t border-gray-200 bg-white px-4 pb-2 pt-3">
          <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:bg-primary-100 hover:shadow-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            rows={1}
            placeholder='Type a message... e.g. "I lent 30,000 FRW to Alice"'
            className="max-h-32 flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? <LoadingSpinner size="sm" /> : <PaperAirplaneIcon className="h-5 w-5" />}
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-gray-400">
          The assistant can create loans, contacts, transactions, savings, businesses, expenses & more on your behalf.
        </p>
      </div>
    </div>
  );
}

export default Assistant;
