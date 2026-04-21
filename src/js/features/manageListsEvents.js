/*
  AUTOR: Victor Martins
  DESCRIÇÃO: Event binding para gerenciamento e troca de listas salvas.
*/

import { DOM_SELECTORS } from '../dom/selectors.js';

const {
  btnManageLists,
  manageListsModal,
  manageListsModalCloseButton,
  btnSaveCurrentList,
  manageListsBox,
  manageListsItemsContainer,
  switchListModal,
  switchListSaveButton,
  switchListCancelButton,
  switchListConfirmButton,
} = DOM_SELECTORS;

/**
 * Vincula eventos do modal de gerenciamento de listas
 * @param {any} appState - Estado da aplicação
 * @param {Function} openManageListsModal - Função para abrir modal de gerenciamento
 * @param {Function} closeManageListsModal - Função para fechar modal de gerenciamento
 * @param {Function} saveCurrentList - Função para salvar lista atual
 * @param {Function} removeSavedList - Função para remover lista salva
 * @param {Function} startManageListEditing - Função para iniciar edição de lista
 * @param {Function} finishManageListEditing - Função para finalizar edição de lista
 * @param {Function} getEditableSelectionLength - Função para obter tamanho da seleção
 * @param {number} SAVED_LIST_NAME_MAX_LENGTH - Tamanho máximo do nome da lista salva
 * @param {Function} clipboardHasImage - Função para verificar se clipboard tem imagem
 * @param {Function} openValidationModal - Função para abrir modal de validação
 * @param {Function} clampEditingTextLength - Função para limitar tamanho do texto
 * @param {Function} getCurrentRowsSnapshot - Função para obter snapshot das linhas
 * @param {Function} getRowsSignature - Função para obter assinatura das linhas
 * @param {Function} openSwitchListModal - Função para abrir modal de troca de lista
 * @param {Function} applySavedList - Função para aplicar lista salva
 * @param {Function} handleSavedListsDragOver - Função para lidar com drag over de listas
 * @param {Function} persistSavedListsFromDomOrder - Função para persistir ordem das listas
 * @param {Function} renderSavedLists - Função para renderizar listas salvas
 * @returns {void}
 * @description Configura listeners para modal de gerenciamento de listas salvas
 */
export function bindManageListsEvents(
  appState,
  openManageListsModal,
  closeManageListsModal,
  saveCurrentList,
  removeSavedList,
  startManageListEditing,
  finishManageListEditing,
  getEditableSelectionLength,
  SAVED_LIST_NAME_MAX_LENGTH,
  clipboardHasImage,
  openValidationModal,
  clampEditingTextLength,
  getCurrentRowsSnapshot,
  getRowsSignature,
  openSwitchListModal,
  applySavedList,
  handleSavedListsDragOver,
  persistSavedListsFromDomOrder,
  renderSavedLists
) {
  btnManageLists?.addEventListener('click', openManageListsModal);
  manageListsModalCloseButton?.addEventListener('click', closeManageListsModal);

  manageListsModal?.addEventListener('click', event => {
    if (event.target === manageListsModal) {
      closeManageListsModal();
    }
  });

  btnSaveCurrentList?.addEventListener('click', saveCurrentList);

  manageListsItemsContainer?.addEventListener('click', event => {
    const removeButton = event.target.closest('.manage-list-remove');

    if (removeButton) {
      const rowElement = removeButton.closest('.manage-list-row');
      const savedListId = rowElement?.dataset?.savedListId;

      if (savedListId) {
        removeSavedList(savedListId);
      }

      return;
    }

    const listNameElement = event.target.closest('.manage-list-name');

    if (listNameElement) {
      startManageListEditing(listNameElement);
    }
  });

  manageListsItemsContainer?.addEventListener('focusin', event => {
    const listNameElement = event.target.closest('.manage-list-name');

    if (!listNameElement || listNameElement.classList.contains('is-editing')) {
      return;
    }

    if (appState.activeManageListEditableItem && appState.activeManageListEditableItem !== listNameElement) {
      finishManageListEditing(appState.activeManageListEditableItem);
    }
  });

  manageListsItemsContainer?.addEventListener('keydown', event => {
    const listNameElement = event.target.closest('.manage-list-name');

    if (!listNameElement) {
      return;
    }

    if (!listNameElement.classList.contains('is-editing') && event.key === 'Enter') {
      event.preventDefault();
      startManageListEditing(listNameElement);
      return;
    }

    if (listNameElement.classList.contains('is-editing') && event.key === 'Enter') {
      event.preventDefault();
      finishManageListEditing(listNameElement);
      listNameElement.blur();
      return;
    }

    if (listNameElement.classList.contains('is-editing') && event.key === 'Escape') {
      event.preventDefault();
      finishManageListEditing(listNameElement, true);
      listNameElement.blur();
    }
  });

  manageListsItemsContainer?.addEventListener('beforeinput', event => {
    const listNameElement = event.target.closest('.manage-list-name');

    if (!listNameElement || !listNameElement.classList.contains('is-editing')) {
      return;
    }

    const isInsertOperation = event.inputType?.startsWith('insert');
    if (!isInsertOperation) {
      return;
    }

    const currentLength = (listNameElement.textContent || '').length;
    const selectionLength = getEditableSelectionLength(listNameElement);
    const nextLength = currentLength - selectionLength;
    const insertedLength = (event.data || '').length;

    if (nextLength >= SAVED_LIST_NAME_MAX_LENGTH || nextLength + insertedLength > SAVED_LIST_NAME_MAX_LENGTH) {
      event.preventDefault();
    }
  });

  manageListsItemsContainer?.addEventListener('paste', event => {
    const listNameElement = event.target.closest('.manage-list-name');

    if (!listNameElement || !listNameElement.classList.contains('is-editing')) {
      return;
    }

    if (!clipboardHasImage(event)) {
      return;
    }

    event.preventDefault();
    openValidationModal('Nao e permitido colar imagens neste campo.');
  });

  manageListsItemsContainer?.addEventListener('input', event => {
    const listNameElement = event.target.closest('.manage-list-name');

    if (!listNameElement || !listNameElement.classList.contains('is-editing')) {
      return;
    }

    clampEditingTextLength(listNameElement, SAVED_LIST_NAME_MAX_LENGTH);
  });

  manageListsItemsContainer?.addEventListener('focusout', event => {
    const listNameElement = event.target.closest('.manage-list-name');

    if (!listNameElement || !listNameElement.classList.contains('is-editing')) {
      return;
    }

    finishManageListEditing(listNameElement);
  });

  manageListsItemsContainer?.addEventListener('change', event => {
    const radioElement = event.target.closest('.manage-list-radio');

    if (!radioElement) {
      return;
    }

    const rowElement = radioElement.closest('.manage-list-row');
    const selectedSavedListId = rowElement?.dataset?.savedListId;

    if (!selectedSavedListId) {
      return;
    }

    const selectedSavedList = appState.savedLists.find(savedList => savedList.id === selectedSavedListId);

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

  manageListsItemsContainer?.addEventListener('dragstart', event => {
    const dragHandleElement = event.target.closest('.manage-list-drag-handle');

    if (!dragHandleElement) {
      event.preventDefault();
      return;
    }

    appState.draggedSavedListElement = dragHandleElement.closest('.manage-list-row');

    if (!appState.draggedSavedListElement || appState.draggedSavedListElement.classList.contains('hidden')) {
      event.preventDefault();
      return;
    }

    if (appState.activeManageListEditableItem) {
      finishManageListEditing(appState.activeManageListEditableItem);
    }

    appState.draggedSavedListElement.classList.add('is-dragging');

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', appState.draggedSavedListElement.dataset.savedListId || '');
  });

  manageListsItemsContainer?.addEventListener('dragover', handleSavedListsDragOver);
  manageListsBox?.addEventListener('dragover', handleSavedListsDragOver);

  manageListsItemsContainer?.addEventListener('drop', event => {
    if (!appState.draggedSavedListElement) {
      return;
    }

    event.preventDefault();
    persistSavedListsFromDomOrder();
  });

  manageListsItemsContainer?.addEventListener('dragend', () => {
    if (!appState.draggedSavedListElement) {
      return;
    }

    appState.draggedSavedListElement.classList.remove('is-dragging');
    appState.draggedSavedListElement = null;
    renderSavedLists();
  });
}

/**
 * Vincula eventos do modal de troca de lista
 * @param {any} appState - Estado da aplicação
 * @param {Function} closeSwitchListModal - Função para fechar modal de troca de lista
 * @param {Function} renderSavedLists - Função para renderizar listas salvas
 * @param {Function} saveCurrentList - Função para salvar lista atual
 * @param {Function} applySavedList - Função para aplicar lista salva
 * @param {Function} openRemovalAlert - Função para abrir alerta de remoção
 * @returns {void}
 * @description Configura listeners para modal de confirmação de troca de lista
 */
export function bindSwitchListEvents(
  appState,
  closeSwitchListModal,
  renderSavedLists,
  saveCurrentList,
  applySavedList,
  openRemovalAlert
) {
  switchListCancelButton?.addEventListener('click', () => {
    closeSwitchListModal();
    renderSavedLists();
  });

  switchListSaveButton?.addEventListener('click', () => {
    if (!appState.pendingSelectedSavedListId) {
      return;
    }

    const hasSavedCurrentList = saveCurrentList({ showSuccessAlert: false });

    if (!hasSavedCurrentList) {
      return;
    }

    applySavedList(appState.pendingSelectedSavedListId);
    closeSwitchListModal();
    openRemovalAlert('Lista salva e lista selecionada carregada.');
  });

  switchListConfirmButton?.addEventListener('click', () => {
    if (appState.pendingSelectedSavedListId) {
      applySavedList(appState.pendingSelectedSavedListId);
    }

    closeSwitchListModal();
  });

  switchListModal?.addEventListener('click', event => {
    if (event.target === switchListModal) {
      closeSwitchListModal();
      renderSavedLists();
    }
  });
}
