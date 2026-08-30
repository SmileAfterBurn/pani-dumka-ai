/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AST Engine & Static Analysis Suite (TypeScript/JavaScript/Go-like syntax)
 * Статичний аналіз коду, побудова абстрактних синтаксичних дерев,
 * виявлення вразливостей, розрахунок цикломатичної складності та AST-трансформації
 * для агентів @code, @security, @qa.
 */

import { MathCore } from "../utils/mathCore";

// ============================================================================
// 1. СТРУКТУРИ ТА ВУЗЛИ АБСТРАКТНОГО СИНТАКСИЧНОГО ДЕРЕВА (AST NODES)
// ============================================================================

export type AstNodeType =
  | "Program"
  | "ImportDeclaration"
  | "ExportDeclaration"
  | "FunctionDeclaration"
  | "VariableDeclaration"
  | "Identifier"
  | "Literal"
  | "BinaryExpression"
  | "CallExpression"
  | "IfStatement"
  | "ForStatement"
  | "WhileStatement"
  | "ReturnStatement"
  | "TryCatchStatement"
  | "BlockStatement"
  | "MemberExpression"
  | "CommentBlock";

export interface AstNode {
  id: string;
  type: AstNodeType;
  name?: string;
  value?: any;
  loc: {
    startLine: number;
    endLine: number;
    startCol?: number;
    endCol?: number;
  };
  children: AstNode[];
  raw?: string;
  metadata?: Record<string, any>;
}

export interface AstParseResult {
  ast: AstNode;
  tokensCount: number;
  linesCount: number;
  functionsFound: string[];
  importsFound: string[];
  parseDurationMs: number;
}

export interface SecurityVulnerabilityFinding {
  ruleId: "NO_EVAL" | "SQL_INJECTION_RISK" | "HIGH_ENTROPY_SECRET" | "DANGEROUS_REGEX" | "PROTOTYPE_POLLUTION";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  line: number;
  snippet: string;
  remediationAdvice: string;
}

export interface AstComplexityMetrics {
  cyclomaticComplexity: number;
  maxNestingDepth: number;
  totalFunctions: number;
  maintainabilityIndex: number; // 0..100 scale
  deadCodeCandidates: string[];
  unusedImports: string[];
  complexityVerdict: "LOW (EASY TO MAINTAIN)" | "MODERATE (ACCEPTABLE)" | "HIGH (NEEDS REFACTORING)" | "CRITICAL (DANGEROUS)";
}

export interface AstTransformResult {
  transformedCode: string;
  modificationsApplied: string[];
  diffSummary: string;
}

// ============================================================================
// 2. ДЕТЕРМІНОВАНИЙ СИНТАКСИЧНИЙ ПАРСЕР (AST PARSER)
// ============================================================================

export class AstParser {
  private static nodeIdCounter = 0;

  static parse(sourceCode: string): AstParseResult {
    const start = performance.now();
    const lines = sourceCode.split("\n");
    const programNode: AstNode = {
      id: `node-${++this.nodeIdCounter}`,
      type: "Program",
      loc: { startLine: 1, endLine: lines.length },
      children: [],
      raw: sourceCode
    };

    const functionsFound: string[] = [];
    const importsFound: string[] = [];
    let tokenCount = 0;

    let inFunctionBlock: AstNode | null = null;
    let nestingDepth = 0;

    lines.forEach((lineText, lineIdx) => {
      const lineNum = lineIdx + 1;
      const trimmed = lineText.trim();
      if (!trimmed || trimmed.startsWith("//")) return;

      const words = trimmed.split(/\s+/);
      tokenCount += words.length;

      // 1. Imports check (TypeScript/JavaScript & Go format)
      if (trimmed.startsWith("import ") || trimmed.startsWith("const ") && trimmed.includes("require(")) {
        const match = trimmed.match(/import\s+(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/);
        const moduleName = match ? match[1] : trimmed;
        importsFound.push(moduleName);

        programNode.children.push({
          id: `node-${++this.nodeIdCounter}`,
          type: "ImportDeclaration",
          name: moduleName,
          loc: { startLine: lineNum, endLine: lineNum },
          children: [],
          raw: trimmed
        });
        return;
      }

      // 2. Function declaration check
      const funcMatch = trimmed.match(/(?:async\s+)?function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(/);
      const goFuncMatch = trimmed.match(/func\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_$]+)\s*\(/);
      
      const funcName = funcMatch ? (funcMatch[1] || funcMatch[2]) : (goFuncMatch ? goFuncMatch[1] : null);

      if (funcName) {
        functionsFound.push(funcName);
        const funcNode: AstNode = {
          id: `node-${++this.nodeIdCounter}`,
          type: "FunctionDeclaration",
          name: funcName,
          loc: { startLine: lineNum, endLine: lineNum },
          children: [],
          raw: trimmed,
          metadata: { params: [] }
        };
        programNode.children.push(funcNode);
        inFunctionBlock = funcNode;
        return;
      }

      // 3. Control flow statements (If, For, While, Try)
      if (trimmed.startsWith("if ") || trimmed.startsWith("if(")) {
        const ifNode: AstNode = {
          id: `node-${++this.nodeIdCounter}`,
          type: "IfStatement",
          loc: { startLine: lineNum, endLine: lineNum },
          children: [],
          raw: trimmed
        };
        if (inFunctionBlock) inFunctionBlock.children.push(ifNode);
        else programNode.children.push(ifNode);
      } else if (trimmed.startsWith("for ") || trimmed.startsWith("for(")) {
        const forNode: AstNode = {
          id: `node-${++this.nodeIdCounter}`,
          type: "ForStatement",
          loc: { startLine: lineNum, endLine: lineNum },
          children: [],
          raw: trimmed
        };
        if (inFunctionBlock) inFunctionBlock.children.push(forNode);
        else programNode.children.push(forNode);
      } else if (trimmed.startsWith("try ") || trimmed.startsWith("try{")) {
        const tryNode: AstNode = {
          id: `node-${++this.nodeIdCounter}`,
          type: "TryCatchStatement",
          loc: { startLine: lineNum, endLine: lineNum },
          children: [],
          raw: trimmed
        };
        if (inFunctionBlock) inFunctionBlock.children.push(tryNode);
        else programNode.children.push(tryNode);
      } else if (trimmed.startsWith("return ") || trimmed === "return;") {
        const returnNode: AstNode = {
          id: `node-${++this.nodeIdCounter}`,
          type: "ReturnStatement",
          loc: { startLine: lineNum, endLine: lineNum },
          children: [],
          raw: trimmed
        };
        if (inFunctionBlock) inFunctionBlock.children.push(returnNode);
        else programNode.children.push(returnNode);
      } else if (trimmed.includes("(") && trimmed.includes(")")) {
        // Call Expression
        const callNode: AstNode = {
          id: `node-${++this.nodeIdCounter}`,
          type: "CallExpression",
          loc: { startLine: lineNum, endLine: lineNum },
          children: [],
          raw: trimmed
        };
        if (inFunctionBlock) inFunctionBlock.children.push(callNode);
        else programNode.children.push(callNode);
      }
    });

    const parseDurationMs = Number((performance.now() - start).toFixed(2));
    return {
      ast: programNode,
      tokensCount: tokenCount,
      linesCount: lines.length,
      functionsFound,
      importsFound,
      parseDurationMs
    };
  }

  /**
   * Рекурсивний обхід дерева AST (Walker/Visitor)
   */
  static walk(node: AstNode, visitor: (node: AstNode, parent?: AstNode, depth?: number) => boolean | void, parent?: AstNode, depth = 0): void {
    const shouldContinue = visitor(node, parent, depth);
    if (shouldContinue === false) return;

    for (const child of node.children) {
      this.walk(child, visitor, node, depth + 1);
    }
  }
}

// ============================================================================
// 3. АНАЛІЗ БЕЗПЕКИ ТА АУДИТ ВРАЗЛИВОСТЕЙ (SECURITY AUDIT ENGINE)
// ============================================================================

export class AstSecurityLinter {
  static audit(sourceCode: string, ast: AstNode): SecurityVulnerabilityFinding[] {
    const findings: SecurityVulnerabilityFinding[] = [];
    const lines = sourceCode.split("\n");

    // 1. AST Node Walk for semantic dangers
    AstParser.walk(ast, (node) => {
      const raw = (node.raw || "").trim();

      // Rule: No direct eval() or Function constructor
      if (raw.includes("eval(") || raw.includes("new Function(") || raw.includes("setTimeout(\"") || raw.includes("setInterval(\"")) {
        findings.push({
          ruleId: "NO_EVAL",
          severity: "CRITICAL",
          message: "Виявлено небезпечне виконання динамічного коду через eval() або рядковий інтерпретатор.",
          line: node.loc.startLine,
          snippet: raw,
          remediationAdvice: "Замініть eval() на типізований парсинг JSON або безпечні математичні оператори."
        });
      }

      // Rule: SQL Injection Risk
      if (
        (raw.includes("SELECT ") || raw.includes("INSERT ") || raw.includes("UPDATE ") || raw.includes("DELETE ")) &&
        (raw.includes("${") || raw.includes(" + ") || raw.includes("fmt.Sprintf("))
      ) {
        findings.push({
          ruleId: "SQL_INJECTION_RISK",
          severity: "CRITICAL",
          message: "Виявлено формування SQL-запиту через строкову конкатенацію чи інтерполяцію.",
          line: node.loc.startLine,
          snippet: raw,
          remediationAdvice: "Використовуйте параметризовані запити або ORM/Query Builder замість конкатенації рядків."
        });
      }

      // Rule: Dangerous catastrophic backtracking regex
      if (raw.includes("new RegExp(") || raw.includes("RegExp(")) {
        if (raw.includes("(.*)+") || raw.includes("([a-zA-Z]+)*") || raw.includes("(\\w+)+")) {
          findings.push({
            ruleId: "DANGEROUS_REGEX",
            severity: "HIGH",
            message: "Виявлено регулярний вираз із ризиком ReDoS (катастрофічний бектрекінг).",
            line: node.loc.startLine,
            snippet: raw,
            remediationAdvice: "Уникайте вкладених квантифікаторів жадібності `(.*)+` у регулярних виразах."
          });
        }
      }

      // Rule: Prototype pollution
      if (raw.includes("__proto__") || raw.includes("constructor.prototype")) {
        findings.push({
          ruleId: "PROTOTYPE_POLLUTION",
          severity: "HIGH",
          message: "Потенційна загроза Prototype Pollution при доступі до системних прототипів об'єкта.",
          line: node.loc.startLine,
          snippet: raw,
          remediationAdvice: "Використовуйте `Object.create(null)` або валідуйте ключі через `Object.hasOwn()`."
        });
      }
    });

    // 2. High-Entropy Secret Scanner across lines
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//")) return;

      // Extract string literals
      const matches = trimmed.match(/['"`]([A-Za-z0-9+/=_-]{24,})['"`]/g);
      if (matches) {
        matches.forEach(lit => {
          const rawVal = lit.slice(1, -1);
          const entropy = MathCore.InfoTheory.shannonEntropy(rawVal);
          if (entropy > 4.6 && rawVal.length >= 24) {
            findings.push({
              ruleId: "HIGH_ENTROPY_SECRET",
              severity: "HIGH",
              message: `Виявлено рядок із високою ентропією (${entropy.toFixed(2)} біт), схожий на API-ключ або секрет.`,
              line: lineNum,
              snippet: trimmed,
              remediationAdvice: "Винесіть секрети у змінні оточення (process.env) та не зберігайте їх у сирцевому коді."
            });
          }
        });
      }
    });

    return findings;
  }
}

// ============================================================================
// 4. ІНСПЕКТОР СКЛАДНОСТІ ТА МЕРТВОГО КОДУ (COMPLEXITY & REFACTORING)
// ============================================================================

export class AstComplexityInspector {
  static inspect(sourceCode: string, ast: AstNode): AstComplexityMetrics {
    let cyclomaticComplexity = 1; // Base complexity
    let maxNestingDepth = 0;
    let totalFunctions = 0;
    const declaredIdentifiers: Set<string> = new Set();
    const usedIdentifiers: Set<string> = new Set();
    const importedModules: string[] = [];

    AstParser.walk(ast, (node, _parent, depth = 0) => {
      if (depth > maxNestingDepth) maxNestingDepth = depth;

      if (node.type === "FunctionDeclaration") {
        totalFunctions++;
        if (node.name) declaredIdentifiers.add(node.name);
      } else if (node.type === "ImportDeclaration" && node.name) {
        importedModules.push(node.name);
      }

      // Branching increases cyclomatic complexity
      if (
        node.type === "IfStatement" ||
        node.type === "ForStatement" ||
        node.type === "WhileStatement" ||
        node.type === "TryCatchStatement"
      ) {
        cyclomaticComplexity++;
      }

      if (node.type === "CallExpression" && node.raw) {
        // Collect calls
        const match = node.raw.match(/([a-zA-Z0-9_$]+)\s*\(/);
        if (match && match[1]) {
          usedIdentifiers.add(match[1]);
        }
      }
    });

    // Dead code candidates (functions declared but never called locally)
    const deadCodeCandidates: string[] = [];
    declaredIdentifiers.forEach(id => {
      if (!usedIdentifiers.has(id) && id !== "main" && !id.startsWith("export")) {
        deadCodeCandidates.push(`Функція '${id}' ніде не викликається у поточному модулі`);
      }
    });

    // Unused imports inspection
    const unusedImports: string[] = [];
    importedModules.forEach(mod => {
      const baseName = mod.split("/").pop()?.replace(/[^a-zA-Z0-9_$]/g, "") || "";
      if (baseName && !sourceCode.includes(baseName)) {
        unusedImports.push(mod);
      }
    });

    // Calculate Maintainability Index (MI = 171 - 5.2 * ln(Halstead Volume) - 0.23 * CC - 16.2 * ln(LOC))
    const loc = Math.max(sourceCode.split("\n").length, 1);
    const estimatedVolume = loc * 4.5;
    const mi = Math.max(
      0,
      Math.min(
        100,
        171 - 5.2 * Math.log(estimatedVolume) - 0.23 * cyclomaticComplexity - 16.2 * Math.log(loc)
      )
    );

    let verdict: AstComplexityMetrics["complexityVerdict"] = "LOW (EASY TO MAINTAIN)";
    if (cyclomaticComplexity > 15 || maxNestingDepth > 5) {
      verdict = "CRITICAL (DANGEROUS)";
    } else if (cyclomaticComplexity > 8 || maxNestingDepth > 3) {
      verdict = "HIGH (NEEDS REFACTORING)";
    } else if (cyclomaticComplexity > 4) {
      verdict = "MODERATE (ACCEPTABLE)";
    }

    return {
      cyclomaticComplexity,
      maxNestingDepth,
      totalFunctions,
      maintainabilityIndex: Number(mi.toFixed(1)),
      deadCodeCandidates,
      unusedImports,
      complexityVerdict: verdict
    };
  }
}

// ============================================================================
// 5. ТРАНСФОРМАЦІЯ ТА СИНТЕЗ КОДУ (AST REWRITER & CODE SYNTHESIS)
// ============================================================================

export class AstCodeRewriter {
  /**
   * Автоматичне обгортання функцій у захисні блоки try/catch з логуванням для @code & @qa
   */
  static wrapFunctionsWithTryCatch(sourceCode: string): AstTransformResult {
    const lines = sourceCode.split("\n");
    const modifications: string[] = [];
    const newLines: string[] = [];

    let inFunc = false;
    let funcName = "";
    let funcIndent = "";

    lines.forEach((line) => {
      const match = line.match(/^(\s*)(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\((.*?)\)\s*\{/);
      if (match && !line.includes("try {")) {
        inFunc = true;
        funcIndent = match[1];
        funcName = match[2];
        newLines.push(line);
        newLines.push(`${funcIndent}  try {`);
        modifications.push(`Додано захисний блок try/catch для функції '${funcName}'`);
        return;
      }

      if (inFunc && line.trim() === "}") {
        newLines.push(`${funcIndent}  } catch (error: any) {`);
        newLines.push(`${funcIndent}    console.error('[Error in ${funcName}]:', error);`);
        newLines.push(`${funcIndent}    throw error;`);
        newLines.push(`${funcIndent}  }`);
        newLines.push(line);
        inFunc = false;
        return;
      }

      newLines.push(line);
    });

    return {
      transformedCode: newLines.join("\n"),
      modificationsApplied: modifications,
      diffSummary: `Трансформовано функцій: ${modifications.length}`
    };
  }

  /**
   * Додавання вимірювання продуктивності та телеметрії (Telemetry Injector)
   */
  static injectTelemetryHeaders(sourceCode: string): AstTransformResult {
    const header = `// [Пані Думка Telemetry Header - Trace ID: ${Date.now()}]\n`;
    const transformed = header + sourceCode;
    return {
      transformedCode: transformed,
      modificationsApplied: ["Впроваджено системний телеметричний заголовок трасування"],
      diffSummary: "Додано телеметрію у шапку файлу"
    };
  }
}
