import { ModuleFormat, OutputOptions, rollup } from "rollup";
import * as hypothetical from "rollup-plugin-hypothetical";
import * as gleamWasm from "gleam-wasm";
import { Notyf } from 'notyf';
import { registerGleam } from "./gleam";
import * as monaco from "monaco-editor";

import "./index.css";
import 'notyf/notyf.min.css';

// Create an instance of Notyf
const notyf = new Notyf({
  types: [
    {
      type: 'success',
      background: '#ffaff3',
      duration: 30000,
      icon: {
        className: 'notyf__icon--success',
        color: "black"
      }
    }
  ],
  ripple: false
});

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

registerGleam(monaco);

const initialSource = `import gleam/io

pub fn main() {
  io.print("hi")
  42
}`;

let source = localStorage.getItem("gleam-source") || initialSource;

const urlParams = new URLSearchParams(window.location.search);
const sourceParam = urlParams.get('source');

if (sourceParam) {
  source = window.atob(sourceParam);
}

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

async function bundle(files) {
  const inputOptions = {
    input: {
      main: "./gleam-packages/gleam-wasm/main.js",
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
    console.log(files)

    jsEditor.setValue(files.Ok["./gleam-packages/gleam-wasm/main.js"]);

    bundle(files.Ok).then((bundled) => {
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

document.getElementById("share").addEventListener("click", async (e) => {
  let base64source = window.btoa(gleamEditor.getValue());

  var url = new URL(window.location.href.split('?')[0]);
  url.searchParams.append("source", base64source);

  await navigator.clipboard.writeText(url.toString());
  
  notyf.success("Link Copied to Clipboard!");
});


