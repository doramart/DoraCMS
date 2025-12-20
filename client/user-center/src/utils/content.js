// 将平铺数据转换为树状结构
export function convertToTree(list = []) {
  const map = {};
  const roots = [];

  // 首先创建一个映射表
  list.forEach(item => {
    map[item.id] = {
      ...item,
      value: item.id,
      label: item.name,
      children: [],
    };
  });

  // 构建树结构
  list.forEach(item => {
    const node = map[item.id];
    if (item.parentId === '0') {
      roots.push(node);
    } else {
      const parent = map[item.parentId];
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return roots;
}
