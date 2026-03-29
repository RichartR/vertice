import sharp from 'sharp'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const logo = resolve(__dirname, '../src/assets/logo.webp')

for (const size of [192, 512]) {
  const logoSize = size
  const logoBuffer = await sharp(logo)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()

  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0xb9, g: 0xd9, b: 0xce, alpha: 1 } },
  })
    .composite([{ input: logoBuffer }])
    .png()
    .toFile(resolve(__dirname, `../public/icons/icon-${size}.png`))
}
