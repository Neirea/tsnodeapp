#!/usr/bin/env node
import { Command } from "commander";
import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import util from "node:util";

const execAsync = util.promisify(exec);

const program = new Command();

program
    .argument("[name]", "directory name")
    .action(createTsNodeApp)
    .description("Bootstrap node.js typescript project");

program.parse(process.argv);

async function createTsNodeApp(name: string) {
    if (name && !isValidDirectoryName(name)) {
        console.error(
            "Invalid directory name. Directory names can only contain letters, numbers, underscores, and hyphens."
        );
        return;
    }
    let targetDirectory = "";
    if (!name || name === ".") {
        targetDirectory = process.cwd();
    } else {
        targetDirectory = name;
    }
    if (!fs.existsSync(targetDirectory)) {
        fs.mkdirSync(targetDirectory);
    }
    try {
        const versions = [
            getPackageVersion("typescript"),
            getPackageVersion("@types/node"),
        ];
        const [tsVersion, nodeTypesVersion] = await Promise.all(versions);
        // Create tsconfig and package.json
        createJsonConfigs(targetDirectory, tsVersion, nodeTypesVersion);
        //git init
        gitInit(targetDirectory);
        const srcFilePath = `${targetDirectory}/src`;
        if (!fs.existsSync(srcFilePath)) {
            fs.mkdirSync(srcFilePath);
        }
        const indexFilePath = `${srcFilePath}/index.ts`;
        if (!fs.existsSync(indexFilePath)) {
            fs.writeFileSync(indexFilePath, "");
        }
    } catch (error) {
        console.error((error as Error).message);
    }
}

async function gitInit(dirPath: string) {
    await execAsync("git init", { cwd: dirPath });
    const gitignoreContent = "node_modules\ndist";
    const gitignorePath = path.join(dirPath, ".gitignore");
    fs.writeFileSync(gitignorePath, gitignoreContent);
}

async function getPackageVersion(packageName: string) {
    try {
        const { stdout } = await execAsync(
            `npm view ${packageName} version --json`
        );
        const version = JSON.parse(stdout);
        return version;
    } catch (error) {
        throw new Error(
            `Error getting package version for ${packageName}: ${
                (error as Error).message
            }`
        );
    }
}

function createJsonConfigs(
    dirPath: string,
    tsVersion: string,
    nodeTypesVersion: string
) {
    const templatesDir = path.join(__dirname, "templates");

    const tsconfigContent = fs.readFileSync(
        path.join(templatesDir, "tsconfig-template.json"),
        "utf-8"
    );
    const packageTemplate = fs.readFileSync(
        path.join(templatesDir, "package-template.json"),
        "utf-8"
    );

    const appName = dirPath.split("/").at(-1) || "myapp";
    const packageJsonContent = packageTemplate
        .replace("{{appName}}", appName)
        .replace("{{nodeTypesVersion}}", nodeTypesVersion)
        .replace("{{typescriptVersion}}", tsVersion);
    fs.writeFileSync(path.join(dirPath, "tsconfig.json"), tsconfigContent);
    fs.writeFileSync(path.join(dirPath, "package.json"), packageJsonContent);
}

function isValidDirectoryName(name: string): boolean {
    const validNameRegex = /^[a-zA-Z0-9_-]+$/;
    return validNameRegex.test(name);
}
