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
    .action(async (name: string) => {
        let targetDirectory = "";
        if (!name || name === ".") {
            targetDirectory = process.cwd();
        } else {
            targetDirectory = name;
        }
        if (!fs.existsSync(targetDirectory)) {
            fs.mkdirSync(targetDirectory);
        }
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
    })
    .description("Bootstrap node.js typescript project");

program.parse(process.argv);

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
        console.error("Error getting package version:", error);
        return null;
    }
}

function createJsonConfigs(
    dirPath: string,
    tsVersion: string,
    nodeTypesVersion: string
) {
    const templatesDir = path.join(__dirname, "templates");

    // Read template files
    const tsconfigContent = fs.readFileSync(
        path.join(templatesDir, "tsconfig-template.json"),
        "utf-8"
    );
    const packageTemplate = fs.readFileSync(
        path.join(templatesDir, "package-template.json"),
        "utf-8"
    );

    // Replace placeholders in templates
    const packageJsonContent = packageTemplate
        .replace("{{nodeTypesVersion}}", nodeTypesVersion)
        .replace("{{typescriptVersion}}", tsVersion);
    // Write files to target directory
    fs.writeFileSync(path.join(dirPath, "tsconfig.json"), tsconfigContent);
    fs.writeFileSync(path.join(dirPath, "package.json"), packageJsonContent);
}
