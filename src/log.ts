import { H, h, hh as frag, styled } from "./virtualdom";

export class HtmlLogger {
    private counts = {};
    private timers = {};
    private activeGroup: HTMLElement;

    constructor(private element: HTMLElement) {
        element.classList.add('log-container');
        this.activeGroup = element;
    }

    mountGlobally() {
        consoleFields.forEach(field => console[field] = (...args: any[]) => this[field](...args));
    }

    unmountGlobally() {
        consoleFields.forEach(field => console[field] = browserConsole[field]);
    }

    private logAtLogLevel(logLevel: string, args: any[]) {
        const item = document.createElement('div');
        item.setAttribute('data-log-level', logLevel);
        for (const arg of args) {
            item.append(toLogItem(arg, 2));
            item.append(' ');
        }
        this.activeGroup.append(item);
    }

    assert(condition: boolean, ...args: any[]) {
        if (!condition) {
            this.logAtLogLevel('error', args);
            browserConsole.error(...args);
        }
    }

    clear() {
        this.element.innerHTML = '';
        this.activeGroup = this.element;
        browserConsole.clear();
    }

    count(label = 'default') {
        const count = this.counts[label] ?? 0;
        this.counts[label] = count + 1;
        this.logAtLogLevel('log', [label + ":", count]);
        browserConsole.count(label);
    }

    countReset(label = 'default') {
        this.counts[label] = 0;
        this.logAtLogLevel('log', [label + ":", 0]);
        browserConsole.countReset(label);
    }

    debug(...args: any[]) {
        this.logAtLogLevel('debug', args);
        browserConsole.debug(...args);
    }

    error(...args: any[]) {
        this.logAtLogLevel('error', args);
        browserConsole.error(...args);
    }

    group(label = '<Unnamed group>') {
        const newGroup = document.createElement('div');
        newGroup.className = 'console-group';

        const arrow = arrowButton(false, (closed) => {
            if (closed) newGroup.classList.add('closed');
            else newGroup.classList.remove('closed');
        });

        const header = document.createElement('div');
        header.className = 'group-header';
        header.append(arrow, label);

        this.activeGroup.append(header, newGroup);
        this.activeGroup = newGroup;

        browserConsole.group(label);
    }

    groupCollapsed(label = '<Unnamed group>') {
        const newGroup = document.createElement('div');
        newGroup.className = 'console-group closed';

        const arrow = arrowButton(true, (closed) => {
            if (closed) newGroup.classList.add('closed');
            else newGroup.classList.remove('closed');
        });

        const header = document.createElement('div');
        header.append(arrow, `<b>${label}</b>`);

        this.activeGroup.append(header, newGroup);
        this.activeGroup = newGroup;

        browserConsole.groupCollapsed(label);
    }

    groupEnd() {
        if (this.activeGroup !== this.element) {
            this.activeGroup = this.activeGroup.parentElement;
        }

        browserConsole.groupEnd();
    }

    info(...args: any[]) {
        this.logAtLogLevel('info', args);
        browserConsole.info(...args);
    }

    log(...args: any[]) {
        this.logAtLogLevel('log', args);
        browserConsole.log(...args);
    }

    time(label = 'default') {
        if (label in this.timers) {
            this.logAtLogLevel('warn', [`Timer ${label} already exists`]);
            return;
        }
        this.counts[label] = +new Date();
        browserConsole.time(label);
    }

    timeEnd(label = 'default') {
        if (!(label in this.timers)) {
            this.logAtLogLevel('warn', [`Timer ${label} doesn't exist`]);
            return;
        }
        const elapsed = +new Date() - this.timers[label];
        if (elapsed > 1000) {
            this.logAtLogLevel('log', [`${label}: ${elapsed / 1000}s - timer ended`]);
        } else {
            this.logAtLogLevel('log', [`${label}: ${elapsed}ms - timer ended`]);
        }
        delete this.timers[label];
        browserConsole.timeEnd(label);
    }

    timeLog(label = 'default') {
        if (!(label in this.timers)) {
            this.logAtLogLevel('warn', [`Timer ${label} doesn't exist`]);
            return;
        }
        const elapsed = +new Date() - this.timers[label];
        if (elapsed > 1000) {
            this.logAtLogLevel('log', [`${label}: ${elapsed / 1000}s`]);
        } else {
            this.logAtLogLevel('log', [`${label}: ${elapsed}ms`]);
        }
        browserConsole.timeLog(label);
    }

    trace(...args: any[]) {
        try {
            throw new Error();
        } catch (e) {
            if (args.length) {
                this.logAtLogLevel('trace', args);
            }
            let stack: string[] = e.stack.split('\n');
            stack = stack.slice(stack[0] === 'Error' ? 3 : 2);

            this.logAtLogLevel('trace', [stack.join('\n')]);
        }
        browserConsole.trace(...args);
    }

    warn(...args: any[]) {
        this.logAtLogLevel('warn', args);
        browserConsole.warn(...args);
    }
}

function toLogItem(arg: any, details = 0): Node {
    switch (typeof arg) {
        case "string":
            if (details >= 2) {
                return h(arg);
            } else if (arg.length > 200) {
                const json = JSON.stringify(arg);
                return styled('str', frag(
                    json.substr(0, 170),
                    styled('clear', h('...')),
                    json.substr(json.length - 20),
                ));
            } else {
                return styled('str', JSON.stringify(arg));
            }
        case "number":
            return styled('num', arg + '');
        case "bigint":
            return styled('num', arg + 'n');
        case "symbol":
            return styled('sym', `Symbol(${arg.description})`);
        case "undefined":
            return styled('undef', 'undefined');
        case "boolean":
            return styled('bool', '' + arg);
        case "function":
            let text: string;
            if (details >= 2) {
                text = arg.toString().replace(/^function/, '');
            } else if (details === 1) {
                text = shortenSignature(arg.toString()).replace(/^function\s*/, '');
            } else {
                text = arg.name == '' ? '' : arg.name + '()';
            }
            return expandable(arg, styled('fn', text === '' ? 'f()' : 'f '), text);
        case "object":
            if (arg === null) return styled('undef', 'null');
            if (arg instanceof Array) {
                if (details <= 0) {
                    return expandable(arg, '[', styled('clear', arg.length + ' elements'), ']');
                } else {
                    const shown = details === 2 ? 40 : 10;
                    const arr = arg.slice(0, shown).flatMap((v) => [toLogItem(v), ', ']);
                    if (arr.length) arr.pop();
                    if (shown < arg.length) {
                        arr.push(styled('clear', ` ...${arg.length - shown} more elements`));
                    }
                    return expandable(arg, '[', ...arr, ']');
                }
            }
            if (details <= 0) {
                return expandable(arg, styled('tag', arg.constructor.name));
            }
            if (arg.constructor === Object) {
                const arr: (Node | string | H)[] = [];
                const completed = enumerateSafe(arg, (k, v) => {
                    arr.push(toLogItem(k), ': ', toLogItem(v), ', ');
                }, details === 2 ? 50 : details === 1 ? 10 : 4);
                if (arr.length) arr.pop();
                if (!completed) arr.push(styled('clear', ' ...some entries omitted'));

                return expandable(arg, '{ ', ...arr, ' }');
            }
            switch (arg.constructor) {
                case Date:
                    return expandable(arg, styled('tag', 'Date'), ' ', styled('repr', arg.toString()));
                case Number:
                    return expandable(arg, styled('tag', 'Number'), ' ', styled('num', arg + ''));
                case Boolean:
                    return expandable(arg, styled('tag', 'Boolean'), ' ', styled('bool', arg + ''));
                case String:
                    return expandable(arg, styled('tag', 'String'), ' ', styled('str', JSON.stringify(arg)));
                default:
                    if (arg instanceof Element) {
                        const attrs: (Node | string)[] = []
                        for (let i = 0; i < arg.attributes.length; i++) {
                            const attr = arg.attributes[i];
                            attrs.push(` ${attr.localName}=`);
                            attrs.push(styled('str', JSON.stringify(attr.value)));
                        }
                        return expandable(arg, '<', styled('tag', arg.nodeName.toLowerCase()), ...attrs, '>');
                    } else if (arg instanceof Error) {
                        return expandable(arg, styled('tag', arg.name), ' ', styled('repr', arg.message));
                    } else if (arg instanceof Promise) {
                        return expandable(
                            arg,
                            styled('tag', arg.constructor.name),
                            ' ',
                            h({
                                tag: 'button', on: {
                                    click(e) {
                                        arg.then(value => {
                                            (e.target as HTMLElement).replaceWith(
                                                styled('repr', 'fulfilled: '),
                                                toLogItem(value, details),
                                            );
                                        }, err => {
                                            (e.target as HTMLElement).replaceWith(
                                                styled('repr', 'rejected: '),
                                                toLogItem(err, details),
                                            );
                                        });
                                    }
                                }
                            }, 'await'),
                        );
                    }

                    const arr: (Node | string | H)[] = [];
                    const completed = enumerateSafe(arg, (k, v) => {
                        arr.push(toLogItem(k), ': ', toLogItem(v), ', ');
                    }, details === 2 ? 25 : details === 1 ? 8 : 3);
                    if (arr.length) arr.pop();
                    if (!completed) arr.push(styled('clear', ' ...some entries omitted'));
                    return expandable(arg, styled('tag', arg.constructor.name), ' { ', ...arr, ' }');
            }
    }
}

function arrowButton(closed = false, onToggle: (closed: boolean, e: MouseEvent) => void): HTMLElement {
    const el = document.createElement('button');
    el.className = 'arrow-button';
    el.textContent = closed ? '⏵' : '⏷';
    el.addEventListener('click', (e) => {
        closed = !closed;
        el.textContent = closed ? '⏵' : '⏷';
        onToggle(closed, e);
    });
    return el;
}

function openObject(obj: object): Node {
    if (typeof obj === 'function') {
        return h({ className: 'object' }, obj.toString());
    } else {
        const entryNodes: Node[] = [];
        enumerateSafe(obj, (k, v) => {
            const key = /^[\w\d]+$/.test(k) ? styled('tag', k) : styled('str', JSON.stringify(k));
            entryNodes.push(h({}, frag(key, ': ', toLogItem(v, v === obj ? 0 : 1))));
        })
        if ((obj as any).__proto__ != null) {
            entryNodes.push(h({}, frag(styled('clear', '<prototype>'), ': ', toLogItem((obj as any).__proto__, 0))));
        }

        return h({ className: 'object' }, frag(
            h({ tag: 'b', className: 'tag' }, obj.constructor.name),
            ...entryNodes,
        ));
    }
}

function enumerateSafe(obj: object, forEach: (k: string, v: any) => void, limit = -1): boolean {
    let count = 0;
    const found = {};
    for (const key in obj) {
        found[key] = true;
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

    const ownKeys = Object.getOwnPropertyNames(obj);
    for (const key of ownKeys) {
        if (found[key]) continue;
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
    return true;
}

function expandable(obj: object, ...closedState: (string | Node | H)[]): Node {
    const closedNode = h({}, frag(...closedState));
    return frag(arrowButton(true, (closed, e) => {
        const node = e.target as HTMLElement;
        const next = node.nextElementSibling;
        if (closed) {
            node.parentElement.insertBefore(closedNode, next);
            next.remove();
        } else {
            node.parentElement.insertBefore(openObject(obj), next);
            next.remove();
        }
    }), closedNode);
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

const browserConsole: { [key in ConsoleFields]: (...args: any[]) => void } = {} as any;
consoleFields.forEach(name => browserConsole[name] = console[name]);

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
    const sig = signature.replace(/(\/\/.*?\n|\/\*.*?\*\/)/, '');
    let body = sig.replace(/^(async\s*)?(function\s*)?\*?\s*[\w\d]*\s*/, '');
    if (body.startsWith('=>')) {
        body = body.substr(2);
    } else {
        type ParseState = 'normal' | 'd-string' | 's-string' | 't-string' | 'regex';
        let state: ParseState = 'normal';
        let openParens = 0;
        let regexOpenBrackets = 0;
        let isBackslash = false;

        loop: for (let i = 0; i < body.length; i++) {
            const c = body.charAt(i);
            switch (state) {
                case 'normal':
                    if (c === '(') openParens += 1;
                    else if (c === ')') {
                        openParens -= 1;
                        if (openParens === 0) {
                            body = body.substr(i + 1).trimStart();
                            if (body.startsWith('=>')) body = body.substr(2);
                            break loop;
                        }
                    }
                    else if (c === '"') state = 'd-string';
                    else if (c === "'") state = 's-string';
                    else if (c === '`') state = 't-string';
                    else if (c === '/') {
                        const prev = body.substr(0, i).trimEnd();
                        const prevChar = prev.charAt(prev.length - 1);
                        if (/[=;,():+\-*/<>|&%/?~]/.test(prevChar)) {
                            state = 'regex';
                            regexOpenBrackets = 0;
                        }
                    }
                    break;
                case 'd-string':
                    if (c === '\\') isBackslash = !isBackslash;
                    else if (isBackslash) isBackslash = false;
                    else if (c === '"' && !isBackslash) state = 'normal';
                    break;
                case 's-string':
                    if (c === '\\') isBackslash = !isBackslash;
                    else if (isBackslash) isBackslash = false;
                    else if (c === "'" && !isBackslash) state = 'normal';
                    break;
                case 't-string':
                    if (c === '\\') isBackslash = !isBackslash;
                    else if (isBackslash) isBackslash = false;
                    else if (c === "`" && !isBackslash) state = 'normal';
                    break;
                case 'regex':
                    if (c === '\\') isBackslash = !isBackslash;
                    else if (isBackslash) isBackslash = false;
                    else if (c === '[' || c === '{' || c === '(') regexOpenBrackets += 1;
                    else if (c === ']' || c === '}' || c === ')') regexOpenBrackets -= 1;
                    else if (c === '/' && regexOpenBrackets === 0) state = 'normal';
            }
        }
    }
    const sigLength = sig.length - body.length;
    return sig.substr(0, sigLength).replace(/(\s*=>)?\s*$/, '');
}
