import { useRef, useState, useEffect } from 'react'

function slugify(name) {
  return (name || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-_.]/g, '-')
    .replace(/\-+/g, '-')
    .replace(/(^\-|\-$)/g, '')
}

export default function AdminPage() {
  const fileInputRef = useRef(null)
  const [filename, setFilename] = useState('')
  const [chapterNumber, setChapterNumber] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [token, setToken] = useState('')
  const [status, setStatus] = useState(null)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [downloadName, setDownloadName] = useState(null)

  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' && window.localStorage.getItem('adminToken')
      if (saved) setToken(saved)
    } catch (e) {}
  }, [])

  function reset() {
    setFilename('')
    setChapterNumber('')
    setTitle('')
    setContent('')
    setStatus(null)
    setDownloadUrl(null)
    setDownloadName(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function submit(e) {
    e.preventDefault()
    setStatus(null)
    setDownloadUrl(null)
    setDownloadName(null)

    // basic validation
    if (!chapterNumber) {
      setStatus({ type: 'error', msg: 'Chapter number is required.' })
      return
    }
    if (!content && (!fileInputRef.current || !fileInputRef.current.files[0])) {
      setStatus({ type: 'error', msg: 'Provide content (paste) or upload a .md/.txt file.' })
      return
    }
    if (!token) {
      setStatus({ type: 'error', msg: 'Admin token is required. Add it in the field or set in localStorage.' })
      return
    }

    setStatus({ type: 'info', msg: 'Uploading...' })

    try {
      const fd = new FormData()
      const derived = slugify(filename || title || `chapter-${String(chapterNumber).padStart(2, '0')}`)
      fd.append('filename', derived)
      fd.append('chapterNumber', chapterNumber)
      fd.append('title', title)
      fd.append('content', content)
      const file = fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files[0]
      if (file) fd.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'x-admin-token': token
        },
        body: fd
      })

      // if server returned JSON (likely GitHub commit response)
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const json = await res.json()
        if (res.ok) {
          setStatus({ type: 'success', msg: 'Uploaded and committed to GitHub.' })
          // keep token stored
          try { localStorage.setItem('adminToken', token) } catch (e) {}
        } else {
          setStatus({ type: 'error', msg: json.error || JSON.stringify(json) })
        }
        return
      }

      // fallback: API returned markdown text (attachment). Read as blob and create download link
      const blob = await res.blob()
      const text = await blob.text()
      // If the response is markdown text but sent as application/octet-stream or text/markdown,
      // create a downloadable blob and also show the content in a preview.
      const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }))
      const suggestedName = `${derived}.md`
      setDownloadUrl(url)
      setDownloadName(suggestedName)
      setStatus({ type: 'info', msg: 'No GitHub configured — markdown prepared for download (save into content/chapters/ and push).' })

      // Also keep token in localStorage
      try { localStorage.setItem('adminToken', token) } catch (e) {}

    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', msg: err && err.message ? err.message : String(err) })
    }
  }

  async function copyToClipboard() {
    if (!downloadUrl) return
    try {
      const r = await fetch(downloadUrl)
      const text = await r.text()
      await navigator.clipboard.writeText(text)
      setStatus({ type: 'success', msg: 'Markdown copied to clipboard.' })
    } catch (e) {
      setStatus({ type: 'error', msg: 'Copy failed: ' + (e && e.message ? e.message : String(e)) })
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold">Admin — Upload Chapter</h1>
        <p className="text-sm text-gray-600 mt-2">Upload a chapter as a .md/.txt file or paste markdown in the textarea. Provide ADMIN_TOKEN in the field (saved locally).</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Admin Token</label>
            <input value={token} onChange={e => setToken(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" placeholder="Set ADMIN_TOKEN (stored in localStorage)" />
          </div>

          <div>
            <label className="block text-sm font-medium">Filename (slug) — optional</label>
            <input value={filename} onChange={e => setFilename(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" placeholder="e.g. 02-second-chapter" />
            <p className="text-xs text-gray-500 mt-1">If empty, a slug will be derived from title or chapter number.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Chapter Number</label>
              <input value={chapterNumber} onChange={e => setChapterNumber(e.target.value)} type="number" className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Title (optional)</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Upload file (.md or .txt)</label>
            <input ref={fileInputRef} type="file" accept=".md,.txt,text/markdown,text/plain" className="mt-1 block w-full" />
            <p className="text-xs text-gray-500 mt-1">File content will be used if provided. Otherwise the pasted content below will be used.</p>
          </div>

          <div>
            <label className="block text-sm font-medium">Or paste markdown content (optional)</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={12} className="mt-1 block w-full rounded border p-3 monospace" placeholder="Paste your chapter markdown here..." />
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded bg-blue-600 text-white px-4 py-2" type="submit">Upload</button>
            <button type="button" className="rounded border px-3 py-2" onClick={reset}>Reset</button>
            <div className="ml-auto text-sm">
              {status ? (
                <span className={status.type === 'error' ? 'text-red-600' : status.type === 'success' ? 'text-green-600' : 'text-gray-700'}>{status.msg}</span>
              ) : null}
            </div>
          </div>
        </form>

        {downloadUrl && (
          <div className="mt-6 p-4 border rounded bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-700">Markdown ready</div>
              <div className="flex gap-2">
                <a download={downloadName} href={downloadUrl} className="text-sm text-blue-600 underline">Download .md</a>
                <button onClick={copyToClipboard} className="text-sm rounded border px-2 py-1">Copy</button>
              </div>
            </div>
            <details className="mt-2">
              <summary className="text-xs text-gray-600 cursor-pointer">Preview markdown</summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs p-2 bg-white border rounded max-h-64 overflow-auto">{/* fetch text for preview */}
                {/* to avoid repeating network fetch, we use the blob url to show preview via fetch in effect - but keep it simple: show a message */ }
                Click "Download" or "Copy" to get the markdown text.
              </pre>
            </details>
          </div>
        )}

        <section className="mt-8 text-sm text-gray-600">
          <h2 className="font-semibold">Notes</h2>
          <ul className="list-disc ml-5 mt-2">
            <li>If your deployment has <code>GITHUB_TOKEN</code>, <code>REPO_OWNER</code>, and <code>REPO_NAME</code> env vars set, this endpoint will commit the markdown into <code>content/chapters/{'{filename}.md'}</code> on the configured branch.</li>
            <li>Otherwise the API returns a generated markdown file — download it and add it into <code>content/chapters/</code>, then push to your repo.</li>
            <li>Keep your <code>ADMIN_TOKEN</code> secret. It is stored in your browser when you set it for convenience.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
