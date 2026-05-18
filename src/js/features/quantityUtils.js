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

let activeUnitSelectCloseDropdown = null;

function positionUnitSelectDropdown(dropdown, trigger) {
  const triggerRect = trigger.getBoundingClientRect();
  const dropdownRect = dropdown.getBoundingClientRect();
  const dropdownWidth = dropdownRect.width || 82;
  const dropdownHeight = dropdownRect.height || 0;
  const gap = 6;
  const margin = 8;

  const left = Math.min(
    Math.max(margin, triggerRect.right - dropdownWidth),
    Math.max(margin, window.innerWidth - dropdownWidth - margin)
  );
  const top = Math.min(triggerRect.bottom + gap, Math.max(margin, window.innerHeight - dropdownHeight - margin));

  dropdown.style.position = 'fixed';
  dropdown.style.left = `${Math.round(left)}px`;
  dropdown.style.top = `${Math.round(top)}px`;
  dropdown.style.right = 'auto';
  dropdown.style.bottom = 'auto';
  dropdown.style.zIndex = '5000';
}

function clearUnitSelectDropdownPosition(dropdown) {
  dropdown.style.position = '';
  dropdown.style.left = '';
  dropdown.style.top = '';
  dropdown.style.right = '';
  dropdown.style.bottom = '';
  dropdown.style.zIndex = '';
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

  initializeCustomUnitSelect(itemElement, unit);

  // Atualiza tooltip se necessário
  updateQuantityTooltip(quantityInput);

  // Event listeners para validação
  bindQuantityInputEvents(quantityInput);
}

/**
 * Inicializa o custom select de unidade sem alterar o visual fechado do campo
 * @param {HTMLElement} itemElement - Elemento do item
 * @param {string} unitValue - Valor de unidade inicial
 * @returns {void}
 */
function initializeCustomUnitSelect(itemElement, unitValue = 'un.') {
  if (!itemElement) return;

  const unitSelect = itemElement.querySelector('.unit-select');
  const wrapper = itemElement.querySelector('.quantity-unit-wrapper');

  if (!unitSelect || !wrapper) {
    return;
  }

  // Evita inicializações duplicadas ao restaurar/renderizar novamente linhas
  if (wrapper.querySelector('.unit-select-trigger')) {
    syncCustomUnitSelectState(itemElement, unitValue || unitSelect.value || 'un.');
    return;
  }

  unitSelect.value = unitValue || unitSelect.value || 'un.';
  unitSelect.classList.add('unit-select-native');
  unitSelect.setAttribute('aria-hidden', 'true');
  unitSelect.tabIndex = -1;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'unit-select-trigger';
  trigger.setAttribute('aria-label', 'Unidade de medida');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const dropdown = document.createElement('div');
  dropdown.className = 'unit-select-dropdown hidden';

  const optionsList = document.createElement('ul');
  optionsList.className = 'unit-select-options';
  optionsList.setAttribute('role', 'listbox');

  [...unitSelect.options].forEach(optionElement => {
    const optionItem = document.createElement('li');
    const optionButton = document.createElement('button');

    optionButton.type = 'button';
    optionButton.className = 'unit-select-option';
    optionButton.dataset.value = optionElement.value;
    optionButton.textContent = optionElement.textContent || optionElement.value;
    optionButton.setAttribute('role', 'option');

    if (optionElement.value === unitSelect.value) {
      optionButton.classList.add('is-selected');
      optionButton.setAttribute('aria-selected', 'true');
    } else {
      optionButton.setAttribute('aria-selected', 'false');
    }

    optionItem.append(optionButton);
    optionsList.append(optionItem);
  });

  dropdown.append(optionsList);
  wrapper.append(trigger, dropdown);

  const closeDropdown = () => {
    dropdown.classList.add('hidden');
    trigger.setAttribute('aria-expanded', 'false');
    wrapper.classList.remove('is-dropdown-open');
    clearUnitSelectDropdownPosition(dropdown);

    if (activeUnitSelectCloseDropdown === closeDropdown) {
      activeUnitSelectCloseDropdown = null;
    }
  };

  const openDropdown = () => {
    if (activeUnitSelectCloseDropdown && activeUnitSelectCloseDropdown !== closeDropdown) {
      activeUnitSelectCloseDropdown();
    }

    dropdown.classList.remove('hidden');
    trigger.setAttribute('aria-expanded', 'true');
    wrapper.classList.add('is-dropdown-open');
    activeUnitSelectCloseDropdown = closeDropdown;

    window.requestAnimationFrame(() => {
      if (!dropdown.classList.contains('hidden')) {
        positionUnitSelectDropdown(dropdown, trigger);
      }
    });
  };

  const toggleDropdown = () => {
    if (dropdown.classList.contains('hidden')) {
      openDropdown();
      return;
    }

    closeDropdown();
  };

  trigger.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    toggleDropdown();
  });

  optionsList.addEventListener('click', event => {
    const optionButton = event.target.closest('.unit-select-option');

    if (!optionButton) {
      return;
    }

    const value = optionButton.dataset.value || 'un.';

    syncCustomUnitSelectState(itemElement, value);
    saveQuantityData(itemElement);

    // Dispara evento 'change' no select nativo para ativar listeners de persistência
    const unitSelect = itemElement.querySelector('.unit-select');
    if (unitSelect) {
      unitSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }

    closeDropdown();
  });

  trigger.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleDropdown();
      return;
    }

    if (event.key === 'Escape') {
      closeDropdown();
    }
  });

  document.addEventListener('click', event => {
    if (!wrapper.contains(event.target)) {
      closeDropdown();
    }
  });

  syncCustomUnitSelectState(itemElement, unitSelect.value || 'un.');
}

/**
 * Sincroniza valor visual e estado interno do custom select
 * @param {HTMLElement} itemElement - Elemento do item
 * @param {string} value - Valor de unidade
 * @returns {void}
 */
function syncCustomUnitSelectState(itemElement, value) {
  if (!itemElement) return;

  const unitSelect = itemElement.querySelector('.unit-select');
  const trigger = itemElement.querySelector('.unit-select-trigger');
  const optionButtons = [...itemElement.querySelectorAll('.unit-select-option')];

  if (!unitSelect || !trigger) {
    return;
  }

  const hasMatchingOption = [...unitSelect.options].some(optionElement => optionElement.value === value);
  const nextValue = hasMatchingOption ? value : 'un.';

  unitSelect.value = nextValue;
  trigger.textContent = nextValue;
  trigger.title = nextValue;

  optionButtons.forEach(optionButton => {
    const isSelected = optionButton.dataset.value === nextValue;
    optionButton.classList.toggle('is-selected', isSelected);
    optionButton.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  });
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

  syncCustomUnitSelectState(itemElement, data.unit || 'un.');

  // Armazena em dataset
  itemElement.dataset.quantity = data.quantity || '';
  itemElement.dataset.unit = data.unit || 'un.';
}
