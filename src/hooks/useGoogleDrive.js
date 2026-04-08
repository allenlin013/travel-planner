import { useState, useRef, useCallback } from 'react'

const CLIENT_ID   = '435449181496-40sfep6p6e655kh9kue2s4v3v2nveksg.apps.googleusercontent.com'
const SCOPE       = 'https://www.googleapis.com/auth/drive.file email profile'
const FOLDER_NAME = 'TravelPlanner2026'
const USER_KEY    = 'gdrive_user'
const FOLDER_KEY  = 'gdrive_folder'

// ── Helpers ───────────────────────────────────────────────────

/** Wait until GIS script has loaded (max 15s). */
function waitForGIS() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) { resolve(); return }
    let elapsed = 0
    const t = setInterval(() => {
      elapsed += 100
      if (window.google?.accounts?.oauth2) { clearInterval(t); resolve() }
      else if (elapsed >= 15000)           { clearInterval(t); reject(new Error('Google Sign-In SDK 未載入，請重新整理頁面')) }
    }, 100)
  })
}

/** Drive REST helper — throws on non-2xx. */
async function driveCall(path, token, init = {}) {
  const url    = path.startsWith('http') ? path : `https://www.googleapis.com/drive/v3${path}`
  const res    = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message ?? `Drive error ${res.status}`)
  }
  return res.json()
}

/** Find or create the shared app folder; cache the ID in localStorage. */
async function ensureFolder(token) {
  const cached = localStorage.getItem(FOLDER_KEY)
  if (cached) return cached

  // Search (only app-created files visible with drive.file scope)
  try {
    const q = `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    const data = await driveCall(`/files?q=${encodeURIComponent(q)}&fields=files(id)`, token)
    if (data.files?.length) {
      localStorage.setItem(FOLDER_KEY, data.files[0].id)
      return data.files[0].id
    }
  } catch (_) {}

  // Create new folder
  const folder = await driveCall('/files', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  })
  localStorage.setItem(FOLDER_KEY, folder.id)
  return folder.id
}

/** Set a Drive file to "anyone with link can view". */
async function makePublic(fileId, token) {
  try {
    await driveCall(`/files/${fileId}/permissions`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    })
  } catch (_) {
    // Non-fatal: file still uploaded, just not publicly shareable
  }
}

// ── Hook ──────────────────────────────────────────────────────

export function useGoogleDrive() {
  const [user,     setUser]     = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch (_) { return null }
  })
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [progress,  setProgress]  = useState(0)   // 0-100 during upload

  const tokenRef  = useRef(null)
  const clientRef = useRef(null)

  /** Request / re-use an OAuth token. */
  const getToken = useCallback(() => new Promise(async (resolve, reject) => {
    try {
      await waitForGIS()
    } catch (e) {
      reject(e); return
    }

    if (!clientRef.current) {
      clientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (resp) => {
          if (resp.error) { reject(new Error(resp.error_description ?? resp.error)); return }
          tokenRef.current = resp.access_token
          resolve(resp.access_token)
        },
      })
    }

    if (tokenRef.current) { resolve(tokenRef.current); return }
    clientRef.current.requestAccessToken({ prompt: '' })
  }), [])

  /** Full sign-in flow — fetches user profile after auth. */
  const signIn = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      await waitForGIS()
      const token = await new Promise((resolve, reject) => {
        window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPE,
          callback: (resp) => {
            if (resp.error) { reject(new Error(resp.error_description ?? resp.error)); return }
            tokenRef.current = resp.access_token
            resolve(resp.access_token)
          },
        }).requestAccessToken({ prompt: 'select_account' })
      })

      const info = await driveCall(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        token
      )
      const u = { name: info.name, email: info.email, picture: info.picture }
      setUser(u)
      localStorage.setItem(USER_KEY, JSON.stringify(u))
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [getToken])

  const signOut = useCallback(() => {
    if (tokenRef.current) {
      window.google?.accounts?.oauth2?.revoke(tokenRef.current, () => {})
      tokenRef.current = null
    }
    clientRef.current = null
    setUser(null)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(FOLDER_KEY)
  }, [])

  /**
   * Upload a File object to Drive.
   * Returns { driveId, name, viewLink, previewUrl }
   */
  const uploadFile = useCallback(async (file) => {
    setLoading(true); setError(null); setProgress(0)
    try {
      const token    = await getToken()
      const folderId = await ensureFolder(token)

      // Multipart upload (metadata + binary in one request)
      const metadata = JSON.stringify({ name: file.name, parents: [folderId] })
      const form     = new FormData()
      form.append('metadata', new Blob([metadata], { type: 'application/json' }))
      form.append('file', file)

      // Use XHR so we can track progress
      const fileData = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST',
          'https://www.googleapis.com/upload/drive/v3/files' +
          '?uploadType=multipart&fields=id,name,webViewLink'
        )
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            try {
              const err = JSON.parse(xhr.responseText)
              reject(new Error(err.error?.message ?? `Upload failed (${xhr.status})`))
            } catch (_) {
              reject(new Error(`Upload failed (${xhr.status})`))
            }
          }
        }
        xhr.onerror = () => reject(new Error('網路錯誤，請檢查連線'))
        xhr.send(form)
      })

      await makePublic(fileData.id, token)

      return {
        driveId:    fileData.id,
        name:       fileData.name,
        viewLink:   fileData.webViewLink ?? `https://drive.google.com/file/d/${fileData.id}/view`,
        previewUrl: `https://lh3.googleusercontent.com/d/${fileData.id}`,
      }
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false); setProgress(0)
    }
  }, [getToken])

  return { user, loading, error, progress, signIn, signOut, uploadFile }
}
