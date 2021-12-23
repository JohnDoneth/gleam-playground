export interface H {
  tag?: string;
  className?: string;
  id?: string;
  attributes?: Record<string, string>;
  on?: Record<string, (e: Event) => boolean | void>;
  children?: Node | string;
}

export function frag(...items: (string | Node | H)[]): Node {
  if (items.length === 1) {
    if (typeof items[0] === "string") {
      return document.createTextNode(items[0]);
    } else if (items[0] instanceof Node) {
      return items[0];
    } else {
      return h(items[0]);
    }
  } else {
    const frag = document.createDocumentFragment();
    for (const item of items) {
      if (typeof item === "string" || item instanceof Node) {
        frag.append(item);
      } else {
        frag.append(h(item));
      }
    }
    return frag;
  }
}

export function h(item: H): HTMLElement {
  const el = document.createElement(item.tag ?? "div");
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
  return el;
}

export function styled(cls: string, children: Node | string): Element {
  return h({ tag: "i", className: cls, children });
}

export function button(
  content: Node | string,
  action: (e: MouseEvent) => void
): Element {
  return h({ tag: "button", on: { click: action }, children: content });
}
