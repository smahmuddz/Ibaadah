import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

const GROQ_KEY = process.env.REACT_APP_GROQ_API_KEY;

const SYSTEM_PROMPT = `
You are an Islamic scholar assistant well-versed in:
- Quran
- Hadith
- Hanafi, Maliki, Shafi'i, and Hanbali madhabs

You help Muslims understand:
- Halal and Haram rulings
- Islamic jurisprudence (fiqh)
- Salah, fasting, zakat, hajj
- Islamic ethics and daily life

Always:
- Cite Quran or Hadith references when possible
- Mention differences of opinion when relevant
- Be respectful and compassionate
- Keep answers practical and concise
`;

const HIDDEN_PROMPT = `
Make the response as concise as possible.
Include Quran or Hadith references when relevant, with exact hadith and quran quotes when necessary.
Use simple wording. if people asks anything out of islamic or religious context, tell them it is out of your scope and politely refuse to answer. If you don't know the answer, say you don't know but will try to find out.
`;

const SUGGESTIONS = [
  "Is music halal or haram?",
  "How to perform Salah correctly?",
  "What breaks your fast in Ramadan?",
  "Is cryptocurrency halal?",
  "What is the ruling on tattoos?",
];

export default function Chatbot() {

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
`As-salamu alaykum!

I am your Islamic Scholar companion.

Ask me anything about:
• Halal & Haram
• Prayer & fasting
• Fiqh rulings
• Islamic guidance

How can I help you today?`
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // ── Auto Scroll ─────────────────────────────
  useEffect(() => {

    bottomRef.current?.scrollIntoView({
      behavior: 'smooth'
    });

  }, [messages, loading]);

  // ── Send Message ────────────────────────────
  async function sendMessage(text) {

    const userMsg = (text || input).trim();

    if (!userMsg || loading) return;

    setInput('');

    // Show ONLY clean message in UI
    const uiMessages = [
      ...messages,
      {
        role: 'user',
        content: userMsg
      }
    ];

    setMessages(uiMessages);

    setLoading(true);

    try {

      // Build API messages separately
      const apiMessages = [

        {
          role: 'system',
          content: SYSTEM_PROMPT
        },

        // Previous messages
        ...messages,

        // Hidden enhanced prompt
        {
          role: 'user',
          content:
`${HIDDEN_PROMPT}

User Question:
${userMsg}`
        }
      ];

      const res = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_KEY}`,
          },

          body: JSON.stringify({

            model: 'llama-3.3-70b-versatile',

            messages: apiMessages,

            max_tokens: 1024,

            temperature: 0.7,
          }),
        }
      );

      const data = await res.json();

      console.log(data);

      const reply =
        data?.choices?.[0]?.message?.content ||
        'Sorry, I could not get a response.';

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: reply
        }
      ]);

    } catch (err) {

      console.error(err);

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            '⚠️ Connection error. Please check your API key or internet connection.'
        }
      ]);
    }

    setLoading(false);
  }

  const showSuggestions = messages.length === 1;

  return (

    <div className="chat-page">

      {/* ── Header ─────────────────────────── */}
      <div className="chat-header">

       <div className="chat-header-icon">
  <img
    src="/favicon-96x96.png"
    alt="Ibaadah Logo"
    className="header-logo"
  />
</div>

        <div>

          <div className="chat-header-title">
            Islamic Scholar
          </div>

          <div className="chat-header-sub">
            Ask anything about Islam · Always available
          </div>

        </div>

        <div className="online-dot" />

      </div>

      {/* ── Chat Body ─────────────────────── */}
      <div className="chat-body">

        {/* Suggestions */}
        {showSuggestions && (

          <div className="suggestions-section">

            <p className="suggestions-label">
              Suggested questions
            </p>

            <div className="suggestions-list">

              {SUGGESTIONS.map(s => (

                <button
                  key={s}
                  className="suggestion-pill"
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </button>

              ))}

            </div>

          </div>
        )}

        {/* Messages */}
        <div className="messages-list">

          {messages.map((msg, i) => (

            <div
              key={i}
              className={`msg-row ${msg.role}`}
              style={{
                animationDelay: `${i * 0.04}s`
              }}
            >

              {msg.role === 'assistant' && (
                <div className="">
                
                <img
                  src="/favicon-96x96.png"
                  alt="Ibaadah Logo"
                  className="header-logo"
                />
              </div>

              )}

              <div className="msg-bubble">

                <div className="msg-text">
                  {msg.content}
                </div>

              </div>

            </div>
          ))}

          {/* Typing */}
          {loading && (

            <div className="msg-row assistant">

              <div className="msg-avatar">
                
              </div>

              <div className="msg-bubble">

                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>

              </div>

            </div>
          )}

          <div ref={bottomRef} />

        </div>

      </div>

      {/* ── Input ─────────────────────────── */}
      <div className="chat-input-bar">

        <textarea
          ref={inputRef}
          className="chat-textarea"
          placeholder="Ask your question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {

            if (
              e.key === 'Enter' &&
              !e.shiftKey
            ) {

              e.preventDefault();

              sendMessage();
            }
          }}
          rows={1}
        />

        <button
          className="chat-send-btn"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          aria-label="Send"
        >

          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
          >

            <path
              d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

          </svg>

        </button>

      </div>

    </div>
  );
}