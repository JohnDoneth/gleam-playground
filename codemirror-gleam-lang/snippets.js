import { snippetCompletion } from "@codemirror/autocomplete";

export const snippets = [
  snippetCompletion("fn #{}() ->", {
    label: "function",
    detail: "definition",
    type: "keyword",
  }),
];
