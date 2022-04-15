import { parse } from "https://deno.land/std@0.135.0/encoding/csv.ts";
import { BufReader } from "https://deno.land/std@0.135.0/io/buffer.ts";
import groupBy from "https://deno.land/x/denodash@0.1.3/src/collection/groupBy.ts";

type Reflection = {
  reflectionGroup: string;
  type: "Reflection" | "Comment" | "Task";
  content: string;
};

const filename = Deno.args[0];
const file = await Deno.open(filename);
let reflections: Reflection[];
try {
  const buf = BufReader.create(file);
  reflections = (await parse(buf, {
    skipFirstRow: true,
  })) as Reflection[];
} finally {
  file.close();
}

// This code depends on that insertion order of object's key is preserved.
const groupedReflections = groupBy((r) => r.reflectionGroup, reflections);
const listContents = Object.values(groupedReflections)
  .filter((reflections) => reflections.length >= 2)
  .map((reflections) => {
    const [parentReflection, ...childReflections] = reflections;
    const childContents = childReflections
      .filter((r) => !r.content.endsWith("#archived"))
      .map(
        (r) => `  - ${r.type !== "Comment" ? r.type + ": " : ""}${r.content}`
      );
    return `- ${parentReflection.content}\n${childContents.join("\n")}`;
  });

console.log(listContents.join("\n"));
