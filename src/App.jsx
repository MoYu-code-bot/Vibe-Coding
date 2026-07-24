import React, { useState, useEffect, useCallback, useRef } from 'react'
import { AuthProvider, useAuth } from './components/AuthContext'
import LoginPage from './components/LoginPage'
import NavBar from './components/NavBar'
import SmartClipboard from './components/SmartClipboard'
import NacosModule from './components/NacosModule'
import GrayModule from './components/GrayModule'
import DmsModule from './components/DmsModule'
import EmailModule from './components/EmailModule'
import ReleaseModule from './components/ReleaseModule'
import HistoryPanel from './components/HistoryPanel'
import ConfirmDialog from './components/ConfirmDialog'
import { getCurrentIteration, saveCurrentIteration, archiveIteration, archiveIterationOverwrite, findArchiveByName, getArchives, deleteArchive, updateArchive } from './utils/db'

function AppInner() {
  const { user, loading, isLoggedIn, serverAvailable, login, logout } = useAuth()
  const [data, setData] = useState(null)
  const [archives, setArchives] = useState([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [viewingArchive, setViewingArchive] = useState(false)
  const [editingArchive, setEditingArchive] = useState(null) // archive id when editing
  const [saved, setSaved] = useState(false)
  const [confirm, setConfirm] = useState({ show: false, title: '', message: '', onConfirm: null, confirmLabel: '确认' })
  const [loaded, setLoaded] = useState(false)
  const currentDataRef = useRef(null)
  const saveTimerRef = useRef(null)

  // Load data when user logs in
  useEffect(() => {
    if (!isLoggedIn) {
      setData(null)
      setArchives([])
      setLoaded(false)
      setReadOnly(false)
      return
    }
    (async () => {
      setLoaded(false)
      const iter = await getCurrentIteration()
      setData(iter)
      const arch = await getArchives()
      setArchives(arch)
      setLoaded(true)
    })()
  }, [isLoggedIn])

  // Debounced auto-save (skip when viewing archive, even in edit mode)
  useEffect(() => {
    if (data && loaded && !readOnly && !viewingArchive) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        saveCurrentIteration(data)
      }, 800)
    }
    return () => clearTimeout(saveTimerRef.current)
  }, [data, loaded, readOnly, viewingArchive])

  const update = useCallback((partial) => {
    if (readOnly && !editingArchive) return
    setData(prev => ({ ...prev, ...partial }))
  }, [readOnly, editingArchive])

  const showConfirm = useCallback((title, message, onConfirm, confirmLabel = '确认') => {
    setConfirm({ show: true, title, message, onConfirm, confirmLabel })
  }, [])

  const hideConfirm = useCallback(() => {
    setConfirm({ show: false, title: '', message: '', onConfirm: null, confirmLabel: '确认' })
  }, [])

  const handleConfirm = useCallback(() => {
    if (confirm.onConfirm) confirm.onConfirm()
    hideConfirm()
  }, [confirm, hideConfirm])

  const handleArchive = async () => {
    const existing = await findArchiveByName(data.name)
    if (existing) {
      showConfirm(
        '归档确认',
        `历史迭代中已存在 "${data.name}"，是否覆盖？`,
        async () => {
          const newIter = await archiveIterationOverwrite()
          setData(newIter)
          const arch = await getArchives()
          setArchives(arch)
        },
        '覆盖'
      )
    } else {
      showConfirm(
        '归档确认',
        `确认将 ${data.name} 归档到历史迭代？归档后页面将重置为空白新迭代。`,
        async () => {
          const newIter = await archiveIteration()
          setData(newIter)
          const arch = await getArchives()
          setArchives(arch)
        }
      )
    }
  }

  const handleDeleteArchive = (archive) => {
    showConfirm(
      '删除确认',
      `确认删除 ${archive.iterationName} 的归档记录？删除后不可恢复。`,
      async () => {
        await deleteArchive(archive.id)
        const arch = await getArchives()
        setArchives(arch)
      }
    )
  }

  const handleLoadArchive = (archive) => {
    currentDataRef.current = { ...data }
    setData({ ...archive.data, _readOnly: true, _archiveId: archive.id })
    setReadOnly(true)
    setViewingArchive(true)
    setEditingArchive(null)
    setHistoryOpen(false)
  }

  const handleBack = async () => {
    if (currentDataRef.current) {
      setData(currentDataRef.current)
      currentDataRef.current = null
    } else {
      const iter = await getCurrentIteration()
      setData(iter)
    }
    setReadOnly(false)
    setViewingArchive(false)
    setEditingArchive(null)
  }

  const handleEditArchive = () => {
    setEditingArchive(data._archiveId || true)
    setReadOnly(false)
  }

  const handleSaveArchive = async () => {
    const archiveId = data._archiveId || editingArchive
    const { _readOnly, _archiveId, ...cleanData } = data
    try {
      await updateArchive(archiveId, cleanData)
      setEditingArchive(null)
      setReadOnly(true)
      // Refresh archives list
      const arch = await getArchives()
      setArchives(arch)
    } catch (err) {
      console.error('Save archive failed:', err)
    }
  }

  // Manual save for current iteration
  const handleSave = async () => {
    if (!data) return
    await saveCurrentIteration(data)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Copy helpers
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    })
  }

  const copyNacos = (blocks) => {
    copyToClipboard(blocks.map(b => `# ${b.filename}\n${b.content}`).join('\n\n'))
  }

  const copyGray = ({ frontend, backend }) => {
    const fe = frontend.map(r => `${r.app}\t${r.version}\t${r.note}`).join('\n')
    const be = backend.map(r => `${r.service}\t${r.lane}\t${r.note}`).join('\n')
    copyToClipboard(`前端灰度:\n${fe}\n\n后端灰度:\n${be}`)
  }

  const copyDms = (rows) => {
    copyToClipboard(rows.map(r => `${r.id}\t${r.table}\t${r.type === 'modify' ? '修改表' : '新建表'}\t${r.approver}\t${r.status}`).join('\n'))
  }

  const copyEmail = (content) => copyToClipboard(content)

  const copyRelease = ({ date, items }) => {
    const text = `上线日期: ${date}\n\n` + items.map(r => `${r.name}\t${r.type}\t${r.merged === 'merged' ? '已合并' : '未合并'}\t${r.done === 'done' ? '已上线' : '未上线'}\t${r.note}`).join('\n')
    copyToClipboard(text)
  }

  const copyAll = () => {
    if (!data) return
    const parts = []
    parts.push(`迭代: ${data.name}\n`)
    if (data.nacos.length) parts.push(`【Nacos 配置变更】\n${data.nacos.map(b => `# ${b.filename}\n${b.content}`).join('\n\n')}`)
    if (data.grayFrontend.length || data.grayBackend.length) {
      const fe = data.grayFrontend.map(r => `${r.app}\t${r.version}\t${r.note}`).join('\n')
      const be = data.grayBackend.map(r => `${r.service}\t${r.lane}\t${r.note}`).join('\n')
      parts.push(`【灰度创建】\n前端灰度:\n${fe}\n后端灰度:\n${be}`)
    }
    if (data.dms.length) parts.push(`【DMS 审批】\n${data.dms.map(r => `${r.id}\t${r.table}\t${r.type === 'modify' ? '修改表' : '新建表'}\t${r.approver}`).join('\n')}`)
    if (data.email) parts.push(`【邮箱配置】\n${data.email}`)
    if (data.release.items.length) parts.push(`【上线模块】\n上线日期: ${data.release.date}\n${data.release.items.map(r => `${r.name}\t${r.type}\t${r.done === 'done' ? '已上线' : '未上线'}\t${r.merged === 'merged' ? '已合并' : '未合并'}`).join('\n')}`)
    copyToClipboard(parts.join('\n\n'))
  }

  const handleImport = ({ selected, nacosBlocks, frontendApps, backendServices, dmsRows, emailText, releaseLines }) => {
    const partial = {}
    if (selected['Nacos'] && nacosBlocks && nacosBlocks.length > 0) {
      partial.nacos = [...data.nacos, ...nacosBlocks]
    }
    if (selected['灰度创建']) {
      if (frontendApps && frontendApps.length > 0) {
        const newRows = frontendApps.map(a => ({ app: a.app, version: '', note: '' }))
        partial.grayFrontend = [...data.grayFrontend, ...newRows]
      }
      if (backendServices && backendServices.length > 0) {
        const lane = data.name ? 'vg-' + data.name.replace(/^vg/i, '').toLowerCase() : ''
        const newRows = backendServices.map(s => ({ lane, service: s.service, note: '' }))
        partial.grayBackend = [...data.grayBackend, ...newRows]
      }
    }
    if (selected['DMS 审批'] && dmsRows && dmsRows.length > 0) {
      const newRows = dmsRows.map(r => ({ id: r.id, table: r.table, type: 'modify', approver: r.approver || '', status: 'pending' }))
      partial.dms = [...data.dms, ...newRows]
    }
    if (selected['邮箱配置'] && emailText) {
      partial.email = data.email ? data.email + '\n' + emailText : emailText
    }
    if (selected['上线模块'] && releaseLines && releaseLines.length > 0) {
      const newItems = releaseLines.map(name => ({ name, type: '服务', merged: 'unmerged', done: 'pending', note: '' }))
      partial.release = { ...data.release, items: [...data.release.items, ...newItems] }
    }
    update(partial)
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text3)', fontSize: 14
      }}>
        加载中...
      </div>
    )
  }

  // Not logged in: show login page
  if (!isLoggedIn) {
    return <LoginPage onLogin={login} />
  }

  // Logged in but data not loaded yet
  if (!data) return null

  return (
    <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
      <NavBar
        name={data.name}
        onNameChange={name => update({ name })}
        onArchive={handleArchive}
        onHistory={() => setHistoryOpen(true)}
        onCopyAll={copyAll}
        readOnly={readOnly}
        onBack={handleBack}
        username={serverAvailable ? user?.username : null}
        onLogout={logout}
        viewingArchive={viewingArchive}
        editingArchive={editingArchive}
        onEditArchive={handleEditArchive}
        onSaveArchive={handleSaveArchive}
        onSave={handleSave}
        saved={saved}
      />

      {(!readOnly || editingArchive) && <SmartClipboard onImport={handleImport} />}

      <NacosModule
        blocks={data.nacos}
        onChange={nacos => update({ nacos })}
        onCopy={copyNacos}
        onConfirmDelete={showConfirm}
      />

      <GrayModule
        frontend={data.grayFrontend}
        backend={data.grayBackend}
        onFrontendChange={grayFrontend => update({ grayFrontend })}
        onBackendChange={grayBackend => update({ grayBackend })}
        onCopy={copyGray}
        onConfirmDelete={showConfirm}
      />

      <DmsModule
        rows={data.dms}
        onChange={dms => update({ dms })}
        onCopy={copyDms}
        onConfirmDelete={showConfirm}
      />

      <EmailModule
        content={data.email}
        onChange={email => update({ email })}
        onCopy={copyEmail}
      />

      <ReleaseModule
        date={data.release.date}
        items={data.release.items}
        onDateChange={date => update({ release: { ...data.release, date } })}
        onItemsChange={items => update({ release: { ...data.release, items } })}
        onCopy={copyRelease}
        onConfirmDelete={showConfirm}
      />

      <HistoryPanel
        show={historyOpen}
        archives={archives}
        onClose={() => setHistoryOpen(false)}
        onDelete={handleDeleteArchive}
        onLoad={handleLoadArchive}
      />

      <ConfirmDialog
        show={confirm.show}
        title={confirm.title}
        message={confirm.message}
        onConfirm={handleConfirm}
        onCancel={hideConfirm}
        confirmLabel={confirm.confirmLabel}
      />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
