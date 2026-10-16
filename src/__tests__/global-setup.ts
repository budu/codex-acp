import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type {TestProject} from "vitest/node";

/**
 * Gives the test run its own temp directory and removes it at the end, so files a test forgets to clean up do not
 * pile up in the system temp directory. Workers and the processes they spawn inherit `TMPDIR`, which `os.tmpdir()` reads.
 */
export default function setup(project: TestProject): () => void {
    const previous = process.env["TMPDIR"];
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "codex-acp-test-run-"));
    process.env["TMPDIR"] = root;
    return () => {
        if (previous === undefined) {
            delete process.env["TMPDIR"];
        } else {
            process.env["TMPDIR"] = previous;
        }
        fs.rmSync(root, {recursive: true, force: true, maxRetries: 5});
        // Vitest creates its module cache directory in the temp directory before this setup runs, and never removes it.
        const vitestTmpDir = (project.vitest as unknown as {_tmpDir?: unknown})._tmpDir;
        if (typeof vitestTmpDir === "string" && path.dirname(vitestTmpDir) === os.tmpdir()) {
            fs.rmSync(vitestTmpDir, {recursive: true, force: true, maxRetries: 5});
        }
    };
}
