/**
 * Bemor keshbek / MED-ID kartasini chop etish (hamyon o'lchamida).
 */

import QRCode from 'qrcode'

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export function cashbackQrPayload(patientId) {
  const id = Number(patientId)
  if (!Number.isFinite(id) || id <= 0) return ''
  return `SHIFOCRM:MED:${id}`
}

export async function cashbackQrDataUrl(patientId) {
  const payload = cashbackQrPayload(patientId)
  if (!payload) return ''
  return QRCode.toDataURL(payload, {
    width: 320,
    margin: 1,
    color: { dark: '#111827', light: '#ffffff' },
  })
}

/**
 * @param {{
 *   clinicName?: string,
 *   patientName?: string,
 *   medId?: string,
 *   phone?: string,
 *   cashbackLabel?: string,
 *   hint?: string,
 *   qrDataUrl?: string,
 * }} data
 */
export function openCashbackCardPrint(data = {}) {
  const clinicName = escapeHtml(data.clinicName || 'SHIFOCRM')
  const patientName = escapeHtml(data.patientName || '-')
  const medId = escapeHtml(data.medId || '-')
  const phone = escapeHtml(data.phone || '')
  const cashbackLabel = escapeHtml(data.cashbackLabel || '')
  const hint = escapeHtml(data.hint || '')
  const qr = data.qrDataUrl
    ? `<img src="${escapeHtml(data.qrDataUrl)}" alt="QR" />`
    : ''

  const html = `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8" />
<title>${medId}</title>
<style>
  @page { size: 85.6mm 54mm; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: #fff; }
  .card {
    width: 85.6mm;
    height: 54mm;
    padding: 6mm 7mm;
    display: flex;
    gap: 5mm;
    border: 0.4mm solid #f59e0b;
    border-radius: 3mm;
  }
  .left { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .clinic { font-size: 8pt; font-weight: 700; color: #0f766e; letter-spacing: 0.04em; text-transform: uppercase; }
  .name { margin-top: 2mm; font-size: 12pt; font-weight: 700; color: #111827; line-height: 1.2; }
  .med { margin-top: 1.5mm; font-family: ui-monospace, monospace; font-size: 11pt; font-weight: 700; color: #0d9488; }
  .phone { margin-top: 0.8mm; font-size: 8pt; color: #6b7280; }
  .cash { margin-top: auto; font-size: 11pt; font-weight: 700; color: #b45309; }
  .hint { margin-top: 1mm; font-size: 7pt; color: #78716c; line-height: 1.3; }
  .qr { width: 28mm; height: 28mm; align-self: center; }
  .qr img { width: 100%; height: 100%; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="card">
    <div class="left">
      <div class="clinic">${clinicName}</div>
      <div class="name">${patientName}</div>
      <div class="med">${medId}</div>
      ${phone ? `<div class="phone">${phone}</div>` : ''}
      <div class="cash">${cashbackLabel}</div>
      <div class="hint">${hint}</div>
    </div>
    <div class="qr">${qr}</div>
  </div>
  <script>
    window.onload = function () { setTimeout(function () { window.focus(); window.print(); }, 250); };
  <\/script>
</body>
</html>`

  const popup = window.open('', '_blank', 'width=420,height=320')
  if (!popup) return { ok: false, error: 'POPUP_BLOCKED' }
  popup.document.open()
  popup.document.write(html)
  popup.document.close()
  return { ok: true }
}
