/**
 * Ma'lumotlarni eksport qilish: Excel (CSV) va PDF (chop etish orqali).
 * Tashqi kutubxonasiz — brauzerning o'zida ishlaydi.
 *
 * columns: [{ key, label, type? }]  type: 'number' | 'text' (ixtiyoriy)
 * rows: ob'ektlar massivi
 */

const sanitizeCell = (value) => {
  if (value == null) return ''
  let text = String(value)
  // CSV injection himoyasi: =, +, -, @ bilan boshlanadigan kataklar
  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`
  }
  // Qo'shtirnoq va vergul bo'lsa, qo'shtirnoqqa olamiz
  if (/["\n;,]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`
  }
  return text
}

const resolveCellValue = (row, column) => {
  const raw = typeof column.value === 'function' ? column.value(row) : row[column.key]
  return raw
}

const timestampSuffix = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
}

/**
 * CSV (Excel ochadi) faylini yuklab beradi.
 * UTF-8 BOM bilan — Excel da kirill/lotin to'g'ri ko'rinadi.
 */
export function exportToCsv(filename, columns, rows) {
  if (!Array.isArray(columns) || !columns.length) {
    throw new Error('Eksport uchun ustunlar aniqlanmagan.')
  }
  const safeRows = Array.isArray(rows) ? rows : []

  const header = columns.map((c) => sanitizeCell(c.label ?? c.key)).join(';')
  const body = safeRows
    .map((row) => columns.map((c) => sanitizeCell(resolveCellValue(row, c))).join(';'))
    .join('\r\n')

  const csv = `\uFEFF${header}\r\n${body}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${timestampSuffix()}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/**
 * Jadvalni alohida oynada A4 ko'rinishida ochib, chop etish/PDF saqlash imkonini beradi.
 * @param {object} opts
 * @param {string} opts.title - Hujjat sarlavhasi
 * @param {string} [opts.subtitle] - Qo'shimcha matn (sana oralig'i va h.k.)
 * @param {Array<{key:string,label:string,value?:Function,type?:string}>} opts.columns
 * @param {Array<object>} opts.rows
 * @param {Array<{label:string,value:string}>} [opts.summary] - Pastdagi yakuniy ko'rsatkichlar
 * @param {string} [opts.clinicName]
 */
export function exportToPdf({ title, subtitle = '', columns, rows, summary = [], clinicName = 'ShifoCRM' }) {
  if (!Array.isArray(columns) || !columns.length) {
    throw new Error('Eksport uchun ustunlar aniqlanmagan.')
  }
  const safeRows = Array.isArray(rows) ? rows : []

  const thead = columns
    .map((c) => `<th class="${c.type === 'number' ? 'num' : ''}">${escapeHtml(c.label ?? c.key)}</th>`)
    .join('')

  const tbody = safeRows.length
    ? safeRows
        .map((row) => {
          const tds = columns
            .map((c) => {
              const val = resolveCellValue(row, c)
              return `<td class="${c.type === 'number' ? 'num' : ''}">${escapeHtml(val)}</td>`
            })
            .join('')
          return `<tr>${tds}</tr>`
        })
        .join('')
    : `<tr><td colspan="${columns.length}" class="empty">Ma'lumot yo'q</td></tr>`

  const summaryHtml = summary.length
    ? `<div class="summary">${summary
        .map((s) => `<div class="summary-row"><span>${escapeHtml(s.label)}</span><b>${escapeHtml(s.value)}</b></div>`)
        .join('')}</div>`
    : ''

  const printedAt = new Date().toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })

  const html = `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; font-size: 12px; }
  .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #e5e7eb; padding-bottom:10px; margin-bottom:14px; }
  .clinic { font-size:18px; font-weight:800; color:#0f172a; }
  .title { font-size:14px; font-weight:700; margin-top:2px; }
  .subtitle { font-size:11px; color:#6b7280; margin-top:3px; }
  .meta { text-align:right; font-size:10px; color:#6b7280; }
  table { width:100%; border-collapse:collapse; margin-top:6px; }
  th { background:#f3f4f6; border:1px solid #d1d5db; padding:6px 8px; text-align:left; font-size:11px; }
  td { border:1px solid #e5e7eb; padding:5px 8px; font-size:11px; }
  td.num, th.num { text-align:right; font-variant-numeric: tabular-nums; }
  tbody tr:nth-child(even){ background:#fafafa; }
  .empty { text-align:center; color:#9ca3af; padding:14px; }
  .summary { margin-top:16px; margin-left:auto; width:300px; border:1px solid #cbd5e1; border-radius:6px; overflow:hidden; }
  .summary-row { display:flex; justify-content:space-between; padding:7px 10px; border-bottom:1px solid #eef2f7; font-size:12px; }
  .summary-row:last-child { border-bottom:0; background:#f0fdf4; font-weight:700; }
  .foot { margin-top:20px; text-align:center; font-size:10px; color:#9ca3af; }
  .toolbar { margin-bottom:12px; }
  .toolbar button { border:1px solid #cbd5e1; background:#fff; border-radius:6px; padding:6px 12px; font-size:12px; cursor:pointer; font-weight:600; }
  @media print { .toolbar { display:none; } }
</style>
</head>
<body>
  <div class="toolbar"><button onclick="window.print()">🖨️ Chop etish / PDF saqlash</button></div>
  <div class="head">
    <div>
      <div class="clinic">${escapeHtml(clinicName)}</div>
      <div class="title">${escapeHtml(title)}</div>
      ${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ''}
    </div>
    <div class="meta">Chop etilgan: ${escapeHtml(printedAt)}<br/>Jami yozuvlar: ${safeRows.length}</div>
  </div>
  <table>
    <thead><tr>${thead}</tr></thead>
    <tbody>${tbody}</tbody>
  </table>
  ${summaryHtml}
  <div class="foot">ShifoCRM — avtomatik yaratilgan hisobot</div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };<\/script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) {
    throw new Error('Chop etish oynasi ochilmadi. Brauzerda pop-up ruxsatini bering.')
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}
