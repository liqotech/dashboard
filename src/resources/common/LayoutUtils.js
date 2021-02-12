function deleteUnused(item) {
  delete item.isDraggable;
  delete item.moved;
  delete item.static;
  delete item.isBounded;
  delete item.isResizable;
  delete item.maxH;
  delete item.maxW;
  delete item.minH;
  delete item.minW;
  return item;
}

export const pruneLayouts = l => {
  Object.keys(l).forEach(br => {
    l[br].forEach(item => {
      deleteUnused(item);
    });
  });
  return l;
};

export const pruneLayout = l => {
  l.forEach(item => {
    deleteUnused(item);
  });
  return l;
};
