/*
  AUTOR: Victor Martins
  DESCRIÇÃO: Utilitários para gerenciamento de quantidade e unidade de medida dos itens
*/

/**
 * Valida e limpa entrada de quantidade
 * @param {string} value - Valor a ser validado
 * @returns {string} - Valor limpo (apenas números e ponto decimal)
 */
export function sanitizeQuantityInput(value) {
  if (!value) return '';

  // Remove tudo que não é número, ponto ou vírgula (remove sinais de menos também)
  let cleaned = value.replace(/[^0-9.,]/g, '');

  // Substitui vírgula por ponto
  cleaned = cleaned.replace(',', '.');

  // Remove múltiplos pontos, mantendo apenas o primeiro
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }

  return cleaned;
}

/**
 * Valida se o valor de quantidade é válido (> 0)
 * @param {string} value - Valor a ser validado
 * @param {string} previousValue - Valor anterior (fallback)
 * @returns {string} - Valor válido ou fallback
 */
export function validateQuantityValue(value, previousValue = '1') {
  const numValue = parseFloat(value);

  if (isNaN(numValue) || numValue <= 0) {
    return previousValue || '1';
  }

  return value;
}

/**
 * Inicializa os campos de quantidade e unidade em um item
 * @param {HTMLElement} itemElement - Elemento do item
 * @param {Object} data - Dados do item (quantity, unit)
 * @returns {void}
 */
export function initializeQuantityFields(itemElement, data = {}) {
  const quantityInput = itemElement.querySelector('.quantity-input');
  const unitSelect = itemElement.querySelector('.unit-select');

  if (!quantityInput || !unitSelect) {
    return;
  }

  // Define valores iniciais
  const quantity = data.quantity || '';
  const unit = data.unit || 'un.';

  quantityInput.value = quantity;
  unitSelect.value = unit;

  // Atualiza tooltip se necessário
  updateQuantityTooltip(quantityInput);

  // Event listeners para validação
  bindQuantityInputEvents(quantityInput);
}

/**
 * Atualiza tooltip de quantidade se o valor for muito longo
 * @param {HTMLInputElement} quantityInput - Input de quantidade
 * @returns {void}
 */
export function updateQuantityTooltip(quantityInput) {
  if (!quantityInput) return;

  const value = quantityInput.value;

  // Set title for full value tooltip only
  if (value && value.length > 0) {
    quantityInput.title = value;
  } else {
    quantityInput.title = 'Quantidade do item';
  }
}

/**
 * Vincula eventos de validação ao input de quantidade
 * @param {HTMLInputElement} quantityInput - Input de quantidade
 * @returns {void}
 */
export function bindQuantityInputEvents(quantityInput) {
  if (!quantityInput) return;

  // Store the initial value when the input is first bound
  let lastValidValue = quantityInput.value;

  quantityInput.addEventListener('input', event => {
    let value = event.target.value;

    // Sanitiza entrada
    value = sanitizeQuantityInput(value);

    // Limita a 10 caracteres
    if (value.length > 10) {
      value = value.substring(0, 10);
    }

    // Atualiza input
    event.target.value = value;

    // Atualiza tooltip
    updateQuantityTooltip(event.target);
  });

  quantityInput.addEventListener('blur', event => {
    // Valida que o valor é > 0, ou vazio (se estava vazio)
    const currentValue = event.target.value.trim();
    let validValue = currentValue;

    // Se o valor for vazio, mantém vazio
    // Se o valor for <= 0, volta ao valor anterior (ou mantém vazio se anterior era vazio)
    if (currentValue === '') {
      validValue = '';
    } else if (parseFloat(currentValue) <= 0) {
      validValue = lastValidValue;
    } else {
      validValue = currentValue;
      lastValidValue = currentValue; // Update the last valid value
    }

    event.target.value = validValue;

    // Atualiza tooltip
    updateQuantityTooltip(event.target);

    // Salva dados
    saveQuantityData(event.target.closest('.item-added'));
  });

  quantityInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      // Valida que o valor é > 0, ou vazio
      const currentValue = event.target.value.trim();
      let validValue = currentValue;

      // Se o valor for vazio, mantém vazio
      // Se o valor for <= 0, volta ao valor anterior (ou mantém vazio se anterior era vazio)
      if (currentValue === '') {
        validValue = '';
      } else if (parseFloat(currentValue) <= 0) {
        validValue = lastValidValue;
      } else {
        validValue = currentValue;
        lastValidValue = currentValue; // Update the last valid value
      }

      event.target.value = validValue;
      updateQuantityTooltip(event.target);
      saveQuantityData(event.target.closest('.item-added'));
      event.target.blur();
    }
  });
}

/**
 * Obtém dados de quantidade e unidade de um item
 * @param {HTMLElement} itemElement - Elemento do item
 * @returns {Object} - Objeto com quantity e unit
 */
export function getQuantityData(itemElement) {
  if (!itemElement) return { quantity: '', unit: 'un.' };

  const quantityInput = itemElement.querySelector('.quantity-input');
  const unitSelect = itemElement.querySelector('.unit-select');

  return {
    quantity: quantityInput?.value || '',
    unit: unitSelect?.value || 'un.',
  };
}

/**
 * Salva dados de quantidade em um item
 * @param {HTMLElement} itemElement - Elemento do item
 * @returns {void}
 */
export function saveQuantityData(itemElement) {
  if (!itemElement) return;

  const data = getQuantityData(itemElement);

  // Armazena em dataset para persistência
  itemElement.dataset.quantity = data.quantity;
  itemElement.dataset.unit = data.unit;
}

/**
 * Restaura dados de quantidade em um item
 * @param {HTMLElement} itemElement - Elemento do item
 * @param {Object} data - Dados do item
 * @returns {void}
 */
export function restoreQuantityData(itemElement, data = {}) {
  if (!itemElement) return;

  const quantityInput = itemElement.querySelector('.quantity-input');
  const unitSelect = itemElement.querySelector('.unit-select');

  if (quantityInput) {
    quantityInput.value = data.quantity || '';
  }

  if (unitSelect) {
    unitSelect.value = data.unit || 'un.';
  }

  // Armazena em dataset
  itemElement.dataset.quantity = data.quantity || '';
  itemElement.dataset.unit = data.unit || 'un.';
}
