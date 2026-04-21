/**
 * Limita um valor numérico entre mínimo e máximo.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Gera um ID simples e previsível para elementos de UI.
 * @param {string} [prefix="id"]
 * @returns {string}
 */
export const generateId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Escapa caracteres HTML para prevenir injeção em renderização dinâmica.
 * @param {string} value
 * @returns {string}
 */
export const escapeHTML = value =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

/**
 * Formata uma data no padrão pt-BR.
 * @param {Date | string | number} dateInput
 * @returns {string}
 */
export const formatDate = dateInput => {
  const date = new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    return 'Data inválida';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

/**
 * Formata moeda no padrão BRL.
 * @param {number} value
 * @returns {string}
 */
export const formatCurrencyBRL = value =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
