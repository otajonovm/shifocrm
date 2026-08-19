import { describe, expect, it } from 'vitest'
import { TEXTUP_TEST_SMS_TEXT, getTextUpTestSmsText } from './treatmentPlanSms'

describe('treatmentPlanSms', () => {
  it('tasdiqlangan TextUp shablon matnini qaytaradi', () => {
    expect(getTextUpTestSmsText()).toBe(TEXTUP_TEST_SMS_TEXT)
    expect(TEXTUP_TEST_SMS_TEXT).toContain("t.me/shifocrm_bot")
    expect(TEXTUP_TEST_SMS_TEXT).toContain('25,000')
  })
})
