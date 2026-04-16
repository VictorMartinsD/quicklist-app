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

let validationTimeoutId = null;
let removalAlertTimeoutId = null;

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

function createListItemElement(itemText) {
  const newItemElement = itemTemplate.cloneNode(true);
  newItemElement.classList.remove("hidden");

  const shoppingItemText = newItemElement.querySelector(".shopping-item");
  shoppingItemText.textContent = itemText;

  newItemElement.dataset.itemId = generateId();

  return newItemElement;
}

function handleAddItem() {
  const text = input.value.trim();

  if (text !== "") {
    const newItem = createListItemElement(text);
    itemsContainer.prepend(newItem);

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

  if (removedItemText) {
    openRemovalAlert(`"${removedItemText}" foi removido da lista.`);
    return;
  }

  openRemovalAlert("O item foi removido da lista.");
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
