/** @vitest-environment node */
import fs from 'fs'
import path from 'path'
import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error JS module is runtime-tested here
import { app, IMAGES_DIR } from './server.js'

const TEST_NAME = 'vitest-upload-test.png'
/** Minimal valid PNG (1×1) */
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

describe('POST /upload-image', () => {
  const target = path.join(IMAGES_DIR, TEST_NAME)

  afterEach(() => {
    if (fs.existsSync(target)) fs.unlinkSync(target)
  })

  it('saves file and returns url', async () => {
    const res = await request(app).post('/upload-image').attach('file', PNG_BYTES, TEST_NAME)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ url: `/uploaded-images/${TEST_NAME}` })
    expect(fs.existsSync(target)).toBe(true)
  })

  it('returns 409 when file already exists', async () => {
    fs.writeFileSync(target, PNG_BYTES)

    const res = await request(app).post('/upload-image').attach('file', PNG_BYTES, TEST_NAME)

    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: 'File already exists' })
  })
})
