// This code is begging for language-level macros or a webpack plugin.
// This can definitely be cleaner.
const FILES = {
  "build/packages/gleam_stdlib/src/gleam/base.gleam": import(
    "libs/gleam_stdlib/src/gleam/base.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/bit_builder.gleam": import(
    "libs/gleam_stdlib/src/gleam/bit_builder.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/bit_string.gleam": import(
    "libs/gleam_stdlib/src/gleam/bit_string.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/bool.gleam": import(
    "libs/gleam_stdlib/src/gleam/bool.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/dynamic.gleam": import(
    "libs/gleam_stdlib/src/gleam/dynamic.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/float.gleam": import(
    "libs/gleam_stdlib/src/gleam/float.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/function.gleam": import(
    "libs/gleam_stdlib/src/gleam/function.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/int.gleam": import(
    "libs/gleam_stdlib/src/gleam/int.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/io.gleam": import(
    "libs/gleam_stdlib/src/gleam/io.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/iterator.gleam": import(
    "libs/gleam_stdlib/src/gleam/iterator.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/list.gleam": import(
    "libs/gleam_stdlib/src/gleam/list.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/map.gleam": import(
    "libs/gleam_stdlib/src/gleam/map.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/option.gleam": import(
    "libs/gleam_stdlib/src/gleam/option.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/order.gleam": import(
    "libs/gleam_stdlib/src/gleam/order.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/pair.gleam": import(
    "libs/gleam_stdlib/src/gleam/pair.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/queue.gleam": import(
    "libs/gleam_stdlib/src/gleam/queue.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/regex.gleam": import(
    "libs/gleam_stdlib/src/gleam/regex.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/result.gleam": import(
    "libs/gleam_stdlib/src/gleam/result.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/set.gleam": import(
    "libs/gleam_stdlib/src/gleam/set.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/string_builder.gleam": import(
    "libs/gleam_stdlib/src/gleam/string_builder.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/string.gleam": import(
    "libs/gleam_stdlib/src/gleam/string.gleam"
  ),
  "build/packages/gleam_stdlib/src/gleam/uri.gleam": import(
    "libs/gleam_stdlib/src/gleam/uri.gleam"
  ),
  //"libs/gleam_stdlib/src/gleam/gleam_stdlib.gleam":  import("libs/gleam_stdlib/src/gleam_stdlib.erl"),
  "build/packages/gleam_stdlib/src/gleam/gleam_stdlib.mjs": import(
    "libs/gleam_stdlib/src/gleam_stdlib.mjs"
  ),
};

export async function stdlibFiles(): Promise<object> {
  const imports = {};

  for (const [key, importValue] of Object.entries(FILES)) {
    imports[key] = (await importValue).default;
  }

  return imports;
}
