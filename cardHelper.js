function findInvalidNodes(node) {
  if (node.type && node.type.startsWith('Input.') && !node.id) {
    return node;
  }
  if (typeof node !== 'object') return false;
  for (let key in node) {
    const res = findInvalidNodes(node[key]);
    if (res) return res;
  }
  return false;
};