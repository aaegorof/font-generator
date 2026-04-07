import express from 'express'
import fs from 'fs'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FONTS_DIR = path.join(__dirname, 'public/fonts')
const IMAGES_DIR = path.join(__dirname, 'public/images')

fs.mkdirSync(FONTS_DIR, { recursive: true })
fs.mkdirSync(IMAGES_DIR, { recursive: true })

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

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
])

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, IMAGES_DIR)
  },
  filename: (_req, file, cb) => {
    const target = path.join(IMAGES_DIR, file.originalname)
    if (fs.existsSync(target)) {
      const err = new Error('File already exists')
      err.code = 'DUPLICATE'
      cb(err)
      return
    }
    cb(null, file.originalname)
  },
})

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIMES.has(file.mimetype)) cb(null, true)
    else cb(new Error('Invalid image type'))
  },
})

const app = express()
const PORT = 3001
const FONT_EXTENSIONS = new Set(['.woff', '.woff2', '.ttf', '.otf'])
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'])
const LOCAL_IMAGE_URL_PREFIX = '/images/'

app.use('/uploaded-images', express.static(IMAGES_DIR))

app.get('/list-fonts', (_req, res) => {
  try {
    const files = fs.readdirSync(FONTS_DIR)
    const stems = new Set(
      files
        .filter((fileName) => FONT_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
        .map((fileName) => fileName.replace(/\.(woff2?|ttf|otf)$/i, '')),
    )

    res.json([...stems])
  } catch (error) {
    console.error('Failed to read local fonts directory:', error)
    res.status(500).json({ error: 'Failed to list fonts' })
  }
})

app.get('/list-images', (_req, res) => {
  try {
    const imageUrls = fs
      .readdirSync(IMAGES_DIR)
      .filter((fileName) => IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
      .map((fileName) => `${LOCAL_IMAGE_URL_PREFIX}${fileName}`)

    res.json(imageUrls)
  } catch (error) {
    console.error('Failed to read local images directory:', error)
    res.status(500).json({ error: 'Failed to list images' })
  }
})

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

app.post('/upload-image', (req, res, next) => {
  imageUpload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'DUPLICATE' || err.message === 'File already exists') {
        res.status(409).json({ error: 'File already exists' })
        return
      }
      if (err instanceof multer.MulterError) {
        res.status(400).json({ error: err.message })
        return
      }
      if (err.message === 'Invalid image type') {
        res.status(400).json({ error: err.message })
        return
      }
      next(err)
      return
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' })
      return
    }

    res.json({ url: `/uploaded-images/${req.file.filename}` })
  })
})

function isMainModule() {
  const entry = process.argv[1]
  if (!entry) return false
  try {
    return fileURLToPath(import.meta.url) === path.resolve(entry)
  } catch {
    return false
  }
}

if (isMainModule()) {
  app.listen(PORT, () => {
    console.log(`Font upload server → http://localhost:${PORT}`)
  })
}

export { app, FONTS_DIR, IMAGES_DIR, PORT }
