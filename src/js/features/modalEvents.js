/*
  AUTOR: Victor Martins
  DESCRIÇÃO: Event binding para modais de limpeza e validação.
*/

import { DOM_SELECTORS } from "../dom/selectors.js";

const {
  clearAllButton,
  clearModal,
  clearModalCloseButton,
  clearModalCancelButton,
  clearModalCategoryOnlyButton,
  clearModalConfirmButton,
  validationModal,
  validationCloseButton,
} = DOM_SELECTORS;

export function bindClearModalEvents(appState, openClearModal, closeClearModal, clearCategoryOnly, clearCategoryItems, clearAllItems) {
  clearAllButton.addEventListener("click", openClearModal);
  clearModalCloseButton.addEventListener("click", closeClearModal);
  clearModalCancelButton.addEventListener("click", closeClearModal);
  clearModalCategoryOnlyButton.addEventListener("click", clearCategoryOnly);

  clearModalConfirmButton.addEventListener("click", () => {
    if (appState.clearModalMode === "category") {
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
}

export function bindValidationModalEvents(closeValidationModal) {
  validationCloseButton.addEventListener("click", closeValidationModal);

  validationModal.addEventListener("click", (event) => {
    if (event.target === validationModal) {
      closeValidationModal();
    }
  });
}
