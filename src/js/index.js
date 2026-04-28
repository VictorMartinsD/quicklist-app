/*
  AUTOR: Victor Martins
  DESCRIÇÃO: Script principal para funcionalidades do site.
*/

import { APP_CONSTANTS } from './app/constants.js';
import { DOM_SELECTORS } from './dom/selectors.js';
import { createAppState } from './state/appState.js';
import { getStorageItem, removeStorageItem, setStorageItem } from './storage/localStorage.js';
import { generateId } from './utils.js';
import { bindListActionEvents, bindListItemEvents } from './features/listEvents.js';
import { bindClearModalEvents, bindValidationModalEvents } from './features/modalEvents.js';
import { bindImportExportModalEvents } from './features/importExportEvents.js';
import { bindManageListsEvents, bindSwitchListEvents } from './features/manageListsEvents.js';
import { bindGlobalUiEvents } from './features/globalEvents.js';

const {
  input,
  themeToggleButton,
  focusModeToggleButton,
  btnAddItem,
  btnNewCategory,
  btnSelectAll,
  btnManageLists,
  bulkClearSlot,
  bulkActionsToggle,
  itemsContainer,
  itemTemplate,
  validationModal,
  validationCloseButton,
  clearAllButton,
  clearModal,
  clearModalDescription,
  clearModalCloseButton,
  clearModalCancelButton,
  clearModalCategoryOnlyButton,
  clearModalConfirmButton,
  manageListsModal,
  manageListsModalCloseButton,
  btnSaveCurrentList,
  btnImportList,
  btnExportList,
  manageListsBox,
  manageListsItemsContainer,
  manageListRowTemplate,
  switchListModal,
  importCodeModal,
  importCodeInput,
  importCodeCancelButton,
  importCodeClearButton,
  importCodeConfirmButton,
  importUnsavedModal,
  importUnsavedSaveButton,
  importUnsavedDiscardButton,
  importUnsavedCancelButton,
  importDuplicateModal,
  importDuplicateNameElement,
  importDuplicateActivateButton,
  importDuplicateCancelButton,
  importDuplicateActiveModal,
  importDuplicateActiveConfirmButton,
  exportSaveModal,
  exportSaveConfirmButton,
  exportSaveCancelButton,
  exportSuccessModal,
  exportSuccessCloseButton,
  importExportHelpModal,
  btnImportExportHelp,
  importExportHelpCloseButton,
  btnImportExportHelpClose,
  switchListSaveButton,
  switchListCancelButton,
  switchListConfirmButton,
  removalAlert,
} = DOM_SELECTORS;

const themeToggleIconUse = themeToggleButton?.querySelector('use');
const focusModeToggleIconUse = focusModeToggleButton?.querySelector('use');
const removalAlertMessage = removalAlert.querySelector('.alert-message');
const removalAlertCloseButton = removalAlert.querySelector('.icon-button');
const {
  ITEMS_STORAGE_KEY,
  SAVED_LISTS_STORAGE_KEY,
  THEME_STORAGE_KEY,
  MOBILE_BULK_ACTIONS_MEDIA_QUERY,
  LEGACY_CHECKED_KEYS,
  ITEM_NAME_MAX_LENGTH,
  SAVED_LIST_NAME_MAX_LENGTH,
  IMPORT_CODE_MAX_LENGTH,
  SAVED_LIST_DRAG_SCROLL_EDGE_PX,
  SAVED_LIST_DRAG_SCROLL_STEP_PX,
} = APP_CONSTANTS;

const appState = createAppState();

input.maxLength = ITEM_NAME_MAX_LENGTH;

if (importCodeInput) {
  importCodeInput.maxLength = IMPORT_CODE_MAX_LENGTH;
}

function normalizeTheme(theme) {
  return theme === 'light' ? 'light' : 'dark';
}

function applyTheme(theme) {
  const normalizedTheme = normalizeTheme(theme);
  document.documentElement.setAttribute('data-theme', normalizedTheme);

  if (!themeToggleButton || !themeToggleIconUse) {
    return;
  }

  const isLightTheme = normalizedTheme === 'light';

  themeToggleIconUse.setAttribute(
    'href',
    isLightTheme ? 'assets/img/icons.svg#bulb-on' : 'assets/img/icons.svg#bulb-off'
  );
  themeToggleButton.setAttribute('aria-label', isLightTheme ? 'Ativar modo escuro' : 'Ativar modo claro');
  themeToggleButton.setAttribute('title', isLightTheme ? 'Ativar modo escuro' : 'Ativar modo claro');
}

function loadSavedTheme() {
  try {
    const savedTheme = getStorageItem(THEME_STORAGE_KEY);
    return normalizeTheme(savedTheme);
  } catch {
    return 'dark';
  }
}

function saveTheme(theme) {
  try {
    setStorageItem(THEME_STORAGE_KEY, normalizeTheme(theme));
  } catch {
    return;
  }
}

function toggleTheme() {
  const currentTheme = normalizeTheme(document.documentElement.getAttribute('data-theme'));
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

  applyTheme(nextTheme);
  saveTheme(nextTheme);
}

/**
 * Atualiza o botão de toggle do modo de foco
 * @param {boolean} isFocusModeEnabled - Estado do modo de foco
 * @returns {void}
 * @description Atualiza texto, ícone e estado ARIA do botão de modo de foco
 */
function updateFocusModeToggleButton(isFocusModeEnabled) {
  if (!focusModeToggleButton || !focusModeToggleIconUse) {
    return;
  }

  const labelText = isFocusModeEnabled ? 'Recolher lista' : 'Expandir lista';
  const iconId = isFocusModeEnabled ? 'minimize' : 'expand';

  focusModeToggleButton.setAttribute('aria-label', labelText);
  focusModeToggleButton.setAttribute('title', labelText);
  focusModeToggleButton.setAttribute('aria-pressed', String(isFocusModeEnabled));
  focusModeToggleIconUse.setAttribute('href', `assets/img/icons.svg#${iconId}`);
}

/**
 * Aplica o modo de foco à interface
 * @param {boolean} isFocusModeEnabled - Estado do modo de foco a ser aplicado
 * @returns {void}
 * @description Ativa/desativa o modo de foco e atualiza elementos da UI
 */
function applyFocusMode(isFocusModeEnabled) {
  appState.isFocusMode = Boolean(isFocusModeEnabled);
  document.body.classList.toggle('focus-mode', appState.isFocusMode);
  updateFocusModeToggleButton(appState.isFocusMode);

  if (appState.isFocusMode) {
    closeRemovalAlert();
  }
}

/**
 * Alterna o estado do modo de foco
 * @returns {void}
 * @description Inverte o estado atual do modo de foco
 */
function toggleFocusMode() {
  applyFocusMode(!appState.isFocusMode);
}

applyTheme(loadSavedTheme());

/**
 * Verifica se a viewport está em modo mobile
 * @returns {boolean} True se estiver em viewport mobile
 * @description Verifica se a viewport corresponde à media query de dispositivos móveis
 */
function isMobileViewport() {
  return window.matchMedia(MOBILE_BULK_ACTIONS_MEDIA_QUERY).matches;
}

/**
 * Atualiza o estado do toggle de ações em massa
 * @param {boolean} isExpanded - Estado de expansão do toggle
 * @returns {void}
 * @description Atualiza classes CSS e atributos ARIA do toggle de ações em massa
 */
function updateBulkActionsToggleState(isExpanded) {
  if (!bulkClearSlot || !bulkActionsToggle) {
    return;
  }

  const iconUseElement = bulkActionsToggle.querySelector('use');
  const isMobile = isMobileViewport();

  if (isMobile) {
    bulkClearSlot.classList.toggle('is-collapsed', !isExpanded);
    bulkClearSlot.classList.remove('is-extra-open');
  } else {
    bulkClearSlot.classList.remove('is-collapsed');
    bulkClearSlot.classList.toggle('is-extra-open', isExpanded);
  }

  bulkActionsToggle.setAttribute('aria-expanded', String(isExpanded));
  bulkActionsToggle.setAttribute('aria-label', isExpanded ? 'Ocultar acoes adicionais' : 'Mostrar acoes adicionais');

  if (iconUseElement) {
    iconUseElement.setAttribute(
      'href',
      isExpanded ? 'assets/img/icons.svg#chevron-up' : 'assets/img/icons.svg#chevron-down'
    );
  }
}

/**
 * Sincroniza ações em massa com a viewport atual
 * @returns {void}
 * @description Ajusta o estado das ações em massa baseado no tamanho da viewport
 */
function syncBulkActionsByViewport() {
  if (!bulkClearSlot || !bulkActionsToggle) {
    return;
  }

  updateBulkActionsToggleState(false);
}

function closeValidationModal() {
  validationModal.classList.add('hidden');
  syncModalOpenState();
  window.clearTimeout(appState.validationTimeoutId);
  appState.validationTimeoutId = null;
  input.focus();
}

function openValidationModal(message) {
  const modalMessage = validationModal.querySelector('#validation-modal-description');

  modalMessage.innerHTML = message;
  validationModal.classList.remove('hidden');
  syncModalOpenState();
  validationCloseButton.focus();

  window.clearTimeout(appState.validationTimeoutId);
  appState.validationTimeoutId = window.setTimeout(closeValidationModal, 3200);
}

function getVisibleItems() {
  return [...itemsContainer.querySelectorAll('.item-added:not(.hidden)')];
}

function getVisibleRows() {
  return getVisibleItems();
}

function getVisibleCheckboxes() {
  return getVisibleRows()
    .map(rowElement => rowElement.querySelector('input[type="checkbox"]'))
    .filter(Boolean);
}

function updateSelectAllButtonState() {
  if (!btnSelectAll) {
    return;
  }

  const visibleCheckboxes = getVisibleCheckboxes();
  const hasCheckboxes = visibleCheckboxes.length > 0;
  const areAllSelected = hasCheckboxes && visibleCheckboxes.every(checkboxElement => checkboxElement.checked);

  btnSelectAll.classList.toggle('is-all-selected', areAllSelected);
  btnSelectAll.disabled = false;
  btnSelectAll.setAttribute(
    'aria-label',
    areAllSelected ? 'Desmarcar todos os itens e categorias.' : 'Selecionar todos os itens e categorias.'
  );
}

function handleToggleSelectAll() {
  const visibleCheckboxes = getVisibleCheckboxes();

  if (!visibleCheckboxes.length) {
    openValidationModal('Adicione um item ou categoria para poder selecionar.');
    return;
  }

  const areAllSelected = visibleCheckboxes.every(checkboxElement => checkboxElement.checked);
  const shouldSelectAll = !areAllSelected;

  visibleCheckboxes.forEach(checkboxElement => {
    checkboxElement.checked = shouldSelectAll;
  });

  saveItemsToStorage();
  updateSelectAllButtonState();
}

function isCategoryRow(rowElement) {
  return rowElement?.dataset?.rowType === 'category';
}

function getNextCategoryNumber() {
  const categoryRows = getVisibleRows().filter(rowElement => isCategoryRow(rowElement));

  const highestCategoryNumber = categoryRows.reduce((highest, rowElement) => {
    const categoryText = rowElement.querySelector('.shopping-item')?.textContent?.trim() || '';
    const matchedNumber = categoryText.match(/^Lista\s+(\d+)$/i);

    if (!matchedNumber) {
      return highest;
    }

    const numericValue = Number(matchedNumber[1]);
    return Number.isNaN(numericValue) ? highest : Math.max(highest, numericValue);
  }, 0);

  return highestCategoryNumber + 1;
}

function refreshCategoryStructure() {
  const visibleRows = getVisibleRows();
  let previousRow = null;
  let currentCategoryLevel = -1;

  visibleRows.forEach(rowElement => {
    rowElement.classList.remove(
      'is-grouped',
      'is-group-first',
      'is-group-last',
      'is-group-continuation',
      'is-subcategory-chain'
    );
    delete rowElement.dataset.groupId;
  });

  visibleRows.forEach(rowElement => {
    if (isCategoryRow(rowElement)) {
      const previousLevel = Number(previousRow?.dataset?.categoryLevel || 0);
      const categoryLevel = previousRow && isCategoryRow(previousRow) ? previousLevel + 1 : 0;

      rowElement.dataset.categoryLevel = String(categoryLevel);
      rowElement.style.setProperty('--category-level', String(categoryLevel));
      rowElement.classList.add('is-under-category');
      currentCategoryLevel = categoryLevel;
    } else {
      const inheritedLevel = currentCategoryLevel >= 0 ? currentCategoryLevel : 0;

      rowElement.style.setProperty('--category-level', String(inheritedLevel));
      rowElement.classList.toggle('is-under-category', currentCategoryLevel >= 0);
    }

    previousRow = rowElement;
  });

  let currentGroupId = -1;

  visibleRows.forEach((rowElement, index) => {
    const previousVisibleRow = visibleRows[index - 1] || null;

    if (isCategoryRow(rowElement)) {
      const categoryLevel = Number(rowElement.dataset.categoryLevel || 0);

      if (categoryLevel === 0) {
        currentGroupId += 1;
      }

      if (previousVisibleRow && isCategoryRow(previousVisibleRow)) {
        rowElement.classList.add('is-subcategory-chain');
      }
    }

    if (currentGroupId >= 0 && rowElement.classList.contains('is-under-category')) {
      rowElement.dataset.groupId = String(currentGroupId);
      rowElement.classList.add('is-grouped');
    }
  });

  const groupedRowsById = new Map();

  visibleRows.forEach(rowElement => {
    const groupId = rowElement.dataset.groupId;

    if (!groupId) {
      return;
    }

    const groupedRows = groupedRowsById.get(groupId) || [];
    groupedRows.push(rowElement);
    groupedRowsById.set(groupId, groupedRows);
  });

  groupedRowsById.forEach(groupedRows => {
    const firstRow = groupedRows[0];
    const lastRow = groupedRows[groupedRows.length - 1];

    firstRow.classList.add('is-group-first');
    lastRow.classList.add('is-group-last');

    groupedRows.slice(1).forEach(groupedRow => {
      groupedRow.classList.add('is-group-continuation');
    });
  });
}

function getCategoryScopeRows(categoryRowElement) {
  if (!categoryRowElement || !isCategoryRow(categoryRowElement)) {
    return { rows: [], hasSubcategories: false };
  }

  refreshCategoryStructure();

  const visibleRows = getVisibleRows();
  const startIndex = visibleRows.indexOf(categoryRowElement);

  if (startIndex === -1) {
    return { rows: [], hasSubcategories: false };
  }

  const baseLevel = Number(categoryRowElement.dataset.categoryLevel || 0);
  const scopedRows = [categoryRowElement];
  let hasSubcategories = false;

  for (let index = startIndex + 1; index < visibleRows.length; index += 1) {
    const rowElement = visibleRows[index];

    if (isCategoryRow(rowElement)) {
      const rowLevel = Number(rowElement.dataset.categoryLevel || 0);

      if (rowLevel <= baseLevel) {
        break;
      }

      hasSubcategories = true;
    }

    scopedRows.push(rowElement);
  }

  return { rows: scopedRows, hasSubcategories };
}

function updateClearAllButtonVisibility() {
  clearAllButton.classList.remove('is-hidden');
  updateSelectAllButtonState();
}

function closeClearModal() {
  clearModal.classList.add('hidden');
  syncModalOpenState();
  appState.clearModalMode = 'all';
  appState.categoryRowsToDelete = [];
  appState.categoryOnlyRowToDelete = null;
  clearModalCategoryOnlyButton.classList.add('hidden');
}

function openClearModal() {
  const totalItems = getVisibleItems().length;

  if (totalItems < 2) {
    openValidationModal('Adicione pelo menos 2 itens para apagar todos.');
    return;
  }

  clearModalDescription.textContent = `Tem certeza que deseja apagar ${totalItems} itens da lista?`;
  appState.clearModalMode = 'all';
  appState.categoryRowsToDelete = [];
  appState.categoryOnlyRowToDelete = null;
  clearModalCategoryOnlyButton.classList.add('hidden');
  clearModal.classList.remove('hidden');
  syncModalOpenState();
  clearModalCloseButton.focus();
}

function openCategoryClearModal(categoryRowElement) {
  const { rows, hasSubcategories } = getCategoryScopeRows(categoryRowElement);

  if (!rows.length) {
    return;
  }

  if (rows.length === 1 && !hasSubcategories) {
    appState.categoryRowsToDelete = [categoryRowElement];
    clearCategoryItems();
    return;
  }

  appState.categoryRowsToDelete = rows;
  appState.clearModalMode = 'category';

  const categoryLevel = Number(categoryRowElement.dataset.categoryLevel || 0);
  const allowCategoryOnly = hasSubcategories || categoryLevel > 0;

  appState.categoryOnlyRowToDelete = allowCategoryOnly ? categoryRowElement : null;

  if (appState.categoryOnlyRowToDelete) {
    clearModalCategoryOnlyButton.classList.remove('hidden');
  } else {
    clearModalCategoryOnlyButton.classList.add('hidden');
  }

  if (hasSubcategories) {
    clearModalDescription.textContent =
      'Tem certeza que deseja apagar os itens dessa categoria e suas sub-categorias correspondentes?';
  } else if (categoryLevel > 0) {
    clearModalDescription.textContent = 'Tem certeza que deseja apagar somente esta subcategoria?';
  } else {
    clearModalDescription.textContent = 'Tem certeza que deseja apagar os itens dessa categoria?';
  }

  clearModal.classList.remove('hidden');
  syncModalOpenState();
  clearModalCloseButton.focus();
}

function syncModalOpenState() {
  const hasOpenModal = [
    validationModal,
    clearModal,
    manageListsModal,
    switchListModal,
    importCodeModal,
    importUnsavedModal,
    importDuplicateModal,
    importDuplicateActiveModal,
    exportSaveModal,
    exportSuccessModal,
  ].some(modalElement => modalElement && !modalElement.classList.contains('hidden'));

  document.body.classList.toggle('modal-open', hasOpenModal);
}

function normalizeListRowsForComparison(rows) {
  return rows.map(row => ({
    rowType: row.rowType === 'category' ? 'category' : 'item',
    text: normalizeItemText(row.text || ''),
    checked: Boolean(row.checked),
  }));
}

function getRowsSignature(rows) {
  return JSON.stringify(normalizeListRowsForComparison(rows));
}

function getCurrentRowsSnapshot() {
  return getVisibleRows().map(rowElement => {
    const text = rowElement.querySelector('.shopping-item')?.textContent?.trim() || '';
    const checkboxElement = rowElement.querySelector('input[type="checkbox"]');

    return {
      rowType: rowElement.dataset.rowType === 'category' ? 'category' : 'item',
      text,
      checked: Boolean(checkboxElement?.checked),
    };
  });
}

function getNextSavedListName() {
  const highestUsedNumber = appState.savedLists.reduce((highest, savedList) => {
    const matchedNumber = (savedList.name || '').match(/^Lista salva\s+(\d+)$/i);

    if (!matchedNumber) {
      return highest;
    }

    const numericValue = Number(matchedNumber[1]);
    return Number.isNaN(numericValue) ? highest : Math.max(highest, numericValue);
  }, 0);

  return `Lista salva ${highestUsedNumber + 1}`;
}

function getNextImportedListName() {
  const highestImportedNumber = appState.savedLists.reduce((highest, savedList) => {
    const matchedNumber = (savedList.name || '').match(/^Lista importada\s+(\d+)$/i);

    if (!matchedNumber) {
      return highest;
    }

    const numericValue = Number(matchedNumber[1]);
    return Number.isNaN(numericValue) ? highest : Math.max(highest, numericValue);
  }, 0);

  return `Lista importada ${highestImportedNumber + 1}`;
}

function resolveImportedListName(preferredName = '') {
  const normalizedName = normalizeItemText(preferredName || '');
  const hasDuplicateName = appState.savedLists.some(
    savedList => (savedList.name || '').toLowerCase() === normalizedName.toLowerCase()
  );
  const isDefaultNamePattern =
    /^Lista\s+salva\s+\d+$/i.test(normalizedName) || /^Lista\s+importada\s+\d+$/i.test(normalizedName);

  if (!normalizedName || hasDuplicateName || isDefaultNamePattern) {
    return getNextImportedListName();
  }

  return normalizedName;
}

function buildShareCodePayload(rowsSnapshot, preferredName = '') {
  const normalizedRows = normalizeListRowsForComparison(rowsSnapshot).filter(row => row.text !== '');

  if (!normalizedRows.length) {
    return null;
  }

  return {
    name: preferredName ? normalizeItemText(preferredName) : '',
    items: normalizedRows,
  };
}

function getCurrentListNameForShare() {
  const matchedListId = getCurrentSavedListMatchId();
  const matchedSavedList = appState.savedLists.find(savedList => savedList.id === matchedListId);

  return matchedSavedList?.name || '';
}

function encodeSharePayload(payload) {
  return encodeURIComponent(JSON.stringify(payload));
}

function decodeSharePayload(encodedPayload) {
  const decodedText = decodeURIComponent(encodedPayload);
  return JSON.parse(decodedText);
}

function extractShareCode(rawInput) {
  const inputValue = (rawInput || '').trim();

  if (!inputValue) {
    return '';
  }

  if (inputValue.startsWith('{')) {
    return inputValue;
  }

  if (inputValue.startsWith('#') || inputValue.startsWith('?')) {
    const leadingToken = inputValue[0] === '#' ? inputValue.slice(1) : inputValue.slice(1);
    const parsedParams = new URLSearchParams(leadingToken);
    return parsedParams.get('share') || parsedParams.get('list') || inputValue;
  }

  if (/^https?:\/\//i.test(inputValue)) {
    try {
      const parsedUrl = new URL(inputValue);
      const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));
      const queryParams = new URLSearchParams(parsedUrl.search.replace(/^\?/, ''));
      return hashParams.get('share') || queryParams.get('list') || queryParams.get('share') || inputValue;
    } catch {
      return inputValue;
    }
  }

  return inputValue;
}

function parseImportedPayload(rawCode) {
  const candidateCode = extractShareCode(rawCode);

  if (!candidateCode) {
    return null;
  }

  let parsedPayload;

  if (candidateCode.startsWith('{')) {
    parsedPayload = JSON.parse(candidateCode);
  } else {
    parsedPayload = decodeSharePayload(candidateCode);
  }

  if (!parsedPayload || typeof parsedPayload !== 'object') {
    return null;
  }

  const normalizedItems = normalizeListRowsForComparison(parsedPayload.items || []).filter(row => row.text !== '');

  if (!normalizedItems.length) {
    return null;
  }

  return {
    name: typeof parsedPayload.name === 'string' ? parsedPayload.name : '',
    items: normalizedItems,
  };
}

function findSavedListBySignature(rows) {
  const targetSignature = getRowsSignature(rows);
  return appState.savedLists.find(savedList => getRowsSignature(savedList.items) === targetSignature) || null;
}

function closeImportCodeModal() {
  if (importCodeInput) {
    importCodeInput.value = '';
  }
  importCodeModal?.classList.add('hidden');
  syncModalOpenState();
}

function openImportCodeModal() {
  importCodeModal?.classList.remove('hidden');
  syncModalOpenState();
  importCodeInput?.focus();
}

function closeImportUnsavedModal() {
  importUnsavedModal?.classList.add('hidden');
  syncModalOpenState();
}

function openImportUnsavedModal() {
  importUnsavedModal?.classList.remove('hidden');
  syncModalOpenState();
  importUnsavedSaveButton?.focus();
}

function closeImportDuplicateModal() {
  importDuplicateModal?.classList.add('hidden');
  appState.pendingDuplicateSavedListId = null;
  syncModalOpenState();
}

function openImportDuplicateModal(savedList) {
  if (!savedList) {
    return;
  }

  appState.pendingDuplicateSavedListId = savedList.id;

  if (importDuplicateNameElement) {
    importDuplicateNameElement.textContent = savedList.name;
  }

  importDuplicateModal?.classList.remove('hidden');
  syncModalOpenState();
  importDuplicateActivateButton?.focus();
}

function closeImportDuplicateActiveModal() {
  importDuplicateActiveModal?.classList.add('hidden');
  syncModalOpenState();
}

function openImportDuplicateActiveModal() {
  importDuplicateActiveModal?.classList.remove('hidden');
  syncModalOpenState();
  importDuplicateActiveConfirmButton?.focus();
}

function closeExportSaveModal() {
  exportSaveModal?.classList.add('hidden');
  syncModalOpenState();
}

function openExportSaveModal() {
  exportSaveModal?.classList.remove('hidden');
  syncModalOpenState();
  exportSaveConfirmButton?.focus();
}

function closeExportSuccessModal() {
  exportSuccessModal?.classList.add('hidden');
  syncModalOpenState();
}

function openExportSuccessModal() {
  exportSuccessModal?.classList.remove('hidden');
  syncModalOpenState();
  exportSuccessCloseButton?.focus();
}

function closeImportExportHelpModal() {
  importExportHelpModal?.classList.add('hidden');
  syncModalOpenState();
}

function openImportExportHelpModal() {
  importExportHelpModal?.classList.remove('hidden');
  syncModalOpenState();
  btnImportExportHelpClose?.focus();
}

function importParsedList(parsedPayload) {
  const importedListName = resolveImportedListName(parsedPayload.name);
  const newImportedList = {
    id: generateId(),
    name: importedListName,
    items: parsedPayload.items,
  };

  appState.savedLists = [newImportedList, ...appState.savedLists];
  saveSavedListsToStorage();
  applySavedList(newImportedList.id);
  renderSavedLists();

  window.setTimeout(() => {
    const manageListRow = manageListsItemsContainer?.querySelector(`[data-saved-list-id="${newImportedList.id}"]`);
    if (manageListRow) {
      manageListRow.focus();
      manageListRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 180);
}

async function copyTextToClipboard(textToCopy) {
  if (!textToCopy) {
    return false;
  }

  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      return true;
    } catch {
      // fallback below
    }
  }

  const tempTextArea = document.createElement('textarea');
  tempTextArea.value = textToCopy;
  tempTextArea.setAttribute('readonly', 'true');
  tempTextArea.style.position = 'fixed';
  tempTextArea.style.top = '-9999px';
  document.body.append(tempTextArea);
  tempTextArea.select();

  let copiedSuccessfully = false;

  try {
    copiedSuccessfully = document.execCommand('copy');
  } catch {
    copiedSuccessfully = false;
  }

  tempTextArea.remove();
  return copiedSuccessfully;
}

async function exportCurrentList() {
  const rowsSnapshot = getCurrentRowsSnapshot();

  if (!rowsSnapshot.length) {
    openValidationModal('Adicione um item, categoria ou selecione uma lista salva para exportar.');
    return;
  }

  const payload = buildShareCodePayload(rowsSnapshot, getCurrentListNameForShare());

  if (!payload) {
    openValidationModal('Adicione um item, categoria ou selecione uma lista salva para exportar.');
    return;
  }

  const encodedPayload = encodeSharePayload(payload);
  const shareUrl = `${window.location.origin}${window.location.pathname}#share=${encodedPayload}`;
  const copiedSuccessfully = await copyTextToClipboard(shareUrl);

  if (!copiedSuccessfully) {
    openValidationModal('Nao foi possivel copiar o codigo. Tente novamente.');
    return;
  }

  openExportSuccessModal();
}

function handleImportConfirmRequest() {
  const rawImportCode = importCodeInput?.value || '';

  if (!rawImportCode.trim()) {
    openValidationModal(
      'Campo vazio. <br> <br> É necessário utilizar o botão "Exportação" onde tem a lista que você deseja trazer e colar o código aqui.'
    );
    return;
  }

  let parsedPayload;

  try {
    parsedPayload = parseImportedPayload(rawImportCode);
  } catch {
    parsedPayload = null;
  }

  if (!parsedPayload) {
    openValidationModal(
      'Código JSON inválido. <br> <br> É necessário utilizar o botão "Exportação" onde tem a lista que você deseja trazer e colar o código aqui.'
    );
    return;
  }

  const matchedSavedList = findSavedListBySignature(parsedPayload.items);

  if (matchedSavedList) {
    const activeSavedListId = getCurrentSavedListMatchId();

    if (activeSavedListId && activeSavedListId === matchedSavedList.id) {
      openImportDuplicateActiveModal();
      return;
    }

    openImportDuplicateModal(matchedSavedList);
    return;
  }

  appState.pendingImportPayload = parsedPayload;

  const currentRowsSnapshot = getCurrentRowsSnapshot();
  if (currentRowsSnapshot.length > 0 && !isCurrentListSaved()) {
    openImportUnsavedModal();
    return;
  }

  importParsedList(parsedPayload);
  appState.pendingImportPayload = null;
  closeImportCodeModal();
  openRemovalAlert('Lista importada com sucesso!');
}

function loadSavedListsFromStorage() {
  const storedSavedListsRaw = getStorageItem(SAVED_LISTS_STORAGE_KEY);

  if (!storedSavedListsRaw) {
    appState.savedLists = [];
    return;
  }

  let parsedSavedLists;

  try {
    parsedSavedLists = JSON.parse(storedSavedListsRaw);
  } catch {
    removeStorageItem(SAVED_LISTS_STORAGE_KEY);
    appState.savedLists = [];
    return;
  }

  if (!Array.isArray(parsedSavedLists)) {
    removeStorageItem(SAVED_LISTS_STORAGE_KEY);
    appState.savedLists = [];
    return;
  }

  appState.savedLists = parsedSavedLists
    .map(savedList => {
      if (!savedList || typeof savedList !== 'object') {
        return null;
      }

      if (!Array.isArray(savedList.items) || typeof savedList.name !== 'string') {
        return null;
      }

      const normalizedRows = normalizeListRowsForComparison(savedList.items).filter(row => row.text !== '');

      if (!normalizedRows.length) {
        return null;
      }

      return {
        id: savedList.id || generateId(),
        name: normalizeItemText(savedList.name) || 'Lista salva',
        items: normalizedRows,
      };
    })
    .filter(Boolean);
}

function saveSavedListsToStorage() {
  if (!appState.savedLists.length) {
    removeStorageItem(SAVED_LISTS_STORAGE_KEY);
    return;
  }

  setStorageItem(SAVED_LISTS_STORAGE_KEY, JSON.stringify(appState.savedLists));
}

function getCurrentSavedListMatchId() {
  const currentRowsSnapshot = getCurrentRowsSnapshot();

  if (!currentRowsSnapshot.length) {
    return null;
  }

  const currentSignature = getRowsSignature(currentRowsSnapshot);
  const matchedList = appState.savedLists.find(savedList => getRowsSignature(savedList.items) === currentSignature);

  return matchedList?.id || null;
}

function isCurrentListSaved() {
  return Boolean(getCurrentSavedListMatchId());
}

function createSavedListRowElement(savedList, activeSavedListId) {
  const savedListRowElement = manageListRowTemplate.cloneNode(true);
  savedListRowElement.classList.remove('hidden');
  savedListRowElement.dataset.savedListId = savedList.id;

  const nameElement = savedListRowElement.querySelector('.manage-list-name');
  const radioElement = savedListRowElement.querySelector('.manage-list-radio');

  nameElement.textContent = savedList.name;
  nameElement.title = savedList.name;
  nameElement.tabIndex = 0;
  nameElement.setAttribute('role', 'button');
  nameElement.setAttribute('aria-label', `Renomear lista salva: ${savedList.name}`);

  radioElement.checked = activeSavedListId === savedList.id;
  radioElement.setAttribute('aria-label', `Selecionar lista salva: ${savedList.name}`);

  return savedListRowElement;
}

function renderSavedLists() {
  if (!manageListsItemsContainer || !manageListRowTemplate) {
    return;
  }

  const rowsToRemove = [...manageListsItemsContainer.querySelectorAll('.manage-list-row:not(.hidden)')];
  rowsToRemove.forEach(rowElement => rowElement.remove());

  const activeSavedListId = getCurrentSavedListMatchId();

  appState.savedLists.forEach(savedList => {
    const savedListRowElement = createSavedListRowElement(savedList, activeSavedListId);
    manageListsItemsContainer.append(savedListRowElement);
  });
}

function openManageListsModal() {
  if (appState.activeEditableItem) {
    finishItemEditing(appState.activeEditableItem);
  }

  renderSavedLists();
  manageListsModal.classList.remove('hidden');
  syncModalOpenState();
  manageListsModalCloseButton.focus();
}

function closeManageListsModal() {
  if (appState.activeManageListEditableItem) {
    finishManageListEditing(appState.activeManageListEditableItem);
  }

  manageListsModal.classList.add('hidden');
  syncModalOpenState();
}

function openSwitchListModal(savedListId) {
  appState.pendingSelectedSavedListId = savedListId;
  switchListModal.classList.remove('hidden');
  syncModalOpenState();
  switchListSaveButton?.focus();
}

function closeSwitchListModal() {
  switchListModal.classList.add('hidden');
  appState.pendingSelectedSavedListId = null;
  syncModalOpenState();
}

function applySavedList(savedListId) {
  const targetSavedList = appState.savedLists.find(savedList => savedList.id === savedListId);

  if (!targetSavedList) {
    return;
  }

  getVisibleRows().forEach(rowElement => rowElement.remove());

  targetSavedList.items.forEach(savedRow => {
    const createdRow =
      savedRow.rowType === 'category' ? createCategoryElement(savedRow.text) : createListItemElement(savedRow.text);

    const checkboxElement = createdRow.querySelector('input[type="checkbox"]');

    if (checkboxElement) {
      checkboxElement.checked = Boolean(savedRow.checked);
    }

    itemsContainer.append(createdRow);
  });

  refreshCategoryStructure();
  saveItemsToStorage();
  updateClearAllButtonVisibility();
  renderSavedLists();
}

function saveCurrentList(options = {}) {
  const { showSuccessAlert = true, skipAutoFocus = false } = options;
  const currentRowsSnapshot = getCurrentRowsSnapshot();

  if (!currentRowsSnapshot.length) {
    openValidationModal('É necessário ter pelo menos um item ou categoria na lista para salvar');
    return false;
  }

  const currentSignature = getRowsSignature(currentRowsSnapshot);
  const alreadySaved = appState.savedLists.some(savedList => getRowsSignature(savedList.items) === currentSignature);

  if (alreadySaved) {
    openValidationModal('Ja existe uma lista identica salva.');
    return false;
  }

  const newSavedList = {
    id: generateId(),
    name: getNextSavedListName(),
    items: normalizeListRowsForComparison(currentRowsSnapshot),
  };

  appState.savedLists = [newSavedList, ...appState.savedLists];
  saveSavedListsToStorage();
  renderSavedLists();

  if (!skipAutoFocus) {
    window.setTimeout(() => {
      const manageListRow = manageListsItemsContainer?.querySelector(`[data-saved-list-id="${newSavedList.id}"]`);
      const nameElement = manageListRow?.querySelector('.manage-list-name');
      if (nameElement) {
        startManageListEditing(nameElement);
      }
    }, 180);
  }

  if (showSuccessAlert) {
    openRemovalAlert('Lista atual salva com sucesso.');
  }

  return true;
}

function removeSavedList(savedListId) {
  appState.savedLists = appState.savedLists.filter(savedList => savedList.id !== savedListId);
  saveSavedListsToStorage();
  renderSavedLists();
}

function finishManageListEditing(nameElement, shouldCancel = false) {
  if (!nameElement || !nameElement.classList.contains('is-editing')) {
    return;
  }

  const originalName = nameElement.dataset.originalName || '';
  let editedName = normalizeItemText(nameElement.textContent || '');
  if (editedName.length > SAVED_LIST_NAME_MAX_LENGTH) {
    editedName = editedName.slice(0, SAVED_LIST_NAME_MAX_LENGTH);
  }
  const finalName = shouldCancel || !editedName ? originalName : editedName;
  const rowElement = nameElement.closest('.manage-list-row');
  const savedListId = rowElement?.dataset?.savedListId;

  nameElement.textContent = finalName;
  nameElement.title = finalName;
  nameElement.setAttribute('aria-label', `Renomear lista salva: ${finalName}`);
  nameElement.removeAttribute('contenteditable');
  nameElement.removeAttribute('spellcheck');
  nameElement.classList.remove('is-editing');
  nameElement.style.height = '';
  nameElement.style.maxHeight = '';
  delete nameElement.dataset.originalName;

  if (appState.activeManageListEditableItem === nameElement) {
    appState.activeManageListEditableItem = null;
  }

  if (savedListId && finalName !== originalName) {
    const targetSavedList = appState.savedLists.find(savedList => savedList.id === savedListId);

    if (targetSavedList) {
      targetSavedList.name = finalName;
      saveSavedListsToStorage();
      renderSavedLists();
    }
  }
}

function startManageListEditing(nameElement) {
  if (!nameElement || nameElement.classList.contains('is-editing')) {
    return;
  }

  if (appState.activeManageListEditableItem && appState.activeManageListEditableItem !== nameElement) {
    finishManageListEditing(appState.activeManageListEditableItem);
  }

  const stableHeight = nameElement.offsetHeight;

  nameElement.dataset.originalName = nameElement.textContent || '';
  nameElement.classList.add('is-editing');
  nameElement.setAttribute('contenteditable', 'true');
  nameElement.setAttribute('spellcheck', 'false');
  nameElement.style.height = `${stableHeight}px`;
  nameElement.style.maxHeight = `${stableHeight}px`;

  nameElement.focus();
  appState.activeManageListEditableItem = nameElement;

  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(nameElement);
  selection.removeAllRanges();
  selection.addRange(range);
}

function getSavedListRowAfterPointerPosition(pointerY) {
  const draggableRows = [
    ...manageListsItemsContainer.querySelectorAll('.manage-list-row:not(.hidden):not(.is-dragging)'),
  ];

  return draggableRows.reduce(
    (closestRow, currentRow) => {
      const rowRect = currentRow.getBoundingClientRect();
      const pointerOffset = pointerY - rowRect.top - rowRect.height / 2;

      if (pointerOffset < 0 && pointerOffset > closestRow.offset) {
        return { offset: pointerOffset, element: currentRow };
      }

      return closestRow;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

function autoScrollSavedListsContainer(pointerY) {
  if (!manageListsItemsContainer) {
    return;
  }

  const containerRect = manageListsItemsContainer.getBoundingClientRect();
  const topEdgeDistance = pointerY - containerRect.top;
  const bottomEdgeDistance = containerRect.bottom - pointerY;

  if (topEdgeDistance < SAVED_LIST_DRAG_SCROLL_EDGE_PX) {
    const intensity = (SAVED_LIST_DRAG_SCROLL_EDGE_PX - topEdgeDistance) / SAVED_LIST_DRAG_SCROLL_EDGE_PX;
    const scrollDelta = Math.max(1, Math.round(SAVED_LIST_DRAG_SCROLL_STEP_PX * intensity));
    manageListsItemsContainer.scrollTop -= scrollDelta;
    return;
  }

  if (bottomEdgeDistance < SAVED_LIST_DRAG_SCROLL_EDGE_PX) {
    const intensity = (SAVED_LIST_DRAG_SCROLL_EDGE_PX - bottomEdgeDistance) / SAVED_LIST_DRAG_SCROLL_EDGE_PX;
    const scrollDelta = Math.max(1, Math.round(SAVED_LIST_DRAG_SCROLL_STEP_PX * intensity));
    manageListsItemsContainer.scrollTop += scrollDelta;
  }
}

function handleSavedListsDragOver(event) {
  if (!appState.draggedSavedListElement) {
    return;
  }

  event.preventDefault();
  autoScrollSavedListsContainer(event.clientY);

  const nextRowElement = getSavedListRowAfterPointerPosition(event.clientY);

  if (nextRowElement && appState.draggedSavedListElement === nextRowElement) {
    return;
  }

  if (!nextRowElement) {
    manageListsItemsContainer.append(appState.draggedSavedListElement);
    return;
  }

  manageListsItemsContainer.insertBefore(appState.draggedSavedListElement, nextRowElement);
}

function persistSavedListsFromDomOrder() {
  const orderedIds = [...manageListsItemsContainer.querySelectorAll('.manage-list-row:not(.hidden)')].map(
    rowElement => rowElement.dataset.savedListId
  );

  if (!orderedIds.length) {
    return;
  }

  const savedListsById = new Map(appState.savedLists.map(savedList => [savedList.id, savedList]));

  appState.savedLists = orderedIds.map(savedListId => savedListsById.get(savedListId)).filter(Boolean);
  saveSavedListsToStorage();
}

function clearAllItems() {
  const listItems = getVisibleItems();

  if (listItems.length < 2) {
    openValidationModal('Adicione pelo menos 2 itens para apagar todos.');
    return;
  }

  listItems.forEach(itemElement => itemElement.remove());
  saveItemsToStorage();
  updateClearAllButtonVisibility();
  closeClearModal();
  openRemovalAlert('Todos os itens foram removidos da lista.');
}

function clearCategoryItems() {
  if (!appState.categoryRowsToDelete.length) {
    closeClearModal();
    return;
  }

  appState.categoryRowsToDelete.forEach(rowElement => rowElement.remove());
  refreshCategoryStructure();
  saveItemsToStorage();
  updateClearAllButtonVisibility();
  closeClearModal();
  openRemovalAlert('Categoria removida com sucesso.');
}

function clearCategoryOnly() {
  if (!appState.categoryOnlyRowToDelete) {
    closeClearModal();
    return;
  }

  appState.categoryOnlyRowToDelete.remove();
  refreshCategoryStructure();
  saveItemsToStorage();
  updateClearAllButtonVisibility();
  closeClearModal();
  openRemovalAlert('Categoria removida com sucesso.');
}

function closeRemovalAlert() {
  removalAlert.classList.add('hidden');
  window.clearTimeout(appState.removalAlertTimeoutId);
  appState.removalAlertTimeoutId = null;
}

function openRemovalAlert(message) {
  if (appState.isFocusMode) {
    return;
  }

  removalAlertMessage.textContent = message;
  removalAlertMessage.title = message;
  removalAlert.classList.remove('hidden');
  window.clearTimeout(appState.removalAlertTimeoutId);
  appState.removalAlertTimeoutId = window.setTimeout(closeRemovalAlert, 6000);
}

function getStoredCheckedState(storedItem) {
  return LEGACY_CHECKED_KEYS.some(key => storedItem?.[key] === true);
}

function saveItemsToStorage() {
  const currentItems = [...itemsContainer.querySelectorAll('.item-added:not(.hidden)')].map(itemElement => {
    const text = itemElement.querySelector('.shopping-item')?.textContent?.trim() || '';
    const checkboxElement = itemElement.querySelector('input[type="checkbox"]');
    const isChecked = Boolean(checkboxElement?.checked);

    return {
      id: itemElement.dataset.itemId,
      rowType: itemElement.dataset.rowType || 'item',
      text,
      checked: isChecked,
    };
  });

  setStorageItem(ITEMS_STORAGE_KEY, JSON.stringify(currentItems));
}

function loadItemsFromStorage() {
  const storedItemsRaw = getStorageItem(ITEMS_STORAGE_KEY);

  if (!storedItemsRaw) {
    return;
  }

  let storedItems;

  try {
    storedItems = JSON.parse(storedItemsRaw);
  } catch {
    removeStorageItem(ITEMS_STORAGE_KEY);
    return;
  }

  if (!Array.isArray(storedItems)) {
    removeStorageItem(ITEMS_STORAGE_KEY);
    return;
  }

  storedItems.forEach(storedItem => {
    if (!storedItem || typeof storedItem.text !== 'string') {
      return;
    }

    const normalizedText = normalizeItemText(storedItem.text);

    if (!normalizedText) {
      return;
    }

    const rowType = storedItem.rowType === 'category' ? 'category' : 'item';
    const newItem =
      rowType === 'category'
        ? createCategoryElement(normalizedText, storedItem.id)
        : createListItemElement(normalizedText, storedItem.id);

    const checkboxElement = newItem.querySelector('input[type="checkbox"]');

    if (checkboxElement) {
      checkboxElement.checked = getStoredCheckedState(storedItem);
    }

    itemsContainer.append(newItem);
  });

  refreshCategoryStructure();
}

function createListItemElement(itemText, itemId = generateId()) {
  const newItemElement = itemTemplate.cloneNode(true);
  newItemElement.classList.remove('hidden');
  const normalizedItemText = normalizeItemText(itemText);

  const shoppingItemText = newItemElement.querySelector('.shopping-item');
  shoppingItemText.textContent = normalizedItemText;
  shoppingItemText.title = normalizedItemText;
  shoppingItemText.tabIndex = 0;
  shoppingItemText.setAttribute('role', 'button');
  shoppingItemText.setAttribute('aria-label', `Renomear item: ${normalizedItemText}`);

  newItemElement.dataset.itemId = itemId;
  newItemElement.dataset.rowType = 'item';
  newItemElement.classList.remove('category-added');

  const checkboxElement = newItemElement.querySelector('input[type="checkbox"]');

  if (checkboxElement) {
    checkboxElement.setAttribute('aria-label', `Marcar item: ${normalizedItemText}`);
  }

  const removeButton = newItemElement.querySelector('.icon-button');

  if (removeButton) {
    removeButton.setAttribute('aria-label', 'Apagar item.');
  }

  return newItemElement;
}

function createCategoryElement(categoryText, categoryId = generateId()) {
  const newCategoryElement = createListItemElement(categoryText, categoryId);
  const normalizedCategoryText = normalizeItemText(categoryText);
  newCategoryElement.dataset.rowType = 'category';
  newCategoryElement.classList.add('category-added');

  const shoppingItemText = newCategoryElement.querySelector('.shopping-item');

  if (shoppingItemText) {
    shoppingItemText.setAttribute('aria-label', `Renomear categoria: ${normalizedCategoryText}`);
  }

  const checkboxElement = newCategoryElement.querySelector('input[type="checkbox"]');

  if (checkboxElement) {
    checkboxElement.setAttribute('aria-label', `Marcar itens da categoria: ${normalizedCategoryText}`);
  }

  const removeButton = newCategoryElement.querySelector('.icon-button');

  if (removeButton) {
    removeButton.setAttribute('aria-label', 'Apagar categoria.');
  }

  return newCategoryElement;
}

function scrollMainListToBottom() {
  const mainListScrollContainer = itemsContainer?.closest('.items-scroll');

  if (!mainListScrollContainer) {
    return;
  }

  mainListScrollContainer.scrollTo({
    top: mainListScrollContainer.scrollHeight,
    behavior: 'smooth',
  });
}

function handleAddCategory() {
  const typedCategoryName = normalizeItemText(input.value);
  const nextCategoryName = `Lista ${getNextCategoryNumber()}`;
  const categoryName = typedCategoryName || nextCategoryName;
  const newCategory = createCategoryElement(categoryName);

  itemsContainer.append(newCategory);
  refreshCategoryStructure();
  saveItemsToStorage();
  updateClearAllButtonVisibility();
  scrollMainListToBottom();

  input.value = '';
  window.setTimeout(() => {
    const categoryTextElement = newCategory.querySelector('.shopping-item');
    if (categoryTextElement) {
      startItemEditing(categoryTextElement);
    }
  }, 180);
}

function normalizeItemText(text) {
  return text.replace(/\s+/g, ' ').trim().slice(0, ITEM_NAME_MAX_LENGTH);
}

function getEditableSelectionLength(editableElement) {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return 0;
  }

  const activeRange = selection.getRangeAt(0);

  if (!editableElement.contains(activeRange.commonAncestorContainer)) {
    return 0;
  }

  return activeRange.toString().length;
}

function clipboardHasImage(clipboardEvent) {
  const clipboardData = clipboardEvent?.clipboardData;

  if (!clipboardData) {
    return false;
  }

  const clipboardItems = [...(clipboardData.items || [])];
  const hasImageItem = clipboardItems.some(
    clipboardItem => clipboardItem.kind === 'file' && clipboardItem.type?.startsWith('image/')
  );

  if (hasImageItem) {
    return true;
  }

  const htmlPayload = clipboardData.getData('text/html') || '';

  return /<img\b|data:image\//i.test(htmlPayload);
}

function clampEditingTextLength(editableElement, maxLength = ITEM_NAME_MAX_LENGTH) {
  if (!editableElement) {
    return;
  }

  const currentText = editableElement.textContent || '';

  if (currentText.length <= maxLength) {
    return;
  }

  editableElement.textContent = currentText.slice(0, maxLength);

  if (document.activeElement === editableElement) {
    const selection = window.getSelection();

    if (!selection) {
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(editableElement);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function finishItemEditing(shoppingItemText, shouldCancel = false) {
  if (!shoppingItemText || !shoppingItemText.classList.contains('is-editing')) {
    return;
  }

  const originalText = shoppingItemText.dataset.originalText || '';
  const editedText = normalizeItemText(shoppingItemText.textContent || '');
  const finalText = shouldCancel || !editedText ? originalText : editedText;
  const rowElement = shoppingItemText.closest('.item-added');
  const isCategory = isCategoryRow(rowElement);

  shoppingItemText.textContent = finalText;
  shoppingItemText.title = finalText;
  shoppingItemText.setAttribute(
    'aria-label',
    isCategory ? `Renomear categoria: ${finalText}` : `Renomear item: ${finalText}`
  );

  const rowCheckbox = rowElement?.querySelector('input[type="checkbox"]');

  if (rowCheckbox) {
    rowCheckbox.setAttribute(
      'aria-label',
      isCategory ? `Marcar itens da categoria: ${finalText}` : `Marcar item: ${finalText}`
    );
  }
  shoppingItemText.removeAttribute('contenteditable');
  shoppingItemText.removeAttribute('spellcheck');
  shoppingItemText.classList.remove('is-editing');
  shoppingItemText.style.height = '';
  shoppingItemText.style.maxHeight = '';
  delete shoppingItemText.dataset.originalText;

  if (appState.activeEditableItem === shoppingItemText) {
    appState.activeEditableItem = null;
  }

  if (finalText !== originalText) {
    saveItemsToStorage();
  }
}

function startItemEditing(shoppingItemText) {
  if (!shoppingItemText || shoppingItemText.classList.contains('is-editing')) {
    return;
  }

  if (appState.activeEditableItem && appState.activeEditableItem !== shoppingItemText) {
    finishItemEditing(appState.activeEditableItem);
  }

  const stableHeight = shoppingItemText.offsetHeight;
  shoppingItemText.dataset.originalText = shoppingItemText.textContent || '';
  shoppingItemText.classList.add('is-editing');
  shoppingItemText.setAttribute('contenteditable', 'true');
  shoppingItemText.setAttribute('spellcheck', 'false');

  shoppingItemText.style.height = `${stableHeight}px`;
  shoppingItemText.style.maxHeight = `${stableHeight}px`;

  shoppingItemText.focus();
  appState.activeEditableItem = shoppingItemText;

  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(shoppingItemText);
  selection.removeAllRanges();
  selection.addRange(range);
}

function getItemAfterPointerPosition(pointerY) {
  const listItems = [...itemsContainer.querySelectorAll('.item-added:not(.hidden):not(.is-dragging)')];

  return listItems.reduce(
    (closestItem, currentItem) => {
      const itemRect = currentItem.getBoundingClientRect();
      const pointerOffset = pointerY - itemRect.top - itemRect.height / 2;

      if (pointerOffset < 0 && pointerOffset > closestItem.offset) {
        return { offset: pointerOffset, element: currentItem };
      }

      return closestItem;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

function handleAddItem() {
  const text = normalizeItemText(input.value);

  if (text !== '') {
    const newItem = createListItemElement(text);
    itemsContainer.append(newItem);
    refreshCategoryStructure();
    saveItemsToStorage();
    updateClearAllButtonVisibility();
    scrollMainListToBottom();

    input.value = '';
    input.focus();
  } else {
    openValidationModal('Digite o nome do item antes de adicionar à lista.');
  }
}

function bindEvents() {
  bindListActionEvents(handleAddItem, handleAddCategory, updateBulkActionsToggleState, handleToggleSelectAll);

  bindListItemEvents(
    appState,
    isCategoryRow,
    openCategoryClearModal,
    refreshCategoryStructure,
    saveItemsToStorage,
    updateClearAllButtonVisibility,
    openRemovalAlert,
    startItemEditing,
    finishItemEditing,
    getEditableSelectionLength,
    ITEM_NAME_MAX_LENGTH,
    clipboardHasImage,
    openValidationModal,
    clampEditingTextLength,
    updateSelectAllButtonState,
    getCategoryScopeRows,
    getItemAfterPointerPosition
  );

  bindClearModalEvents(appState, openClearModal, closeClearModal, clearCategoryOnly, clearCategoryItems, clearAllItems);
  bindValidationModalEvents(closeValidationModal);

  bindImportExportModalEvents(
    appState,
    openImportCodeModal,
    closeImportCodeModal,
    openExportSaveModal,
    exportCurrentList,
    handleImportConfirmRequest,
    saveCurrentList,
    importParsedList,
    openRemovalAlert,
    closeImportUnsavedModal,
    openImportUnsavedModal,
    closeImportDuplicateModal,
    openImportDuplicateModal,
    closeImportDuplicateActiveModal,
    openImportDuplicateActiveModal,
    closeExportSaveModal,
    closeExportSuccessModal,
    openExportSuccessModal,
    openImportExportHelpModal,
    closeImportExportHelpModal,
    getCurrentRowsSnapshot
  );

  bindManageListsEvents(
    appState,
    openManageListsModal,
    closeManageListsModal,
    saveCurrentList,
    removeSavedList,
    startManageListEditing,
    finishManageListEditing,
    getEditableSelectionLength,
    SAVED_LIST_NAME_MAX_LENGTH,
    clipboardHasImage,
    openValidationModal,
    clampEditingTextLength,
    getCurrentRowsSnapshot,
    getRowsSignature,
    openSwitchListModal,
    applySavedList,
    handleSavedListsDragOver,
    persistSavedListsFromDomOrder,
    renderSavedLists
  );

  bindSwitchListEvents(
    appState,
    closeSwitchListModal,
    renderSavedLists,
    saveCurrentList,
    applySavedList,
    openRemovalAlert
  );

  bindGlobalUiEvents(
    appState,
    toggleTheme,
    toggleFocusMode,
    closeRemovalAlert,
    closeValidationModal,
    closeExportSuccessModal,
    closeExportSaveModal,
    closeImportUnsavedModal,
    closeImportDuplicateModal,
    closeImportDuplicateActiveModal,
    closeImportCodeModal,
    closeSwitchListModal,
    renderSavedLists,
    closeManageListsModal,
    closeClearModal,
    syncBulkActionsByViewport
  );
}

bindEvents();

loadItemsFromStorage();
loadSavedListsFromStorage();
refreshCategoryStructure();
updateClearAllButtonVisibility();
syncBulkActionsByViewport();
applyFocusMode(false);

// Mobile keyboard detection and handling
function setupMobileKeyboardHandling() {
  let initialViewportHeight = window.innerHeight;
  let isKeyboardVisible = false;

  function handleViewportChange() {
    const currentViewportHeight = window.innerHeight;
    const heightDifference = initialViewportHeight - currentViewportHeight;
    const threshold = 150;

    const isCurrentlyKeyboardVisible = heightDifference > threshold;

    if (isCurrentlyKeyboardVisible !== isKeyboardVisible) {
      isKeyboardVisible = isCurrentlyKeyboardVisible;

      if (isKeyboardVisible) {
        document.body.classList.add('keyboard-visible');
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'INPUT') {
          setTimeout(() => {
            activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      } else {
        document.body.classList.remove('keyboard-visible');
        initialViewportHeight = window.innerHeight;
      }
    }
  }

  window.addEventListener('resize', handleViewportChange);
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      initialViewportHeight = window.innerHeight;
      handleViewportChange();
    }, 100);
  });

  const inputElement = document.getElementById('item');
  if (inputElement) {
    inputElement.addEventListener('focus', () => {
      setTimeout(handleViewportChange, 300);
    });

    inputElement.addEventListener('blur', () => {
      setTimeout(handleViewportChange, 100);
    });
  }
}

if (window.innerWidth <= 640) {
  setupMobileKeyboardHandling();
}
