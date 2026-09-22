const fs = require("fs");
const path = require("path");

const haxballFiles = [
  path.resolve(__dirname, "../node_modules/haxball.js/dist/index.cjs"),
  path.resolve(__dirname, "../node_modules/haxball.js/dist/index.js"),
];
const initTwiceGuard = /if\(([A-Za-z_$][\w$]*)\.Ff\)throw ([A-Za-z_$][\w$]*)\.s\("Can't init twice"\);\1\.Ff=!0;/;
const initTwicePatch = "/* [patch] multi-room support: init guard removed */";

for (const haxballFile of haxballFiles) {
  const code = fs.readFileSync(haxballFile, "utf8");
  if (code.includes(initTwicePatch)) continue;

  const patched = code.replace(initTwiceGuard, initTwicePatch);
  if (patched === code) {
    throw new Error(`Could not patch haxball.js multi-room guard: ${haxballFile}`);
  }

  fs.writeFileSync(haxballFile, patched, "utf8");
}

const extendedRoomFile = path.resolve(__dirname, "../node_modules/haxball-extended-room/dist/Room.js");
const original = [
  "const commands = Reflect.getMetadata('her:commands', Module.prototype) || [];",
  "        const events = Reflect.getMetadata('her:events', Module.prototype) || [];",
  "        let customEvents = Reflect.getMetadata('her:custom_events', Module.prototype) || [];",
].join("\n");
const replacement = [
  "const commands = (Reflect.getMetadata('her:commands', Module.prototype) || []).map(c => ({ ...c }));",
  "        const events = (Reflect.getMetadata('her:events', Module.prototype) || []).map(e => ({ ...e }));",
  "        let customEvents = (Reflect.getMetadata('her:custom_events', Module.prototype) || []).map(e => ({ ...e }));",
].join("\n");

const code = fs.readFileSync(extendedRoomFile, "utf8");
if (code.includes(original)) {
  fs.writeFileSync(extendedRoomFile, code.replace(original, replacement), "utf8");
} else if (!code.includes(replacement)) {
  throw new Error("Could not patch haxball-extended-room: expected Room.js block not found.");
}

console.log("OK haxball.js patched for multi-room initialization");
console.log("OK haxball-extended-room patched for isolated module handlers");
