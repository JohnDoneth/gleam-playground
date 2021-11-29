import {parser} from "./gleam_parser"
import {LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent} from "@codemirror/language"
import {styleTags, tags as t} from "@codemirror/highlight"
import {completeFromList} from "@codemirror/autocomplete"
import { Extension } from "@codemirror/state"

export const gleamLanguage: LRLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        topExpression: delimitedIndent({closing: "}", align: false})
      }),
      foldNodeProp.add({
        topExpression: foldInside
      }),
      styleTags({
        import: t.keyword,
        pub: t.keyword,
        fn: t.keyword,
        as: t.keyword,
        if: t.keyword,
        assert: t.keyword,
        case: t.keyword,
        const: t.keyword,
        external: t.keyword,
        let: t.keyword,
        opaque: t.keyword,
        todo: t.keyword,
        try: t.keyword,
        type: t.keyword,
        to: t.keyword,
        TypeIdentifier: t.typeName,
        identifier: t.variableName,
        Boolean: t.bool,
        Number: t.number,
        String: t.string,
        LineComment: t.lineComment,
        Variable: t.variableName,
        "{ }": t.brace
      })
    ]
  }),
  languageData: {
    commentTokens: {line: ";"}
  }
})

const gleamCompletion: Extension = gleamLanguage.data.of({
  autocomplete: completeFromList([
    // Keywords
    {label: "import", type: "keyword"},
    {label: "pub", type: "keyword"},
    {label: "fn", type: "keyword"},
    {label: "as", type: "keyword"},
    {label: "assert", type: "keyword"},
    {label: "case", type: "keyword"},
    {label: "const", type: "keyword"},
    {label: "external", type: "keyword"},
    {label: "if", type: "keyword"},
    {label: "let", type: "keyword"},
    {label: "opaque", type: "keyword"},
    {label: "todo", type: "keyword"},
    {label: "try", type: "keyword"},
    {label: "type", type: "keyword"},

    // Stdlib types
    {label: "Int", type: "type"},
    {label: "Float", type: "type"},
    {label: "Uri ", type: "type"},
    {label: "Order", type: "type"},
    {label: "Nil", type: "type"},
    {label: "BitString", type: "type"},
    {label: "Bool", type: "type"},
    {label: "Dynamic", type: "type"},
    {label: "String", type: "type"},
    {label: "StringBuilder", type: "type"},

    // Constructors
    {label: "Some(", type: "function"},
    {label: "None", type: "function"},
    {label: "Ok", type: "function"},
    {label: "Err", type: "function"},
    {label: "True", type: "function"},
    {label: "False", type: "function"},

    // Generic Types
    {label: "Iterator(", type: "type"},
    {label: "List(", type: "type"},
    {label: "Map(", type: "type"},
    {label: "Option(", type: "type"},
    {label: "Result(", type: "type"},
    {label: "Queue(", type: "type"},
    {label: "Set(", type: "type"},

  ])
})

export function gleam(): LanguageSupport {
  return new LanguageSupport(gleamLanguage, gleamCompletion)
}