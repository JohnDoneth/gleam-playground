import { parser } from "./gleam_parser";

import { LRLanguage } from "@codemirror/language";
import { styleTags, tags as t } from "@codemirror/highlight";
import { foldNodeProp, foldInside, indentNodeProp } from "@codemirror/language";

// let parserWithMetadata = parser.configure({
//   //   props: [
//   //     // styleTags({
//   //     //   Identifier: t.variableName,
//   //     //   Boolean: t.bool,
//   //     //   String: t.string,
//   //     //   LineComment: t.lineComment,
//   //     //   "( )": t.paren,
//   //     // }),
//   //     // indentNodeProp.add({
//   //     //   Application: (context) =>
//   //     //     context.column(context.node.from) + context.unit,
//   //     // }),
//   //     // foldNodeProp.add({
//   //     //   Application: foldInside,
//   //     // }),
//   //   ],
// });

// export const gleam = LRLanguage.define({
//   parser: parser,
//   languageData: {
//     commentTokens: { line: ";" },
//   },
// });

// export const exampleCompletion = gleam.data.of({
//   autocomplete: completeFromList([
//     { label: "defun", type: "keyword" },
//     { label: "defvar", type: "keyword" },
//     { label: "let", type: "keyword" },
//     { label: "cons", type: "function" },
//     { label: "car", type: "function" },
//     { label: "cdr", type: "function" },
//   ]),
// });
