/*
  AUTOR: Victor Martins
  DESCRIÇÃO: Event binding para ações da lista principal e interações de itens.
*/

import { DOM_SELECTORS } from '../dom/selectors.js';

const { btnAddItem, btnNewCategory, btnSelectAll, bulkActionsToggle, input, itemsContainer } = DOM_SELECTORS;

/**
 * Vincula eventos de ação da lista principal
 * @param {Function} handleAddItem - Função para adicionar item
 * @param {Function} handleAddCategory - Função para adicionar categoria
 * @param {Function} updateBulkActionsToggleState - Função para atualizar estado do toggle
 * @param {Function} handleToggleSelectAll - Função para alternar seleção de todos
 * @returns {void}
 * @description Configura listeners para botões de adicionar item, categoria e ações em massa
 */
export function bindListActionEvents(
  handleAddItem,
  handleAddCategory,
  updateBulkActionsToggleState,
  handleToggleSelectAll
) {
  btnAddItem.addEventListener('click', handleAddItem);
  btnNewCategory.addEventListener('click', handleAddCategory);

  input.addEventListener('keydown', event => {
    if (event.key !== 'Enter') {
      return;
    }

    if (event.ctrlKey) {
      btnAddItem.click();
      return;
    }

    btnNewCategory.click();
  });

  bulkActionsToggle?.addEventListener('click', () => {
    const isCurrentlyExpanded = bulkActionsToggle.getAttribute('aria-expanded') === 'true';
    updateBulkActionsToggleState(!isCurrentlyExpanded);
  });

  btnSelectAll?.addEventListener('click', handleToggleSelectAll);
}

/**
 * Vincula eventos de interação dos itens da lista
 * @param {any} appState - Estado da aplicação
 * @param {Function} isCategoryRow - Função para verificar se é categoria
 * @param {Function} openCategoryClearModal - Função para abrir modal de limpeza de categoria
 * @param {Function} refreshCategoryStructure - Função para atualizar estrutura de categorias
 * @param {Function} saveItemsToStorage - Função para salvar itens no storage
 * @param {Function} updateClearAllButtonVisibility - Função para atualizar visibilidade do botão limpar
 * @param {Function} openRemovalAlert - Função para abrir alerta de remoção
 * @param {Function} startItemEditing - Função para iniciar edição de item
 * @param {Function} finishItemEditing - Função para finalizar edição de item
 * @param {Function} getEditableSelectionLength - Função para obter tamanho da seleção
 * @param {number} ITEM_NAME_MAX_LENGTH - Tamanho máximo do nome do item
 * @param {Function} clipboardHasImage - Função para verificar se clipboard tem imagem
 * @param {Function} openValidationModal - Função para abrir modal de validação
 * @param {Function} clampEditingTextLength - Função para limitar tamanho do texto
 * @param {Function} updateSelectAllButtonState - Função para atualizar estado do botão selecionar todos
 * @param {Function} getCategoryScopeRows - Função para obter linhas do escopo da categoria
 * @param {Function} getItemAfterPointerPosition - Função para obter item após posição do ponteiro
 * @returns {void}
 * @description Configura listeners para interações com itens da lista (click, drag, edit, etc)
 */
export function bindListItemEvents(
  appState,
  isCategoryRow,
  openCategoryClearModal,
  refreshCategoryStructure,
  saveItemsToStorage,
  updateClearAllButtonVisibility,
  openRemovalAlert,
  startItemEditing,
  finishItemEditing,
  getEditableSelectionLength,
  ITEM_NAME_MAX_LENGTH,
  clipboardHasImage,
  openValidationModal,
  clampEditingTextLength,
  updateSelectAllButtonState,
  getCategoryScopeRows,
  getItemAfterPointerPosition
) {
  itemsContainer.addEventListener('click', event => {
    const removeButton = event.target.closest('.icon-button');

    if (!removeButton) {
      return;
    }

    const itemElement = removeButton.closest('.item-added');

    if (!itemElement || itemElement.classList.contains('hidden')) {
      return;
    }

    if (isCategoryRow(itemElement)) {
      openCategoryClearModal(itemElement);
      return;
    }

    const removedItemText = itemElement.querySelector('.shopping-item')?.textContent?.trim() || '';
    itemElement.remove();
    refreshCategoryStructure();
    saveItemsToStorage();
    updateClearAllButtonVisibility();

    if (removedItemText) {
      openRemovalAlert(`Removido da lista: "${removedItemText}".`);
      return;
    }

    openRemovalAlert('O item foi removido da lista.');
  });

  itemsContainer.addEventListener('click', event => {
    const shoppingItemText = event.target.closest('.shopping-item');

    if (!shoppingItemText || document.body.classList.contains('is-grabbing')) {
      return;
    }

    startItemEditing(shoppingItemText);
  });

  itemsContainer.addEventListener('focusin', event => {
    const shoppingItemText = event.target.closest('.shopping-item');

    if (!shoppingItemText || shoppingItemText.classList.contains('is-editing')) {
      return;
    }

    if (appState.activeEditableItem && appState.activeEditableItem !== shoppingItemText) {
      finishItemEditing(appState.activeEditableItem);
    }
  });

  itemsContainer.addEventListener('keydown', event => {
    const shoppingItemText = event.target.closest('.shopping-item');

    if (!shoppingItemText) {
      return;
    }

    if (!shoppingItemText.classList.contains('is-editing') && event.key === 'Enter') {
      event.preventDefault();
      startItemEditing(shoppingItemText);
      return;
    }

    if (shoppingItemText.classList.contains('is-editing') && event.key === 'Enter') {
      event.preventDefault();
      finishItemEditing(shoppingItemText);
      shoppingItemText.blur();
      return;
    }

    if (shoppingItemText.classList.contains('is-editing') && event.key === 'Escape') {
      event.preventDefault();
      finishItemEditing(shoppingItemText, true);
      shoppingItemText.blur();
    }
  });

  itemsContainer.addEventListener('beforeinput', event => {
    const shoppingItemText = event.target.closest('.shopping-item');

    if (!shoppingItemText || !shoppingItemText.classList.contains('is-editing')) {
      return;
    }

    const isInsertOperation = event.inputType?.startsWith('insert');

    if (!isInsertOperation) {
      return;
    }

    const currentLength = (shoppingItemText.textContent || '').length;
    const selectionLength = getEditableSelectionLength(shoppingItemText);
    const nextLength = currentLength - selectionLength;

    if (nextLength >= ITEM_NAME_MAX_LENGTH) {
      event.preventDefault();
    }
  });

  itemsContainer.addEventListener('paste', event => {
    const shoppingItemText = event.target.closest('.shopping-item');

    if (!shoppingItemText || !shoppingItemText.classList.contains('is-editing')) {
      return;
    }

    if (!clipboardHasImage(event)) {
      return;
    }

    event.preventDefault();
    openValidationModal('Nao e permitido colar imagens neste campo.');
  });

  itemsContainer.addEventListener('input', event => {
    const shoppingItemText = event.target.closest('.shopping-item');

    if (!shoppingItemText || !shoppingItemText.classList.contains('is-editing')) {
      return;
    }

    clampEditingTextLength(shoppingItemText);
  });

  itemsContainer.addEventListener('focusout', event => {
    const shoppingItemText = event.target.closest('.shopping-item');

    if (!shoppingItemText || !shoppingItemText.classList.contains('is-editing')) {
      return;
    }

    finishItemEditing(shoppingItemText);
  });

  itemsContainer.addEventListener('change', event => {
    const checkboxElement = event.target.closest('input[type="checkbox"]');

    if (!checkboxElement) {
      return;
    }

    const rowElement = checkboxElement.closest('.item-added');

    if (!rowElement || rowElement.classList.contains('hidden')) {
      return;
    }

    if (!isCategoryRow(rowElement)) {
      saveItemsToStorage();
      updateSelectAllButtonState();
      return;
    }

    const { rows } = getCategoryScopeRows(rowElement);

    rows.slice(1).forEach(scopedRow => {
      const scopedCheckbox = scopedRow.querySelector('input[type="checkbox"]');

      if (scopedCheckbox) {
        scopedCheckbox.checked = checkboxElement.checked;
      }
    });

    saveItemsToStorage();
    updateSelectAllButtonState();
  });

  itemsContainer.addEventListener('dragstart', event => {
    const dragHandle = event.target.closest('.drag-handle');

    if (!dragHandle) {
      event.preventDefault();
      return;
    }

    appState.draggedItemElement = dragHandle.closest('.item-added');

    if (!appState.draggedItemElement || appState.draggedItemElement.classList.contains('hidden')) {
      event.preventDefault();
      return;
    }

    if (appState.activeEditableItem) {
      finishItemEditing(appState.activeEditableItem);
    }

    appState.draggedRows = [appState.draggedItemElement];

    appState.draggedRows.forEach(rowElement => rowElement.classList.add('is-dragging'));
    document.body.classList.add('is-grabbing');

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', appState.draggedItemElement.dataset.itemId || '');
  });

  itemsContainer.addEventListener('dragover', event => {
    if (!appState.draggedItemElement) {
      return;
    }

    event.preventDefault();

    const nextItem = getItemAfterPointerPosition(event.clientY);

    if (nextItem && appState.draggedItemElement === nextItem) {
      return;
    }

    if (!nextItem) {
      itemsContainer.append(appState.draggedItemElement);
      return;
    }

    itemsContainer.insertBefore(appState.draggedItemElement, nextItem);
  });

  itemsContainer.addEventListener('drop', event => {
    if (!appState.draggedItemElement) {
      return;
    }

    event.preventDefault();
    refreshCategoryStructure();
    saveItemsToStorage();
  });

  itemsContainer.addEventListener('dragend', () => {
    if (!appState.draggedItemElement) {
      return;
    }

    appState.draggedRows.forEach(rowElement => rowElement.classList.remove('is-dragging'));
    document.body.classList.remove('is-grabbing');
    refreshCategoryStructure();
    appState.draggedRows = [];
    appState.draggedItemElement = null;
  });
}
