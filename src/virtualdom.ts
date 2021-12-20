
export interface H {
    tag?: string
    className?: string
    id?: string
    attributes?: Record<string, string>
    on?: Record<string, (e: Event) => (boolean | void)>
    children?: Node
}

export function hh(...items: (string | Node | H)[]): Node {
    if (items.length === 1) {
        return h(items[0]);
    } else {
        const frag = document.createDocumentFragment();
        for (const item of items) {
            if (item != null) {
                frag.append(h(item));
            }
        }
        return frag;
    }
}

export function h(item: string | Node | H, children?: Node | string): Node {
    if (typeof item === 'string') return document.createTextNode(item);
    else if (item instanceof Node) return item;
    else {
        const el = document.createElement(item.tag ?? 'div');
        if (item.className != null) el.className = item.className;
        if (item.id != null) el.id = item.id;
        if (item.attributes != null) {
            for (const k in item.attributes) {
                el.setAttribute(k, item.attributes[k]);
            }
        }
        if (item.on != null) {
            for (const k in item.on) {
                el.addEventListener(k, item.on[k]);
            }
        }
        if (item.children != null) {
            el.append(item.children);
        }
        if (children != null) {
            el.append(children);
        }
        return el;
    }
}

export function styled(cls: string, children: Node | string): Node {
    return h({ tag: 'i', className: cls }, children);
}
