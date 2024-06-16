
function findInvalidNodes(node, usedIds = {}) {
  if (node.id) {
    // error: used multiple times
    if (usedIds[node.id]) return node;
    else usedIds[node.id] = node;
  }
  if (node.type && node.type.startsWith('Input.') && !node.id) {
    return node;
  }
  if (typeof node !== 'object') return false;
  for (let key in node) {
    const res = findInvalidNodes(node[key], usedIds);
    if (res) return res;
  }

  return false;
};
