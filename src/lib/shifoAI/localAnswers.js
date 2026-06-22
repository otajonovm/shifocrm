/**
 * ShifoAI mahalliy (offline) javoblar — API mavjud bo'lmasa yoki xato bo'lsa.
 */

export function getAnswerKey(question) {
  const q = (question || '').toLowerCase().trim()
  if (!q) return 'empty'
  if (/salom|hello|yordam|nima qilish|qanday ishlatish|boshlash|привет|помощь|помоги|как пользоваться|как начать/.test(q)) return 'welcome'
  if (/dashboard|bosh sahifa|asosiy|главн|дашборд/.test(q)) return 'dashboard'
  if (/lead|murojaat|onlayn|band qil|лид|онлайн|заявк/.test(q)) return 'lead'
  if (/xodim|hodim|staff|wizard|ruxsat|permission|сотрудник|прав|мастер/.test(q)) return 'xodim'
  if (/kassa|smena|smena|касс|смен/.test(q)) return 'kassa'
  if (/audit|jurnal|faoliyat|аудит|журнал/.test(q)) return 'audit'
  if (/bemor|patient|пациент|добавить пациента|как добавить|как создать пациента|qo'shish|qanday qo'shiladi|yangi bemor/.test(q)) return 'bemor'
  if (/tashrif|visit|визит|приём|прием|yakunlash|complete|davolanish|davolash|завершить|лечение/.test(q)) return 'tashrif'
  if (/material|sarf|ombor|kirim|chiqim|inventory|harajat|материал|склад|расход|приход|уход/.test(q)) return 'material'
  if (/qarz|debt|qarzdor|qoldiq|долг|задолженность|кредит/.test(q)) return 'qarz'
  if (/hisobot|report|statistika|daromad|filtr|отчет|отчёт|статистика|доход|фильтр/.test(q)) return 'hisobot'
  if (/to'lov|payment|tolov|naqd|karta|o'tkazma|платеж|оплата|наличн|карта|перевод/.test(q)) return 'tolov'
  if (/uchrashuv|qabul|appointment|jadval|taqvim|встреча|приём|прием|запись|расписание|календар/.test(q)) return 'uchrashuv'
  if (/odontogramma|tish|plomba|karies|tish holati|одонтограмм|зуб|пломба|кариес/.test(q)) return 'odontogramma'
  if (/sozlamalar|settings|logo|til|klinika nomi|настройки|настройка|логотип|язык|клиник/.test(q)) return 'sozlamalar'
  if (/doktor|shifokor|doctor|yangi doktor|врач|доктор|добавить врача|как добавить врача/.test(q)) return 'doktor'
  if (/telegram|bot|xabar|register|телеграм|бот|сообщен|регистрац|sms|eslatma/.test(q)) return 'telegram'
  if (/xizmat|service|narx|narxlari|услуг|цена|прайс/.test(q)) return 'xizmat'
  if (/xavfsiz|rls|maxfi|безопас|конфиден/.test(q)) return 'security'
  return 'default'
}

export function resolveLocalAnswer(question, translate) {
  const key = getAnswerKey(question)
  return translate(`shifoAI.answers.${key}`)
}
