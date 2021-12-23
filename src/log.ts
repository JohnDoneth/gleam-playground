/* eslint @typescript-eslint/ban-types: "off", @typescript-eslint/no-explicit-any: "off" */
import { H, h, frag, styled } from "./virtualdom";

export class HTMLLogger {
  private counts: Record<string, number> = {};
  private timers: Record<string, number> = {};
  private activeGroup: HTMLElement;

  constructor(private element: HTMLElement) {
    element.classList.add("log-container");
    this.activeGroup = element;
  }

  mountGlobally() {
    consoleFields.forEach((field) => {
      console[field] = (...args: any[]) => this[field](...args);
    });
  }

  unmountGlobally() {
    consoleFields.forEach((field) => (console[field] = browserConsole[field]));
  }

  get showGleamSyntax(): boolean {
    return showGleamSyntax;
  }

  set showGleamSyntax(value: boolean) {
    showGleamSyntax = value;
  }

  private logAtLogLevel(logLevel: string, args: any[]) {
    const item = document.createElement("div");
    item.setAttribute("data-log-level", logLevel);
    for (const arg of args) {
      item.append(format(arg, "normal"));
      item.append(" ");
    }
    this.activeGroup.append(item);
  }

  assert(condition: boolean, ...args: any[]) {
    if (!condition) {
      this.logAtLogLevel("error", args);
      browserConsole.error(...args);
    }
  }

  clear() {
    this.element.innerHTML = "";
    this.activeGroup = this.element;
    browserConsole.clear();
  }

  count(label = "default") {
    const count = this.counts[label] ?? 0;
    this.counts[label] = count + 1;
    this.logAtLogLevel("log", [label + ":", count]);
    browserConsole.count(label);
  }

  countReset(label = "default") {
    this.counts[label] = 0;
    this.logAtLogLevel("log", [label + ":", 0]);
    browserConsole.countReset(label);
  }

  debug(...args: any[]) {
    this.logAtLogLevel("debug", args);
    browserConsole.debug(...args);
  }

  error(...args: any[]) {
    this.logAtLogLevel("error", args);
    browserConsole.error(...args);
  }

  group(label = "<Unnamed group>") {
    const newGroup = document.createElement("div");
    newGroup.className = "console-group";

    const arrow = arrowButton(false, (closed) => {
      if (closed) newGroup.classList.add("closed");
      else newGroup.classList.remove("closed");
    });

    const header = document.createElement("div");
    header.className = "group-header";
    header.append(arrow, label);

    this.activeGroup.append(header, newGroup);
    this.activeGroup = newGroup;

    browserConsole.group(label);
  }

  groupCollapsed(label = "<Unnamed group>") {
    const newGroup = document.createElement("div");
    newGroup.className = "console-group closed";

    const arrow = arrowButton(true, (closed) => {
      if (closed) newGroup.classList.add("closed");
      else newGroup.classList.remove("closed");
    });

    const header = document.createElement("div");
    header.className = "group-header";
    header.append(arrow, label);

    this.activeGroup.append(header, newGroup);
    this.activeGroup = newGroup;

    browserConsole.groupCollapsed(label);
  }

  groupEnd() {
    if (
      this.activeGroup !== this.element &&
      this.activeGroup.parentElement != null
    ) {
      this.activeGroup = this.activeGroup.parentElement;
    }

    browserConsole.groupEnd();
  }

  info(...args: any[]) {
    this.logAtLogLevel("info", args);
    browserConsole.info(...args);
  }

  log(...args: any[]) {
    this.logAtLogLevel("log", args);
    browserConsole.log(...args);
  }

  time(label = "default") {
    if (label in this.timers) {
      this.logAtLogLevel("warn", [`Timer ${label} already exists`]);
      return;
    }
    this.counts[label] = +new Date();
    browserConsole.time(label);
  }

  timeEnd(label = "default") {
    if (!(label in this.timers)) {
      this.logAtLogLevel("warn", [`Timer ${label} doesn't exist`]);
      return;
    }
    const elapsed = +new Date() - this.timers[label];
    if (elapsed > 1000) {
      this.logAtLogLevel("log", [`${label}: ${elapsed / 1000}s - timer ended`]);
    } else {
      this.logAtLogLevel("log", [`${label}: ${elapsed}ms - timer ended`]);
    }
    delete this.timers[label];
    browserConsole.timeEnd(label);
  }

  timeLog(label = "default") {
    if (!(label in this.timers)) {
      this.logAtLogLevel("warn", [`Timer ${label} doesn't exist`]);
      return;
    }
    const elapsed = +new Date() - this.timers[label];
    if (elapsed > 1000) {
      this.logAtLogLevel("log", [`${label}: ${elapsed / 1000}s`]);
    } else {
      this.logAtLogLevel("log", [`${label}: ${elapsed}ms`]);
    }
    browserConsole.timeLog(label);
  }

  trace(...args: any[]) {
    try {
      throw new Error();
    } catch (e: any) {
      if (args.length) {
        this.logAtLogLevel("trace", args);
      }
      let stack: string[] = e.stack.split("\n");
      stack = stack.slice(stack[0] === "Error" ? 3 : 2);

      this.logAtLogLevel("trace", [stack.join("\n")]);
    }
    browserConsole.trace(...args);
  }

  warn(...args: any[]) {
    this.logAtLogLevel("warn", args);
    browserConsole.warn(...args);
  }
}

type Context = "normal" | "field" | "tree-val";

type GleamList<T> = Object | NonEmpty<T>;
interface NonEmpty<T> {
  head: T;
  tail: GleamList<T>;
}

let showGleamSyntax = true;

const primitives = {
  string(arg: string, context: Context): Node | string {
    if (context === "normal") return arg;
    if (arg.length > 200) {
      const json = JSON.stringify(arg);
      const elem = styled(
        "str",
        frag(
          json.substr(0, 170),
          h({
            tag: "a",
            className: "clear",
            attributes: { href: "javascript:void()" },
            on: { click: () => void (elem.textContent = json) },
            children: "...",
          }),
          json.substr(json.length - 25)
        )
      );
      return elem;
    } else {
      return styled("str", JSON.stringify(arg));
    }
  },
  number(arg: number, _context: Context): Node {
    return styled("num", arg + "");
  },
  bigint(arg: bigint, _context: Context): Node {
    return styled("num", arg + "n");
  },
  symbol(arg: symbol, _context: Context): Node {
    return styled("sym", `Symbol(${arg.description})`);
  },
  undefined(_: undefined, _context: Context): Node {
    if (showGleamSyntax) return styled("undef", "Nil");
    return styled("undef", "undefined");
  },
  boolean(arg: boolean, _context: Context): Node {
    if (showGleamSyntax) return styled("bool", arg ? "True" : "False");
    return styled("bool", "" + arg);
  },
  function(arg: Function, context: Context): Node | string {
    if (context === "field") {
      if (arg.name == null || arg.name === "") {
        return frag(styled("fn", "f()"));
      } else {
        return frag(styled("fn", "f"), ` ${arg.name}()`);
      }
    }

    const text = shortenSignature(arg.toString()).replace(/^function\s*/, "");
    return expandIfNormal(context, arg, frag(styled("fn", "f "), text));
  },
  object(arg: object, context: Context): Node | string {
    if (arg === null) return styled("undef", "null");

    const constructor = arg.constructor.name;

    if (constructor in objects && arg instanceof window[constructor]) {
      return objects[constructor](arg, context);
    }

    if (arg instanceof Array) {
      const fn = showGleamSyntax ? objects.GleamTuple : objects.Array;
      return fn(arg, context);
    } else if (arg instanceof Element) {
      return objects.Element(arg, context);
    } else if (arg instanceof Error) {
      return objects.Error(arg, context);
    } else if (arg instanceof Promise) {
      return objects.Promise(arg, context);
    }

    if (showGleamSyntax) {
      if ("__gleam_prelude_variant__" in arg) {
        if (constructor === "Empty" || constructor === "NonEmpty") {
          return objects.GleamList(arg, context);
        } else {
          return objects.GleamCustomType(arg, context);
        }
      }

      const proto = Object.getPrototypeOf(arg);
      if (proto != null) {
        const proto2 = Object.getPrototypeOf(proto);
        if (proto2 != null && proto2.constructor.name === "CustomType") {
          return objects.GleamCustomType(arg, context);
        }
      }
    }

    if (context === "field") return styled("tag", constructor);

    const arr: (Node | string | H)[] = [];
    const completed = enumerateSafe(
      arg,
      (k, v) => arr.push(formatField(k), ": ", format(v, "field"), ", "),
      context === "normal" ? 9 : context === "tree-val" ? 3 : 0
    );
    if (arr.length) arr.pop();
    if (!completed) arr.push(styled("clear", " …"));
    return expandIfNormal(
      context,
      arg,
      frag(styled("tag", arg.constructor.name), " { ", ...arr, " }")
    );
  },
};

const objects = {
  GleamCustomType(arg: Object, context: Context): Node | string {
    const name = arg.constructor.name;
    if (context === "field") return frag(styled("tag", name), "(…)");

    let entries = Object.entries(arg);
    const limit = context === "normal" ? 9 : context === "tree-val" ? 3 : 0;
    let completed = true;
    if (entries.length > limit) {
      entries = entries.slice(0, limit);
      completed = false;
    }

    const arr: (Node | string | H)[] = [];
    let i = 0;
    for (const [k, v] of entries) {
      const nextContext = entries.length === 1 ? "tree-val" : "field";
      if (+k == i) {
        arr.push(format(v, nextContext), ", ");
        i++;
      } else {
        arr.push(formatField(k), ": ", format(v, nextContext), ", ");
      }
    }
    if (!completed) arr.push(styled("clear", "…"));
    else if (arr.length) arr.pop();

    return expandIfNormal(
      context,
      arg,
      arr.length === 0
        ? styled("tag", name)
        : frag(styled("tag", name), "(", ...arr, ")")
    );
  },

  GleamList(arg: GleamList<any>, context: Context): Node | string {
    const frags = [];
    let head = arg;
    const limit = context === "normal" ? 40 : context === "tree-val" ? 10 : 0;
    let omitted = false;

    while ("head" in head) {
      if (frags.length === limit) {
        omitted = true;
        break;
      }
      frags.push(format(head.head, "field"));
      frags.push(", ");
      head = head.tail;
    }

    if (omitted) {
      return expandIfNormal(
        context,
        arg,
        frag("[", ...frags, styled("clear", `…`), "]")
      );
    } else {
      if (frags.length > 0) frags.pop();
      return expandIfNormal(context, arg, frag("[", ...frags, "]"));
    }
  },

  GleamTuple(arg: Array<any>, context: Context): Node | string {
    if (context === "field") {
      return frag("#(", styled("clear", `…${arg.length} items`), ")");
    }

    const shown = context === "normal" ? 40 : 10;
    const arr = arg.slice(0, shown).flatMap((v) => [format(v, "field"), ", "]);
    if (arr.length) arr.pop();
    if (shown < arg.length) {
      arr.push(styled("clear", ` …${arg.length - shown} more items`));
    }
    return expandIfNormal(context, arg, frag("#(", ...arr, ")"));
  },

  Object(arg: Object, context: Context): Node | string {
    if (context === "field") return "{…}";

    const arr: (Node | string | H)[] = [];
    const completed = enumerateSafe(
      arg,
      (k, v) => arr.push(formatField(k), ": ", format(v, "field"), ", "),
      context === "normal" ? 9 : context === "tree-val" ? 3 : 0
    );
    if (arr.length) arr.pop();
    if (!completed) arr.push(styled("clear", " …"));

    return expandIfNormal(context, arg, frag("{ ", ...arr, " }"));
  },
  Array(arg: Array<any>, context: Context): Node | string {
    if (context === "field") {
      return frag("[", styled("clear", `…${arg.length} items`), "]");
    }

    const shown = context === "normal" ? 40 : 10;
    const arr = arg.slice(0, shown).flatMap((v) => [format(v, "field"), ", "]);
    if (arr.length) arr.pop();
    if (shown < arg.length) {
      arr.push(styled("clear", ` …${arg.length - shown} more items`));
    }
    return expandIfNormal(context, arg, frag("[", ...arr, "]"));
  },
  Element(arg: Element, context: Context): Node | string {
    try {
      if (context === "field") {
        return frag("<", styled("tag", arg.nodeName.toLowerCase()), ">");
      }

      const attrs: (Node | string)[] = [];
      for (let i = 0; i < arg.attributes.length; i++) {
        const attr = arg.attributes[i];
        attrs.push(` ${attr.localName}=`);
        attrs.push(styled("str", JSON.stringify(attr.value)));
      }
      return expandIfNormal(
        context,
        arg,
        frag("<", styled("tag", arg.nodeName.toLowerCase()), ...attrs, ">")
      );
    } catch (e) {
      return expandIfNormal(context, arg, styled("tag", arg.constructor.name));
    }
  },
  Error(arg: Error, context: Context): Node | string {
    if (context === "field") return styled("tag", arg.name);

    return expandIfNormal(
      context,
      arg,
      frag(styled("tag", arg.name), " ", styled("repr", arg.message))
    );
  },
  Date(arg: Date, context: Context): Node | string {
    const name = arg.constructor.name;
    if (context === "field") return styled("tag", name);

    return expandIfNormal(
      context,
      arg,
      frag(styled("tag", name), " ", styled("repr", arg.toString()))
    );
  },
  CSSStyleDeclaration(
    arg: CSSStyleDeclaration,
    context: Context
  ): Node | string {
    const name = arg.constructor.name;
    if (context === "field") return styled("tag", name);

    return expandIfNormal(
      context,
      arg,
      frag(
        styled("tag", name),
        " ",
        styled("repr", JSON.stringify(arg.cssText))
      )
    );
  },
  HTMLDocument(arg: Document, context: Context): Node | string {
    const name = arg.constructor.name;
    if (context === "field") return styled("tag", name);

    return expandIfNormal(
      context,
      arg,
      frag(
        styled("tag", name),
        " ",
        styled("repr", JSON.stringify(arg.documentURI))
      )
    );
  },
  Window(arg: Window, context: Context): Node | string {
    const name = arg.constructor.name;
    if (context === "field") return styled("tag", name);

    return expandIfNormal(
      context,
      arg,
      frag(
        styled("tag", name),
        " ",
        styled("repr", JSON.stringify(arg.location.href))
      )
    );
  },
  Promise(arg: Promise<any>, context: Context): Node | string {
    const name = arg.constructor.name;
    if (context === "field") return styled("tag", name);

    const click = (e: Event) => {
      const target = e.target as Element;
      arg.then(
        (value) =>
          target.replaceWith(
            styled("repr", "fulfilled: "),
            format(value, context)
          ),
        (err) =>
          target.replaceWith(styled("repr", "rejected: "), format(err, context))
      );
    };
    return expandIfNormal(
      context,
      arg,
      frag(
        styled("tag", name),
        " ",
        h({ tag: "button", on: { click }, children: "await" })
      )
    );
  },

  Number(arg: Number, context: Context): Node | string {
    if (context === "field") return primitives.number(arg.valueOf(), context);
    return expandIfNormal(
      context,
      arg,
      primitives.number(arg.valueOf(), context)
    );
  },
  String(arg: String, context: Context): Node | string {
    if (context === "field") return primitives.string(arg.valueOf(), context);
    return expandIfNormal(
      context,
      arg,
      primitives.string(arg.valueOf(), context)
    );
  },
  Boolean(arg: Boolean, context: Context): Node | string {
    if (context === "field") return primitives.boolean(arg.valueOf(), context);
    return expandIfNormal(
      context,
      arg,
      primitives.boolean(arg.valueOf(), context)
    );
  },
};

function format(arg: any, context: Context): Node | string {
  return primitives[typeof arg](arg, context);
}

function formatField(k: string) {
  return /^[\w_\d]+$/.test(k)
    ? styled("field", k)
    : styled("str", JSON.stringify(k));
}

function expandIfNormal(
  context: Context,
  value: any,
  fragment: Node | string
): Node | string {
  return context === "normal" ? expandable(value, fragment) : fragment;
}

function arrowButton(
  closed = false,
  onToggle: (closed: boolean, e: MouseEvent) => void
): HTMLElement {
  const el = document.createElement("button");
  el.className = "arrow-button";
  el.textContent = closed ? "⏵" : "⏷";
  el.addEventListener("click", (e) => {
    closed = !closed;
    el.textContent = closed ? "⏵" : "⏷";
    onToggle(closed, e);
  });
  return el;
}

const objConstructor = Object.getPrototypeOf({});

function openObject(obj: object): Node {
  if (typeof obj === "function") {
    return h({ className: "object", children: obj.toString() });
  } else {
    const entryNodes: Node[] = [];
    enumerateSafe(obj, (k, v) => {
      if ((typeof v === "object" && v != null) || typeof v === "function") {
        entryNodes.push(
          expandable(v, frag(formatField(k), ": ", format(v, "tree-val")))
        );
      } else {
        entryNodes.push(
          h({ children: frag(formatField(k), ": ", format(v, "tree-val")) })
        );
      }
    });
    const proto = Object.getPrototypeOf(obj);
    if (proto != null && proto !== objConstructor) {
      entryNodes.push(
        expandable(
          proto,
          frag(
            styled("clear", "[[Prototype]]"),
            ": ",
            styled("tag", proto.constructor.name)
          )
        )
      );
    }

    return h({ className: "object", children: frag(...entryNodes) });
  }
}

function enumerateSafe<T extends object>(
  obj: T,
  forEach: (k: keyof T, v: any) => void,
  limit = -1
): boolean {
  type Key = keyof T;
  type Descriptors = Record<Key, PropertyDescriptor>;

  let count = 0;
  const ownKeys = Object.getOwnPropertyNames(obj) as Key[];
  for (const key of ownKeys) {
    let value: any;
    try {
      value = obj[key];
    } catch (e) {
      value = e;
    }
    forEach(key, value);
    if (limit !== -1) {
      count++;
      if (count === limit) return false;
    }
  }

  let proto = Object.getPrototypeOf(obj);
  while (proto != null && proto !== objConstructor) {
    const descriptors = Object.getOwnPropertyDescriptors(proto) as Descriptors;
    for (const key in descriptors) {
      const desc = descriptors[key];
      if (desc.get && desc.enumerable) {
        let value: any;
        try {
          value = obj[key];
        } catch (ex) {
          value = ex;
        }
        forEach(key, value);
        if (limit !== -1) {
          count++;
          if (count === limit) return false;
        }
      }
    }
    proto = Object.getPrototypeOf(proto);
  }
  return true;
}

function expandable(
  obj: object,
  titleClosed: string | Node,
  titleOpen?: string | Node
): HTMLElement {
  const titleNode = h({ children: titleClosed });

  const bodyNode = h({});
  const arrow = arrowButton(true, (closed, _) => {
    if (closed) {
      bodyNode.style.display = "none";
      if (titleOpen) {
        titleNode.innerHTML = "";
        titleNode.append(titleClosed);
      }
    } else {
      if (bodyNode.childElementCount === 0) {
        bodyNode.append(openObject(obj));
      }
      bodyNode.style.display = "block";
      if (titleOpen) {
        titleNode.innerHTML = "";
        titleNode.append(titleOpen);
      }
    }
  });

  const elem = h({
    className: "expand",
    children: frag(arrow, titleNode, bodyNode),
  });
  return elem;
}

const consoleFields = [
  "assert",
  "clear",
  "count",
  "countReset",
  "debug",
  // "dir", // not supported
  // "dirxml", // not supported
  "error",
  "group",
  "groupCollapsed",
  "groupEnd",
  "info",
  "log",
  // "table", // not supported
  "time",
  "timeEnd",
  "timeLog",
  "timeStamp",
  "trace",
  "warn",
] as const;
type ConsoleFields = typeof consoleFields[number];

const browserConsole: { [key in ConsoleFields]: (...args: any[]) => void } =
  {} as any;
consoleFields.forEach((name) => (browserConsole[name] = console[name]));

/**
 * Accepts a function as string and returns the signature.
 *
 * This parses the string superficially (i.e. it removes comments and handles strings and regular
 * expressions) so examples like the following work:
 *
 *     function foo(x = /hello\)/, [y] = ")\"".split("")) {}
 *
 * @param signature the full function including body
 * @returns the function signature (without body)
 */
function shortenSignature(signature: string): string {
  const sig = signature.replace(/(\/\/.*?\n|\/\*.*?\*\/)/g, "");
  let body = sig.replace(/^(async\s*)?(function\s*)?\*?\s*[\w\d]*\s*/, "");
  if (body.startsWith("=>")) {
    body = body.substr(2);
  } else {
    type ParseState = "normal" | "d-string" | "s-string" | "t-string" | "regex";
    let state: ParseState = "normal";
    let openParens = 0;
    let regexOpenBrackets = 0;
    let isBackslash = false;

    loop: for (let i = 0; i < body.length; i++) {
      const c = body.charAt(i);
      switch (state) {
        case "normal":
          if (c === "(") openParens += 1;
          else if (c === ")") {
            openParens -= 1;
            if (openParens === 0) {
              body = body.substr(i + 1).trimStart();
              if (body.startsWith("=>")) body = body.substr(2);
              break loop;
            }
          } else if (c === '"') state = "d-string";
          else if (c === "'") state = "s-string";
          else if (c === "`") state = "t-string";
          else if (c === "/") {
            const prev = body.substr(0, i).trimEnd();
            const prevChar = prev.charAt(prev.length - 1);
            if (/[=;,():+\-*/<>|&%/?~]/.test(prevChar)) {
              state = "regex";
              regexOpenBrackets = 0;
            }
          }
          break;
        case "d-string":
          if (c === "\\") isBackslash = !isBackslash;
          else if (isBackslash) isBackslash = false;
          else if (c === '"' && !isBackslash) state = "normal";
          break;
        case "s-string":
          if (c === "\\") isBackslash = !isBackslash;
          else if (isBackslash) isBackslash = false;
          else if (c === "'" && !isBackslash) state = "normal";
          break;
        case "t-string":
          if (c === "\\") isBackslash = !isBackslash;
          else if (isBackslash) isBackslash = false;
          else if (c === "`" && !isBackslash) state = "normal";
          break;
        case "regex":
          if (c === "\\") isBackslash = !isBackslash;
          else if (isBackslash) isBackslash = false;
          else if (c === "[" || c === "{" || c === "(") regexOpenBrackets += 1;
          else if (c === "]" || c === "}" || c === ")") regexOpenBrackets -= 1;
          else if (c === "/" && regexOpenBrackets === 0) state = "normal";
      }
    }
  }
  const sigLength = sig.length - body.length;

  if (sig.startsWith("class ")) {
    return (sig.substr(0, sigLength) + " }").replace(/[\s\n]+/g, " ");
  }

  return sig.substr(0, sigLength).replace(/(\s*=>)?\s*$/, "");
}
