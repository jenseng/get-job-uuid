import * as fs from "fs/promises";
import * as path from "path";
import find from "find-process";
import { globby } from "globby";

const processName = "Runner.Worker";
try {
  const results = await find("name", processName);
  if (results.length !== 1) {
    console.warn(results);
    throw new Error(`Expected exactly one Runner.worker process, but found ${results.length}`);
  }

  const workerCmd = results[0]!.cmd;
  const index = workerCmd.indexOf(`/bin/${processName}`);
  if (index === -1) {
    throw new Error(
      `Unable to extract path from ${processName} command string, this might be a bug (${workerCmd})`
    );
  }

  const runnerDir = workerCmd.slice(0, index);
  const workerLogFiles = await globby("Worker_*.log", {
    cwd: path.join(runnerDir, "_diag"),
    absolute: true,
  });
  if (workerLogFiles.length !== 1) {
    console.warn(workerLogFiles);
    throw new Error(
      `Expected exactly one Runner.Worker log file, but found ${workerLogFiles.length}`
    );
  }

  const workerLogFile = await fs.readFile(workerLogFiles[0]!, "utf8");
  const lines = workerLogFile.split("\n");
  const jobIdLine = lines.find((line) => line.includes("INFO JobRunner] Job ID "));
  if (!jobIdLine) {
    throw new Error(`Unable to find job ID in ${processName} log file, this might be a bug`);
  }
  const uuid = jobIdLine.split("INFO JobRunner] Job ID ")[1]!;
  await fs.appendFile(process.env.GITHUB_OUTPUT!, `uuid=${uuid}\n`);
} catch (e) {
  console.error(`::error::${e}`);
  process.exit(1);
}
