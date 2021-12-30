import { ModuleFormat, OutputOptions, rollup } from "rollup";
import * as hypothetical from "rollup-plugin-hypothetical";
import * as gleamWasmImport from "@gleam-wasm";
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
import "@codemirror/lang-javascript";
import { stdlibFiles } from "./stdlib";

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

enum TargetLanguage {
  JavaScript,
  Erlang,
}

function targetToString(target: TargetLanguage) {
  if (target == TargetLanguage.JavaScript) return "javascript";
  if (target == TargetLanguage.Erlang) return "erlang";
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
      main: "gleam-packages/gleam-wasm/dist/main.mjs",
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

async function compile(gleamWasm, stdlib) {
  const gleam_input = gleamEditor.getValue();

  localStorage.setItem("gleam-source", gleam_input);

  const sourceFiles = Object.assign(
    {
      "./src/main.gleam": gleam_input,
      "build/packages/gleam_stdlib/gleam.toml": 'name = "gleam_stdlib"',
    },
    stdlib
  );

  const files: { Ok?: Record<string, string>; Err?: string } =
    gleamWasm.compile({
      target: targetToString(target),
      sourceFiles: sourceFiles,
      dependencies: ["gleam_stdlib"],
      mode: "Dev",
    });

  if (files.Ok) {
    if (target == TargetLanguage.JavaScript) {
      // - Prefix keys with "./" for Rollup as it does relative lookups.
      // - Files need to be in the gleam-packages directory for Rollup to resolve
      //   the paths correctly.
      const processedFiles = Object.keys(files.Ok).reduce(function (acc, key) {
        const newKey =
          "./" +
          key
            .replace("build/dev/javascript", "gleam-packages")
            .replace("build/packages", "gleam-packages");

        acc[newKey] = files.Ok[key];
        return acc;
      }, {});

      // TODO: Remove the following 'src' to 'dist' path witchcraft.
      processedFiles["./gleam-packages/gleam_stdlib/dist/gleam_stdlib.mjs"] =
        processedFiles[
          "./gleam-packages/gleam_stdlib/src/gleam/gleam_stdlib.mjs"
        ];

      jsEditor.setValue(
        processedFiles["./gleam-packages/gleam-wasm/dist/main.mjs"]
      );

      bundle(processedFiles).then((bundled) => {
        const evalResult = eval(bundled);

        logger.clear();
        logger.mountGlobally();
        logger.showGleamSyntax = true;

        if (
          evalResult != undefined &&
          Object.prototype.hasOwnProperty.call(evalResult, "main")
        ) {
          try {
            logger.log(evalResult.main());
          } catch (e) {
            if (e.gleam_error) {
              logger.error(
                `Error: ${e.message}\n  module: ${e.module}\n  line:`,
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
      erlangEditor.setValue(
        files.Ok["build/dev/erlang/gleam-wasm/build/main.erl"]
      );

      logger.clear();
      logger.log(
        "Compiled successfully!\n\nNote that the Erlang target is not executable in the browser."
      );
    }
  } else {
    logger.clear();
    logger.error(files.Err);
  }
}

async function init() {
  registerGleam(monaco);

  const compileButton = document.getElementById("compile") as HTMLButtonElement;
  const stdlib = await stdlibFiles();
  const gleamWasm = await gleamWasmImport;

  gleamWasm.init(false); // debug: false

  compileButton.disabled = false;
  compileButton.addEventListener("click", (_event) => {
    compile(gleamWasm, stdlib);
  });
}

document.getElementById("share").addEventListener("click", async (_event) => {
  const base64source = LZString_compressToBase64(gleamEditor.getValue());

  const url = new URL(window.location.href.split("?")[0]);
  url.searchParams.append("s", base64source);

  await navigator.clipboard.writeText(url.toString());

  notyf.success("Link copied to clipboard!");
});

document.querySelectorAll(".toggle-button").forEach((elem) => {
  elem.addEventListener("click", async (event) => {
    const elem = event.currentTarget as HTMLInputElement;
    if (elem.id === "target-javascript") {
      target = TargetLanguage.JavaScript;
    } else if (elem.id === "target-erlang") {
      target = TargetLanguage.Erlang;
    }

    document.getElementById("target-javascript").classList.toggle("active");
    document.getElementById("target-erlang").classList.toggle("active");

    (<HTMLInputElement>document.getElementById("target-javascript")).disabled =
      !document.getElementById("target-javascript");
    (<HTMLInputElement>document.getElementById("target-erlang")).disabled =
      !document.getElementById("target-erlang");

    targetChanged();
  });
});

function targetChanged() {
  document.getElementById("javascript-output").classList.toggle("hidden");
  document.getElementById("erlang-output").classList.toggle("hidden");

  if (target == TargetLanguage.JavaScript) {
    document.querySelector("#compile nobr").textContent = "Build & Run";
  } else {
    document.querySelector("#compile nobr").textContent = "Build";
  }

  document.getElementById("eval-output").innerHTML =
    '<div data-log-level="clear" class="placeholder">Output…</div>';
}

init();
