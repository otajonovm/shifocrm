const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const asNumber = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

const formatCurrency = (amount) => `${asNumber(amount).toLocaleString('uz-UZ')} so'm`

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${day}.${month}.${year} ${hour}:${minute}`
}

const normalizeNote = (note) => String(note || '')
  .replace(/^\s*\[DISCOUNT\]\s*/i, '')
  .replace(/^\s*\[DISCOUNT_PERCENT:[^\]]+\]\s*/i, '')
  .replace(/^\s*\[CATEGORY:[^\]]+\]\s*/i, '')
  .trim()

const getDiscountPercent = (note) => {
  if (!note) return ''
  const match = String(note).match(/\[DISCOUNT_PERCENT:([\d.]+)\]/i)
  return match?.[1] || ''
}

const documentNumber = () => {
  const d = new Date()
  return `RPT-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`
}

const getPaymentStatusLabel = ({ totalAfterDiscount = 0, paid = 0, remaining = 0 }) => {
  const due = asNumber(totalAfterDiscount)
  const paidAmount = asNumber(paid)
  const debt = asNumber(remaining)
  if (debt > 0 && paidAmount > 0) return 'Qisman to\'langan'
  if (debt > 0) return 'Qarz bor'
  if (due <= 0) return 'Yopilgan'
  if (paidAmount >= due) return 'To\'langan'
  if (paidAmount > 0) return 'Qisman to\'langan'
  return 'To\'lanmagan'
}

const buildServicesRows = (services = []) => {
  if (!Array.isArray(services) || services.length === 0) {
    return '<tr><td colspan="10" class="muted">Bajarilgan xizmatlar topilmadi</td></tr>'
  }

  return services.map((service, index) => {
    const visit = service.visitId ? `#${escapeHtml(service.visitId)}` : '-'
    const tooth = service.tooth != null ? `#${escapeHtml(service.tooth)}` : '-'
    const quantity = asNumber(service.quantity || 1)
    const unitPrice = asNumber(service.unitPrice || service.price)
    const lineTotal = asNumber(service.totalPrice || service.price || (unitPrice * quantity))
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(service.code || '-')}</td>
        <td>${visit}</td>
        <td>${escapeHtml(service.name || 'Xizmat')}</td>
        <td>${tooth}</td>
        <td class="num">${quantity}</td>
        <td class="num">${formatCurrency(unitPrice)}</td>
        <td class="num">${formatCurrency(lineTotal)}</td>
        <td>${escapeHtml(formatDateTime(service.performedAt || service.created_at || ''))}</td>
        <td>${escapeHtml(service.performedBy || service.doctorName || '-')}</td>
      </tr>
    `
  }).join('')
}

const buildDiscountRows = (discounts = []) => {
  if (!Array.isArray(discounts) || discounts.length === 0) {
    return '<tr><td colspan="7" class="muted">Chegirma qo\'llanmagan</td></tr>'
  }

  return discounts.map((discount, index) => {
    const visit = discount.visitId ? `#${escapeHtml(discount.visitId)}` : '-'
    const percent = discount.percent || getDiscountPercent(discount.note)
    const type = percent ? 'Foizli' : 'Summali'
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${visit}</td>
        <td>${type}</td>
        <td class="num">${percent ? `${escapeHtml(percent)}%` : '-'}</td>
        <td class="num">-${formatCurrency(discount.amount)}</td>
        <td>${escapeHtml(normalizeNote(discount.note) || '-')}</td>
        <td>${escapeHtml(discount.approvedBy || '-')}</td>
      </tr>
    `
  }).join('')
}

const buildPaymentRows = (payments = []) => {
  if (!Array.isArray(payments) || payments.length === 0) {
    return '<tr><td colspan="5" class="muted">To\'lov tafsilotlari mavjud emas</td></tr>'
  }

  return payments.map((entry, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(entry.method || '-')}</td>
      <td>${escapeHtml(entry.kind || '-')}</td>
      <td class="num">${formatCurrency(entry.amount)}</td>
      <td>${escapeHtml(entry.note || '-')}</td>
    </tr>
  `).join('')
}

const controlsScript = `
  <script>
    function printDocument(){ window.print(); }
    function savePdf(){
      alert('Brauzer oynasida "Save as PDF" ni tanlang.');
      window.print();
    }
  </script>
`

export const buildPatientCompletionPrintHtml = (inputData = {}, options = {}) => {
  const {
    clinicName = 'SHIFOCRM',
    clinicLogo = '',
    branchName = '',
    clinicPhone = '',
    clinicAddress = '',
    clinicLicense = '',
    patientName = '-',
    patientMedId = '',
    doctorName = '-',
    responsibleName = '-',
    visitDate = '',
    services = [],
    discounts = [],
    paymentDetails = [],
    totalBeforeDiscount = 0,
    totalDiscount = 0,
    totalAfterDiscount = 0,
    paid = 0,
    remaining = 0,
    extraCharges = 0,
    reportNumber = documentNumber(),
    verificationCode = '',
    template = 'full',
    printedAt = new Date().toISOString()
  } = inputData

  const withControls = options.withControls !== false
  const serviceTotal = services.reduce((sum, entry) => sum + asNumber(entry.totalPrice ?? entry.price), 0)
  const computedExtra = asNumber(extraCharges || (asNumber(totalBeforeDiscount) - serviceTotal))
  const safeTotalBefore = Math.max(asNumber(totalBeforeDiscount), serviceTotal)
  const safeDiscount = Math.max(0, asNumber(totalDiscount))
  const safeAfter = Math.max(0, asNumber(totalAfterDiscount || (safeTotalBefore - safeDiscount)))
  const safePaid = Math.max(0, asNumber(paid))
  const safeRemaining = Math.max(0, asNumber(remaining))
  const statusLabel = getPaymentStatusLabel({ totalAfterDiscount: safeAfter, paid: safePaid, remaining: safeRemaining })

  const title = `Yakuniy hisobot - ${patientName}`
  const shortTemplate = template === 'short'
  const internalTemplate = template === 'internal'

  return `<!doctype html>
<html lang="uz">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 8mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; font-size: 10px; line-height: 1.3; }
    .controls { position: sticky; top: 0; z-index: 10; display: flex; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
    .controls button { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer; font-weight: 600; }
    .controls button:hover { background: #f1f5f9; }
    .sheet { max-width: 210mm; margin: 0 auto; padding: 4mm; }

    .header { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: flex-start; }
    .brand { display: flex; gap: 8px; align-items: flex-start; flex: 1; }
    .logo { width: 40px; height: 40px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 4px; padding: 2px; }
    .brand-text { flex: 1; }
    .title { font-size: 14px; font-weight: 800; margin-bottom: 3px; color: #0f172a; }
    .clinic-info { font-size: 9px; color: #475569; line-height: 1.4; }
    .clinic-info div { margin: 1px 0; }

    .meta { text-align: right; font-size: 9px; color: #475569; min-width: 180px; }
    .meta-line { margin: 2px 0; white-space: nowrap; }
    .meta-line b { color: #0f172a; font-weight: 600; }
    .badge { display: inline-block; border: 1px solid #10b981; background: #d1fae5; color: #065f46; border-radius: 4px; padding: 2px 6px; font-size: 9px; font-weight: 600; margin-left: 4px; }

    .section { border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 6px; overflow: hidden; }
    .section-title { background: linear-gradient(to right, #f8fafc, #f1f5f9); border-bottom: 1px solid #cbd5e1; padding: 5px 8px; font-size: 11px; font-weight: 700; color: #0f172a; }

    .patient-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 4px 12px; padding: 6px 8px; background: #fafafa; }
    .patient-item { font-size: 9px; }
    .patient-item b { color: #334155; font-weight: 600; margin-right: 4px; }

    table { width: 100%; border-collapse: collapse; }
    thead th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 5px; font-size: 9px; font-weight: 700; text-align: left; color: #0f172a; white-space: nowrap; }
    tbody td { border: 1px solid #e2e8f0; padding: 3px 5px; font-size: 9px; vertical-align: top; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
    tbody tr:nth-child(even) { background: #fafafa; }
    tbody tr:hover { background: #f1f5f9; }
    .muted { color: #94a3b8; font-style: italic; }

    .discount-section { background: #fef3c7; }
    .discount-section .section-title { background: linear-gradient(to right, #fef3c7, #fde68a); border-bottom-color: #fbbf24; }

    .totals-section { background: #f0fdf4; }
    .totals-wrap { display: flex; gap: 8px; padding: 6px 8px; }
    .totals-note { flex: 1; font-size: 8px; color: #64748b; padding: 4px; }
    .totals-calc { min-width: 280px; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; background: #fff; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
    .totals-row:last-child { border-bottom: 0; font-weight: 800; font-size: 11px; background: #f0fdf4; color: #065f46; }
    .totals-row .label { color: #475569; }
    .totals-row .value { font-weight: 600; font-variant-numeric: tabular-nums; }

    .signatures { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 8px; margin-bottom: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .sign-block { font-size: 9px; color: #475569; }
    .sign-line { margin-top: 30px; border-top: 1px solid #94a3b8; padding-top: 4px; text-align: center; font-size: 8px; color: #64748b; }

    .footer { display: flex; justify-content: space-between; padding: 4px 0; font-size: 8px; color: #94a3b8; border-top: 1px solid #f1f5f9; }

    .hide-print { display: block; }
    @media print {
      .hide-print { display: none !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sheet { padding: 0; max-width: 100%; }
      .section, .header, .signatures { page-break-inside: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
    }
  </style>
  ${withControls ? controlsScript : ''}
</head>
<body>
  ${withControls ? `
    <div class="controls hide-print">
      <button onclick="printDocument()">Pechatlash</button>
      <button onclick="savePdf()">PDF yuklab olish</button>
    </div>
  ` : ''}
  <div class="sheet">
    <div class="header">
      <div class="brand">
        ${clinicLogo ? `<img src="${escapeHtml(clinicLogo)}" alt="logo" class="logo" />` : ''}
        <div class="brand-text">
          <div class="title">${shortTemplate ? 'Qisqa chek' : 'Yakuniy davolash hisoboti'}</div>
          <div class="clinic-info">
            <div><b>Klinika:</b> ${escapeHtml(clinicName)}</div>
            ${branchName ? `<div><b>Filial:</b> ${escapeHtml(branchName)}</div>` : ''}
            ${clinicPhone ? `<div><b>Tel:</b> ${escapeHtml(clinicPhone)}</div>` : ''}
            ${clinicAddress ? `<div><b>Manzil:</b> ${escapeHtml(clinicAddress)}</div>` : ''}
            ${clinicLicense ? `<div><b>Litsenziya/STIR:</b> ${escapeHtml(clinicLicense)}</div>` : ''}
          </div>
        </div>
      </div>
      <div class="meta">
        <div class="meta-line"><b>Hujjat #:</b> ${escapeHtml(reportNumber)}</div>
        <div class="meta-line"><b>Chop etildi:</b> ${escapeHtml(formatDateTime(printedAt))}</div>
        <div class="meta-line"><b>Status:</b><span class="badge">${escapeHtml(statusLabel)}</span></div>
        ${verificationCode ? `<div class="meta-line"><b>Verifikatsiya:</b> ${escapeHtml(verificationCode)}</div>` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Bemor va tashrif ma'lumotlari</div>
      <div class="patient-grid">
        <div class="patient-item"><b>Bemor:</b> ${escapeHtml(patientName || '-')}</div>
        ${patientMedId ? `<div class="patient-item"><b>Med ID:</b> ${escapeHtml(patientMedId)}</div>` : '<div></div>'}
        <div class="patient-item"><b>Shifokor:</b> ${escapeHtml(doctorName || '-')}</div>
        <div class="patient-item"><b>Yakun sanasi:</b> ${escapeHtml(formatDateTime(visitDate) || '-')}</div>
      </div>
    </div>

    ${shortTemplate ? '' : `
    <div class="section">
      <div class="section-title">Bajarilgan xizmatlar</div>
      <table>
        <thead>
          <tr>
            <th style="width:28px">#</th>
            <th style="width:60px">Kod</th>
            <th style="width:55px">Visit</th>
            <th>Xizmat</th>
            <th style="width:45px">Tish</th>
            <th style="width:38px">Soni</th>
            <th style="width:85px">Birlik narx</th>
            <th style="width:90px">Jami</th>
            <th style="width:95px">Sana</th>
            <th style="width:95px">Bajaruvchi</th>
          </tr>
        </thead>
        <tbody>${buildServicesRows(services)}</tbody>
      </table>
    </div>

    <div class="section discount-section">
      <div class="section-title">Chegirmalar</div>
      <table>
        <thead>
          <tr>
            <th style="width:28px">#</th>
            <th style="width:55px">Visit</th>
            <th style="width:75px">Turi</th>
            <th style="width:55px">Foiz</th>
            <th style="width:95px">Miqdor</th>
            <th>Sabab/Izoh</th>
            <th style="width:110px">Tasdiqlagan</th>
          </tr>
        </thead>
        <tbody>${buildDiscountRows(discounts)}</tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">To'lov tafsilotlari</div>
      <table>
        <thead>
          <tr>
            <th style="width:28px">#</th>
            <th style="width:80px">Usul</th>
            <th style="width:105px">Turi</th>
            <th style="width:95px">Miqdor</th>
            <th>Izoh</th>
          </tr>
        </thead>
        <tbody>${buildPaymentRows(paymentDetails)}</tbody>
      </table>
    </div>
    `}

    <div class="section totals-section">
      <div class="section-title">Yakuniy hisob-kitob</div>
      <div class="totals-wrap">
        <div class="totals-note">
          ${computedExtra > 0 ? `<b>Izoh:</b> Xizmatlar ro'yxatidan tashqari qo'shimcha sarf/xizmat = ${formatCurrency(computedExtra)}` : '<b>Izoh:</b> Qo\'shimcha sarf aniqlanmadi'}
          ${internalTemplate ? '<br /><b>Ichki nusxa:</b> Audit uchun' : ''}
        </div>
        <div class="totals-calc">
          <div class="totals-row">
            <span class="label">Jami (chegirmagacha):</span>
            <span class="value">${formatCurrency(safeTotalBefore)}</span>
          </div>
          <div class="totals-row">
            <span class="label">Chegirma jami:</span>
            <span class="value">${safeDiscount > 0 ? `-${formatCurrency(safeDiscount)}` : '0 so\'m'}</span>
          </div>
          <div class="totals-row">
            <span class="label">Chegirmadan keyin:</span>
            <span class="value">${formatCurrency(safeAfter)}</span>
          </div>
          <div class="totals-row">
            <span class="label">To'langan:</span>
            <span class="value">${formatCurrency(safePaid)}</span>
          </div>
          <div class="totals-row">
            <span class="label">Qolgan qarz:</span>
            <span class="value">${formatCurrency(safeRemaining)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="signatures">
      <div class="sign-block">
        <div><b>Mas'ul xodim:</b> ${escapeHtml(responsibleName || '-')}</div>
        <div class="sign-line">Mas'ul xodim imzosi</div>
      </div>
      <div class="sign-block">
        <div><b>Shifokor:</b> ${escapeHtml(doctorName || '-')}</div>
        <div class="sign-line">Shifokor/Bemor imzosi</div>
      </div>
    </div>

    <div class="footer">
      <span>${escapeHtml(clinicName)} • ShifoCRM</span>
      <span>Hujjat: ${escapeHtml(reportNumber)}</span>
    </div>
  </div>
</body>
</html>`
}

const openPopupWithHtml = (html) => {
  const popup = window.open('', '_blank', 'width=1024,height=900')
  if (!popup) return { ok: false, error: 'POPUP_BLOCKED' }
  popup.document.open()
  popup.document.write(html)
  popup.document.close()
  return { ok: true, popup }
}

export const openPatientCompletionPreview = (printData = {}) => {
  const html = buildPatientCompletionPrintHtml(printData, { withControls: true })
  return openPopupWithHtml(html)
}

export const openPatientCompletionPrint = (printData = {}) => {
  const html = buildPatientCompletionPrintHtml(printData, { withControls: true })
  const result = openPopupWithHtml(html)
  if (!result.ok) return result
  const printNow = () => {
    result.popup.focus()
    result.popup.print()
  }
  if (result.popup.document.readyState === 'complete') printNow()
  else result.popup.onload = printNow
  return { ok: true }
}
