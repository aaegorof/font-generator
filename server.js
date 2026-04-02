import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FONTS_DIR = path.join(__dirname, 'public/fonts')

const storage = multer.diskStorage({
  destination: FONTS_DIR,
  filename: (_req, file, cb) => {
    // Preserve original filename so the URL path stays predictable
    cb(null, file.originalname)
  },
})

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(woff2?|ttf|otf)$/i
    if (allowed.test(file.originalname)) cb(null, true)
    else cb(new Error('Only font files are allowed (.woff, .woff2, .ttf, .otf)'))
  },
})

const app = express()
const PORT = 3001

app.post('/upload-font', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }

  const filename = req.file.originalname
  // Strip extension and turn separators into spaces → font family name
  const baseName = filename.replace(/\.(woff2?|ttf|otf)$/i, '')
  const family = baseName.replace(/[-_]/g, ' ')

  res.json({
    filename,
    family,
    url: `/fonts/${filename}`,
  })
})

app.listen(PORT, () => {
  console.log(`Font upload server → http://localhost:${PORT}`)
})
