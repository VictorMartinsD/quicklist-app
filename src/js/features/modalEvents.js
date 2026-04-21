/*
  AUTOR: Victor Martins
  DESCRIÇÃO: Event binding para modais de limpeza e validação.
*/

import { DOM_SELECTORS } from '../dom/selectors.js';

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

/**
 * Vincula eventos ao modal de limpeza
 * @param {any} appState - Estado da aplicação
 * @param {Function} openClearModal - Função para abrir modal de limpeza
 * @param {Function} closeClearModal - Função para fechar modal de limpeza
 * @param {Function} clearCategoryOnly - Função para limpar apenas categoria
 * @param {Function} clearCategoryItems - Função para limpar itens da categoria
 * @param {Function} clearAllItems - Função para limpar todos os itens
 * @returns {void}
 * @description Configura listeners de eventos para o modal de confirmação de limpeza
 */
export function bindClearModalEvents(
  appState,
  openClearModal,
  closeClearModal,
  clearCategoryOnly,
  clearCategoryItems,
  clearAllItems
) {
  clearAllButton.addEventListener('click', openClearModal);
  clearModalCloseButton.addEventListener('click', closeClearModal);
  clearModalCancelButton.addEventListener('click', closeClearModal);
  clearModalCategoryOnlyButton.addEventListener('click', clearCategoryOnly);

  clearModalConfirmButton.addEventListener('click', () => {
    if (appState.clearModalMode === 'category') {
      clearCategoryItems();
      return;
    }

    clearAllItems();
  });

  clearModal.addEventListener('click', event => {
    if (event.target === clearModal) {
      closeClearModal();
    }
  });
}

/**
 * Vincula eventos ao modal de validação
 * @param {Function} closeValidationModal - Função para fechar modal de validação
 * @returns {void}
 * @description Configura listeners de eventos para o modal de validação de campos
 */
export function bindValidationModalEvents(closeValidationModal) {
  validationCloseButton.addEventListener('click', closeValidationModal);

  validationModal.addEventListener('click', event => {
    if (event.target === validationModal) {
      closeValidationModal();
    }
  });
}
