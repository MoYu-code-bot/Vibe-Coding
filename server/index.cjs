const path = require('path')
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const { getDb } = require('./db.cjs')
const { generateToken, authMiddleware } = require('./auth.cjs')

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

// ============ Auth Routes ============

app.post('/api/register', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' })
  }
  if (username.length < 2 || username.length > 20) {
    return res.status(400).json({ error: '用户名长度需在 2-20 个字符之间' })
  }
  if (password.length < 4) {
    return res.status(400).json({ error: '密码至少 4 个字符' })
  }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    return res.status(409).json({ error: '用户名已存在' })
  }

  const hash = bcrypt.hashSync(password, 10)
  const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hash)
  const userId = result.lastInsertRowid

  // Create default iteration for new user
  const weekCode = getWeekCode()
  db.prepare('INSERT INTO iterations (user_id, name, data) VALUES (?, ?, ?)').run(
    userId, 'VG' + weekCode, JSON.stringify(emptyData())
  )

  const token = generateToken(Number(userId), username)
  res.json({ token, username, userId: Number(userId) })
})

app.post('/api/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' })
  }

  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }

  const token = generateToken(user.id, user.username)
  res.json({ token, username: user.username, userId: user.id })
})

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ userId: req.user.userId, username: req.user.username })
})

// ============ Iteration Routes ============

app.get('/api/iteration', authMiddleware, (req, res) => {
  const db = getDb()
  let iter = db.prepare('SELECT * FROM iterations WHERE user_id = ?').get(req.user.userId)
  if (!iter) {
    const weekCode = getWeekCode()
    const data = emptyData()
    db.prepare('INSERT INTO iterations (user_id, name, data) VALUES (?, ?, ?)').run(
      req.user.userId, 'VG' + weekCode, JSON.stringify(data)
    )
    iter = db.prepare('SELECT * FROM iterations WHERE user_id = ?').get(req.user.userId)
  }
  res.json({
    id: iter.id,
    name: iter.name,
    ...JSON.parse(iter.data),
    createdAt: iter.created_at,
    updatedAt: iter.updated_at
  })
})

app.put('/api/iteration', authMiddleware, (req, res) => {
  const { name, ...rest } = req.body
  const db = getDb()
  const data = JSON.stringify(rest)

  const existing = db.prepare('SELECT id FROM iterations WHERE user_id = ?').get(req.user.userId)
  if (existing) {
    db.prepare("UPDATE iterations SET name = ?, data = ?, updated_at = datetime('now') WHERE user_id = ?")
      .run(name || '', data, req.user.userId)
  } else {
    db.prepare('INSERT INTO iterations (user_id, name, data) VALUES (?, ?, ?)')
      .run(req.user.userId, name || '', data)
  }
  res.json({ ok: true })
})

// ============ Archive Routes ============

app.post('/api/archive', authMiddleware, (req, res) => {
  const db = getDb()
  const iter = db.prepare('SELECT * FROM iterations WHERE user_id = ?').get(req.user.userId)
  if (!iter) return res.status(404).json({ error: '无当前迭代' })

  const iterData = JSON.parse(iter.data)
  const parsedData = { ...iterData, name: iter.name }

  // Check for duplicate name
  const existing = db.prepare('SELECT id FROM archives WHERE user_id = ? AND iteration_name = ?')
    .get(req.user.userId, iter.name)

  if (existing) {
    // Overwrite
    db.prepare("UPDATE archives SET data = ?, release_date = ?, archived_at = datetime('now') WHERE id = ?")
      .run(JSON.stringify(parsedData), iterData.release?.date || '', existing.id)
  } else {
    db.prepare('INSERT INTO archives (user_id, iteration_name, data, release_date) VALUES (?, ?, ?, ?)')
      .run(req.user.userId, iter.name, JSON.stringify(parsedData), iterData.release?.date || '')
  }

  // Reset to new iteration
  const weekCode = getWeekCode()
  const newName = 'VG' + weekCode
  db.prepare("UPDATE iterations SET name = ?, data = ?, updated_at = datetime('now') WHERE user_id = ?")
    .run(newName, JSON.stringify(emptyData()), req.user.userId)

  res.json({ ok: true, newName })
})

app.get('/api/archives', authMiddleware, (req, res) => {
  const db = getDb()
  const archives = db.prepare('SELECT * FROM archives WHERE user_id = ? ORDER BY archived_at DESC')
    .all(req.user.userId)
  res.json(archives.map(a => ({
    id: a.id,
    iterationName: a.iteration_name,
    data: JSON.parse(a.data),
    releaseDate: a.release_date,
    archivedAt: a.archived_at
  })))
})

app.delete('/api/archives/:id', authMiddleware, (req, res) => {
  const db = getDb()
  db.prepare('DELETE FROM archives WHERE id = ? AND user_id = ?').run(req.params.id, req.user.userId)
  res.json({ ok: true })
})

app.put('/api/archives/:id', authMiddleware, (req, res) => {
  const db = getDb()
  const archive = db.prepare('SELECT * FROM archives WHERE id = ? AND user_id = ?').get(req.params.id, req.user.userId)
  if (!archive) return res.status(404).json({ error: '归档不存在' })

  const { name, ...rest } = req.body
  const data = JSON.stringify(rest)
  const iterationName = name || archive.iteration_name

  db.prepare("UPDATE archives SET iteration_name = ?, data = ?, release_date = ?, archived_at = datetime('now') WHERE id = ? AND user_id = ?")
    .run(iterationName, data, rest.release?.date || '', req.params.id, req.user.userId)

  res.json({ ok: true })
})

// ============ Helpers ============

function emptyData() {
  return {
    nacos: [],
    grayFrontend: [],
    grayBackend: [],
    dms: [],
    email: '',
    release: { date: '', items: [] }
  }
}

function getWeekCode() {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return yy + mm + dd
}

// ============ Static Files & SPA ============

// Serve built frontend in production
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))

// SPA catch-all: return index.html for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(distPath, 'index.html'))
})

// ============ Start Server ============

const PORT = process.env.PORT || 3001

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
  })
}

module.exports = app
