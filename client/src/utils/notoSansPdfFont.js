const FONT_FAMILY = 'NotoSans'
const VFS_REGULAR = 'NotoSans-Regular.ttf'
const VFS_BOLD = 'NotoSans-Bold.ttf'

let base64Promise = null

function fontUrl(fileName) {
  const base = import.meta.env.BASE_URL || '/'
  const prefix = base.endsWith('/') ? base : `${base}/`
  return `${prefix}fonts/${fileName}`
}

function arrayBufferToBase64(buffer) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer])
    const reader = new FileReader()
    reader.onload = () => {
      const data = String(reader.result || '')
      const comma = data.indexOf(',')
      resolve(comma >= 0 ? data.slice(comma + 1) : data)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function loadNotoSansBase64() {
  if (!base64Promise) {
    base64Promise = (async () => {
      const [regBuf, boldBuf] = await Promise.all([
        fetch(fontUrl('NotoSans-Regular.ttf')).then((r) => {
          if (!r.ok) throw new Error(`NotoSans-Regular: ${r.status}`)
          return r.arrayBuffer()
        }),
        fetch(fontUrl('NotoSans-Bold.ttf')).then((r) => {
          if (!r.ok) throw new Error(`NotoSans-Bold: ${r.status}`)
          return r.arrayBuffer()
        }),
      ])
      const [regB64, boldB64] = await Promise.all([
        arrayBufferToBase64(regBuf),
        arrayBufferToBase64(boldBuf),
      ])
      return { regB64, boldB64 }
    })()
  }
  return base64Promise
}

/**
 * Učitava Noto Sans (Regular + Bold) u proslijeđeni jsPDF dokument.
 * Potrebno za č, ć, š, ž, đ i ostala latinična slova u PDF-u.
 */
export async function registerNotoSansForJsPdf(doc) {
  const { regB64, boldB64 } = await loadNotoSansBase64()
  doc.addFileToVFS(VFS_REGULAR, regB64)
  doc.addFont(VFS_REGULAR, FONT_FAMILY, 'normal')
  doc.addFileToVFS(VFS_BOLD, boldB64)
  doc.addFont(VFS_BOLD, FONT_FAMILY, 'bold')
}

export const NOTO_SANS_PDF_FAMILY = FONT_FAMILY
