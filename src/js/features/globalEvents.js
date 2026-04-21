/*
  AUTOR: Victor Martins
  DESCRIÇÃO: Event binding para funcionalidades globais da UI.
*/

import { DOM_SELECTORS } from "../dom/selectors.js";

const {
  themeToggleButton,
  focusModeToggleButton,
  removalAlert,
  validationModal,
  validationCloseButton,
  exportSuccessModal,
  exportSaveModal,
  importUnsavedModal,
  importDuplicateModal,
  importDuplicateActiveModal,
  importCodeModal,
  switchListModal,
  manageListsModal,
  clearModal,
} = DOM_SELECTORS;

const removalAlertCloseButton = removalAlert.querySelector(".icon-button");

export function bindGlobalUiEvents(
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
) {
  themeToggleButton?.addEventListener("click", toggleTheme);
  focusModeToggleButton?.addEventListener("click", toggleFocusMode);

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

    if (event.key === "Escape" && !importDuplicateModal.classList.contains("hidden")) {
      closeImportDuplicateModal();
      return;
    }

    if (event.key === "Escape" && !importDuplicateActiveModal.classList.contains("hidden")) {
      closeImportDuplicateActiveModal();
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

  window.addEventListener("resize", syncBulkActionsByViewport);
}
