import { ModuleFormat, OutputOptions, rollup } from "rollup";
import * as hypothetical from "rollup-plugin-hypothetical";
import * as gleamWasm from "gleam-wasm";
import { Notyf } from "notyf";
import { registerGleam } from "./gleam";
import * as monaco from "monaco-editor";
import { HTMLLogger } from "./log";
import {
  decompressFromBase64 as LZString_decompressFromBase64,
  compressToBase64 as LZString_compressToBase64,
} from "lz-string";
import "./index.css";
import "./logging.css";
import "notyf/notyf.min.css";

// Create an instance of Notyf
const notyf = new Notyf({
  types: [
    {
      type: "success",
      background: "#ffaff3",
      duration: 3000,
      icon: {
        className: "notyf__icon--success",
        color: "black",
      },
    },
  ],
  ripple: false,
});

// @ts-ignore
self.MonacoEnvironment = <monaco.Environment>{
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

enum TargetLanguage {
  JavaScript,
  Erlang,
}

let target = TargetLanguage.JavaScript;
let source = localStorage.getItem("gleam-source") || initialSource;

const urlParams = new URLSearchParams(window.location.search);
const zippedSourceParam = urlParams.get("s");
const sourceParam = urlParams.get("source");

if (zippedSourceParam) {
  source = LZString_decompressFromBase64(zippedSourceParam);
} else if (sourceParam) {
  source = window.atob(sourceParam);
}

const gleamEditor = monaco.editor.create(
  document.getElementById("gleam-editor"),
  {
    value: source,
    language: "gleam",
    automaticLayout: true,
    readOnly: false,
  }
);

const jsEditor = monaco.editor.create(
  document.getElementById("javascript-editor"),
  {
    value: "// Click [Build & Run] to see JavaScript output here…",
    language: "javascript",
    automaticLayout: true,
    readOnly: true,
  }
);

const erlangEditor = monaco.editor.create(
  document.getElementById("erlang-editor"),
  {
    value: "// Click [Build] to see Erlang output here…",
    language: "erlang",
    automaticLayout: true,
    readOnly: true,
  }
);

async function bundle(files: Record<string, string>): Promise<string> {
  const inputOptions = {
    input: {
      main: "gleam-packages/gleam-wasm/main.js",
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

const logger = new HTMLLogger(document.getElementById("eval-output"));

async function compile() {
  const gleam_input = gleamEditor.getValue();

  localStorage.setItem("gleam-source", gleam_input);

  let files: { Ok?: Record<string, string>; Err?: string };
  if (target == TargetLanguage.JavaScript) {
    files = (await gleamWasm).compile_to_js(gleam_input);
  } else {
    files = (await gleamWasm).compile_to_erlang(gleam_input);
  }

  if (files.Ok) {
    if (target == TargetLanguage.JavaScript) {
      jsEditor.setValue(files.Ok["gleam-packages/gleam-wasm/main.js"]);

      // TODO: remove these hardcoded paths.
      files.Ok["./gleam-packages/gleam-wasm/main.js"] =
        files.Ok["gleam-packages/gleam-wasm/main.js"];
      files.Ok["./gleam-packages/gleam-wasm/gleam.js"] =
        files.Ok["gleam-packages/gleam-wasm/gleam.js"];
      files.Ok["gleam-packages/gleam_stdlib/gleam_stdlib.js"] =
        files.Ok["build/packages/gleam_stdlib/src/gleam_stdlib.js"];

      bundle(files.Ok).then((bundled) => {
        const evalResult = eval(bundled);

        logger.clear();
        logger.mountGlobally();

        if (
          evalResult != undefined &&
          Object.prototype.hasOwnProperty.call(evalResult, "main")
        ) {
          try {
            logger.log(evalResult.main());
          } catch (e) {
            if (e.gleam_error) {
              logger.error(
                `Error: ${e.gleam_error}\n  module: ${e.module}\n  line:`,
                e.line,
                `\n  fn: ${e.fn}\n  value:`,
                e.value
              );
            } else {
              logger.error(e);
            }
          }
        } else {
          logger.log("Main function not found. It is defined and public?");
        }
        logger.unmountGlobally();
      });
    } else {
      erlangEditor.setValue(files.Ok["build/dev/erlang/gleam-wasm/main.erl"]);

      logger.log(
        "Compiled successfully!\n\nNote that the Erlang target is not executable in the browser."
      );
    }
  } else {
    logger.clear();
    logger.error(files.Err);
  }
}

document.getElementById("compile").addEventListener("click", (_event) => {
  compile();
});

document.getElementById("share").addEventListener("click", async (_event) => {
  const base64source = LZString_compressToBase64(gleamEditor.getValue());

  const url = new URL(window.location.href.split("?")[0]);
  url.searchParams.append("s", base64source);

  await navigator.clipboard.writeText(url.toString());

  notyf.success("Link copied to clipboard!");
});

document
  .getElementById("target-erlang")
  .addEventListener("click", async (_event) => {
    target = TargetLanguage.Erlang;
    document.getElementById("target-erlang").classList.toggle("active");
    document.getElementById("target-javascript").classList.toggle("active");

    document.getElementById("target-erlang").setAttribute("disabled", "");
    document.getElementById("target-javascript").removeAttribute("disabled");

    targetChanged();
  });

function targetChanged() {
  document.getElementById("javascript-output").classList.toggle("hidden");
  document.getElementById("erlang-output").classList.toggle("hidden");

  if (target == TargetLanguage.JavaScript) {
    document.querySelector("#compile nobr").textContent = "Build & Run";
  } else {
    document.querySelector("#compile nobr").textContent = "Build";
  }

  document.getElementById("eval-output").textContent = "";
}
