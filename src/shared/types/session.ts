export const SESSION_KEYS = {
  filteredListIds: "filteredListIds",
  selectedListId: "selectedListId",
  followInputList: "followInputList",
  sortAsc: "sortAsc",
  sortField: "sortField",
  optionalFilterType: "optionalFilterType",
  imageFilterMode: "imageFilterMode",
  layoutMode: "layoutMode",
  gridColumns: "gridColumns",
  galleryColumns: "galleryColumns",
  visibilityMode: "visibilityMode",
  gridVisibilityMode: "gridVisibilityMode",
  galleryVisibilityMode: "galleryVisibilityMode",
  useContainImageFit: "useContainImageFit",
  showUnsetItemFields: "showUnsetItemFields",
  textSearch: "textSearch"
} as const

export type SessionKey = (typeof SESSION_KEYS)[keyof typeof SESSION_KEYS]
