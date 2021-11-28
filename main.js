import { rollup } from "rollup";
import * as hypothetical from "rollup-plugin-hypothetical";
import { compile_to_js } from "gleam-wasm";

async function bundle(files) {
  const inputOptions = {
    input: {
      main: "main.gleam.js",
    },
    plugins: [
      hypothetical({
        cwd: "",
        files: files,
      }),
    ],
  };
  const outputOptions = {
    dir: "blah",
    format: "iife",
  };
  // create a bundle
  const bundle = await rollup(inputOptions);
  const { output } = await bundle.generate(outputOptions);

  console.log({ output: output });

  return output[0].code;
}

function compile() {
  const gleam_input = document.getElementById("gleam-input").value;

  console.log({ gleam_input: gleam_input });

  let files = compile_to_js(gleam_input);

  console.log(files);

  // files["./main.gleam.js"] = files["main.gleam.js"];
  // files["./gleam.js"] = files["gleam.js"];

  document.getElementById("js-output").textContent = files["main.gleam.js"];

  bundle(files).then((bundled) => {
    document.getElementById("js-bundle-output").textContent = bundled;

    document.getElementById("eval-output").textContent = eval(bundled).main();

    console.log({ eval: eval(bundled) });
  });
}

document.getElementById("compile").addEventListener("click", (e) => {
  compile();
});
