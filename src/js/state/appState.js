export function createAppState() {
  return {
    validationTimeoutId: null,
    removalAlertTimeoutId: null,
    draggedItemElement: null,
    draggedRows: [],
    activeEditableItem: null,
    activeManageListEditableItem: null,
    clearModalMode: 'all',
    categoryRowsToDelete: [],
    categoryOnlyRowToDelete: null,
    draggedSavedListElement: null,
    pendingSelectedSavedListId: null,
    pendingImportPayload: null,
    pendingDuplicateSavedListId: null,
    savedLists: [],
    isFocusMode: false,
  };
}
