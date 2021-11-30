// Create your own language definition here
// You can safely look at other samples without losing modifications.
// Modifications are not saved on browser refresh/close though -- copy often!

export function registerGleam(monaco) {
  monaco.languages.register({ id: "gleam" });

  monaco.languages.setMonarchTokensProvider("gleam", {
    // Set defaultToken to invalid to see what you do not tokenize yet
    // defaultToken: 'invalid',

    keywords: [
      "import",
      "pub",
      "fn",
      "as",
      "assert",
      "case",
      "const",
      "external",
      "if",
      "let",
      "opaque",
      "todo",
      "try",
      "type",
    ],

    operators: [
      "=",
      ">",
      "<",
      "!",
      "~",
      "?",
      ":",
      "==",
      "<=",
      ">=",
      "!=",
      "&&",
      "||",
      "++",
      "--",
      "+",
      "-",
      "*",
      "/",
      "&",
      "|",
      "^",
      "%",
      "<<",
      ">>",
      ">>>",
      "+=",
      "-=",
      "*=",
      "/=",
      "&=",
      "|=",
      "^=",
      "%=",
      "<<=",
      ">>=",
      ">>>=",
    ],

    // we include these common regular expressions
    symbols: /[=><!~?:&|+\-*\/\^%]+/,

    // C# style strings
    escapes:
      /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

    // The main tokenizer for our languages
    tokenizer: {
      root: [
        // identifiers and keywords
        [
          /[a-z_$][\w$]*/,
          {
            cases: {
              //"@typeKeywords": "keyword",
              "@keywords": "keyword",
              "@default": "identifier",
            },
          },
        ],
        [/[A-Z][\w\$]*/, "type.identifier"], // to show class names nicely

        // whitespace
        { include: "@whitespace" },

        // delimiters and operators
        [/[{}()\[\]]/, "@brackets"],
        [/[<>](?!@symbols)/, "@brackets"],
        [/@symbols/, { cases: { "@operators": "operator", "@default": "" } }],

        // @ annotations.
        // As an example, we emit a debugging log message on these tokens.
        // Note: message are supressed during the first load -- change some lines to see them.
        [
          /@\s*[a-zA-Z_\$][\w\$]*/,
          { token: "annotation", log: "annotation token: $0" },
        ],

        // numbers
        [/\d*\.\d+([eE][\-+]?\d+)?/, "number.float"],
        [/0[xX][0-9a-fA-F]+/, "number.hex"],
        [/\d+/, "number"],

        // delimiter: after number because of .\d floats
        [/[;,.]/, "delimiter"],

        // strings
        [/"([^"\\]|\\.)*$/, "string.invalid"], // non-teminated string
        [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],

        // characters
        [/'[^\\']'/, "string"],
        [/(')(@escapes)(')/, ["string", "string.escape", "string"]],
        [/'/, "string.invalid"],
      ],

      comment: [[/[^\/*]+/, "comment"]],

      string: [
        [/[^\\"]+/, "string"],
        [/@escapes/, "string.escape"],
        [/\\./, "string.escape.invalid"],
        [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
      ],

      whitespace: [
        [/[ \t\r\n]+/, "white"],
        [/\/\*/, "comment", "@comment"],
        [/\/\/.*$/, "comment"],
      ],
    },
  });

  // Register a completion item provider for the new language
  monaco.languages.registerCompletionItemProvider("gleam", {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      var suggestions = [
        {
          label: "",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "simpleText",
        },
        // Keywords
        {
          label: "import",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "import",
        },
        {
          label: "pub",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "pub",
        },
        {
          label: "fn",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "fn",
        },
        {
          label: "as",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "as",
        },
        {
          label: "assert",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "assert",
        },
        {
          label: "case",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "case",
        },
        {
          label: "const",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "const",
        },
        {
          label: "external",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "external",
        },
        {
          label: "if",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "if",
        },
        {
          label: "let",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "let",
        },
        {
          label: "opaque",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "opaque",
        },
        {
          label: "todo",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "todo",
        },
        {
          label: "try",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "try",
        },
        {
          label: "type",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: "type",
        },

        // Stdlib types
        {
          label: "Int",
          kind: monaco.languages.CompletionItemKind.Type,
          insertText: "Int",
        },
        {
          label: "Float",
          kind: monaco.languages.CompletionItemKind.Type,
          insertText: "Float",
        },
        {
          label: "Uri",
          kind: monaco.languages.CompletionItemKind.Type,
          insertText: "Uri",
        },
        {
          label: "Order",
          kind: monaco.languages.CompletionItemKind.Type,
          insertText: "Order",
        },
        {
          label: "Nil",
          kind: monaco.languages.CompletionItemKind.Type,
          insertText: "Nil",
        },
        {
          label: "BitString",
          kind: monaco.languages.CompletionItemKind.Type,
          insertText: "BitString",
        },
        {
          label: "Bool",
          kind: monaco.languages.CompletionItemKind.Type,
          insertText: "Bool",
        },
        {
          label: "Dynamic",
          kind: monaco.languages.CompletionItemKind.Type,
          insertText: "Dynamic",
        },
        {
          label: "String",
          kind: monaco.languages.CompletionItemKind.Type,
          insertText: "String",
        },
        {
          label: "StringBuilder",
          kind: monaco.languages.CompletionItemKind.Type,
          insertText: "StringBuilder",
        },

        // Constructors
        {
          label: "Some",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "Some(",
        },
        {
          label: "None",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "None",
        },
        {
          label: "Ok",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "Ok(",
        },
        {
          label: "Err",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "Err(",
        },
        {
          label: "True",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "True",
        },
        {
          label: "False",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "False",
        },

        // Generic Types
        {
          label: "Iterator",
          kind: monaco.languages.CompletionItemKind.Type,
          insertText: "Iterator(${1:type})",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range: range,
        },
        { label: "List(", kind: monaco.languages.CompletionItemKind.Snippet },
        { label: "Map(", kind: monaco.languages.CompletionItemKind.Snippet },
        { label: "Option(", kind: monaco.languages.CompletionItemKind.Snippet },
        { label: "Result(", kind: monaco.languages.CompletionItemKind.Snippet },
        { label: "Queue(", kind: monaco.languages.CompletionItemKind.Snippet },
        { label: "Set(", kind: monaco.languages.CompletionItemKind.Snippet },
      ];
      return { suggestions: suggestions };
    },
  });
}
