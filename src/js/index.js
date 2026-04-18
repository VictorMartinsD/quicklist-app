/*
  AUTOR: Victor Martins
  DESCRIÇÃO: Script principal para funcionalidades do site.
*/

import { generateId } from "./utils.js";

const input = document.querySelector("#item");
const btnAddItem = document.querySelector(".btn-add-item");
const btnNewCategory = document.querySelector(".btn-new-category");
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
const clearModalConfirmButton = document.querySelector(".btn-clear-confirm");
const removalAlert = document.querySelector(".alert");
const removalAlertMessage = removalAlert.querySelector(".alert-message");
const removalAlertCloseButton = removalAlert.querySelector(".icon-button");
const ITEMS_STORAGE_KEY = "quicklist:items";
const MOBILE_BULK_ACTIONS_MEDIA_QUERY = "(max-width: 25em)";

let validationTimeoutId = null;
let removalAlertTimeoutId = null;
let draggedItemElement = null;
let draggedRows = [];
let activeEditableItem = null;
let clearModalMode = "all";
let categoryRowsToDelete = [];

function updateBulkActionsToggleState(isExpanded) {
  if (!bulkClearSlot || !bulkActionsToggle) {
    return;
  }

  const iconUseElement = bulkActionsToggle.querySelector("use");

  bulkClearSlot.classList.toggle("is-collapsed", !isExpanded);
  bulkActionsToggle.setAttribute("aria-expanded", String(isExpanded));
  bulkActionsToggle.setAttribute(
    "aria-label",
    isExpanded ? "Ocultar acoes de categoria" : "Mostrar acoes de categoria",
  );

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

  const isMobile = window.matchMedia(MOBILE_BULK_ACTIONS_MEDIA_QUERY).matches;
  updateBulkActionsToggleState(!isMobile);
}

function closeValidationModal() {
  validationModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
  window.clearTimeout(validationTimeoutId);
  validationTimeoutId = null;
  input.focus();
}

function openValidationModal(message) {
  const modalMessage = validationModal.querySelector("#validation-modal-description");

  modalMessage.textContent = message;
  validationModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
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
}

function closeClearModal() {
  clearModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
  clearModalMode = "all";
  categoryRowsToDelete = [];
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
  clearModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  clearModalCloseButton.focus();
}

function openCategoryClearModal(categoryRowElement) {
  const { rows, hasSubcategories } = getCategoryScopeRows(categoryRowElement);

  if (!rows.length) {
    return;
  }

  categoryRowsToDelete = rows;
  clearModalMode = "category";

  clearModalDescription.textContent = hasSubcategories
    ? "Tem certeza que deseja apagar os itens dessa categoria e suas sub-categorias correspondentes?"
    : "Tem certeza que deseja apagar os itens dessa categoria?";

  clearModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  clearModalCloseButton.focus();
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

function saveItemsToStorage() {
  const currentItems = [...itemsContainer.querySelectorAll(".item-added:not(.hidden)")].map((itemElement) => {
    const text = itemElement.querySelector(".shopping-item")?.textContent?.trim() || "";
    const checkboxElement = itemElement.querySelector('input[type="checkbox"]');

    return {
      id: itemElement.dataset.itemId,
      rowType: itemElement.dataset.rowType || "item",
      text,
      checked: Boolean(checkboxElement?.checked),
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
    if (!storedItem || typeof storedItem.text !== "string" || !storedItem.text.trim()) {
      return;
    }

    const rowType = storedItem.rowType === "category" ? "category" : "item";
    const newItem =
      rowType === "category"
        ? createCategoryElement(storedItem.text.trim(), storedItem.id)
        : createListItemElement(storedItem.text.trim(), storedItem.id);

    const checkboxElement = newItem.querySelector('input[type="checkbox"]');

    if (checkboxElement) {
      checkboxElement.checked = Boolean(storedItem.checked);
    }

    itemsContainer.append(newItem);
  });

  refreshCategoryStructure();
}

function createListItemElement(itemText, itemId = generateId()) {
  const newItemElement = itemTemplate.cloneNode(true);
  newItemElement.classList.remove("hidden");

  const shoppingItemText = newItemElement.querySelector(".shopping-item");
  shoppingItemText.textContent = itemText;
  shoppingItemText.title = itemText;
  shoppingItemText.tabIndex = 0;
  shoppingItemText.setAttribute("role", "button");
  shoppingItemText.setAttribute("aria-label", `Renomear item: ${itemText}`);

  newItemElement.dataset.itemId = itemId;
  newItemElement.dataset.rowType = "item";
  newItemElement.classList.remove("category-added");

  const checkboxElement = newItemElement.querySelector('input[type="checkbox"]');

  if (checkboxElement) {
    checkboxElement.setAttribute("aria-label", `Marcar item: ${itemText}`);
  }

  const removeButton = newItemElement.querySelector(".icon-button");

  if (removeButton) {
    removeButton.setAttribute("aria-label", "Apagar item.");
  }

  return newItemElement;
}

function createCategoryElement(categoryText, categoryId = generateId()) {
  const newCategoryElement = createListItemElement(categoryText, categoryId);
  newCategoryElement.dataset.rowType = "category";
  newCategoryElement.classList.add("category-added");

  const shoppingItemText = newCategoryElement.querySelector(".shopping-item");

  if (shoppingItemText) {
    shoppingItemText.setAttribute("aria-label", `Renomear categoria: ${categoryText}`);
  }

  const checkboxElement = newCategoryElement.querySelector('input[type="checkbox"]');

  if (checkboxElement) {
    checkboxElement.setAttribute("aria-label", `Marcar itens da categoria: ${categoryText}`);
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
  return text.replace(/\s+/g, " ").trim();
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
  const text = input.value.trim();

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
    return;
  }

  const visibleRows = getVisibleRows();
  const categoryIndex = visibleRows.indexOf(rowElement);

  for (let index = categoryIndex + 1; index < visibleRows.length; index += 1) {
    const scopedRow = visibleRows[index];

    if (isCategoryRow(scopedRow)) {
      break;
    }

    const scopedCheckbox = scopedRow.querySelector('input[type="checkbox"]');

    if (scopedCheckbox) {
      scopedCheckbox.checked = checkboxElement.checked;
    }
  }

  saveItemsToStorage();
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

removalAlertCloseButton.addEventListener("click", closeRemovalAlert);

validationCloseButton.addEventListener("click", closeValidationModal);

validationModal.addEventListener("click", (event) => {
  if (event.target === validationModal) {
    closeValidationModal();
  }
});

document.addEventListener("keydown", (event) => {
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

window.addEventListener("resize", syncBulkActionsByViewport);

loadItemsFromStorage();
refreshCategoryStructure();
updateClearAllButtonVisibility();
syncBulkActionsByViewport();
