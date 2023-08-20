const fs = require("node:fs");
const path = require("node:path");

const sourceDir = path.join(__dirname, "../src/templates");
const targetDir = path.join(__dirname, "../dist/templates");

function copyJsonFiles() {
    try {
        const jsonFiles = fs.readdirSync(sourceDir);
        for (const jsonFile of jsonFiles) {
            if (jsonFile.endsWith(".json")) {
                const sourcePath = path.join(sourceDir, jsonFile);
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir);
                }
                const targetPath = path.join(targetDir, jsonFile);
                fs.copyFileSync(sourcePath, targetPath);
            }
        }
    } catch (error) {
        console.error("Error copying JSON files:", error);
    }
}

copyJsonFiles();
