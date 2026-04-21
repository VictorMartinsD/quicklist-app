/*
  AUTOR: Victor Martins
  DESCRIÇÃO: Event binding para funcionalidades de importação e exportação.
*/

import { DOM_SELECTORS } from '../dom/selectors.js';

const {
  btnImportList,
  btnExportList,
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
} = DOM_SELECTORS;

/**
 * Vincula eventos dos modais de importação e exportação
 * @param {any} appState - Estado da aplicação
 * @param {Function} openImportCodeModal - Função para abrir modal de código de importação
 * @param {Function} closeImportCodeModal - Função para fechar modal de código de importação
 * @param {Function} openExportSaveModal - Função para abrir modal de exportação salvar
 * @param {Function} exportCurrentList - Função para exportar lista atual
 * @param {Function} handleImportConfirmRequest - Função para confirmar importação
 * @param {Function} saveCurrentList - Função para salvar lista atual
 * @param {Function} importParsedList - Função para importar lista parseada
 * @param {Function} openRemovalAlert - Função para abrir alerta de remoção
 * @param {Function} closeImportUnsavedModal - Função para fechar modal de importação não salvo
 * @param {Function} openImportUnsavedModal - Função para abrir modal de importação não salvo
 * @param {Function} closeImportDuplicateModal - Função para fechar modal de importação duplicada
 * @param {Function} openImportDuplicateModal - Função para abrir modal de importação duplicada
 * @param {Function} closeImportDuplicateActiveModal - Função para fechar modal de importação duplicada ativa
 * @param {Function} openImportDuplicateActiveModal - Função para abrir modal de importação duplicada ativa
 * @param {Function} closeExportSaveModal - Função para fechar modal de exportação salvar
 * @param {Function} closeExportSuccessModal - Função para fechar modal de exportação sucesso
 * @param {Function} openExportSuccessModal - Função para abrir modal de exportação sucesso
 * @param {Function} openImportExportHelpModal - Função para abrir modal de ajuda import/export
 * @param {Function} closeImportExportHelpModal - Função para fechar modal de ajuda import/export
 * @param {Function} getCurrentRowsSnapshot - Função para obter snapshot das linhas atuais
 * @returns {void}
 * @description Configura listeners para todos os modais de importação e exportação
 */
export function bindImportExportModalEvents(
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
) {
  btnImportList?.addEventListener('click', () => {
    openImportCodeModal();
  });

  btnExportList?.addEventListener('click', async () => {
    if (!appState.savedLists.length) {
      const rowsSnapshot = getCurrentRowsSnapshot();

      if (!rowsSnapshot.length) {
        openValidationModal('Você precisa de pelo menos um item na lista ou uma lista salva exportá-la.');
        return;
      }

      openExportSaveModal();
      return;
    }

    await exportCurrentList();
  });

  importCodeCancelButton?.addEventListener('click', closeImportCodeModal);

  importCodeClearButton?.addEventListener('click', () => {
    if (importCodeInput) {
      importCodeInput.value = '';
      importCodeInput.focus();
    }
  });

  importCodeConfirmButton?.addEventListener('click', handleImportConfirmRequest);

  importCodeInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleImportConfirmRequest();
    }
  });

  importCodeModal?.addEventListener('click', event => {
    if (event.target === importCodeModal) {
      closeImportCodeModal();
    }
  });

  importUnsavedSaveButton?.addEventListener('click', () => {
    if (!appState.pendingImportPayload) {
      return;
    }

    const hasSavedCurrentList = saveCurrentList({ showSuccessAlert: false });

    if (!hasSavedCurrentList) {
      return;
    }

    importParsedList(appState.pendingImportPayload);
    appState.pendingImportPayload = null;
    closeImportUnsavedModal();
    closeImportCodeModal();
    openRemovalAlert('Lista importada com sucesso!');
  });

  importUnsavedDiscardButton?.addEventListener('click', () => {
    if (!appState.pendingImportPayload) {
      return;
    }

    importParsedList(appState.pendingImportPayload);
    appState.pendingImportPayload = null;
    closeImportUnsavedModal();
    closeImportCodeModal();
    openRemovalAlert('Lista importada com sucesso!');
  });

  importUnsavedCancelButton?.addEventListener('click', () => {
    closeImportUnsavedModal();
  });

  importDuplicateActivateButton?.addEventListener('click', () => {
    if (!appState.pendingDuplicateSavedListId) {
      return;
    }

    applySavedList(appState.pendingDuplicateSavedListId);
    closeImportDuplicateModal();
    closeImportCodeModal();
  });

  importDuplicateCancelButton?.addEventListener('click', closeImportDuplicateModal);

  importDuplicateModal?.addEventListener('click', event => {
    if (event.target === importDuplicateModal) {
      closeImportDuplicateModal();
    }
  });

  importDuplicateActiveConfirmButton?.addEventListener('click', () => {
    closeImportDuplicateActiveModal();
    closeImportCodeModal();
  });

  importDuplicateActiveModal?.addEventListener('click', event => {
    if (event.target === importDuplicateActiveModal) {
      closeImportDuplicateActiveModal();
    }
  });

  importUnsavedModal?.addEventListener('click', event => {
    if (event.target === importUnsavedModal) {
      closeImportUnsavedModal();
    }
  });

  exportSaveConfirmButton?.addEventListener('click', async () => {
    const hasSavedCurrentList = saveCurrentList({ showSuccessAlert: false });

    if (!hasSavedCurrentList) {
      return;
    }

    closeExportSaveModal();
    await exportCurrentList();
  });

  exportSaveCancelButton?.addEventListener('click', closeExportSaveModal);

  exportSaveModal?.addEventListener('click', event => {
    if (event.target === exportSaveModal) {
      closeExportSaveModal();
    }
  });

  exportSuccessCloseButton?.addEventListener('click', closeExportSuccessModal);

  exportSuccessModal?.addEventListener('click', event => {
    if (event.target === exportSuccessModal) {
      closeExportSuccessModal();
    }
  });

  btnImportExportHelp?.addEventListener('click', openImportExportHelpModal);
  importExportHelpCloseButton?.addEventListener('click', closeImportExportHelpModal);
  btnImportExportHelpClose?.addEventListener('click', closeImportExportHelpModal);

  importExportHelpModal?.addEventListener('click', event => {
    if (event.target === importExportHelpModal) {
      closeImportExportHelpModal();
    }
  });
}
