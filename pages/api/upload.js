// pages/api/upload.js
import fs from 'fs'
import path from 'path'
import formidablePkg from 'formidable'

export const config = {
  api: {
    bodyParser: false, // allow formidable to parse multipart
  },
}

function sanitizeFilename(name = '') {
  return name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-_.]/g, '-')
    .replace(/\-+/g, '-')
    .replace(/(^\-|\-$)/g, '')
}

// Choose a parser that supports multiple formidable versions.
function createFormidable(options = {}) {
  // Cases:
  // - formidable v2: export is a function with .IncomingForm constructor available via formidable.IncomingForm
  // - formidable v3+: default export is a function that returns a new Formidable instance when called
  // - some bundlers may wrap default; handle common shapes.

  const f = formidablePkg

  // v3+ (formidable is a function that returns a form instance)
  if (typeof f === 'function') {
    try {
      // Call it as factory: formidable(options)
      const form = f(options)
      // If parse method exists, return the form
      if (form && typeof form.parse === 'function') return form
    } catch (e) {
      // fall through to try other shapes
    }
  }

  // v2 style: new formidable.IncomingForm()
  if (f && typeof f.IncomingForm === 'function') {
    try {
      const Form = f.IncomingForm
      const form = new Form(options)
      return form
    } catch (e) {
      // fall through
    }
  }

  // If the package is wrapped as default property (common with certain bundlers)
  // Check f.default
  if (f && f.default) {
    const g = f.default
    if (typeof g === 'function') {
      try {
        const form = g(options)
        if (form && typeof form.parse === 'function') return form
      } catch (e) {}
    }
    if (g && typeof g.IncomingForm === 'function') {
      try {
        const form = new g.IncomingForm(options)
        return form
      } catch (e) {}
    }
  }

  throw new Error('Could not initialize formidable: unsupported package shape')
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    try {
      const form = createFormidable({ multiples: false, keepExtensions: true, maxFileSize: 10 * 1024 * 1024 })
      // Some formidable versions expose `parse(req, cb)`; others may use async .parse
      if (typeof form.parse === 'function') {
        // v2 / v3 common API: form.parse(req, cb)
        form.parse(req, (err, fields, files) => {
          if (err) return reject(err)
          resolve({ fields: fields || {}, files: files || {} })
        })
      } else if (typeof form.opened === 'function') {
        // unusual fallback (unlikely)
        reject(new Error('Formidable instance does not expose parse method'))
      } else {
        reject(new Error('Formidable parse method not found on instance'))
      }
    } catch (err) {
      reject(err)
    }
  })
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk.toString() })
    req.on('end', () => {
      if (!body) return resolve({})
      try {
        const parsed = JSON.parse(body)
        resolve(parsed)
      } catch (err) {
        resolve({})
      }
    })
    req.on('error', (err) => reject(err))
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const contentType = req.headers['content-type'] || '(none)'
  console.log('[upload] content-type:', contentType)
  console.log('[upload] x-admin-token present?', !!req.headers['x-admin-token'])

  let fields = {}, files = {}

  try {
    if (contentType.includes('multipart/form-data')) {
      const parsed = await parseMultipart(req)
      fields = parsed.fields || {}
      files = parsed.files || {}
      console.log('[upload] multipart parsed. fields keys:', Object.keys(fields), 'files keys:', Object.keys(files))
    } else {
      const parsed = await parseJsonBody(req)
      fields = parsed || {}
      files = {}
      console.log('[upload] json parsed. fields keys:', Object.keys(fields))
    }
  } catch (err) {
    console.error('[upload] Failed to parse form data:', err && (err.message || err))
    return res.status(400).json({ error: 'Failed to parse form data', details: err && (err.message || String(err)) })
  }

  const adminToken = req.headers['x-admin-token'] || fields.adminToken || fields.token || req.query.token
  if (!process.env.ADMIN_TOKEN) {
    console.error('[upload] ADMIN_TOKEN missing in environment')
    return res.status(500).json({ error: 'ADMIN_TOKEN not configured' })
  }
  if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
    console.log('[upload] invalid admin token')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Extract fields
  let filename = (fields.filename || fields.slug || '').toString()
  let chapterNumber = fields.chapterNumber || fields.chapter || ''
  let title = fields.title || ''
  let content = fields.content || ''

  // Handle uploaded file present in `files` (robust extraction for different formidable shapes)
  if (files && Object.keys(files).length > 0) {
    // Try multiple candidates: files.file, files.upload, first property, or array-like
    let candidate = files.file || files.upload || null

    if (!candidate) {
      // pick the first property in files (handles shapes like { '0': {...} } or { myfile: {...} })
      const firstKey = Object.keys(files)[0]
      candidate = files[firstKey]
    }

    // candidate might be an array (e.g. [{...}]) or an object
    let fileObj = null
    if (Array.isArray(candidate)) {
      fileObj = candidate[0]
    } else if (candidate && typeof candidate === 'object') {
      // Sometimes candidate itself has numeric keys (e.g. { '0': {...} })
      // If so, take first nested value
      const nestedKeys = Object.keys(candidate)
      if (nestedKeys.length === 1 && /^[0-9]+$/.test(nestedKeys[0])) {
        fileObj = candidate[nestedKeys[0]]
      } else {
        fileObj = candidate
      }
    }

    // attempt to find filepath using common property names
    const possiblePaths = [
      fileObj && fileObj.filepath,
      fileObj && fileObj.path,
      fileObj && fileObj.tempFilePath, // some wrappers
      fileObj && fileObj.tempFilePathName,
    ].filter(Boolean)

    const filePath = possiblePaths.length > 0 ? possiblePaths[0] : undefined

    console.log('[upload] extracted fileObj keys:', fileObj ? Object.keys(fileObj) : 'none', 'resolved filePath:', !!filePath)

    if (!fileObj || !filePath) {
      console.error('[upload] could not locate uploaded file path - fileObj shape:', fileObj)
      return res.status(500).json({ error: 'Failed to read uploaded file', details: 'Uploaded file object present but filepath could not be resolved on server' })
    }

    try {
      const buf = fs.readFileSync(filePath)
      const text = buf.toString('utf8')
      if (!content) content = text
      // originalFilename or name or filename may be present in different keys
      const originalName = fileObj.originalFilename || fileObj.name || fileObj.filename || fileObj.originalname
      if (!filename && originalName) {
        filename = path.basename(originalName).replace(path.extname(originalName), '')
      }
    } catch (err) {
      console.error('[upload] error reading uploaded file:', err)
      return res.status(500).json({ error: 'Failed to read uploaded file', details: err && (err.message || String(err)) })
    }
  }


  if (!chapterNumber || !content) {
    console.log('[upload] validation failed; chapterNumber present?', !!chapterNumber, 'content present?', !!content)
    return res.status(400).json({ error: 'Missing filename, chapterNumber or content', parsedFields: Object.keys(fields), parsedFiles: Object.keys(files) })
  }

  if (!filename) {
    filename = title ? title : `chapter-${String(chapterNumber).padStart(2, '0')}`
  }
  filename = sanitizeFilename(filename)

  const md = `---\nchapterNumber: ${Number(chapterNumber)}\ntitle: "${(title || '').toString().replace(/"/g, '\\"')}"\npublishedAt: "${new Date().toISOString().split('T')[0]}"\n---\n\n${content}\n`

  // If GitHub env present, commit; else fallback to return markdown
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  const REPO_OWNER = process.env.REPO_OWNER
  const REPO_NAME = process.env.REPO_NAME
  const BRANCH = process.env.REPO_BRANCH || 'main'

  if (GITHUB_TOKEN && REPO_OWNER && REPO_NAME) {
    try {
      const pathInRepo = `content/chapters/${filename}.md`
      const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(pathInRepo)}`

      const getRes = await fetch(url + `?ref=${BRANCH}`, { headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'PersonalNovelReader' }})
      let sha = null
      if (getRes.status === 200) {
        const getJson = await getRes.json()
        sha = getJson.sha
      }

      const putBody = {
        message: `Add/Update chapter ${chapterNumber} - ${title || filename}`,
        content: Buffer.from(md).toString('base64'),
        branch: BRANCH,
      }
      if (sha) putBody.sha = sha

      const putRes = await fetch(url, {
        method: 'PUT',
        headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'PersonalNovelReader', 'Content-Type': 'application/json' },
        body: JSON.stringify(putBody)
      })
      const putJson = await putRes.json()
      if (putRes.status >= 200 && putRes.status < 300) {
        console.log('[upload] commit success', putJson.content && putJson.content.path)
        return res.status(200).json({ success: true, github: putJson })
      } else {
        console.error('[upload] GitHub API error', putJson)
        return res.status(500).json({ error: 'GitHub API error', details: putJson })
      }
    } catch (err) {
      console.error('[upload] GitHub commit error', err)
      return res.status(500).json({ error: 'GitHub commit failed', details: err && (err.message || String(err)) })
    }
  }

  res.setHeader('Content-Disposition', `attachment; filename=${filename}.md`)
  res.setHeader('Content-Type', 'text/markdown')
  return res.status(200).send(md)
}
