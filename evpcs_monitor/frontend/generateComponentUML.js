const fs = require("fs");
const path = require("path");

const COMPONENTS_DIR = path.resolve(__dirname, "src/components");
const OUTPUT_FILE = "components.puml";

function getComponentFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getComponentFiles(filePath));
        } else if (/\.(jsx?|tsx?)$/.test(file)) {
            results.push(filePath);
        }
    });
    return results;
}

function parseImports(content, fromPath) {
    const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
    let match, imports = [];
    while ((match = importRegex.exec(content)) !== null) {
        const imp = match[1];
        // 只考虑本地组件引用
        if (imp.startsWith(".") || imp.startsWith("/")) {
            try {
                let resolved = path.resolve(path.dirname(fromPath), imp);
                if (!fs.existsSync(resolved) && fs.existsSync(resolved + ".jsx")) resolved += ".jsx";
                if (!fs.existsSync(resolved) && fs.existsSync(resolved + ".tsx")) resolved += ".tsx";
                if (!fs.existsSync(resolved) && fs.existsSync(resolved + ".js")) resolved += ".js";
                if (!fs.existsSync(resolved) && fs.existsSync(resolved + ".ts")) resolved += ".ts";
                if (fs.existsSync(resolved)) {
                    imports.push(path.relative(COMPONENTS_DIR, resolved));
                }
            } catch (_) { }
        }
    }
    return imports;
}

function getComponentName(filePath) {
    return path.relative(COMPONENTS_DIR, filePath).replace(/\.(jsx?|tsx?)$/, "").replace(/\\/g, "/");
}

function buildDependencyGraph() {
    const files = getComponentFiles(COMPONENTS_DIR);
    const graph = {};

    files.forEach(file => {
        const content = fs.readFileSync(file, "utf8");
        const from = getComponentName(file);
        const imports = parseImports(content, file);
        graph[from] = imports.map(p => p.replace(/\.(jsx?|tsx?)$/, "").replace(/\\/g, "/"));
    });

    return graph;
}

function generatePlantUML(graph) {
    let uml = "@startuml\nskinparam componentStyle rectangle\n";
    Object.keys(graph).forEach(component => {
        uml += `component "${component}" as ${component.replace(/[^\w]/g, "_")}\n`;
    });
    Object.entries(graph).forEach(([from, tos]) => {
        tos.forEach(to => {
            uml += `${from.replace(/[^\w]/g, "_")} --> ${to.replace(/[^\w]/g, "_")}\n`;
        });
    });
    uml += "@enduml\n";
    return uml;
}

// Execute
const graph = buildDependencyGraph();
const uml = generatePlantUML(graph);
fs.writeFileSync(OUTPUT_FILE, uml, "utf8");
console.log("✅ 组件依赖图 UML 已生成：components.puml");
