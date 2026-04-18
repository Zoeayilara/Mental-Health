import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import '../styles/chat.css'

// Set this in frontend/.env.local as VITE_GROQ_API_KEY
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

const TOPIC_PROMPTS = {
  stress:        'The user is focusing on managing stress and anxiety.',
  relationships: 'The user is focusing on understanding their relationships.',
  emotions:      'The user is focusing on expressing and understanding their emotions.',
  change:        'The user is focusing on handling change in their life.',
  motivation:    'The user is focusing on finding motivation and purpose.',
  sleep:         'The user is focusing on improving their sleep and rest.',
}

const CRISIS_WORDS = ['give up','hopeless','end it','suicide','want to die','kill myself',"can't go on",'no reason to live','self harm','hurt myself']

const QUICK_PROMPTS = [
  { icon: '😟', text: 'How are you feeling today?' },
  { icon: '💭', text: "Why do I feel so overwhelmed?" },
  { icon: '🧘', text: 'Help me with a breathing exercise' },
  { icon: '📞', text: 'I want to enquire about counselling' },
]

function isCrisis(text) {
  return CRISIS_WORDS.some(w => text.toLowerCase().includes(w))
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function Chat() {
  const { user }              = useAuth()
  const [messages, setMessages] = useState([])
  const [history, setHistory]   = useState([])
  const [input, setInput]       = useState('')
  const [typing, setTyping]     = useState(false)
  const [crisis, setCrisis]     = useState(false)
  const [loaded, setLoaded]     = useState(false)
  const bottomRef               = useRef(null)
  const inputRef                = useRef(null)

  const SYSTEM = `You are CalmBot, a warm and empathetic AI mental health companion built for university and secondary school students in Nigeria.

Your personality: Calm, caring, non-judgmental, conversational. You feel like a trusted friend — not a clinical therapist.
${user?.topic ? `\nContext: ${TOPIC_PROMPTS[user.topic] || ''}` : ''}
Guidelines:
- Acknowledge feelings before giving suggestions. Empathy first, always.
- Keep responses concise: 2–4 paragraphs max.
- Suggest practical coping strategies when appropriate.
- Use light emojis occasionally. Ask one gentle follow-up question.
- Never diagnose or replace professional help.

CRISIS PROTOCOL: If the user expresses suicidal thoughts, self-harm, or wanting to die:
1. Respond with deep compassion.
2. Provide these contacts EXACTLY:
   📞 Nigeria Suicide Prevention Initiative (NSPI): +234 806 210 6493
   🌐 nigeriasuicideprevention.org
   🏫 Walk into your school counselling office — no appointment needed
   🚨 Emergency: 112
3. Tell them their life matters. Invite them to keep talking.`

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  async function loadHistory() {
    try {
      const res  = await fetch('/api/chat/history', { credentials: 'include' })
      const data = await res.json()
      if (Array.isArray(data) && data.length) {
        setMessages(data.map(m => ({ role: m.role === 'assistant' ? 'bot' : m.role, text: m.content, time: new Date(m.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) })))
        setHistory(data.map(m => ({ role: m.role, content: m.content })))
      } else {
        // First time greeting
        const name = user?.name || 'there'
        const h    = new Date().getHours()
        const tod  = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
        addBot(`Good ${tod}, ${name}! 👋\n\nI'm CalmBot — your personal mental health companion. This is a safe, judgment-free space made just for you.\n\nHow are you feeling today?`)
      }
    } catch { }
    setLoaded(true)
  }

  function addBot(text, iscrisis = false) {
    const msg = { role: 'bot', text, time: getTime(), crisis: iscrisis }
    setMessages(m => [...m, msg])
  }

  async function saveMessage(role, content) {
    fetch('/api/chat/save', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, content })
    }).catch(() => {})
  }

  async function send(text) {
    text = text.trim()
    if (!text || typing) return

    setMessages(m => [...m, { role: 'user', text, time: getTime() }])
    saveMessage('user', text)

    const newHist = [...history, { role: 'user', content: text }]
    setHistory(newHist)
    setInput('')
    setTyping(true)

    if (isCrisis(text)) setCrisis(true)

    if (!GROQ_KEY) {
      setTyping(false)
      addBot('⚠️ Missing Groq API key. Add VITE_GROQ_API_KEY to frontend/.env.local and restart the dev server.')
      return
    }

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1024,
          messages: [{ role: 'system', content: SYSTEM }, ...newHist]
        })
      })
      const data  = await res.json()
      setTyping(false)
      if (!res.ok) { addBot('⚠️ ' + (data?.error?.message || 'Something went wrong.')); return }
      const reply = data.choices[0].message.content
      setHistory(h => [...h, { role: 'assistant', content: reply }])
      saveMessage('assistant', reply)
      addBot(reply, isCrisis(text))
    } catch {
      setTyping(false)
      addBot('⚠️ Could not connect. Please check your internet connection.')
    }
  }

  async function clearChat() {
    await fetch('/api/chat/clear', { method: 'DELETE', credentials: 'include' })
    setMessages([])
    setHistory([])
    setCrisis(false)
    setTimeout(() => {
      addBot(`Chat cleared! 🌱 I'm still here whenever you're ready to talk. What's on your mind?`)
    }, 300)
  }

  return (
    <div className="chat-page">
      {/* Header */}
      <div className="chat-topbar">
        <div className="chat-bot-info">
          <div className="chat-bot-av">🧠</div>
          <div>
            <p className="chat-bot-name">CalmBot</p>
            <p className="chat-bot-status"><span className="online-dot"/>Always here for you</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost btn-sm" onClick={clearChat}>🗑 Clear</button>
          {crisis && <button className="btn btn-danger btn-sm" onClick={() => setCrisis(false)}>✕ Dismiss</button>}
        </div>
      </div>

      {/* Crisis banner */}
      {crisis && (
        <div className="crisis-bar animate-up">
          <strong>💙 Help is available right now:</strong>
          <span>📞 NSPI: +234 806 210 6493</span>
          <span>🏫 School counselling office (no appointment)</span>
          <span>🚨 Emergency: 112</span>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {!loaded && <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}><div className="loader-ring" style={{ margin:'0 auto' }} /></div>}

        {messages.map((m, i) => (
          <div key={i} className={`msg-row ${m.role} animate-up`} style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}>
            {m.role === 'bot' && <div className="msg-av">🧠</div>}
            <div className={`bubble ${m.role} ${m.crisis ? 'bubble-crisis' : ''}`}>
              {m.text.split('\n').map((line, j) => (
                <span key={j}>{line}{j < m.text.split('\n').length - 1 && <br/>}</span>
              ))}
              <span className="bubble-time">{m.time}</span>
            </div>
            {m.role === 'user' && (
              <div className="msg-av user-av">
                {user?.avatar ? <img src={`/uploads/${user.avatar}`} alt="" /> : user?.name?.charAt(0)}
              </div>
            )}
          </div>
        ))}

        {typing && (
          <div className="msg-row bot">
            <div className="msg-av">🧠</div>
            <div className="bubble bot typing-bub">
              <span className="tdot"/><span className="tdot"/><span className="tdot"/>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.filter(m => m.role === 'user').length === 0 && loaded && (
        <div className="quick-row">
          {QUICK_PROMPTS.map((q, i) => (
            <button key={i} className="quick-pill" onClick={() => send(q.text)}>
              {q.icon} {q.text}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="chat-input-wrap">
        <div className="chat-input-box">
          <textarea
            ref={inputRef}
            className="chat-textarea"
            placeholder="Ask me anything…"
            value={input}
            rows={1}
            onChange={e => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}
            onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send(input) } }}
          />
          <button
            className={`send-btn ${input.trim() ? 'ready' : ''}`}
            onClick={() => send(input)}
            disabled={!input.trim() || typing}
          >➤</button>
        </div>
        <p className="chat-disclaimer">CalmBot is not a substitute for professional mental health care.</p>
      </div>
    </div>
  )
}
