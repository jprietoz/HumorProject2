'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/auth-client-browser'

const PROMPT_TEXT = "Are you a part of the Humor Project?"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [answer, setAnswer] = useState<'yes' | 'no' | null>(null)
  const [typedPrompt, setTypedPrompt] = useState('')
  const [showInput, setShowInput] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Typewriter effect
  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      if (i < PROMPT_TEXT.length) {
        setTypedPrompt(PROMPT_TEXT.slice(0, i + 1))
        i++
      } else {
        clearInterval(timer)
        setTimeout(() => setShowInput(true), 500)
      }
    }, 38)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showInput])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const val = input.trim().toLowerCase()
    if (val === 'yes') setAnswer('yes')
    else if (val === 'no') setAnswer('no')
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Courier New', Courier, monospace",
      padding: '1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '620px',
        background: '#0d0d0d',
        border: '1px solid #1f1f1f',
        borderRadius: '10px',
        boxShadow: '0 0 60px rgba(0, 255, 136, 0.06), 0 0 120px rgba(0, 255, 136, 0.03), 0 20px 60px rgba(0,0,0,0.8)',
        overflow: 'hidden',
      }}>
        {/* Terminal title bar */}
        <div style={{
          background: '#161616',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid #1f1f1f',
        }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
          <span style={{ marginLeft: 8, color: '#444', fontSize: '12px', letterSpacing: '0.05em' }}>
            humor-project — terminal
          </span>
        </div>

        {/* Terminal body */}
        <div
          style={{ padding: '28px 28px 32px', minHeight: '220px', cursor: 'text' }}
          onClick={() => inputRef.current?.focus()}
        >
          {/* System boot line */}
          <div style={{ color: '#333', fontSize: '12px', marginBottom: '16px', letterSpacing: '0.04em' }}>
            humor-os v1.0 — initialized
          </div>

          {/* Prompt line */}
          <div style={{ color: '#00ff88', fontSize: '15px', lineHeight: '1.8' }}>
            <span style={{ color: '#444' }}>~/humor $ </span>
            <span>{typedPrompt}</span>
            {!showInput && (
              <span style={{
                display: 'inline-block',
                width: '9px',
                height: '16px',
                background: '#00ff88',
                marginLeft: '2px',
                verticalAlign: 'text-bottom',
                animation: 'termBlink 1s step-end infinite',
              }} />
            )}
          </div>

          {/* Input line */}
          {showInput && answer === null && (
            <div style={{ marginTop: '10px', fontSize: '15px', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#444' }}>~/humor $ </span>
              <span style={{ color: '#666', marginLeft: '4px' }}>Type </span>
              <span style={{ color: '#00ff88', margin: '0 4px' }}>yes</span>
              <span style={{ color: '#666' }}>or</span>
              <span style={{ color: '#ff6666', margin: '0 4px' }}>no</span>
              <span style={{ color: '#666', marginRight: '8px' }}>:</span>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flex: 1 }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#00ff88',
                    fontFamily: 'inherit',
                    fontSize: '15px',
                    caretColor: '#00ff88',
                    flex: 1,
                    minWidth: 0,
                  }}
                  autoComplete="off"
                  spellCheck={false}
                />
              </form>
            </div>
          )}

          {/* YES — show Google login */}
          {answer === 'yes' && (
            <div style={{ marginTop: '18px' }}>
              <div style={{ color: '#00ff88', fontSize: '14px', marginBottom: '4px' }}>
                <span style={{ color: '#444' }}>~/humor $ </span>
                <span style={{ color: '#00cc77' }}>identity verification required...</span>
              </div>
              <div style={{
                marginTop: '20px',
                padding: '20px',
                border: '1px solid #1a1a1a',
                borderRadius: '6px',
                background: '#111',
              }}>
                {error && (
                  <div style={{
                    color: '#ff4444',
                    fontSize: '13px',
                    marginBottom: '14px',
                    padding: '8px 12px',
                    border: '1px solid #ff444433',
                    borderRadius: '4px',
                    background: '#ff44441a',
                    fontFamily: 'inherit',
                  }}>
                    ERROR: {error}
                  </div>
                )}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: '#fff',
                    color: '#1f2937',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '11px 22px',
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    letterSpacing: '0.02em',
                    transition: 'opacity 0.15s',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {loading ? 'Redirecting...' : 'Continue with Google'}
                </button>
              </div>
            </div>
          )}

          {/* NO — access denied */}
          {answer === 'no' && (
            <div style={{ marginTop: '18px' }}>
              <div style={{ fontSize: '14px', marginBottom: '14px' }}>
                <span style={{ color: '#444' }}>~/humor $ </span>
                <span style={{ color: '#ff4444', fontWeight: 'bold', letterSpacing: '0.08em' }}>
                  ACCESS DENIED
                </span>
              </div>
              <div style={{
                padding: '18px 20px',
                border: '1px solid #2a1010',
                borderRadius: '6px',
                background: '#110808',
              }}>
                <div style={{
                  color: '#ff5555',
                  fontSize: '15px',
                  letterSpacing: '0.04em',
                  lineHeight: '1.6',
                  fontFamily: "'Courier New', Courier, monospace",
                }}>
                  Sorry, restricted access for superadmins only.
                </div>
                <div style={{
                  marginTop: '10px',
                  color: '#552222',
                  fontSize: '12px',
                  letterSpacing: '0.06em',
                }}>
                  &gt; If you believe this is an error, contact your system administrator.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes termBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}