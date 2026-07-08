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

  console.log(`\n[1/8] Analyzing target project... OK`);
  console.log(`      Found Next.js project at: ${targetPath}`);

  // 1. Merge package.json dependencies, devDependencies, scripts, and prisma configurations
  console.log("\n[2/8] Merging package.json configurations...");
  const basePkg = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
  const targetPkg = JSON.parse(fs.readFileSync(targetPkgPath, "utf8"));

  targetPkg.dependencies = targetPkg.dependencies || {};
  targetPkg.devDependencies = targetPkg.devDependencies || {};
  targetPkg.scripts = targetPkg.scripts || {};

  let addedDeps = 0;
  for (const [dep, ver] of Object.entries(basePkg.dependencies || {})) {
    if (!targetPkg.dependencies[dep]) {
      targetPkg.dependencies[dep] = ver;
      addedDeps++;
    }
  }

  for (const [dep, ver] of Object.entries(basePkg.devDependencies || {})) {
    if (!targetPkg.devDependencies[dep] && !targetPkg.dependencies[dep]) {
      targetPkg.devDependencies[dep] = ver;
      addedDeps++;
    }
  }

  let addedScripts = 0;
  for (const [scriptName, cmd] of Object.entries(basePkg.scripts || {})) {
    if (!targetPkg.scripts[scriptName]) {
      targetPkg.scripts[scriptName] = cmd;
      addedScripts++;
    }
  }

  if (basePkg.prisma) {
    targetPkg.prisma = { ...targetPkg.prisma, ...basePkg.prisma };
  }

  fs.writeFileSync(targetPkgPath, JSON.stringify(targetPkg, null, 2), "utf8");
  console.log(`      OK (Merged/Updated ${addedDeps} dependencies/devDependencies, and ${addedScripts} scripts)`);

  // 2. Auto-Copy backend and UI folders & files
  console.log("\n[3/8] Migrating backend folders & UI components...");
  const foldersToCopy = [
    // App routes
    { src: "src/app/dashboard", dest: "src/app/dashboard" },
    { src: "src/app/crm", dest: "src/app/crm" },
    { src: "src/app/api", dest: "src/app/api" },
    { src: "src/app/login", dest: "src/app/login" },
    { src: "src/app/forgot-password", dest: "src/app/forgot-password" },
    { src: "src/app/reset-password", dest: "src/app/reset-password" },
    { src: "src/app/maintenance", dest: "src/app/maintenance" },
    { src: "src/app/preview", dest: "src/app/preview" },
    
    // Components
    { src: "src/components/dashboard", dest: "src/components/dashboard" },
    { src: "src/components/media", dest: "src/components/media" },
    { src: "src/components/providers", dest: "src/components/providers" },
    { src: "src/components/utils", dest: "src/components/utils" },
    { src: "src/components/ThemeToggle.js", dest: "src/components/ThemeToggle.js" },
    { src: "src/components/BlockEditor.js", dest: "src/components/BlockEditor.js" },
    { src: "src/components/ContactFormSection.js", dest: "src/components/ContactFormSection.js" },
    { src: "src/components/DynamicBlockEditor.js", dest: "src/components/DynamicBlockEditor.js" },
    
    // Services / Repositories / Core / Lib / Common / SDK
    { src: "src/services", dest: "src/services" },
    { src: "src/repositories", dest: "src/repositories" },
    { src: "src/mappers", dest: "src/mappers" },
    { src: "src/data", dest: "src/data" },
    { src: "src/core", dest: "src/core" },
    { src: "src/lib", dest: "src/lib" },
    { src: "src/common", dest: "src/common" },
    { src: "src/sdk", dest: "src/sdk" },
    { src: "utils", dest: "utils" },
    
    // Individual files
    { src: "src/instrumentation.js", dest: "src/instrumentation.js" },
    { src: "src/proxy.js", dest: "src/proxy.js" },
    
    // Prisma config and seed
    { src: "prisma/prisma/seed.js", dest: "prisma/seed.js" },
    { src: "prisma/prisma/prisma.config.ts", dest: "prisma/prisma.config.ts" }
  ];

  for (const f of foldersToCopy) {
    const srcPath = path.join(__dirname, f.src);
    const destPath = path.join(targetPath, f.dest);
    if (fs.existsSync(srcPath)) {
      console.log(`   -> Copying ${f.src} to ${f.dest}...`);
      if (fs.statSync(srcPath).isDirectory()) {
        copyDirSync(srcPath, destPath);
      } else {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        if (fs.existsSync(destPath)) {
          const backupPath = `${destPath}.backup-${Date.now()}`;
          fs.copyFileSync(destPath, backupPath);
          console.log(`   [Backup] Existing file backed up to: ${path.basename(backupPath)}`);
        }
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  console.log("      OK (Files copied successfully)");

  // 3. Auto-Merge schema.prisma
  console.log("\n[4/8] Merging database schema (schema.prisma)...");
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

    // Extract model and enum names from target schema
    const targetEntities = new Set();
    const entityRegex = /(?:model|enum)\s+(\w+)\s+{/g;
    let match;
    while ((match = entityRegex.exec(targetSchema)) !== null) {
      targetEntities.add(match[1]);
    }

    // Parse base schema models/enums and append missing ones
    let appendedSchema = targetSchema;
    const baseBlocks = baseSchema.split(/(?=(?:model|enum)\s+\w+\s+{)/);
    
    let addedEntitiesCount = 0;
    for (const block of baseBlocks) {
      const entityMatch = block.match(/(?:model|enum)\s+(\w+)\s+{/);
      if (entityMatch && entityMatch[1]) {
        const entityName = entityMatch[1];
        if (!targetEntities.has(entityName)) {
          appendedSchema += "\n" + block.trim() + "\n";
          addedEntitiesCount++;
        }
      }
    }

    fs.writeFileSync(targetSchemaPath, appendedSchema, "utf8");
    console.log(`      OK (Appended ${addedEntitiesCount} new models/enums to target schema.prisma)`);
  }

  // 4. Append Environment Variables
  console.log("\n[5/8] Appending configuration values to .env...");
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

  // 5. Update root layout.js/layout.tsx to be wrapped in AuthProvider
  console.log("\n[6/8] Ensuring root layout is wrapped with AuthProvider...");
  const targetLayoutJS = path.join(targetPath, "src/app/layout.js");
  const targetLayoutTSX = path.join(targetPath, "src/app/layout.tsx");
  const layoutPath = fs.existsSync(targetLayoutTSX) ? targetLayoutTSX : (fs.existsSync(targetLayoutJS) ? targetLayoutJS : null);

  if (layoutPath) {
    let layoutContent = fs.readFileSync(layoutPath, "utf8");
    if (!layoutContent.includes("AuthProvider") && !layoutContent.includes("SessionProvider")) {
      console.log(`   -> Wrapping ${path.basename(layoutPath)} with AuthProvider & ThemeProvider...`);
      const backupPath = `${layoutPath}.backup-${Date.now()}`;
      fs.copyFileSync(layoutPath, backupPath);
      console.log(`      [Backup] Saved to ${path.basename(backupPath)}`);

      const imports = `import AuthProvider from "@/components/providers/SessionProvider";\nimport ThemeProvider from "@/components/providers/ThemeProvider";\nimport SessionTimeoutHandler from "@/components/utils/SessionTimeoutHandler";\nimport { Toaster } from "sonner";\nimport "@/core/listeners";\n`;
      layoutContent = imports + "\n" + layoutContent;

      const bodyStartRegex = /(<body[^>]*>)/;
      const bodyEndRegex = /(<\/body>)/;

      if (bodyStartRegex.test(layoutContent) && bodyEndRegex.test(layoutContent)) {
        layoutContent = layoutContent.replace(bodyStartRegex, `$1\n        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>\n          <AuthProvider>\n            <SessionTimeoutHandler timeoutMinutes={30} />`);
        layoutContent = layoutContent.replace(bodyEndRegex, `            <Toaster richColors position="top-right" closeButton />\n          </AuthProvider>\n        </ThemeProvider>\n      $1`);
      }

      const htmlStartRegex = /(<html[^>]*>)/;
      if (htmlStartRegex.test(layoutContent)) {
        const htmlTag = layoutContent.match(htmlStartRegex)[0];
        if (!htmlTag.includes("suppressHydrationWarning")) {
          const newHtmlTag = htmlTag.replace(">", " suppressHydrationWarning>");
          layoutContent = layoutContent.replace(htmlTag, newHtmlTag);
        }
      }

      fs.writeFileSync(layoutPath, layoutContent, "utf8");
      console.log("      OK (Layout updated successfully)");
    } else {
      console.log("      OK (Layout already has AuthProvider/SessionProvider)");
    }
  } else {
    console.log("      ⚠️ Warning: No root layout file found. Please create one.");
  }

  // 6. Ensure target globals.css supports class-based dark mode
  console.log("\n[7/8] Configuring Tailwind v4 class-based dark mode variant...");
  const targetGlobalsCSS = path.join(targetPath, "src/app/globals.css");
  if (fs.existsSync(targetGlobalsCSS)) {
    let cssContent = fs.readFileSync(targetGlobalsCSS, "utf8");
    if (!cssContent.includes("@variant dark")) {
      console.log("   -> Appending @variant dark rules to globals.css...");
      if (cssContent.includes('@import "tailwindcss";')) {
        cssContent = cssContent.replace(
          '@import "tailwindcss";',
          '@import "tailwindcss";\n\n/* ─── Tailwind v4: use class-based dark mode (for next-themes compatibility) ─── */\n@variant dark (&:where(.dark, .dark *));'
        );
      } else {
        cssContent = '/* ─── Tailwind v4: use class-based dark mode ─── */\n@variant dark (&:where(.dark, .dark *));\n\n' + cssContent;
      }
      fs.writeFileSync(targetGlobalsCSS, cssContent, "utf8");
      console.log("      OK (globals.css updated successfully)");
    } else {
      console.log("      OK (globals.css already has dark variant defined)");
    }
  } else {
    console.log("      ⚠️ Warning: src/app/globals.css not found.");
  }

  // 7. Run build tasks
  console.log("\n[8/8] Installing packages & generating Prisma client...");
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
