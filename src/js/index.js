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

let validationTimeoutId = null;

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
