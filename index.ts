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
  console.log(results);

  const workerCmd = results[0]!.cmd;
  const index = workerCmd.indexOf(path.join("bin", processName));
  if (index === -1) {
    throw new Error(
      `Unable to extract path from ${processName} command string, this might be a bug (${workerCmd})`
    );
  }

  const runnerDir = workerCmd.slice(0, index).replace(/^"/, ""); // on windows the bin is quoted
  const workerLogFiles = (
    await globby("Worker_*.log", {
      cwd: path.join(runnerDir, "_diag"),
      absolute: true,
    })
  )
    .sort()
    .reverse();

  if (workerLogFiles.length === 0) {
    throw new Error(`Unable to find ${processName} log file(s), this might be a bug`);
  }

  for (const file of workerLogFiles) {
    const content = await fs.readFile(file, "utf8");
    const lines = content.split("\n");
    const jobIdLine = lines.find((line) => line.includes("INFO JobRunner] Job ID "));
    if (jobIdLine) {
      const uuid = jobIdLine.split("INFO JobRunner] Job ID ")[1]!;
      await fs.appendFile(process.env.GITHUB_OUTPUT!, `uuid=${uuid}\n`);
      process.exit(0);
    }
    throw new Error(`Unable to find job ID in ${processName} log file(s), this might be a bug`);
  }
} catch (e) {
  console.error(`::error::${e}`);
  process.exit(1);
}
