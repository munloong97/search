import { z } from "zod";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "fd",
    description: "Find files using fd (modern alternative to find). Fast, respects .gitignore by default.",
    parameters: z.object({
      pattern: z.string().describe("Filename pattern to search for"),
      path: z.string().optional().describe("Directory to search in (default: cwd)"),
      extension: z.string().optional().describe("Filter by extension (e.g., 'ts', 'py')"),
      type: z.enum(["file", "directory"]).optional().describe("Search for files or directories only"),
      exclude: z.array(z.string()).optional().describe("Patterns to exclude"),
      hidden: z.boolean().optional().describe("Include hidden files"),
      noIgnore: z.boolean().optional().describe("Don't respect .gitignore"),
    }),
    async execute({ pattern, path, extension, type, exclude, hidden, noIgnore }) {
      const args = ["fd"];
      if (extension) args.push("-e", extension);
      if (type === "file") args.push("-t", "f");
      if (type === "directory") args.push("-t", "d");
      if (hidden) args.push("-H");
      if (noIgnore) args.push("-I");
      if (exclude) exclude.forEach((e) => args.push("-E", e));
      args.push(pattern);
      if (path) args.push(path);

      const result = await pi.bash(args.join(" "));
      return {
        content: result.stdout || "No matches found",
        error: result.stderr || undefined,
      };
    },
  });

  pi.registerTool({
    name: "rg",
    description: "Search file contents using ripgrep (rg). Fast, respects .gitignore, supports regex.",
    parameters: z.object({
      pattern: z.string().describe("Search pattern (regex by default)"),
      path: z.string().optional().describe("Directory or file to search (default: cwd)"),
      extensions: z.array(z.string()).optional().describe("Filter by file extensions (e.g., ['ts', 'tsx'])"),
      ignoreCase: z.boolean().optional().describe("Case-insensitive search (-i)"),
      context: z.number().optional().describe("Lines of context before/after match (-C N)"),
      filesOnly: z.boolean().optional().describe("Return only filenames with matches (-l)"),
      countOnly: z.boolean().optional().describe("Return match count per file (-c)"),
      literal: z.boolean().optional().describe("Treat pattern as literal string, not regex (-F)"),
      lineNumber: z.boolean().optional().describe("Show line numbers (default: true)"),
      hidden: z.boolean().optional().describe("Search hidden files"),
      noIgnore: z.boolean().optional().describe("Don't respect .gitignore"),
    }),
    async execute({ pattern, path, extensions, ignoreCase, context, filesOnly, countOnly, literal, lineNumber, hidden, noIgnore }) {
      const args = ["rg"];
      if (ignoreCase) args.push("-i");
      if (context !== undefined) args.push("-C", String(context));
      if (filesOnly) args.push("-l");
      if (countOnly) args.push("-c");
      if (literal) args.push("-F");
      if (hidden) args.push("-.", "--hidden");
      if (noIgnore) args.push("--no-ignore");
      if (lineNumber !== false) args.push("-n");
      if (extensions) extensions.forEach((ext) => args.push("-t", ext));
      args.push("--", pattern);
      if (path) args.push(path);

      const result = await pi.bash(args.join(" "));
      return {
        content: result.stdout || "No matches found",
        error: result.stderr || undefined,
      };
    },
  });

  pi.registerTool({
    name: "fzf",
    description: "Interactive fuzzy finder (non-interactive mode). Filters input through fzf.",
    parameters: z.object({
      input: z.string().describe("Newline-separated list to filter"),
      query: z.string().optional().describe("Initial search query"),
      multi: z.boolean().optional().describe("Enable multi-select"),
      limit: z.number().optional().describe("Limit number of results"),
    }),
    async execute({ input, query, multi, limit }) {
      const args = ["fzf", "--filter"];
      if (query) args.push(query);
      if (multi) args.push("-m");
      if (limit) args.push("-n", String(limit));

      const result = await pi.bash(`echo ${JSON.stringify(input)} | ${args.join(" ")}`);
      return {
        content: result.stdout || "No matches",
        error: result.stderr || undefined,
      };
    },
  });
}
