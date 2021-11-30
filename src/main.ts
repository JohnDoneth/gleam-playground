import { ModuleFormat, OutputOptions, rollup } from "rollup";
import * as hypothetical from "rollup-plugin-hypothetical";
import * as gleamWasm from "gleam-wasm";

import { EditorState, basicSetup } from "@codemirror/basic-setup";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";

import { gleam } from "codemirror-gleam-lang";

import { registerGleam } from "./gleam";

import * as monaco from "monaco-editor";

import "./index.css";

registerGleam(monaco);

// @ts-ignore
self.MonacoEnvironment = {
  getWorkerUrl: function (moduleId, label) {
    if (label === "json") {
      return "./json.worker.bundle.js";
    }
    if (label === "css" || label === "scss" || label === "less") {
      return "./css.worker.bundle.js";
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return "./html.worker.bundle.js";
    }
    if (label === "typescript" || label === "javascript") {
      return "./ts.worker.bundle.js";
    }
    return "./editor.worker.bundle.js";
  },
};

const initialSource = `import gleam/io

pub fn main() {
  io.print("hi")
  42
}`;

const source = localStorage.getItem("gleam-source") || initialSource;

// const gleamEditor = new EditorView({
//   state: EditorState.create({
//     doc: source,
//     extensions: [basicSetup, keymap.of([indentWithTab]), gleam()],
//   }),
//   parent: document.getElementById("gleam-editor"),
// });

const gleamEditor = monaco.editor.create(
  document.getElementById("gleam-editor"),
  {
    value: source,
    language: "gleam",
    automaticLayout: true,
  }
);

const jsEditor = monaco.editor.create(document.getElementById("js-editor"), {
  value: "// Click Build & Run to see JavaScript output here.",
  language: "javascript",
  automaticLayout: true,
});

// const jsBundleEditor = monaco.editor.create(
//   document.getElementById("js-bundle-editor"),
//   {
//     value: "// Click Build & Run to see JavaScript output here.",
//     language: "javascript",
//     automaticLayout: true,
//   }
// );

async function bundle(files) {
  const inputOptions = {
    input: {
      main: "main.js",
    },
    plugins: [
      hypothetical({
        cwd: "",
        files: files,
      }),
    ],
  };
  const outputOptions: OutputOptions = {
    format: "iife" as ModuleFormat,
  };
  const bundle = await rollup(inputOptions);
  const { output } = await bundle.generate(outputOptions);
  return output[0].code;
}

async function compile() {
  const gleam_input = gleamEditor.getValue();

  localStorage.setItem("gleam-source", gleam_input);

  const files = (await gleamWasm).compile_to_js(gleam_input);

  if (files.Ok) {
    jsEditor.setValue(files.Ok["./main.js"]);

    bundle(files.Ok).then((bundled) => {
      //jsBundleEditor.setValue(bundled);

      const evalResult = eval(bundled);

      if (evalResult != undefined && evalResult.hasOwnProperty("main")) {
        document.getElementById("eval-output").textContent = evalResult.main();
      } else {
        document.getElementById("eval-output").textContent =
          "Main function not found. It is defined and public?";
      }
    });
  } else {
    document.getElementById("eval-output").textContent = files.Err;
  }
}

document.getElementById("compile").addEventListener("click", (e) => {
  compile();
});
