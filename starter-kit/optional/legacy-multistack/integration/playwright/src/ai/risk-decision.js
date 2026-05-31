#!/usr/bin/env node
/**
 * Content Risk Decision Generator
 *
 * Takes analysis.json and outputs Warning/OK/Ignore decision for content reviewer.
 *
 * Usage:
 *   node risk-decision.js <analysis.json> [--output <decision.json>]
 *
 * Decision Logic:
 *   WARNING - High medium-term volatility or direct military risk
 *   OK      - Low/medium volatility, background analysis only
 *   IGNORE  - No meaningful risk data or purely promotional content
 */

import fs from "fs";

/**
 * Determine content risk decision level based on riskAssessment
 * @param {Object} analysis - Parsed analysis.json
 * @returns {{ level: string, reason: string }}
 */
function determineDecision(analysis) {
  const risk = analysis.riskAssessment;

  // IGNORE: No meaningful risk data
  if (!risk || (!risk.shortTermImpact && !risk.mediumTermVolatility && !risk.riskTypes)) {
    return {
      level: "Ignore",
      reason: "No meaningful risk assessment data. Content appears irrelevant to content review.",
    };
  }

  const { shortTermImpact, mediumTermVolatility, riskTypes = [] } = risk;

  // Normalize riskTypes for matching
  const normalizedRiskTypes = riskTypes.map((t) => t.toLowerCase());
  const hasDirectMilitary = normalizedRiskTypes.some((t) => t.includes("direct military"));

  // WARNING: High medium-term volatility OR direct military risk
  if (mediumTermVolatility === "high" || hasDirectMilitary) {
    const reasons = [];

    if (mediumTermVolatility === "high") {
      reasons.push("high medium-term volatility");
    }
    if (hasDirectMilitary) {
      reasons.push("direct military risk");
    }

    const riskTypeSummary = riskTypes.length > 0 ? ` (${riskTypes.join(", ")})` : "";

    return {
      level: "Warning",
      reason: `Content indicates ${reasons.join(" and ")}${riskTypeSummary}. May distort short-term content review judgment if over-weighted.`,
    };
  }

  // OK: Low/medium volatility, no immediate danger
  if (shortTermImpact !== "high") {
    return {
      level: "OK",
      reason: "Background/structural analysis with low to medium risk. Safe to read but do not use as direct content review signal.",
    };
  }

  // Edge case: high short-term but not high medium-term (still warrants attention)
  return {
    level: "Warning",
    reason: `High short-term impact indicated. Review before content review decisions.`,
  };
}

/**
 * Generate content risk decision output
 * @param {Object} analysis - Parsed analysis.json
 * @returns {Object} Decision output with riskDecision field
 */
function generateDecision(analysis) {
  const decision = determineDecision(analysis);

  return {
    riskDecision: decision,
    // Include source data for reference
    sourceRiskAssessment: analysis.riskAssessment || null,
  };
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(`
Content Risk Decision Generator

Usage:
  node risk-decision.js <analysis.json> [--output <decision.json>]

Options:
  --output <path>  Save decision to file instead of stdout

Decision Levels:
  Warning  - High volatility / military risk. Do not use for content review.
  OK       - Background analysis. Safe to read.
  Ignore   - No content review relevance.

Example:
  node risk-decision.js analysis.json
  node risk-decision.js analysis.json --output decision.json
`);
    process.exit(0);
  }

  const inputPath = args[0];
  const outputIndex = args.indexOf("--output");
  const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : null;

  // Read input
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`);
    process.exit(1);
  }

  let analysis;
  try {
    const raw = fs.readFileSync(inputPath, "utf-8");
    analysis = JSON.parse(raw);
  } catch (e) {
    console.error(`Error: Invalid JSON in ${inputPath}`);
    process.exit(1);
  }

  // Generate decision
  const result = generateDecision(analysis);

  // Output
  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Decision saved to: ${outputPath}`);
    console.log(`Level: ${result.riskDecision.level}`);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

main();
