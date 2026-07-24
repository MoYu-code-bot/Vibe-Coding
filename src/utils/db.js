import Dexie from 'dexie'
import { api } from './api'

// ============ IndexedDB (fallback for static hosting) ============

const db = new Dexie('VGReleaseChecklist')
db.version(1).stores({
  iterations: 'id',
  archives: '++id, iterationName, archivedAt'
})

// ============ Helpers ============

const emptyData = () => ({
  nacos: [],
  grayFrontend: [],
  grayBackend: [],
  dms: [],
  email: '',
  release: { date: '', items: [] }
})

function getWeekCode() {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return yy + mm + dd
}

// Detect if server API is available (cached after first check)
let _serverAvailable = null
async function isServerAvailable() {
  if (_serverAvailable !== null) return _serverAvailable
  _serverAvailable = await api.checkServer()
  return _serverAvailable
}

// ============ Public API ============

export async function getCurrentIteration() {
  if (await isServerAvailable()) {
    try {
      const iter = await api.getIteration()
      return {
        id: iter.id || 'current',
        name: iter.name || 'VG' + getWeekCode(),
        nacos: iter.nacos || [],
        grayFrontend: iter.grayFrontend || [],
        grayBackend: iter.grayBackend || [],
        dms: iter.dms || [],
        email: iter.email || '',
        release: iter.release || { date: '', items: [] },
        createdAt: iter.createdAt
      }
    } catch {
      // Server call failed, fall through to IndexedDB
    }
  }

  // IndexedDB fallback
  let iter = await db.iterations.get('current')
  if (!iter) {
    iter = { id: 'current', name: 'VG' + getWeekCode(), createdAt: new Date().toISOString(), ...emptyData() }
    await db.iterations.put(iter)
  }
  return iter
}

export async function saveCurrentIteration(data) {
  if (await isServerAvailable()) {
    try {
      await api.saveIteration(data)
      return
    } catch {
      // Fall through to IndexedDB
    }
  }
  await db.iterations.put({ ...data, id: 'current' })
}

export async function archiveIteration() {
  if (await isServerAvailable()) {
    try {
      const result = await api.archive()
      const newName = result.newName || 'VG' + getWeekCode()
      return { id: 'current', name: newName, createdAt: new Date().toISOString(), ...emptyData() }
    } catch {
      // Fall through
    }
  }

  // IndexedDB fallback
  const current = await getCurrentIteration()
  const archive = {
    iterationName: current.name,
    archivedAt: new Date().toISOString(),
    releaseDate: current.release?.date || '',
    data: { ...current }
  }
  await db.archives.add(archive)
  const newName = 'VG' + getWeekCode()
  const newIter = { id: 'current', name: newName, createdAt: new Date().toISOString(), ...emptyData() }
  await db.iterations.put(newIter)
  return newIter
}

export async function archiveIterationOverwrite() {
  if (await isServerAvailable()) {
    return archiveIteration()
  }

  // IndexedDB fallback with overwrite
  const current = await getCurrentIteration()
  const existing = await findArchiveByName(current.name)
  if (existing) await db.archives.delete(existing.id)

  const archive = {
    iterationName: current.name,
    archivedAt: new Date().toISOString(),
    releaseDate: current.release?.date || '',
    data: { ...current }
  }
  await db.archives.add(archive)
  const newName = 'VG' + getWeekCode()
  const newIter = { id: 'current', name: newName, createdAt: new Date().toISOString(), ...emptyData() }
  await db.iterations.put(newIter)
  return newIter
}

export async function findArchiveByName(name) {
  if (await isServerAvailable()) {
    const archives = await getArchives()
    return archives.find(a => a.iterationName === name) || null
  }
  return await db.archives.where('iterationName').equals(name).first()
}

export async function getArchives() {
  if (await isServerAvailable()) {
    try {
      return await api.getArchives()
    } catch {
      // Fall through
    }
  }
  return await db.archives.orderBy('archivedAt').reverse().toArray()
}

export async function deleteArchive(id) {
  if (await isServerAvailable()) {
    try {
      await api.deleteArchive(id)
      return
    } catch {
      // Fall through
    }
  }
  await db.archives.delete(id)
}

export async function updateArchive(id, data) {
  if (await isServerAvailable()) {
    try {
      await api.updateArchive(id, data)
      return
    } catch {
      // Fall through
    }
  }
  // IndexedDB fallback: update the archive's data field
  const archive = await db.archives.get(id)
  if (archive) {
    archive.data = data
    archive.archivedAt = new Date().toISOString()
    if (data.name) archive.iterationName = data.name
    await db.archives.put(archive)
  }
}
