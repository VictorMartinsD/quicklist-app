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

/**
 * Vincula eventos globais da interface do usuário
 * @param {any} appState - Estado da aplicação
 * @param {Function} toggleTheme - Função para alternar tema
 * @param {Function} toggleFocusMode - Função para alternar modo de foco
 * @param {Function} closeRemovalAlert - Função para fechar alerta de remoção
 * @param {Function} closeValidationModal - Função para fechar modal de validação
 * @param {Function} closeExportSuccessModal - Função para fechar modal de exportação sucesso
 * @param {Function} closeExportSaveModal - Função para fechar modal de exportação salvar
 * @param {Function} closeImportUnsavedModal - Função para fechar modal de importação não salvo
 * @param {Function} closeImportDuplicateModal - Função para fechar modal de importação duplicada
 * @param {Function} closeImportDuplicateActiveModal - Função para fechar modal de importação duplicada ativa
 * @param {Function} closeImportCodeModal - Função para fechar modal de código de importação
 * @param {Function} closeSwitchListModal - Função para fechar modal de troca de lista
 * @param {Function} renderSavedLists - Função para renderizar listas salvas
 * @param {Function} closeManageListsModal - Função para fechar modal de gerenciamento de listas
 * @param {Function} closeClearModal - Função para fechar modal de limpeza
 * @param {Function} syncBulkActionsByViewport - Função para sincronizar ações em massa com viewport
 * @returns {void}
 * @description Configura listeners para eventos globais como tema, modo de foco e fechamento de modais
 */
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
  syncBulkActionsByViewport,
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
