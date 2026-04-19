/*
  AUTOR: Victor Martins
  DESCRIÇÃO: Script principal para funcionalidades do site.
*/

import { generateId } from "./utils.js";

const input = document.querySelector("#item");
const btnAddItem = document.querySelector(".btn-add-item");
const btnNewCategory = document.querySelector(".btn-new-category");
const btnSelectAll = document.querySelector(".btn-select-all");
const btnManageLists = document.querySelector(".btn-manage-lists");
const bulkClearSlot = document.querySelector(".bulk-clear-slot");
const bulkActionsToggle = document.querySelector(".bulk-actions-toggle");
const itemsContainer = document.querySelector(".items");
const itemTemplate = document.querySelector(".item-added.hidden");
const validationModal = document.querySelector(".validation-modal");
const validationCloseButton = document.querySelector(".validation-modal__close");
const clearAllButton = document.querySelector(".btn-clear-all");
const clearModal = document.querySelector(".clear-modal");
const clearModalDescription = document.querySelector("#clear-modal-description");
const clearModalCloseButton = document.querySelector(".clear-modal__close");
const clearModalCancelButton = document.querySelector(".btn-clear-cancel");
const clearModalCategoryOnlyButton = document.querySelector(".btn-clear-category-only");
const clearModalConfirmButton = document.querySelector(".btn-clear-confirm");
const manageListsModal = document.querySelector(".manage-lists-modal");
const manageListsModalCloseButton = document.querySelector(".manage-lists-modal__close");
const btnSaveCurrentList = document.querySelector(".btn-save-current-list");
const btnImportList = document.querySelector(".btn-import-list");
const btnExportList = document.querySelector(".btn-export-list");
const manageListsBox = document.querySelector(".manage-lists-box");
const manageListsItemsContainer = document.querySelector(".manage-lists-items");
const manageListRowTemplate = document.querySelector(".manage-list-row.hidden");
const switchListModal = document.querySelector(".switch-list-modal");
const importCodeModal = document.querySelector(".import-code-modal");
const importCodeInput = document.querySelector("#import-code-input");
const importCodeCancelButton = document.querySelector(".btn-import-code-cancel");
const importCodeConfirmButton = document.querySelector(".btn-import-code-confirm");
const importUnsavedModal = document.querySelector(".import-unsaved-modal");
const importUnsavedSaveButton = document.querySelector(".btn-import-unsaved-save");
const importUnsavedDiscardButton = document.querySelector(".btn-import-unsaved-discard");
const importUnsavedCancelButton = document.querySelector(".btn-import-unsaved-cancel");
const exportSaveModal = document.querySelector(".export-save-modal");
const exportSaveConfirmButton = document.querySelector(".btn-export-save-confirm");
const exportSaveCancelButton = document.querySelector(".btn-export-save-cancel");
const exportSuccessModal = document.querySelector(".export-success-modal");
const exportSuccessCloseButton = document.querySelector(".btn-export-success-close");
const switchListSaveButton = document.querySelector(".btn-switch-list-save");
const switchListCancelButton = document.querySelector(".btn-switch-list-cancel");
const switchListConfirmButton = document.querySelector(".btn-switch-list-confirm");
const removalAlert = document.querySelector(".alert");
const removalAlertMessage = removalAlert.querySelector(".alert-message");
const removalAlertCloseButton = removalAlert.querySelector(".icon-button");
const ITEMS_STORAGE_KEY = "quicklist:items";
const SAVED_LISTS_STORAGE_KEY = "quicklist:saved-lists";
const MOBILE_BULK_ACTIONS_MEDIA_QUERY = "(max-width: 40em)";
const LEGACY_CHECKED_KEYS = ["checked", "isChecked", "done"];
const ITEM_NAME_MAX_LENGTH = 84;
const SAVED_LIST_NAME_MAX_LENGTH = 40;
const IMPORT_CODE_MAX_LENGTH = 12000;
const SAVED_LIST_DRAG_SCROLL_EDGE_PX = 48;
const SAVED_LIST_DRAG_SCROLL_STEP_PX = 12;

let validationTimeoutId = null;
let removalAlertTimeoutId = null;
let draggedItemElement = null;
let draggedRows = [];
let activeEditableItem = null;
let activeManageListEditableItem = null;
let clearModalMode = "all";
let categoryRowsToDelete = [];
let categoryOnlyRowToDelete = null;
let draggedSavedListElement = null;
let pendingSelectedSavedListId = null;
let pendingImportPayload = null;
let savedLists = [];

input.maxLength = ITEM_NAME_MAX_LENGTH;

if (importCodeInput) {
  importCodeInput.maxLength = IMPORT_CODE_MAX_LENGTH;
}

function isMobileViewport() {
  return window.matchMedia(MOBILE_BULK_ACTIONS_MEDIA_QUERY).matches;
}

function updateBulkActionsToggleState(isExpanded) {
  if (!bulkClearSlot || !bulkActionsToggle) {
    return;
  }

  const iconUseElement = bulkActionsToggle.querySelector("use");
  const isMobile = isMobileViewport();

  if (isMobile) {
    bulkClearSlot.classList.toggle("is-collapsed", !isExpanded);
    bulkClearSlot.classList.remove("is-extra-open");
  } else {
    bulkClearSlot.classList.remove("is-collapsed");
    bulkClearSlot.classList.toggle("is-extra-open", isExpanded);
  }

  bulkActionsToggle.setAttribute("aria-expanded", String(isExpanded));
  bulkActionsToggle.setAttribute("aria-label", isExpanded ? "Ocultar acoes adicionais" : "Mostrar acoes adicionais");

  if (iconUseElement) {
    iconUseElement.setAttribute(
      "href",
      isExpanded ? "assets/img/icons.svg#chevron-up" : "assets/img/icons.svg#chevron-down",
    );
  }
}

function syncBulkActionsByViewport() {
  if (!bulkClearSlot || !bulkActionsToggle) {
    return;
  }

  updateBulkActionsToggleState(false);
}

function closeValidationModal() {
  validationModal.classList.add("hidden");
  syncModalOpenState();
  window.clearTimeout(validationTimeoutId);
  validationTimeoutId = null;
  input.focus();
}

function openValidationModal(message) {
  const modalMessage = validationModal.querySelector("#validation-modal-description");

  modalMessage.textContent = message;
  validationModal.classList.remove("hidden");
  syncModalOpenState();
  validationCloseButton.focus();

  window.clearTimeout(validationTimeoutId);
  validationTimeoutId = window.setTimeout(closeValidationModal, 3200);
}

function getVisibleItems() {
  return [...itemsContainer.querySelectorAll(".item-added:not(.hidden)")];
}

function getVisibleRows() {
  return getVisibleItems();
}

function getVisibleCheckboxes() {
  return getVisibleRows()
    .map((rowElement) => rowElement.querySelector('input[type="checkbox"]'))
    .filter(Boolean);
}

function updateSelectAllButtonState() {
  if (!btnSelectAll) {
    return;
  }

  const visibleCheckboxes = getVisibleCheckboxes();
  const hasCheckboxes = visibleCheckboxes.length > 0;
  const areAllSelected = hasCheckboxes && visibleCheckboxes.every((checkboxElement) => checkboxElement.checked);

  btnSelectAll.classList.toggle("is-all-selected", areAllSelected);
  btnSelectAll.disabled = !hasCheckboxes;
  btnSelectAll.setAttribute(
    "aria-label",
    areAllSelected ? "Desmarcar todos os itens e categorias." : "Selecionar todos os itens e categorias.",
  );
}

function handleToggleSelectAll() {
  const visibleCheckboxes = getVisibleCheckboxes();

  if (!visibleCheckboxes.length) {
    return;
  }

  const areAllSelected = visibleCheckboxes.every((checkboxElement) => checkboxElement.checked);
  const shouldSelectAll = !areAllSelected;

  visibleCheckboxes.forEach((checkboxElement) => {
    checkboxElement.checked = shouldSelectAll;
  });

  saveItemsToStorage();
  updateSelectAllButtonState();
}

function isCategoryRow(rowElement) {
  return rowElement?.dataset?.rowType === "category";
}

function getNextCategoryNumber() {
  const categoryRows = getVisibleRows().filter((rowElement) => isCategoryRow(rowElement));

  const highestCategoryNumber = categoryRows.reduce((highest, rowElement) => {
    const categoryText = rowElement.querySelector(".shopping-item")?.textContent?.trim() || "";
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

  visibleRows.forEach((rowElement) => {
    rowElement.classList.remove(
      "is-grouped",
      "is-group-first",
      "is-group-last",
      "is-group-continuation",
      "is-subcategory-chain",
    );
    delete rowElement.dataset.groupId;
  });

  visibleRows.forEach((rowElement) => {
    if (isCategoryRow(rowElement)) {
      const previousLevel = Number(previousRow?.dataset?.categoryLevel || 0);
      const categoryLevel = previousRow && isCategoryRow(previousRow) ? previousLevel + 1 : 0;

      rowElement.dataset.categoryLevel = String(categoryLevel);
      rowElement.style.setProperty("--category-level", String(categoryLevel));
      rowElement.classList.add("is-under-category");
      currentCategoryLevel = categoryLevel;
    } else {
      const inheritedLevel = currentCategoryLevel >= 0 ? currentCategoryLevel : 0;

      rowElement.style.setProperty("--category-level", String(inheritedLevel));
      rowElement.classList.toggle("is-under-category", currentCategoryLevel >= 0);
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
        rowElement.classList.add("is-subcategory-chain");
      }
    }

    if (currentGroupId >= 0 && rowElement.classList.contains("is-under-category")) {
      rowElement.dataset.groupId = String(currentGroupId);
      rowElement.classList.add("is-grouped");
    }
  });

  const groupedRowsById = new Map();

  visibleRows.forEach((rowElement) => {
    const groupId = rowElement.dataset.groupId;

    if (!groupId) {
      return;
    }

    const groupedRows = groupedRowsById.get(groupId) || [];
    groupedRows.push(rowElement);
    groupedRowsById.set(groupId, groupedRows);
  });

  groupedRowsById.forEach((groupedRows) => {
    const firstRow = groupedRows[0];
    const lastRow = groupedRows[groupedRows.length - 1];

    firstRow.classList.add("is-group-first");
    lastRow.classList.add("is-group-last");

    groupedRows.slice(1).forEach((groupedRow) => {
      groupedRow.classList.add("is-group-continuation");
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
  clearAllButton.classList.remove("is-hidden");
  updateSelectAllButtonState();
}

function closeClearModal() {
  clearModal.classList.add("hidden");
  syncModalOpenState();
  clearModalMode = "all";
  categoryRowsToDelete = [];
  categoryOnlyRowToDelete = null;
  clearModalCategoryOnlyButton.classList.add("hidden");
}

function openClearModal() {
  const totalItems = getVisibleItems().length;

  if (totalItems < 2) {
    openValidationModal("Adicione pelo menos 2 itens para apagar todos.");
    return;
  }

  clearModalDescription.textContent = `Tem certeza que deseja apagar ${totalItems} itens da lista?`;
  clearModalMode = "all";
  categoryRowsToDelete = [];
  categoryOnlyRowToDelete = null;
  clearModalCategoryOnlyButton.classList.add("hidden");
  clearModal.classList.remove("hidden");
  syncModalOpenState();
  clearModalCloseButton.focus();
}

function openCategoryClearModal(categoryRowElement) {
  const { rows, hasSubcategories } = getCategoryScopeRows(categoryRowElement);

  if (!rows.length) {
    return;
  }

  if (rows.length === 1 && !hasSubcategories) {
    categoryRowsToDelete = [categoryRowElement];
    clearCategoryItems();
    return;
  }

  categoryRowsToDelete = rows;
  clearModalMode = "category";
  categoryOnlyRowToDelete = hasSubcategories ? categoryRowElement : null;

  if (categoryOnlyRowToDelete) {
    clearModalCategoryOnlyButton.classList.remove("hidden");
  } else {
    clearModalCategoryOnlyButton.classList.add("hidden");
  }

  clearModalDescription.textContent = hasSubcategories
    ? "Tem certeza que deseja apagar os itens dessa categoria e suas sub-categorias correspondentes?"
    : "Tem certeza que deseja apagar os itens dessa categoria?";

  clearModal.classList.remove("hidden");
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
    exportSaveModal,
    exportSuccessModal,
  ].some((modalElement) => modalElement && !modalElement.classList.contains("hidden"));

  document.body.classList.toggle("modal-open", hasOpenModal);
}

function normalizeListRowsForComparison(rows) {
  return rows.map((row) => ({
    rowType: row.rowType === "category" ? "category" : "item",
    text: normalizeItemText(row.text || ""),
    checked: Boolean(row.checked),
  }));
}

function getRowsSignature(rows) {
  return JSON.stringify(normalizeListRowsForComparison(rows));
}

function getCurrentRowsSnapshot() {
  return getVisibleRows().map((rowElement) => {
    const text = rowElement.querySelector(".shopping-item")?.textContent?.trim() || "";
    const checkboxElement = rowElement.querySelector('input[type="checkbox"]');

    return {
      rowType: rowElement.dataset.rowType === "category" ? "category" : "item",
      text,
      checked: Boolean(checkboxElement?.checked),
    };
  });
}

function getNextSavedListName() {
  const highestUsedNumber = savedLists.reduce((highest, savedList) => {
    const matchedNumber = (savedList.name || "").match(/^Lista salva\s+(\d+)$/i);

    if (!matchedNumber) {
      return highest;
    }

    const numericValue = Number(matchedNumber[1]);
    return Number.isNaN(numericValue) ? highest : Math.max(highest, numericValue);
  }, 0);

  return `Lista salva ${highestUsedNumber + 1}`;
}

function getNextImportedListName() {
  const highestImportedNumber = savedLists.reduce((highest, savedList) => {
    const matchedNumber = (savedList.name || "").match(/^Lista importada\s+(\d+)$/i);

    if (!matchedNumber) {
      return highest;
    }

    const numericValue = Number(matchedNumber[1]);
    return Number.isNaN(numericValue) ? highest : Math.max(highest, numericValue);
  }, 0);

  return `Lista importada ${highestImportedNumber + 1}`;
}

function resolveImportedListName(preferredName = "") {
  const normalizedName = normalizeItemText(preferredName || "");
  const hasDuplicateName = savedLists.some(
    (savedList) => (savedList.name || "").toLowerCase() === normalizedName.toLowerCase(),
  );
  const isDefaultNamePattern =
    /^Lista\s+salva\s+\d+$/i.test(normalizedName) || /^Lista\s+importada\s+\d+$/i.test(normalizedName);

  if (!normalizedName || hasDuplicateName || isDefaultNamePattern) {
    return getNextImportedListName();
  }

  return normalizedName;
}

function buildShareCodePayload(rowsSnapshot, preferredName = "") {
  const normalizedRows = normalizeListRowsForComparison(rowsSnapshot).filter((row) => row.text !== "");

  if (!normalizedRows.length) {
    return null;
  }

  return {
    name: preferredName ? normalizeItemText(preferredName) : "",
    items: normalizedRows,
  };
}

function getCurrentListNameForShare() {
  const matchedListId = getCurrentSavedListMatchId();
  const matchedSavedList = savedLists.find((savedList) => savedList.id === matchedListId);

  return matchedSavedList?.name || "";
}

function encodeSharePayload(payload) {
  return encodeURIComponent(JSON.stringify(payload));
}

function decodeSharePayload(encodedPayload) {
  const decodedText = decodeURIComponent(encodedPayload);
  return JSON.parse(decodedText);
}

function extractShareCode(rawInput) {
  const inputValue = (rawInput || "").trim();

  if (!inputValue) {
    return "";
  }

  if (inputValue.startsWith("{")) {
    return inputValue;
  }

  if (inputValue.startsWith("#") || inputValue.startsWith("?")) {
    const leadingToken = inputValue[0] === "#" ? inputValue.slice(1) : inputValue.slice(1);
    const parsedParams = new URLSearchParams(leadingToken);
    return parsedParams.get("share") || parsedParams.get("list") || inputValue;
  }

  if (/^https?:\/\//i.test(inputValue)) {
    try {
      const parsedUrl = new URL(inputValue);
      const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));
      const queryParams = new URLSearchParams(parsedUrl.search.replace(/^\?/, ""));
      return hashParams.get("share") || queryParams.get("list") || queryParams.get("share") || inputValue;
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

  if (candidateCode.startsWith("{")) {
    parsedPayload = JSON.parse(candidateCode);
  } else {
    parsedPayload = decodeSharePayload(candidateCode);
  }

  if (!parsedPayload || typeof parsedPayload !== "object") {
    return null;
  }

  const normalizedItems = normalizeListRowsForComparison(parsedPayload.items || []).filter((row) => row.text !== "");

  if (!normalizedItems.length) {
    return null;
  }

  return {
    name: typeof parsedPayload.name === "string" ? parsedPayload.name : "",
    items: normalizedItems,
  };
}

function closeImportCodeModal() {
  importCodeModal?.classList.add("hidden");
  syncModalOpenState();
}

function openImportCodeModal() {
  importCodeModal?.classList.remove("hidden");
  syncModalOpenState();
  importCodeInput?.focus();
}

function closeImportUnsavedModal() {
  importUnsavedModal?.classList.add("hidden");
  syncModalOpenState();
}

function openImportUnsavedModal() {
  importUnsavedModal?.classList.remove("hidden");
  syncModalOpenState();
  importUnsavedSaveButton?.focus();
}

function closeExportSaveModal() {
  exportSaveModal?.classList.add("hidden");
  syncModalOpenState();
}

function openExportSaveModal() {
  exportSaveModal?.classList.remove("hidden");
  syncModalOpenState();
  exportSaveConfirmButton?.focus();
}

function closeExportSuccessModal() {
  exportSuccessModal?.classList.add("hidden");
  syncModalOpenState();
}

function openExportSuccessModal() {
  exportSuccessModal?.classList.remove("hidden");
  syncModalOpenState();
  exportSuccessCloseButton?.focus();
}

function importParsedList(parsedPayload) {
  const importedListName = resolveImportedListName(parsedPayload.name);
  const newImportedList = {
    id: generateId(),
    name: importedListName,
    items: parsedPayload.items,
  };

  savedLists = [newImportedList, ...savedLists];
  saveSavedListsToStorage();
  applySavedList(newImportedList.id);
  renderSavedLists();
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

  const tempTextArea = document.createElement("textarea");
  tempTextArea.value = textToCopy;
  tempTextArea.setAttribute("readonly", "true");
  tempTextArea.style.position = "fixed";
  tempTextArea.style.top = "-9999px";
  document.body.append(tempTextArea);
  tempTextArea.select();

  let copiedSuccessfully = false;

  try {
    copiedSuccessfully = document.execCommand("copy");
  } catch {
    copiedSuccessfully = false;
  }

  tempTextArea.remove();
  return copiedSuccessfully;
}

async function exportCurrentList() {
  const rowsSnapshot = getCurrentRowsSnapshot();

  if (!rowsSnapshot.length) {
    openValidationModal("Você precisa de pelo menos um item na lista ou uma lista salva exportá-la.");
    return;
  }

  const payload = buildShareCodePayload(rowsSnapshot, getCurrentListNameForShare());

  if (!payload) {
    openValidationModal("Você precisa de pelo menos um item na lista ou uma lista salva exportá-la.");
    return;
  }

  const encodedPayload = encodeSharePayload(payload);
  const shareUrl = `${window.location.origin}${window.location.pathname}#share=${encodedPayload}`;
  const copiedSuccessfully = await copyTextToClipboard(shareUrl);

  if (!copiedSuccessfully) {
    openValidationModal("Nao foi possivel copiar o codigo. Tente novamente.");
    return;
  }

  openExportSuccessModal();
}

function handleImportConfirmRequest() {
  const rawImportCode = importCodeInput?.value || "";

  if (!rawImportCode.trim()) {
    openValidationModal(
      'Campo vazio. \nÉ necessário utilizar o botão "Exportação" onde tem a lista que você deseja trazer e colar o código aqui.',
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
      'Código JSON inválido. \nÉ necessário utilizar o botão "Exportação" onde tem a lista que você deseja trazer e colar o código aqui.',
    );
    return;
  }

  pendingImportPayload = parsedPayload;

  const currentRowsSnapshot = getCurrentRowsSnapshot();
  if (currentRowsSnapshot.length > 0 && !isCurrentListSaved()) {
    openImportUnsavedModal();
    return;
  }

  importParsedList(parsedPayload);
  pendingImportPayload = null;
  closeImportCodeModal();
  openRemovalAlert("Lista importada com sucesso!");
}

function loadSavedListsFromStorage() {
  const storedSavedListsRaw = localStorage.getItem(SAVED_LISTS_STORAGE_KEY);

  if (!storedSavedListsRaw) {
    savedLists = [];
    return;
  }

  let parsedSavedLists;

  try {
    parsedSavedLists = JSON.parse(storedSavedListsRaw);
  } catch {
    localStorage.removeItem(SAVED_LISTS_STORAGE_KEY);
    savedLists = [];
    return;
  }

  if (!Array.isArray(parsedSavedLists)) {
    localStorage.removeItem(SAVED_LISTS_STORAGE_KEY);
    savedLists = [];
    return;
  }

  savedLists = parsedSavedLists
    .map((savedList) => {
      if (!savedList || typeof savedList !== "object") {
        return null;
      }

      if (!Array.isArray(savedList.items) || typeof savedList.name !== "string") {
        return null;
      }

      const normalizedRows = normalizeListRowsForComparison(savedList.items).filter((row) => row.text !== "");

      if (!normalizedRows.length) {
        return null;
      }

      return {
        id: savedList.id || generateId(),
        name: normalizeItemText(savedList.name) || "Lista salva",
        items: normalizedRows,
      };
    })
    .filter(Boolean);
}

function saveSavedListsToStorage() {
  if (!savedLists.length) {
    localStorage.removeItem(SAVED_LISTS_STORAGE_KEY);
    return;
  }

  localStorage.setItem(SAVED_LISTS_STORAGE_KEY, JSON.stringify(savedLists));
}

function getCurrentSavedListMatchId() {
  const currentRowsSnapshot = getCurrentRowsSnapshot();

  if (!currentRowsSnapshot.length) {
    return null;
  }

  const currentSignature = getRowsSignature(currentRowsSnapshot);
  const matchedList = savedLists.find((savedList) => getRowsSignature(savedList.items) === currentSignature);

  return matchedList?.id || null;
}

function isCurrentListSaved() {
  return Boolean(getCurrentSavedListMatchId());
}

function createSavedListRowElement(savedList, activeSavedListId) {
  const savedListRowElement = manageListRowTemplate.cloneNode(true);
  savedListRowElement.classList.remove("hidden");
  savedListRowElement.dataset.savedListId = savedList.id;

  const nameElement = savedListRowElement.querySelector(".manage-list-name");
  const radioElement = savedListRowElement.querySelector(".manage-list-radio");

  nameElement.textContent = savedList.name;
  nameElement.title = savedList.name;
  nameElement.tabIndex = 0;
  nameElement.setAttribute("role", "button");
  nameElement.setAttribute("aria-label", `Renomear lista salva: ${savedList.name}`);

  radioElement.checked = activeSavedListId === savedList.id;
  radioElement.setAttribute("aria-label", `Selecionar lista salva: ${savedList.name}`);

  return savedListRowElement;
}

function renderSavedLists() {
  if (!manageListsItemsContainer || !manageListRowTemplate) {
    return;
  }

  const rowsToRemove = [...manageListsItemsContainer.querySelectorAll(".manage-list-row:not(.hidden)")];
  rowsToRemove.forEach((rowElement) => rowElement.remove());

  const activeSavedListId = getCurrentSavedListMatchId();

  savedLists.forEach((savedList) => {
    const savedListRowElement = createSavedListRowElement(savedList, activeSavedListId);
    manageListsItemsContainer.append(savedListRowElement);
  });
}

function openManageListsModal() {
  if (activeEditableItem) {
    finishItemEditing(activeEditableItem);
  }

  renderSavedLists();
  manageListsModal.classList.remove("hidden");
  syncModalOpenState();
  manageListsModalCloseButton.focus();
}

function closeManageListsModal() {
  if (activeManageListEditableItem) {
    finishManageListEditing(activeManageListEditableItem);
  }

  manageListsModal.classList.add("hidden");
  syncModalOpenState();
}

function openSwitchListModal(savedListId) {
  pendingSelectedSavedListId = savedListId;
  switchListModal.classList.remove("hidden");
  syncModalOpenState();
  switchListSaveButton?.focus();
}

function closeSwitchListModal() {
  switchListModal.classList.add("hidden");
  pendingSelectedSavedListId = null;
  syncModalOpenState();
}

function applySavedList(savedListId) {
  const targetSavedList = savedLists.find((savedList) => savedList.id === savedListId);

  if (!targetSavedList) {
    return;
  }

  getVisibleRows().forEach((rowElement) => rowElement.remove());

  targetSavedList.items.forEach((savedRow) => {
    const createdRow =
      savedRow.rowType === "category" ? createCategoryElement(savedRow.text) : createListItemElement(savedRow.text);

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
  const { showSuccessAlert = true } = options;
  const currentRowsSnapshot = getCurrentRowsSnapshot();

  if (!currentRowsSnapshot.length) {
    openValidationModal("É necessário ter pelo menos um item ou categoria na lista para salvar");
    return false;
  }

  const currentSignature = getRowsSignature(currentRowsSnapshot);
  const alreadySaved = savedLists.some((savedList) => getRowsSignature(savedList.items) === currentSignature);

  if (alreadySaved) {
    openValidationModal("Ja existe uma lista identica salva.");
    return false;
  }

  const newSavedList = {
    id: generateId(),
    name: getNextSavedListName(),
    items: normalizeListRowsForComparison(currentRowsSnapshot),
  };

  savedLists = [newSavedList, ...savedLists];
  saveSavedListsToStorage();
  renderSavedLists();

  if (showSuccessAlert) {
    openRemovalAlert("Lista atual salva com sucesso.");
  }

  return true;
}

function removeSavedList(savedListId) {
  savedLists = savedLists.filter((savedList) => savedList.id !== savedListId);
  saveSavedListsToStorage();
  renderSavedLists();
}

function finishManageListEditing(nameElement, shouldCancel = false) {
  if (!nameElement || !nameElement.classList.contains("is-editing")) {
    return;
  }

  const originalName = nameElement.dataset.originalName || "";
  let editedName = normalizeItemText(nameElement.textContent || "");
  if (editedName.length > SAVED_LIST_NAME_MAX_LENGTH) {
    editedName = editedName.slice(0, SAVED_LIST_NAME_MAX_LENGTH);
  }
  const finalName = shouldCancel || !editedName ? originalName : editedName;
  const rowElement = nameElement.closest(".manage-list-row");
  const savedListId = rowElement?.dataset?.savedListId;

  nameElement.textContent = finalName;
  nameElement.title = finalName;
  nameElement.setAttribute("aria-label", `Renomear lista salva: ${finalName}`);
  nameElement.removeAttribute("contenteditable");
  nameElement.removeAttribute("spellcheck");
  nameElement.classList.remove("is-editing");
  nameElement.style.height = "";
  nameElement.style.maxHeight = "";
  delete nameElement.dataset.originalName;

  if (activeManageListEditableItem === nameElement) {
    activeManageListEditableItem = null;
  }

  if (savedListId && finalName !== originalName) {
    const targetSavedList = savedLists.find((savedList) => savedList.id === savedListId);

    if (targetSavedList) {
      targetSavedList.name = finalName;
      saveSavedListsToStorage();
      renderSavedLists();
    }
  }
}

function startManageListEditing(nameElement) {
  if (!nameElement || nameElement.classList.contains("is-editing")) {
    return;
  }

  if (activeManageListEditableItem && activeManageListEditableItem !== nameElement) {
    finishManageListEditing(activeManageListEditableItem);
  }

  const stableHeight = nameElement.offsetHeight;

  nameElement.dataset.originalName = nameElement.textContent || "";
  nameElement.classList.add("is-editing");
  nameElement.setAttribute("contenteditable", "true");
  nameElement.setAttribute("spellcheck", "false");
  nameElement.style.height = `${stableHeight}px`;
  nameElement.style.maxHeight = `${stableHeight}px`;

  nameElement.focus();
  activeManageListEditableItem = nameElement;

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
    ...manageListsItemsContainer.querySelectorAll(".manage-list-row:not(.hidden):not(.is-dragging)"),
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
    { offset: Number.NEGATIVE_INFINITY, element: null },
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
  if (!draggedSavedListElement) {
    return;
  }

  event.preventDefault();
  autoScrollSavedListsContainer(event.clientY);

  const nextRowElement = getSavedListRowAfterPointerPosition(event.clientY);

  if (nextRowElement && draggedSavedListElement === nextRowElement) {
    return;
  }

  if (!nextRowElement) {
    manageListsItemsContainer.append(draggedSavedListElement);
    return;
  }

  manageListsItemsContainer.insertBefore(draggedSavedListElement, nextRowElement);
}

function persistSavedListsFromDomOrder() {
  const orderedIds = [...manageListsItemsContainer.querySelectorAll(".manage-list-row:not(.hidden)")].map(
    (rowElement) => rowElement.dataset.savedListId,
  );

  if (!orderedIds.length) {
    return;
  }

  const savedListsById = new Map(savedLists.map((savedList) => [savedList.id, savedList]));

  savedLists = orderedIds.map((savedListId) => savedListsById.get(savedListId)).filter(Boolean);
  saveSavedListsToStorage();
}

function clearAllItems() {
  const listItems = getVisibleItems();

  if (listItems.length < 2) {
    openValidationModal("Adicione pelo menos 2 itens para apagar todos.");
    return;
  }

  listItems.forEach((itemElement) => itemElement.remove());
  saveItemsToStorage();
  updateClearAllButtonVisibility();
  closeClearModal();
  openRemovalAlert("Todos os itens foram removidos da lista.");
}

function clearCategoryItems() {
  if (!categoryRowsToDelete.length) {
    closeClearModal();
    return;
  }

  categoryRowsToDelete.forEach((rowElement) => rowElement.remove());
  refreshCategoryStructure();
  saveItemsToStorage();
  updateClearAllButtonVisibility();
  closeClearModal();
  openRemovalAlert("Categoria removida com sucesso.");
}

function clearCategoryOnly() {
  if (!categoryOnlyRowToDelete) {
    closeClearModal();
    return;
  }

  categoryOnlyRowToDelete.remove();
  refreshCategoryStructure();
  saveItemsToStorage();
  updateClearAllButtonVisibility();
  closeClearModal();
  openRemovalAlert("Categoria removida com sucesso.");
}

function closeRemovalAlert() {
  removalAlert.classList.add("hidden");
  window.clearTimeout(removalAlertTimeoutId);
  removalAlertTimeoutId = null;
}

function openRemovalAlert(message) {
  removalAlertMessage.textContent = message;
  removalAlertMessage.title = message;
  removalAlert.classList.remove("hidden");
  window.clearTimeout(removalAlertTimeoutId);
  removalAlertTimeoutId = window.setTimeout(closeRemovalAlert, 6000);
}

function getStoredCheckedState(storedItem) {
  return LEGACY_CHECKED_KEYS.some((key) => storedItem?.[key] === true);
}

function saveItemsToStorage() {
  const currentItems = [...itemsContainer.querySelectorAll(".item-added:not(.hidden)")].map((itemElement) => {
    const text = itemElement.querySelector(".shopping-item")?.textContent?.trim() || "";
    const checkboxElement = itemElement.querySelector('input[type="checkbox"]');
    const isChecked = Boolean(checkboxElement?.checked);

    return {
      id: itemElement.dataset.itemId,
      rowType: itemElement.dataset.rowType || "item",
      text,
      checked: isChecked,
    };
  });

  localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(currentItems));
}

function loadItemsFromStorage() {
  const storedItemsRaw = localStorage.getItem(ITEMS_STORAGE_KEY);

  if (!storedItemsRaw) {
    return;
  }

  let storedItems;

  try {
    storedItems = JSON.parse(storedItemsRaw);
  } catch {
    localStorage.removeItem(ITEMS_STORAGE_KEY);
    return;
  }

  if (!Array.isArray(storedItems)) {
    localStorage.removeItem(ITEMS_STORAGE_KEY);
    return;
  }

  storedItems.forEach((storedItem) => {
    if (!storedItem || typeof storedItem.text !== "string") {
      return;
    }

    const normalizedText = normalizeItemText(storedItem.text);

    if (!normalizedText) {
      return;
    }

    const rowType = storedItem.rowType === "category" ? "category" : "item";
    const newItem =
      rowType === "category"
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
  newItemElement.classList.remove("hidden");
  const normalizedItemText = normalizeItemText(itemText);

  const shoppingItemText = newItemElement.querySelector(".shopping-item");
  shoppingItemText.textContent = normalizedItemText;
  shoppingItemText.title = normalizedItemText;
  shoppingItemText.tabIndex = 0;
  shoppingItemText.setAttribute("role", "button");
  shoppingItemText.setAttribute("aria-label", `Renomear item: ${normalizedItemText}`);

  newItemElement.dataset.itemId = itemId;
  newItemElement.dataset.rowType = "item";
  newItemElement.classList.remove("category-added");

  const checkboxElement = newItemElement.querySelector('input[type="checkbox"]');

  if (checkboxElement) {
    checkboxElement.setAttribute("aria-label", `Marcar item: ${normalizedItemText}`);
  }

  const removeButton = newItemElement.querySelector(".icon-button");

  if (removeButton) {
    removeButton.setAttribute("aria-label", "Apagar item.");
  }

  return newItemElement;
}

function createCategoryElement(categoryText, categoryId = generateId()) {
  const newCategoryElement = createListItemElement(categoryText, categoryId);
  const normalizedCategoryText = normalizeItemText(categoryText);
  newCategoryElement.dataset.rowType = "category";
  newCategoryElement.classList.add("category-added");

  const shoppingItemText = newCategoryElement.querySelector(".shopping-item");

  if (shoppingItemText) {
    shoppingItemText.setAttribute("aria-label", `Renomear categoria: ${normalizedCategoryText}`);
  }

  const checkboxElement = newCategoryElement.querySelector('input[type="checkbox"]');

  if (checkboxElement) {
    checkboxElement.setAttribute("aria-label", `Marcar itens da categoria: ${normalizedCategoryText}`);
  }

  const removeButton = newCategoryElement.querySelector(".icon-button");

  if (removeButton) {
    removeButton.setAttribute("aria-label", "Apagar categoria.");
  }

  return newCategoryElement;
}

function handleAddCategory() {
  const typedCategoryName = normalizeItemText(input.value);
  const nextCategoryName = `Lista ${getNextCategoryNumber()}`;
  const categoryName = typedCategoryName || nextCategoryName;
  const newCategory = createCategoryElement(categoryName);

  itemsContainer.prepend(newCategory);
  refreshCategoryStructure();
  saveItemsToStorage();
  updateClearAllButtonVisibility();

  input.value = "";
  newCategory.querySelector(".shopping-item")?.focus();
}

function normalizeItemText(text) {
  return text.replace(/\s+/g, " ").trim().slice(0, ITEM_NAME_MAX_LENGTH);
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
    (clipboardItem) => clipboardItem.kind === "file" && clipboardItem.type?.startsWith("image/"),
  );

  if (hasImageItem) {
    return true;
  }

  const htmlPayload = clipboardData.getData("text/html") || "";

  return /<img\b|data:image\//i.test(htmlPayload);
}

function clampEditingTextLength(editableElement, maxLength = ITEM_NAME_MAX_LENGTH) {
  if (!editableElement) {
    return;
  }

  const currentText = editableElement.textContent || "";

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
  if (!shoppingItemText || !shoppingItemText.classList.contains("is-editing")) {
    return;
  }

  const originalText = shoppingItemText.dataset.originalText || "";
  const editedText = normalizeItemText(shoppingItemText.textContent || "");
  const finalText = shouldCancel || !editedText ? originalText : editedText;
  const rowElement = shoppingItemText.closest(".item-added");
  const isCategory = isCategoryRow(rowElement);

  shoppingItemText.textContent = finalText;
  shoppingItemText.title = finalText;
  shoppingItemText.setAttribute(
    "aria-label",
    isCategory ? `Renomear categoria: ${finalText}` : `Renomear item: ${finalText}`,
  );

  const rowCheckbox = rowElement?.querySelector('input[type="checkbox"]');

  if (rowCheckbox) {
    rowCheckbox.setAttribute(
      "aria-label",
      isCategory ? `Marcar itens da categoria: ${finalText}` : `Marcar item: ${finalText}`,
    );
  }
  shoppingItemText.removeAttribute("contenteditable");
  shoppingItemText.removeAttribute("spellcheck");
  shoppingItemText.classList.remove("is-editing");
  shoppingItemText.style.height = "";
  shoppingItemText.style.maxHeight = "";
  delete shoppingItemText.dataset.originalText;

  if (activeEditableItem === shoppingItemText) {
    activeEditableItem = null;
  }

  if (finalText !== originalText) {
    saveItemsToStorage();
  }
}

function startItemEditing(shoppingItemText) {
  if (!shoppingItemText || shoppingItemText.classList.contains("is-editing")) {
    return;
  }

  if (activeEditableItem && activeEditableItem !== shoppingItemText) {
    finishItemEditing(activeEditableItem);
  }

  const stableHeight = shoppingItemText.offsetHeight;
  shoppingItemText.dataset.originalText = shoppingItemText.textContent || "";
  shoppingItemText.classList.add("is-editing");
  shoppingItemText.setAttribute("contenteditable", "true");
  shoppingItemText.setAttribute("spellcheck", "false");

  shoppingItemText.style.height = `${stableHeight}px`;
  shoppingItemText.style.maxHeight = `${stableHeight}px`;

  shoppingItemText.focus();
  activeEditableItem = shoppingItemText;

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
  const listItems = [...itemsContainer.querySelectorAll(".item-added:not(.hidden):not(.is-dragging)")];

  return listItems.reduce(
    (closestItem, currentItem) => {
      const itemRect = currentItem.getBoundingClientRect();
      const pointerOffset = pointerY - itemRect.top - itemRect.height / 2;

      if (pointerOffset < 0 && pointerOffset > closestItem.offset) {
        return { offset: pointerOffset, element: currentItem };
      }

      return closestItem;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null },
  ).element;
}

function handleAddItem() {
  const text = normalizeItemText(input.value);

  if (text !== "") {
    const newItem = createListItemElement(text);
    itemsContainer.prepend(newItem);
    refreshCategoryStructure();
    saveItemsToStorage();
    updateClearAllButtonVisibility();

    input.value = "";
    input.focus();
  } else {
    openValidationModal("Digite o nome do item antes de adicionar à lista.");
  }
}

btnAddItem.addEventListener("click", handleAddItem);
btnNewCategory.addEventListener("click", handleAddCategory);

itemsContainer.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".icon-button");

  if (!removeButton) {
    return;
  }

  const itemElement = removeButton.closest(".item-added");

  if (!itemElement || itemElement.classList.contains("hidden")) {
    return;
  }

  if (isCategoryRow(itemElement)) {
    openCategoryClearModal(itemElement);
    return;
  }

  const removedItemText = itemElement.querySelector(".shopping-item")?.textContent?.trim() || "";
  itemElement.remove();
  refreshCategoryStructure();
  saveItemsToStorage();
  updateClearAllButtonVisibility();

  if (removedItemText) {
    openRemovalAlert(`Removido da lista: "${removedItemText}".`);
    return;
  }

  openRemovalAlert("O item foi removido da lista.");
});

itemsContainer.addEventListener("click", (event) => {
  const shoppingItemText = event.target.closest(".shopping-item");

  if (!shoppingItemText || document.body.classList.contains("is-grabbing")) {
    return;
  }

  startItemEditing(shoppingItemText);
});

itemsContainer.addEventListener("focusin", (event) => {
  const shoppingItemText = event.target.closest(".shopping-item");

  if (!shoppingItemText || shoppingItemText.classList.contains("is-editing")) {
    return;
  }

  if (activeEditableItem && activeEditableItem !== shoppingItemText) {
    finishItemEditing(activeEditableItem);
  }
});

itemsContainer.addEventListener("keydown", (event) => {
  const shoppingItemText = event.target.closest(".shopping-item");

  if (!shoppingItemText) {
    return;
  }

  if (!shoppingItemText.classList.contains("is-editing") && event.key === "Enter") {
    event.preventDefault();
    startItemEditing(shoppingItemText);
    return;
  }

  if (shoppingItemText.classList.contains("is-editing") && event.key === "Enter") {
    event.preventDefault();
    finishItemEditing(shoppingItemText);
    shoppingItemText.blur();
    return;
  }

  if (shoppingItemText.classList.contains("is-editing") && event.key === "Escape") {
    event.preventDefault();
    finishItemEditing(shoppingItemText, true);
    shoppingItemText.blur();
  }
});

itemsContainer.addEventListener("beforeinput", (event) => {
  const shoppingItemText = event.target.closest(".shopping-item");

  if (!shoppingItemText || !shoppingItemText.classList.contains("is-editing")) {
    return;
  }

  const isInsertOperation = event.inputType?.startsWith("insert");

  if (!isInsertOperation) {
    return;
  }

  const currentLength = (shoppingItemText.textContent || "").length;
  const selectionLength = getEditableSelectionLength(shoppingItemText);
  const nextLength = currentLength - selectionLength;

  if (nextLength >= ITEM_NAME_MAX_LENGTH) {
    event.preventDefault();
  }
});

itemsContainer.addEventListener("paste", (event) => {
  const shoppingItemText = event.target.closest(".shopping-item");

  if (!shoppingItemText || !shoppingItemText.classList.contains("is-editing")) {
    return;
  }

  if (!clipboardHasImage(event)) {
    return;
  }

  event.preventDefault();
  openValidationModal("Nao e permitido colar imagens neste campo.");
});

itemsContainer.addEventListener("input", (event) => {
  const shoppingItemText = event.target.closest(".shopping-item");

  if (!shoppingItemText || !shoppingItemText.classList.contains("is-editing")) {
    return;
  }

  clampEditingTextLength(shoppingItemText);
});

itemsContainer.addEventListener("focusout", (event) => {
  const shoppingItemText = event.target.closest(".shopping-item");

  if (!shoppingItemText || !shoppingItemText.classList.contains("is-editing")) {
    return;
  }

  finishItemEditing(shoppingItemText);
});

itemsContainer.addEventListener("change", (event) => {
  const checkboxElement = event.target.closest('input[type="checkbox"]');

  if (!checkboxElement) {
    return;
  }

  const rowElement = checkboxElement.closest(".item-added");

  if (!rowElement || rowElement.classList.contains("hidden")) {
    return;
  }

  if (!isCategoryRow(rowElement)) {
    saveItemsToStorage();
    updateSelectAllButtonState();
    return;
  }

  const { rows } = getCategoryScopeRows(rowElement);

  rows.slice(1).forEach((scopedRow) => {
    const scopedCheckbox = scopedRow.querySelector('input[type="checkbox"]');

    if (scopedCheckbox) {
      scopedCheckbox.checked = checkboxElement.checked;
    }
  });

  saveItemsToStorage();
  updateSelectAllButtonState();
});

itemsContainer.addEventListener("dragstart", (event) => {
  const dragHandle = event.target.closest(".drag-handle");

  if (!dragHandle) {
    event.preventDefault();
    return;
  }

  draggedItemElement = dragHandle.closest(".item-added");

  if (!draggedItemElement || draggedItemElement.classList.contains("hidden")) {
    event.preventDefault();
    return;
  }

  if (activeEditableItem) {
    finishItemEditing(activeEditableItem);
  }

  draggedRows = [draggedItemElement];

  draggedRows.forEach((rowElement) => rowElement.classList.add("is-dragging"));
  document.body.classList.add("is-grabbing");

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", draggedItemElement.dataset.itemId || "");
});

itemsContainer.addEventListener("dragover", (event) => {
  if (!draggedItemElement) {
    return;
  }

  event.preventDefault();

  const nextItem = getItemAfterPointerPosition(event.clientY);

  if (nextItem && draggedItemElement === nextItem) {
    return;
  }

  if (!nextItem) {
    itemsContainer.append(draggedItemElement);
    return;
  }

  itemsContainer.insertBefore(draggedItemElement, nextItem);
});

itemsContainer.addEventListener("drop", (event) => {
  if (!draggedItemElement) {
    return;
  }

  event.preventDefault();
  refreshCategoryStructure();
  saveItemsToStorage();
});

itemsContainer.addEventListener("dragend", () => {
  if (!draggedItemElement) {
    return;
  }

  draggedRows.forEach((rowElement) => rowElement.classList.remove("is-dragging"));
  document.body.classList.remove("is-grabbing");
  refreshCategoryStructure();
  draggedRows = [];
  draggedItemElement = null;
});

clearAllButton.addEventListener("click", openClearModal);

clearModalCloseButton.addEventListener("click", closeClearModal);

clearModalCancelButton.addEventListener("click", closeClearModal);

clearModalCategoryOnlyButton.addEventListener("click", clearCategoryOnly);

clearModalConfirmButton.addEventListener("click", () => {
  if (clearModalMode === "category") {
    clearCategoryItems();
    return;
  }

  clearAllItems();
});

clearModal.addEventListener("click", (event) => {
  if (event.target === clearModal) {
    closeClearModal();
  }
});

btnManageLists?.addEventListener("click", openManageListsModal);

manageListsModalCloseButton?.addEventListener("click", closeManageListsModal);

manageListsModal?.addEventListener("click", (event) => {
  if (event.target === manageListsModal) {
    closeManageListsModal();
  }
});

btnSaveCurrentList?.addEventListener("click", saveCurrentList);

btnImportList?.addEventListener("click", () => {
  openImportCodeModal();
});

btnExportList?.addEventListener("click", async () => {
  if (!savedLists.length) {
    const rowsSnapshot = getCurrentRowsSnapshot();

    if (!rowsSnapshot.length) {
      openValidationModal("Você precisa de pelo menos um item na lista ou uma lista salva exportá-la.");
      return;
    }

    openExportSaveModal();
    return;
  }

  await exportCurrentList();
});

importCodeCancelButton?.addEventListener("click", closeImportCodeModal);

importCodeConfirmButton?.addEventListener("click", handleImportConfirmRequest);

importCodeInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleImportConfirmRequest();
  }
});

importCodeModal?.addEventListener("click", (event) => {
  if (event.target === importCodeModal) {
    closeImportCodeModal();
  }
});

importUnsavedSaveButton?.addEventListener("click", () => {
  if (!pendingImportPayload) {
    return;
  }

  const hasSavedCurrentList = saveCurrentList({ showSuccessAlert: false });

  if (!hasSavedCurrentList) {
    return;
  }

  importParsedList(pendingImportPayload);
  pendingImportPayload = null;
  closeImportUnsavedModal();
  closeImportCodeModal();
  openRemovalAlert("Lista importada com sucesso!");
});

importUnsavedDiscardButton?.addEventListener("click", () => {
  if (!pendingImportPayload) {
    return;
  }

  importParsedList(pendingImportPayload);
  pendingImportPayload = null;
  closeImportUnsavedModal();
  closeImportCodeModal();
  openRemovalAlert("Lista importada com sucesso!");
});

importUnsavedCancelButton?.addEventListener("click", () => {
  closeImportUnsavedModal();
});

importUnsavedModal?.addEventListener("click", (event) => {
  if (event.target === importUnsavedModal) {
    closeImportUnsavedModal();
  }
});

exportSaveConfirmButton?.addEventListener("click", async () => {
  const hasSavedCurrentList = saveCurrentList({ showSuccessAlert: false });

  if (!hasSavedCurrentList) {
    return;
  }

  closeExportSaveModal();
  await exportCurrentList();
});

exportSaveCancelButton?.addEventListener("click", closeExportSaveModal);

exportSaveModal?.addEventListener("click", (event) => {
  if (event.target === exportSaveModal) {
    closeExportSaveModal();
  }
});

exportSuccessCloseButton?.addEventListener("click", closeExportSuccessModal);

exportSuccessModal?.addEventListener("click", (event) => {
  if (event.target === exportSuccessModal) {
    closeExportSuccessModal();
  }
});

manageListsItemsContainer?.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".manage-list-remove");

  if (removeButton) {
    const rowElement = removeButton.closest(".manage-list-row");
    const savedListId = rowElement?.dataset?.savedListId;

    if (savedListId) {
      removeSavedList(savedListId);
    }

    return;
  }

  const listNameElement = event.target.closest(".manage-list-name");

  if (listNameElement) {
    startManageListEditing(listNameElement);
  }
});

manageListsItemsContainer?.addEventListener("focusin", (event) => {
  const listNameElement = event.target.closest(".manage-list-name");

  if (!listNameElement || listNameElement.classList.contains("is-editing")) {
    return;
  }

  if (activeManageListEditableItem && activeManageListEditableItem !== listNameElement) {
    finishManageListEditing(activeManageListEditableItem);
  }
});

manageListsItemsContainer?.addEventListener("keydown", (event) => {
  const listNameElement = event.target.closest(".manage-list-name");

  if (!listNameElement) {
    return;
  }

  if (!listNameElement.classList.contains("is-editing") && event.key === "Enter") {
    event.preventDefault();
    startManageListEditing(listNameElement);
    return;
  }

  if (listNameElement.classList.contains("is-editing") && event.key === "Enter") {
    event.preventDefault();
    finishManageListEditing(listNameElement);
    listNameElement.blur();
    return;
  }

  if (listNameElement.classList.contains("is-editing") && event.key === "Escape") {
    event.preventDefault();
    finishManageListEditing(listNameElement, true);
    listNameElement.blur();
  }
});

manageListsItemsContainer?.addEventListener("beforeinput", (event) => {
  const listNameElement = event.target.closest(".manage-list-name");

  if (!listNameElement || !listNameElement.classList.contains("is-editing")) {
    return;
  }

  const isInsertOperation = event.inputType?.startsWith("insert");
  if (!isInsertOperation) {
    return;
  }

  const currentLength = (listNameElement.textContent || "").length;
  const selectionLength = getEditableSelectionLength(listNameElement);
  const nextLength = currentLength - selectionLength;
  const insertedLength = (event.data || "").length;

  if (nextLength >= SAVED_LIST_NAME_MAX_LENGTH || nextLength + insertedLength > SAVED_LIST_NAME_MAX_LENGTH) {
    event.preventDefault();
  }
});

manageListsItemsContainer?.addEventListener("paste", (event) => {
  const listNameElement = event.target.closest(".manage-list-name");

  if (!listNameElement || !listNameElement.classList.contains("is-editing")) {
    return;
  }

  if (!clipboardHasImage(event)) {
    return;
  }

  event.preventDefault();
  openValidationModal("Nao e permitido colar imagens neste campo.");
});

manageListsItemsContainer?.addEventListener("input", (event) => {
  const listNameElement = event.target.closest(".manage-list-name");

  if (!listNameElement || !listNameElement.classList.contains("is-editing")) {
    return;
  }

  clampEditingTextLength(listNameElement, SAVED_LIST_NAME_MAX_LENGTH);
});

manageListsItemsContainer?.addEventListener("focusout", (event) => {
  const listNameElement = event.target.closest(".manage-list-name");

  if (!listNameElement || !listNameElement.classList.contains("is-editing")) {
    return;
  }

  finishManageListEditing(listNameElement);
});

manageListsItemsContainer?.addEventListener("change", (event) => {
  const radioElement = event.target.closest(".manage-list-radio");

  if (!radioElement) {
    return;
  }

  const rowElement = radioElement.closest(".manage-list-row");
  const selectedSavedListId = rowElement?.dataset?.savedListId;

  if (!selectedSavedListId) {
    return;
  }

  const selectedSavedList = savedLists.find((savedList) => savedList.id === selectedSavedListId);

  if (!selectedSavedList) {
    return;
  }

  const currentRowsSnapshot = getCurrentRowsSnapshot();
  const currentSignature = getRowsSignature(currentRowsSnapshot);
  const selectedSignature = getRowsSignature(selectedSavedList.items);

  if (currentSignature === selectedSignature) {
    renderSavedLists();
    return;
  }

  if (currentRowsSnapshot.length > 0 && !isCurrentListSaved()) {
    openSwitchListModal(selectedSavedListId);
    return;
  }

  applySavedList(selectedSavedListId);
});

manageListsItemsContainer?.addEventListener("dragstart", (event) => {
  const dragHandleElement = event.target.closest(".manage-list-drag-handle");

  if (!dragHandleElement) {
    event.preventDefault();
    return;
  }

  draggedSavedListElement = dragHandleElement.closest(".manage-list-row");

  if (!draggedSavedListElement || draggedSavedListElement.classList.contains("hidden")) {
    event.preventDefault();
    return;
  }

  if (activeManageListEditableItem) {
    finishManageListEditing(activeManageListEditableItem);
  }

  draggedSavedListElement.classList.add("is-dragging");

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", draggedSavedListElement.dataset.savedListId || "");
});

manageListsItemsContainer?.addEventListener("dragover", handleSavedListsDragOver);

manageListsBox?.addEventListener("dragover", handleSavedListsDragOver);

manageListsItemsContainer?.addEventListener("drop", (event) => {
  if (!draggedSavedListElement) {
    return;
  }

  event.preventDefault();
  persistSavedListsFromDomOrder();
});

manageListsItemsContainer?.addEventListener("dragend", () => {
  if (!draggedSavedListElement) {
    return;
  }

  draggedSavedListElement.classList.remove("is-dragging");
  draggedSavedListElement = null;
  renderSavedLists();
});

switchListCancelButton?.addEventListener("click", () => {
  closeSwitchListModal();
  renderSavedLists();
});

switchListSaveButton?.addEventListener("click", () => {
  if (!pendingSelectedSavedListId) {
    return;
  }

  const hasSavedCurrentList = saveCurrentList({ showSuccessAlert: false });

  if (!hasSavedCurrentList) {
    return;
  }

  applySavedList(pendingSelectedSavedListId);
  closeSwitchListModal();
  openRemovalAlert("Lista salva e lista selecionada carregada.");
});

switchListConfirmButton?.addEventListener("click", () => {
  if (pendingSelectedSavedListId) {
    applySavedList(pendingSelectedSavedListId);
  }

  closeSwitchListModal();
});

switchListModal?.addEventListener("click", (event) => {
  if (event.target === switchListModal) {
    closeSwitchListModal();
    renderSavedLists();
  }
});

removalAlertCloseButton.addEventListener("click", closeRemovalAlert);

validationCloseButton.addEventListener("click", closeValidationModal);

validationModal.addEventListener("click", (event) => {
  if (event.target === validationModal) {
    closeValidationModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !exportSuccessModal.classList.contains("hidden")) {
    closeExportSuccessModal();
    return;
  }

  if (event.key === "Escape" && !exportSaveModal.classList.contains("hidden")) {
    closeExportSaveModal();
    return;
  }

  if (event.key === "Escape" && !importUnsavedModal.classList.contains("hidden")) {
    closeImportUnsavedModal();
    return;
  }

  if (event.key === "Escape" && !importCodeModal.classList.contains("hidden")) {
    closeImportCodeModal();
    return;
  }

  if (event.key === "Escape" && !switchListModal.classList.contains("hidden")) {
    closeSwitchListModal();
    renderSavedLists();
    return;
  }

  if (event.key === "Escape" && !manageListsModal.classList.contains("hidden")) {
    closeManageListsModal();
    return;
  }

  if (event.key === "Escape" && !clearModal.classList.contains("hidden")) {
    closeClearModal();
    return;
  }

  if (event.key === "Escape" && !validationModal.classList.contains("hidden")) {
    closeValidationModal();
  }
});

input.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") {
    return;
  }

  if (event.ctrlKey) {
    btnAddItem.click();
    return;
  }

  btnNewCategory.click();
});

bulkActionsToggle?.addEventListener("click", () => {
  const isCurrentlyExpanded = bulkActionsToggle.getAttribute("aria-expanded") === "true";
  updateBulkActionsToggleState(!isCurrentlyExpanded);
});

btnSelectAll?.addEventListener("click", handleToggleSelectAll);

window.addEventListener("resize", syncBulkActionsByViewport);

loadItemsFromStorage();
loadSavedListsFromStorage();
refreshCategoryStructure();
updateClearAllButtonVisibility();
syncBulkActionsByViewport();
