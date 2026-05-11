// utils.js

/**
 * 在树数据中根据指定键值查找节点
 */
export function findNode(data, key, prop = "key") {
    for (const item of data) {
        if (item[prop] === key) return item;
        if (item.children?.length) {
            const found = findNode(item.children, key, prop);
            if (found) return found;
        }
    }
    return null;
}

/**
 * 更新树节点的子节点
 */
export function updateTreeChildren(data, parentKey, children) {
    return data.map((item) => {
        if (item.key === parentKey) {
            return { ...item, children };
        }
        if (item.children?.length) {
            return { ...item, children: updateTreeChildren(item.children, parentKey, children) };
        }
        return item;
    });
}

/**
 * 根据节点信息，生成新的面包屑数组
 * 注意：不直接 setBreadcrumbItems，这个工具函数只是返回一个数组
 */
export function createBreadcrumbItems(node) {
    const items = [{ title: "深圳市", key: "sz" }];

    if (node.level === 2) {
        items.push({ title: node.title, key: node.key });
    } else if (node.level === 3) {
        items.push(
            { title: node.districtName || "未知区", key: node.districtKey || "none" },
            { title: node.title, key: node.key }
        );
    }

    return items;
}
