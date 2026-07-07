/**
 * Global CMS & CRM Backend Auto-Integration CLI
 * Run this script to merge the global-backend-base template with your Next.js project.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper to ask question
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

// Helper to recursively copy directories
function copyDirSync(src, dest, overwritePrompt = true) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath, overwritePrompt);
    } else {
      if (fs.existsSync(destPath) && overwritePrompt) {
        // Backup existing files to be safe
        const backupPath = `${destPath}.backup-${Date.now()}`;
        fs.copyFileSync(destPath, backupPath);
        console.log(`   [Backup] Existing file backed up to: ${path.basename(backupPath)}`);
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function run() {
  console.log("=====================================================");
  console.log("   Global CMS & CRM Backend Auto-Integration CLI     ");
  console.log("=====================================================");

  const targetInput = await askQuestion("? Enter the path to your existing Next.js project (relative or absolute): ");
  const targetPath = path.resolve(targetInput.trim());

  if (!fs.existsSync(targetPath)) {
    console.error(`❌ Error: Path "${targetPath}" does not exist.`);
    rl.close();
    return;
  }

  const targetPkgPath = path.join(targetPath, "package.json");
  if (!fs.existsSync(targetPkgPath)) {
    console.error(`❌ Error: Target folder does not contain a package.json file. Is it a Node/Next.js project?`);
    rl.close();
    return;
  }

  console.log(`\n[1/5] Analyzing target project... OK`);
  console.log(`      Found Next.js project at: ${targetPath}`);

  // 1. Merge package.json dependencies
  console.log("\n[2/5] Merging package.json dependencies...");
  const basePkg = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
  const targetPkg = JSON.parse(fs.readFileSync(targetPkgPath, "utf8"));

  targetPkg.dependencies = targetPkg.dependencies || {};
  targetPkg.devDependencies = targetPkg.devDependencies || {};

  let addedDeps = 0;
  const depsToMerge = [
    "@prisma/client", "next-auth", "bcryptjs", "cloudinary", "zod", 
    "lucide-react", "sharp", "@fortawesome/fontawesome-svg-core", 
    "@fortawesome/free-brands-svg-icons", "@fortawesome/free-solid-svg-icons",
    "@fortawesome/react-fontawesome", "js-cookie", "react-share"
  ];

  for (const dep of depsToMerge) {
    if (basePkg.dependencies[dep] && !targetPkg.dependencies[dep]) {
      targetPkg.dependencies[dep] = basePkg.dependencies[dep];
      addedDeps++;
    }
  }

  const devDepsToMerge = ["prisma"];
  for (const dep of devDepsToMerge) {
    if (basePkg.devDependencies[dep] && !targetPkg.devDependencies[dep] && !targetPkg.dependencies[dep]) {
      targetPkg.devDependencies[dep] = basePkg.devDependencies[dep];
      addedDeps++;
    }
  }

  fs.writeFileSync(targetPkgPath, JSON.stringify(targetPkg, null, 2), "utf8");
  console.log(`      OK (Merged/Updated ${addedDeps} dependencies)`);

  // 2. Auto-Copy backend and UI folders
  console.log("\n[3/5] Migrating backend folders & UI components...");
  const foldersToCopy = [
    { src: "src/app/dashboard", dest: "src/app/dashboard" },
    { src: "src/app/crm", dest: "src/app/crm" },
    { src: "src/app/api", dest: "src/app/api" },
    { src: "src/components/dashboard", dest: "src/components/dashboard" },
    { src: "src/components/media", dest: "src/components/media" },
    { src: "src/services", dest: "src/services" },
    { src: "src/repositories", dest: "src/repositories" },
    { src: "src/core", dest: "src/core" },
    { src: "src/lib", dest: "src/lib" },
    { src: "utils", dest: "utils" }
  ];

  for (const f of foldersToCopy) {
    const srcPath = path.join(__dirname, f.src);
    const destPath = path.join(targetPath, f.dest);
    if (fs.existsSync(srcPath)) {
      console.log(`   -> Copying ${f.src} to ${f.dest}...`);
      copyDirSync(srcPath, destPath);
    }
  }
  console.log("      OK (Files copied successfully)");

  // 3. Auto-Merge schema.prisma
  console.log("\n[4/5] Merging database schema (schema.prisma)...");
  const baseSchemaPath = path.join(__dirname, "prisma/prisma/schema.prisma");
  let targetSchemaPath = path.join(targetPath, "prisma/schema.prisma");

  if (!fs.existsSync(path.dirname(targetSchemaPath))) {
    fs.mkdirSync(path.dirname(targetSchemaPath), { recursive: true });
  }

  if (!fs.existsSync(baseSchemaPath)) {
    console.warn("   ⚠️ Warning: Base schema.prisma not found. Skipping schema merge.");
  } else if (!fs.existsSync(targetSchemaPath)) {
    // If target has no schema, just copy our schema
    fs.copyFileSync(baseSchemaPath, targetSchemaPath);
    console.log("      OK (Copied baseline schema.prisma)");
  } else {
    // Both exist, append missing models
    const baseSchema = fs.readFileSync(baseSchemaPath, "utf8");
    const targetSchema = fs.readFileSync(targetSchemaPath, "utf8");

    // Extract model names from target schema
    const targetModels = new Set();
    const modelRegex = /model\s+(\w+)\s+{/g;
    let match;
    while ((match = modelRegex.exec(targetSchema)) !== null) {
      targetModels.add(match[1]);
    }

    // Parse base schema models and append missing ones
    let appendedSchema = targetSchema;
    const baseModelBlocks = baseSchema.split(/(?=model\s+\w+\s+{)/);
    
    let addedModelsCount = 0;
    for (const block of baseModelBlocks) {
      const modelMatch = block.match(/model\s+(\w+)\s+{/);
      if (modelMatch && modelMatch[1]) {
        const modelName = modelMatch[1];
        if (!targetModels.has(modelName)) {
          appendedSchema += "\n" + block.trim() + "\n";
          addedModelsCount++;
        }
      }
    }

    fs.writeFileSync(targetSchemaPath, appendedSchema, "utf8");
    console.log(`      OK (Appended ${addedModelsCount} new models to target schema.prisma)`);
  }

  // 4. Append Environment Variables
  console.log("\n[5/5] Appending configuration values to .env...");
  const targetEnvPath = path.join(targetPath, ".env");
  const baseEnvExamplePath = path.join(__dirname, ".env.example");

  let envToAppend = "";
  if (fs.existsSync(baseEnvExamplePath)) {
    envToAppend = fs.readFileSync(baseEnvExamplePath, "utf8");
  } else {
    envToAppend = `
# =====================================================
# Global CMS & CRM Settings
# =====================================================
DATABASE_URL="mysql://root:password@localhost:3306/global_cms"
NEXTAUTH_SECRET="supersecretnextauthkey123"
NEXTAUTH_URL="http://localhost:3000"

CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
`;
  }

  if (!fs.existsSync(targetEnvPath)) {
    fs.writeFileSync(targetEnvPath, envToAppend, "utf8");
    console.log("      OK (Created new .env file)");
  } else {
    const targetEnv = fs.readFileSync(targetEnvPath, "utf8");
    const linesToAppend = envToAppend.split("\n").filter(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return false;
      const key = trimmed.split("=")[0];
      return !targetEnv.includes(key);
    });

    if (linesToAppend.length > 0) {
      fs.appendFileSync(targetEnvPath, "\n\n# Added by Global CMS Integration Script\n" + linesToAppend.join("\n"), "utf8");
      console.log(`      OK (Appended ${linesToAppend.length} configuration keys)`);
    } else {
      console.log("      OK (All keys already defined)");
    }
  }

  // 5. Run build tasks
  console.log("\n[6/6] Installing packages & generating Prisma client...");
  try {
    console.log("   -> Running npm install inside target directory (this may take a minute)...");
    execSync("npm install", { cwd: targetPath, stdio: "inherit" });
    
    console.log("   -> Running npx prisma generate inside target directory...");
    execSync("npx prisma generate", { cwd: targetPath, stdio: "inherit" });
    
    console.log("\n=====================================================");
    console.log("🎉 SUCCESS! Global CMS backend successfully integrated.");
    console.log("=====================================================");
    console.log("Next steps:");
    console.log("1. Open your target project's `.env` and fill in API credentials.");
    console.log('2. Run database migration: "npx prisma db push"');
    console.log('3. Start the project: "npm run dev"');
  } catch (err) {
    console.error("\n❌ Error running post-install commands:", err.message);
    console.warn("⚠️ You will need to manually run 'npm install' and 'npx prisma generate' inside your target project.");
  }

  rl.close();
}

run();
