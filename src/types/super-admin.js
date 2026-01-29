/**
 * JSDoc interfaces for Super Admin & multi-tenant (clinics) features.
 * @module types/super-admin
 */

/**
 * @typedef {Object} Clinic
 * @property {number} id
 * @property {string} name
 * @property {string} slug
 * @property {string|null} [logo_url]
 * @property {number} [max_doctors=4]
 * @property {boolean} [is_active=true]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

/**
 * @typedef {Object} Profile
 * @property {number} id
 * @property {string} email
 * @property {'admin'|'doctor'|'super_admin'} role
 * @property {number|null} [clinic_id]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

/**
 * @typedef {Object} ClinicCreateInput
 * @property {string} name
 * @property {string} slug
 * @property {string|null} [logo_url]
 * @property {number} [max_doctors=4]
 * @property {boolean} [is_active=true]
 */

/**
 * @typedef {Partial<ClinicCreateInput>} ClinicUpdateInput
 */
