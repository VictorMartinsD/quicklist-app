/*
  AUTOR: Victor Martins
  DESCRIÇÃO: Script principal para funcionalidades do site.
*/

import { generateId } from "./utils.js";

const input = document.querySelector("#item");
const btnAddItem = document.querySelector(".btn-add-item");
const itemsContainer = document.querySelector(".items");
const itemTemplate = document.querySelector(".item-added.hidden");
const validationModal = document.querySelector(".validation-modal");
const validationCloseButton = document.querySelector(".validation-modal__close");
const removalAlert = document.querySelector(".alert");
const removalAlertMessage = removalAlert.querySelector(".alert-message");
const removalAlertCloseButton = removalAlert.querySelector(".icon-button");
const ITEMS_STORAGE_KEY = "quicklist:items";

let validationTimeoutId = null;
let removalAlertTimeoutId = null;
let draggedItemElement = null;

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

function closeRemovalAlert() {
  removalAlert.classList.add("hidden");
  window.clearTimeout(removalAlertTimeoutId);
  removalAlertTimeoutId = null;
}

function openRemovalAlert(message) {
  removalAlertMessage.textContent = message;
  removalAlert.classList.remove("hidden");
  window.clearTimeout(removalAlertTimeoutId);
  removalAlertTimeoutId = window.setTimeout(closeRemovalAlert, 6000);
}

function saveItemsToStorage() {
  const currentItems = [...itemsContainer.querySelectorAll(".item-added:not(.hidden)")].map((itemElement) => {
    const text = itemElement.querySelector(".shopping-item")?.textContent?.trim() || "";

    return {
      id: itemElement.dataset.itemId,
      text,
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

    const newItem = createListItemElement(storedItem.text.trim(), storedItem.id);
    itemsContainer.append(newItem);
  });
}

function createListItemElement(itemText, itemId = generateId()) {
  const newItemElement = itemTemplate.cloneNode(true);
  newItemElement.classList.remove("hidden");

  const shoppingItemText = newItemElement.querySelector(".shopping-item");
  shoppingItemText.textContent = itemText;

  newItemElement.dataset.itemId = itemId;

  return newItemElement;
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
    saveItemsToStorage();

    input.value = "";
    input.focus();
  } else {
    openValidationModal("Digite o nome do item antes de adicionar à lista.");
  }
}

btnAddItem.addEventListener("click", handleAddItem);

itemsContainer.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".icon-button");

  if (!removeButton) {
    return;
  }

  const itemElement = removeButton.closest(".item-added");

  if (!itemElement || itemElement.classList.contains("hidden")) {
    return;
  }

  const removedItemText = itemElement.querySelector(".shopping-item")?.textContent?.trim() || "";
  itemElement.remove();
  saveItemsToStorage();

  if (removedItemText) {
    openRemovalAlert(`"${removedItemText}" foi removido da lista.`);
    return;
  }

  openRemovalAlert("O item foi removido da lista.");
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

  draggedItemElement.classList.add("is-dragging");
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
  saveItemsToStorage();
});

itemsContainer.addEventListener("dragend", () => {
  if (!draggedItemElement) {
    return;
  }

  draggedItemElement.classList.remove("is-dragging");
  document.body.classList.remove("is-grabbing");
  draggedItemElement = null;
});

removalAlertCloseButton.addEventListener("click", closeRemovalAlert);

validationCloseButton.addEventListener("click", closeValidationModal);

validationModal.addEventListener("click", (event) => {
  if (event.target === validationModal) {
    closeValidationModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !validationModal.classList.contains("hidden")) {
    closeValidationModal();
  }
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    btnAddItem.click();
  }
});

loadItemsFromStorage();
