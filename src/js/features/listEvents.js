/*
  AUTOR: Victor Martins
  DESCRIÇÃO: Event binding para ações da lista principal e interações de itens.
*/

import { DOM_SELECTORS } from '../dom/selectors.js';

const { btnAddItem, btnNewCategory, btnSelectAll, bulkActionsToggle, input, itemsContainer } = DOM_SELECTORS;

function getVisibleRows(excludedRows = []) {
  const excludedSet = new Set(excludedRows);
  return [...itemsContainer.querySelectorAll('.item-added:not(.hidden)')].filter(
    rowElement => !excludedSet.has(rowElement)
  );
}

function getBlockAnchorRow(rowElement, visibleRows = getVisibleRows()) {
  if (!rowElement) {
    return null;
  }

  if (rowElement.dataset.rowType === 'category') {
    return rowElement;
  }

  const rowIndex = visibleRows.indexOf(rowElement);

  if (rowIndex === -1) {
    return rowElement;
  }

  for (let index = rowIndex; index >= 0; index -= 1) {
    const currentRow = visibleRows[index];

    if (currentRow?.dataset?.rowType === 'category') {
      return currentRow;
    }
  }

  return rowElement;
}

function getBlockAnchors(excludedRows = []) {
  const visibleRows = getVisibleRows(excludedRows);
  const uniqueAnchors = [];
  const seenAnchors = new Set();

  visibleRows.forEach(rowElement => {
    const anchorRow = getBlockAnchorRow(rowElement, visibleRows);

    if (!anchorRow || seenAnchors.has(anchorRow)) {
      return;
    }

    seenAnchors.add(anchorRow);
    uniqueAnchors.push(anchorRow);
  });

  return uniqueAnchors;
}

function getBlockInsertionTarget(pointerY, excludedRows = []) {
  return getBlockAnchors(excludedRows).reduce(
    (closestAnchor, currentAnchor) => {
      const rowRect = currentAnchor.getBoundingClientRect();
      const pointerOffset = pointerY - rowRect.top - rowRect.height / 2;

      if (pointerOffset < 0 && pointerOffset > closestAnchor.offset) {
        return { offset: pointerOffset, element: currentAnchor };
      }

      return closestAnchor;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

function getBlockDragLabel(categoryRowElement) {
  const categoryLevel = Number(categoryRowElement?.dataset?.categoryLevel || 0);
  return categoryLevel > 0 ? 'Movendo subcategoria' : 'Movendo categoria inteira';
}

function updateDraggedRowsFeedback(appState, label, isKeyboardDrag = false) {
  appState.draggedRows.forEach((rowElement, index) => {
    rowElement.classList.add('is-dragging');

    if (isKeyboardDrag) {
      rowElement.classList.add('is-keyboard-dragging');
    }

    if (index === 0) {
      rowElement.dataset.dragLabel = label;
    } else {
      delete rowElement.dataset.dragLabel;
    }
  });

  document.body.classList.add('is-grabbing');
}

function resetDraggedRowsFeedback(appState) {
  appState.draggedRows.forEach(rowElement => {
    rowElement.classList.remove('is-dragging', 'is-keyboard-dragging');
    delete rowElement.dataset.dragLabel;
  });

  if (appState.draggedHandleElement?.classList.contains('block-drag-handle')) {
    appState.draggedHandleElement.setAttribute('aria-pressed', 'false');
  }

  document.body.classList.remove('is-grabbing');
  appState.draggedItemElement = null;
  appState.draggedHandleElement = null;
  appState.draggedRows = [];
  appState.dragMode = null;
  appState.isKeyboardDragActive = false;
}

function beginBlockDrag(appState, categoryRowElement, handleElement, event, finishItemEditing, getCategoryScopeRows) {
  const draggedRows = categoryRowElement ? getCategoryScopeRows(categoryRowElement).rows : [];

  if (!draggedRows.length) {
    return false;
  }

  if (appState.activeEditableItem) {
    finishItemEditing(appState.activeEditableItem);
  }

  appState.draggedItemElement = categoryRowElement;
  appState.draggedHandleElement = handleElement;
  appState.draggedRows = draggedRows;
  appState.dragMode = 'block';
  appState.isKeyboardDragActive = Boolean(event?.type === 'keydown');

  updateDraggedRowsFeedback(appState, getBlockDragLabel(categoryRowElement), appState.isKeyboardDragActive);

  if (appState.isKeyboardDragActive) {
    handleElement?.setAttribute('aria-pressed', 'true');
    return true;
  }

  if (event?.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', categoryRowElement?.dataset?.itemId || '');
  }

  return true;
}

function positionDraggedRowsBeforeTarget(appState, targetRowElement) {
  if (!appState.draggedRows.length) {
    return;
  }

  if (!targetRowElement) {
    itemsContainer.append(...appState.draggedRows);
    return;
  }

  appState.draggedRows.forEach(rowElement => {
    itemsContainer.insertBefore(rowElement, targetRowElement);
  });
}

function positionDraggedRowsAtStart(appState) {
  if (!appState.draggedRows.length) {
    return;
  }

  itemsContainer.prepend(...appState.draggedRows);
}

function getKeyboardBlockTarget(appState, direction) {
  const allVisibleRows = getVisibleRows();
  const rootRowElement = appState.draggedItemElement;

  if (!rootRowElement) {
    return null;
  }

  const rootIndex = allVisibleRows.indexOf(rootRowElement);

  if (rootIndex === -1) {
    return null;
  }

  if (direction < 0) {
    for (let index = rootIndex - 1; index >= 0; index -= 1) {
      const candidateRow = allVisibleRows[index];

      if (appState.draggedRows.includes(candidateRow)) {
        continue;
      }

      return getBlockAnchorRow(candidateRow, allVisibleRows);
    }

    return null;
  }

  for (let index = rootIndex + appState.draggedRows.length; index < allVisibleRows.length; index += 1) {
    const candidateRow = allVisibleRows[index];

    if (appState.draggedRows.includes(candidateRow)) {
      continue;
    }

    return getBlockAnchorRow(candidateRow, allVisibleRows);
  }

  return null;
}

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

    if (event.shiftKey) {
      btnNewCategory.click();
      return;
    }

    btnAddItem.click();
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
    const blockDragHandle = event.target.closest('.block-drag-handle');

    if (blockDragHandle) {
      const categoryRowElement = blockDragHandle.closest('.item-added.category-added');

      if (!categoryRowElement || categoryRowElement.classList.contains('hidden')) {
        event.preventDefault();
        return;
      }

      const started = beginBlockDrag(
        appState,
        categoryRowElement,
        blockDragHandle,
        event,
        finishItemEditing,
        getCategoryScopeRows
      );

      if (!started) {
        event.preventDefault();
      }

      return;
    }

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

    if (appState.dragMode === 'block') {
      const nextBlockTarget = getBlockInsertionTarget(event.clientY, appState.draggedRows);

      if (nextBlockTarget && nextBlockTarget === appState.draggedItemElement) {
        return;
      }

      positionDraggedRowsBeforeTarget(appState, nextBlockTarget);
      return;
    }

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

    resetDraggedRowsFeedback(appState);
    refreshCategoryStructure();
  });

  itemsContainer.addEventListener('keydown', event => {
    const blockDragHandle = event.target.closest('.block-drag-handle');

    if (!blockDragHandle) {
      return;
    }

    const categoryRowElement = blockDragHandle.closest('.item-added.category-added');

    if (!categoryRowElement || categoryRowElement.classList.contains('hidden')) {
      return;
    }

    const isActivationKey = event.key === 'Enter' || event.key === ' ';

    if (isActivationKey && !appState.isKeyboardDragActive) {
      event.preventDefault();
      beginBlockDrag(appState, categoryRowElement, blockDragHandle, event, finishItemEditing, getCategoryScopeRows);
      return;
    }

    if (!appState.isKeyboardDragActive || appState.dragMode !== 'block') {
      return;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const nextTarget = getKeyboardBlockTarget(appState, event.key === 'ArrowUp' ? -1 : 1);

      if (nextTarget) {
        positionDraggedRowsBeforeTarget(appState, nextTarget);
      } else if (event.key === 'ArrowUp') {
        positionDraggedRowsAtStart(appState);
      } else {
        itemsContainer.append(...appState.draggedRows);
      }

      refreshCategoryStructure();
      saveItemsToStorage();

      return;
    }

    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      resetDraggedRowsFeedback(appState);
      refreshCategoryStructure();
      saveItemsToStorage();
    }
  });
}
