import { rollup } from "rollup";
import * as hypothetical from "rollup-plugin-hypothetical";
import { compile_to_js } from "gleam-wasm";

import { EditorState, basicSetup } from "@codemirror/basic-setup";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";

const initialSource = `import gleam/io

pub fn main() {
  io.print("hi")
  42
}`;

const source = localStorage.getItem("gleam-source") || initialSource;

const gleamEditor = new EditorView({
  state: EditorState.create({
    doc: source,
    extensions: [basicSetup, keymap.of([indentWithTab])],
  }),
  parent: document.getElementById("gleam-editor"),
});

const jsEditor = new EditorView({
  state: EditorState.create({
    doc: "",
    extensions: [basicSetup, keymap.of([indentWithTab]), javascript()],
  }),
  parent: document.getElementById("js-editor"),
});

const jsBundleEditor = new EditorView({
  state: EditorState.create({
    doc: "",
    extensions: [basicSetup, keymap.of([indentWithTab]), javascript()],
  }),
  parent: document.getElementById("js-bundle-editor"),
});

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
  const outputOptions = {
    format: "iife",
  };
  const bundle = await rollup(inputOptions);
  const { output } = await bundle.generate(outputOptions);
  return output[0].code;
}

function compile() {
  const gleam_input = gleamEditor.state.sliceDoc(0);

  localStorage.setItem("gleam-source", gleam_input);

  const files = compile_to_js(gleam_input);

  jsEditor.setState(
    EditorState.create({
      doc: files["./main.js"],
      extensions: [basicSetup, keymap.of([indentWithTab]), javascript()],
    })
  );

  bundle(files).then((bundled) => {
    jsBundleEditor.setState(
      EditorState.create({
        doc: bundled,
        extensions: [basicSetup, keymap.of([indentWithTab]), javascript()],
      })
    );

    document.getElementById("eval-output").textContent = eval(bundled).main();

    console.log({ eval: eval(bundled) });
  });
}

document.getElementById("compile").addEventListener("click", (e) => {
  compile();
});
