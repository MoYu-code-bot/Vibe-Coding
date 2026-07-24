import React, { useState } from 'react'
import { User, Lock, LogIn, UserPlus } from 'lucide-react'
import { api } from '../utils/api'

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!username.trim() || !password.trim()) {
      setError('用户名和密码不能为空')
      return
    }

    if (mode === 'register') {
      if (username.trim().length < 2) {
        setError('用户名至少 2 个字符')
        return
      }
      if (password.length < 4) {
        setError('密码至少 4 个字符')
        return
      }
      if (password !== confirmPwd) {
        setError('两次输入的密码不一致')
        return
      }
    }

    setLoading(true)
    try {
      if (mode === 'register') {
        // Register only, do NOT auto-login
        await api.register(username.trim(), password)
        api.logout() // clear auto-stored token
        const savedName = username.trim()
        setSuccess('注册成功，请登录')
        setMode('login')
        setUsername(savedName)
        setPassword('')
        setConfirmPwd('')
      } else {
        const result = await api.login(username.trim(), password)
        onLogin(result)
      }
    } catch (err) {
      setError(err.message || '操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
    setSuccess('')
    setConfirmPwd('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-page)',
      padding: 20
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'white',
        borderRadius: 20,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          padding: '32px 32px 28px',
          textAlign: 'center'
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            VG 迭代上线清单
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
            {mode === 'login' ? '登录以继续管理迭代' : '创建账号开始使用'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '28px 32px 32px' }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 4, marginBottom: 24,
            background: '#f1f5f9', borderRadius: 10, padding: 3
          }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                border: 'none', cursor: 'pointer', transition: 'all .2s',
                background: mode === 'login' ? 'white' : 'transparent',
                color: mode === 'login' ? '#059669' : '#94a3b8',
                boxShadow: mode === 'login' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setSuccess(''); setConfirmPwd(''); }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                border: 'none', cursor: 'pointer', transition: 'all .2s',
                background: mode === 'register' ? 'white' : 'transparent',
                color: mode === 'register' ? '#059669' : '#94a3b8',
                boxShadow: mode === 'register' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              注册
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecdd3',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              color: '#be123c', fontSize: 13
            }}>
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{
              background: '#ecfdf5', border: '1px solid #a7f3d0',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              color: '#059669', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {success}
            </div>
          )}

          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>
              用户名
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: '#94a3b8'
              }} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="请输入用户名"
                autoComplete="username"
                style={{
                  width: '100%', padding: '10px 12px 10px 38px',
                  border: '1px solid var(--border)', borderRadius: 10,
                  fontSize: 14, color: 'var(--text)', background: '#f8fafc',
                  outline: 'none', transition: 'border-color .2s, box-shadow .2s'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#10b981'
                  e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'
                  e.target.style.background = 'white'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)'
                  e.target.style.boxShadow = 'none'
                  e.target.style.background = '#f8fafc'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: mode === 'register' ? 16 : 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>
              密码
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: '#94a3b8'
              }} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                style={{
                  width: '100%', padding: '10px 12px 10px 38px',
                  border: '1px solid var(--border)', borderRadius: 10,
                  fontSize: 14, color: 'var(--text)', background: '#f8fafc',
                  outline: 'none', transition: 'border-color .2s, box-shadow .2s'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#10b981'
                  e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'
                  e.target.style.background = 'white'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)'
                  e.target.style.boxShadow = 'none'
                  e.target.style.background = '#f8fafc'
                }}
              />
            </div>
          </div>

          {/* Confirm password (register only) */}
          {mode === 'register' && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>
                确认密码
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }} />
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="请再次输入密码"
                  autoComplete="new-password"
                  style={{
                    width: '100%', padding: '10px 12px 10px 38px',
                    border: '1px solid var(--border)', borderRadius: 10,
                    fontSize: 14, color: 'var(--text)', background: '#f8fafc',
                    outline: 'none', transition: 'border-color .2s, box-shadow .2s'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#10b981'
                    e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'
                    e.target.style.background = 'white'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'var(--border)'
                    e.target.style.boxShadow = 'none'
                    e.target.style.background = '#f8fafc'
                  }}
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%', padding: '12px 0', borderRadius: 10,
              fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: loading ? 0.7 : 1
            }}
          >
            {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
            <span>{loading ? '请稍候...' : (mode === 'login' ? '登录' : '注册')}</span>
          </button>

          {/* Switch hint */}
          <p style={{
            textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text3)'
          }}>
            {mode === 'login' ? '还没有账号？' : '已有账号？'}
            <button
              type="button"
              onClick={switchMode}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#10b981', fontWeight: 500, fontSize: 13, marginLeft: 4
              }}
            >
              {mode === 'login' ? '立即注册' : '去登录'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
