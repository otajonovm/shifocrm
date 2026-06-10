/**
 * Bemor to'lovlari: A4 va 80mm chek chop etish.
 * Alohida popup oynada — ilova header/sidebar chiqmaydi.
 */

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const asNumber = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const formatMoney = (amount) => `${asNumber(amount).toLocaleString('uz-UZ')} so'm`

const formatDateTime = (value) => {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })
}

const buildDocumentNumber = (patientId) => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const pid = String(patientId || '').slice(-4).padStart(4, '0')
  return `CHK-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pid}`
}

const printScript = `
<script>
  function doPrint() {
    window.focus();
    window.print();
  }
  window.onload = function() { setTimeout(doPrint, 250); };
<\/script>
`

/** @param {object} data */
export function buildReceiptPrintHtml(data = {}) {
  const {
    clinicName = 'SHIFOCRM',
    clinicLogo = '',
    clinicAddress = '',
    clinicPhone = '',
    patientName = '-',
    patientMedId = '',
    patientPhone = '',
    doctorName = '-',
    documentNumber = buildDocumentNumber(),
    printedAt = new Date().toISOString(),
    services = [],
    totalServices = 0,
    totalDiscount = 0,
    totalPaid = 0,
    remainingDebt = 0,
  } = data

  const serviceRows = services.length
    ? services
        .map((s) => {
          const label = `${escapeHtml(s.name || 'Xizmat')}${s.tooth != null ? ` (#${escapeHtml(s.tooth)})` : ''}`
          return `<tr><td>${label}</td><td class="num">${formatMoney(s.price)}</td></tr>`
        })
        .join('')
    : '<tr><td colspan="2" class="empty">Xizmatlar mavjud emas</td></tr>'

  const discountRow =
    asNumber(totalDiscount) > 0
      ? `<tr><td>Chegirma</td><td class="num">-${formatMoney(totalDiscount)}</td></tr>`
      : ''

  return `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8" />
<title>Chek — ${escapeHtml(patientName)}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Courier New', Consolas, monospace;
    font-size: 11px;
    color: #000;
    background: #fff;
    width: 72mm;
    margin: 0 auto;
    padding: 4mm 2mm;
    line-height: 1.35;
  }
  .head { text-align: center; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed #000; }
  .logo { max-width: 36mm; max-height: 22mm; margin: 0 auto 4px; display: block; }
  .clinic { font-size: 13px; font-weight: bold; text-transform: uppercase; }
  .meta { font-size: 9px; margin-top: 2px; }
  .info { font-size: 9px; text-align: center; margin-bottom: 8px; line-height: 1.4; }
  .info b { font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0; }
  th { border-bottom: 1px solid #000; padding: 3px 2px; text-align: left; font-size: 10px; }
  th:last-child, td.num { text-align: right; }
  td { padding: 3px 2px; vertical-align: top; border-bottom: 1px dotted #bbb; font-size: 10px; }
  tr.total td { border-top: 1px dashed #000; border-bottom: none; font-weight: bold; padding-top: 5px; }
  tr.debt td { border-top: 2px solid #000; font-weight: bold; font-size: 11px; }
  .empty { text-align: center; color: #666; font-style: italic; }
  .foot { text-align: center; margin-top: 10px; padding-top: 6px; border-top: 1px dashed #000; font-weight: bold; font-size: 10px; }
  @media print {
    body { width: 72mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
${printScript}
</head>
<body>
  <div class="head">
    ${clinicLogo ? `<img src="${escapeHtml(clinicLogo)}" alt="" class="logo" />` : ''}
    <div class="clinic">${escapeHtml(clinicName)}</div>
    ${clinicAddress ? `<div class="meta">${escapeHtml(clinicAddress)}</div>` : ''}
    ${clinicPhone ? `<div class="meta">Tel: ${escapeHtml(clinicPhone)}</div>` : ''}
  </div>
  <div class="info">
    <div><b>${escapeHtml(patientName)}</b>${patientMedId ? ` • MED-ID #${escapeHtml(patientMedId)}` : ''}</div>
    ${patientPhone ? `<div>Tel: ${escapeHtml(patientPhone)}</div>` : ''}
    <div>Shifokor: ${escapeHtml(doctorName)}</div>
    <div>${escapeHtml(formatDateTime(printedAt))} • Chek № ${escapeHtml(documentNumber)}</div>
  </div>
  <table>
    <thead><tr><th>Xizmat</th><th>Summa</th></tr></thead>
    <tbody>
      ${serviceRows}
      <tr class="total"><td>Jami xizmatlar</td><td class="num">${formatMoney(totalServices)}</td></tr>
      ${discountRow}
      <tr><td>To'langan</td><td class="num">${formatMoney(totalPaid)}</td></tr>
      <tr class="debt"><td>Qarzdorlik</td><td class="num">${formatMoney(remainingDebt)}</td></tr>
    </tbody>
  </table>
  <div class="foot">Rahmat! Sog'ligingiz uchun!</div>
</body>
</html>`
}

/** @param {object} data */
export function buildA4PrintHtml(data = {}) {
  const {
    clinicName = 'SHIFOCRM',
    clinicLogo = '',
    clinicAddress = '',
    clinicPhone = '',
    patientName = '-',
    patientMedId = '',
    patientPhone = '',
    doctorName = '-',
    documentNumber = buildDocumentNumber(),
    printedAt = new Date().toISOString(),
    services = [],
    totalServices = 0,
    totalDiscount = 0,
    totalPaid = 0,
    remainingDebt = 0,
  } = data

  const serviceRows = services.length
    ? services
        .map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(s.name || 'Xizmat')}</td>
        <td>${s.tooth != null ? `#${escapeHtml(s.tooth)}` : '-'}</td>
        <td>${escapeHtml(s.doctor || doctorName || '-')}</td>
        <td class="num">${formatMoney(s.price)}</td>
      </tr>`)
        .join('')
    : '<tr><td colspan="5" class="empty">Xizmatlar mavjud emas</td></tr>'

  const discountFoot =
    asNumber(totalDiscount) > 0
      ? `<tr><td colspan="4" class="foot-label">Chegirma</td><td class="num foot-discount">-${formatMoney(totalDiscount)}</td></tr>`
      : ''

  return `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8" />
<title>Davolash hisoboti — ${escapeHtml(patientName)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1e293b; background: #fff; margin: 0; padding: 0; }
  .sheet { max-width: 186mm; margin: 0 auto; }
  .header { display: flex; gap: 16px; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 14px; }
  .logo { width: 64px; height: 64px; object-fit: contain; }
  .brand { flex: 1; }
  .brand h1 { font-size: 20px; margin: 0 0 4px; color: #0f172a; }
  .brand p { margin: 1px 0; color: #64748b; font-size: 10px; }
  .doc-meta { text-align: right; font-size: 10px; color: #64748b; min-width: 130px; }
  .title { text-align: center; font-size: 16px; font-weight: 700; margin-bottom: 14px; }
  .patient { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; margin-bottom: 14px; }
  .patient div { font-size: 10px; }
  .patient b { color: #475569; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 7px 8px; text-align: left; font-size: 10px; }
  td { border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 10px; }
  td.num, th.num { text-align: right; }
  tfoot td { background: #eff6ff; font-weight: 600; border-top: 2px solid #0284c7; }
  .foot-label { text-align: right; }
  .foot-discount { color: #7c3aed; }
  tfoot tr:last-child td { font-size: 12px; font-weight: 800; color: #0c4a6e; }
  .empty { text-align: center; color: #94a3b8; font-style: italic; }
  .signs { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 24px; }
  .sign { font-size: 10px; color: #475569; }
  .sign-line { margin-top: 32px; border-top: 1px solid #94a3b8; padding-top: 4px; text-align: center; font-size: 9px; color: #94a3b8; }
  .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 8px; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .sheet { max-width: 100%; }
  }
</style>
${printScript}
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="brand">
        ${clinicLogo ? `<img src="${escapeHtml(clinicLogo)}" alt="" class="logo" style="float:left;margin-right:12px;" />` : ''}
        <h1>${escapeHtml(clinicName)}</h1>
        ${clinicAddress ? `<p>${escapeHtml(clinicAddress)}</p>` : ''}
        ${clinicPhone ? `<p>Tel: ${escapeHtml(clinicPhone)}</p>` : ''}
      </div>
      <div class="doc-meta">
        <div><b>Hujjat №:</b> ${escapeHtml(documentNumber)}</div>
        <div><b>Sana:</b> ${escapeHtml(formatDateTime(printedAt))}</div>
      </div>
    </div>
    <div class="title">Davolash va to'lov hisoboti</div>
    <div class="patient">
      <div><b>F.I.Sh:</b> ${escapeHtml(patientName)}</div>
      <div><b>MED-ID:</b> ${patientMedId ? `#${escapeHtml(patientMedId)}` : '-'}</div>
      ${patientPhone ? `<div><b>Telefon:</b> ${escapeHtml(patientPhone)}</div>` : '<div></div>'}
      <div><b>Shifokor:</b> ${escapeHtml(doctorName)}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:28px">#</th>
          <th>Xizmat</th>
          <th style="width:48px">Tish</th>
          <th>Shifokor</th>
          <th class="num" style="width:90px">Narx</th>
        </tr>
      </thead>
      <tbody>${serviceRows}</tbody>
      <tfoot>
        <tr>
          <td colspan="4" class="foot-label">Jami xizmatlar narxi</td>
          <td class="num">${formatMoney(totalServices)}</td>
        </tr>
        ${discountFoot}
        <tr>
          <td colspan="4" class="foot-label">To'langan summa</td>
          <td class="num">${formatMoney(totalPaid)}</td>
        </tr>
        <tr>
          <td colspan="4" class="foot-label">Qoldiq qarzdorlik</td>
          <td class="num">${formatMoney(remainingDebt)}</td>
        </tr>
      </tfoot>
    </table>
    <div class="signs">
      <div class="sign">Kassir / Administrator<div class="sign-line">Imzo</div></div>
      <div class="sign">Bemor<div class="sign-line">Imzo</div></div>
    </div>
    <div class="footer">${escapeHtml(clinicName)} • ShifoCRM tizimida avtomatik tuzilgan</div>
  </div>
</body>
</html>`
}

const openAndPrint = (html) => {
  const popup = window.open('', '_blank', 'width=900,height=800')
  if (!popup) return { ok: false, error: 'POPUP_BLOCKED' }
  popup.document.open()
  popup.document.write(html)
  popup.document.close()
  return { ok: true, popup }
}

/** Chop etish uchun ma'lumotlarni tayyorlaydi */
export function buildPaymentPrintPayload({
  clinicStore,
  patientId,
  patientName,
  patientMedId,
  patientPhone,
  doctorName,
  printServices,
  totalServices,
  totalDiscountAmount,
  totalPaidNet,
  remainingDebt,
  documentNumber,
}) {
  return {
    clinicName: clinicStore?.displayName || 'SHIFOCRM',
    clinicLogo: clinicStore?.logoUrl || '',
    clinicAddress: clinicStore?.address || '',
    clinicPhone: clinicStore?.phone || '',
    patientName: patientName || '-',
    patientMedId: patientMedId || '',
    patientPhone: patientPhone || '',
    doctorName: doctorName || '-',
    documentNumber: documentNumber || buildDocumentNumber(patientId),
    printedAt: new Date().toISOString(),
    services: (printServices || []).map((s) => ({
      name: s.service_name,
      tooth: s.tooth_id,
      price: s.price,
      doctor: s.performed_by,
    })),
    totalServices,
    totalDiscount: totalDiscountAmount,
    totalPaid: totalPaidNet,
    remainingDebt,
  }
}

export function openReceiptPrint(data) {
  const html = buildReceiptPrintHtml(data)
  return openAndPrint(html)
}

export function openA4Print(data) {
  const html = buildA4PrintHtml(data)
  return openAndPrint(html)
}
