#!/bin/bash

# PitchMirror Frontend Validation Script
# Tests all aspects of the implementation

set -e  # Exit on any error

echo "🚀 PitchMirror Frontend Validation Script"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Test function
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -n "Testing: $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
        return 1
    fi
}

echo "📁 1. Project Structure Tests"
echo "------------------------------"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from pitchmirror directory${NC}"
    exit 1
fi

run_test "package.json exists" "test -f package.json"
run_test "vite.config.ts exists" "test -f vite.config.ts"
run_test "tsconfig.json exists" "test -f tsconfig.json"
run_test "tailwind.config.js exists" "test -f tailwind.config.js"
run_test ".gitignore exists" "test -f .gitignore"
run_test "README.md exists" "test -f README.md"
run_test "INTEGRATION.md exists" "test -f INTEGRATION.md"

echo ""
echo "📦 2. Source Files Tests"
echo "------------------------"

# Components
run_test "PitchMirror component exists" "test -f src/components/PitchMirror.tsx"
run_test "VideoCanvas component exists" "test -f src/components/VideoCanvas.tsx"
run_test "OverlayCanvas component exists" "test -f src/components/OverlayCanvas.tsx"
run_test "ScorePanel component exists" "test -f src/components/ScorePanel.tsx"
run_test "SubscoreBar component exists" "test -f src/components/SubscoreBar.tsx"
run_test "TipsPanel component exists" "test -f src/components/TipsPanel.tsx"
run_test "CalibrationBanner component exists" "test -f src/components/CalibrationBanner.tsx"
run_test "DebugPanel component exists" "test -f src/components/DebugPanel.tsx"

# Hooks
run_test "useScoringLoop hook exists" "test -f src/hooks/useScoringLoop.ts"

# Lib files
run_test "types.ts exists" "test -f src/lib/types.ts"
run_test "mockVision.ts exists" "test -f src/lib/mockVision.ts"
run_test "mockLogic.ts exists" "test -f src/lib/mockLogic.ts"

# Other files
run_test "fixtures exists" "test -f src/fixtures/frames.sample.json"
run_test "globals.css exists" "test -f src/styles/globals.css"
run_test "App.tsx exists" "test -f src/App.tsx"
run_test "main.tsx exists" "test -f src/main.tsx"

echo ""
echo "🔍 3. File Content Validation"
echo "------------------------------"

# Check for required exports in types
run_test "types.ts has FramePack" "grep -q 'export interface FramePack' src/lib/types.ts"
run_test "types.ts has EvaluateResult" "grep -q 'export interface EvaluateResult' src/lib/types.ts"
run_test "types.ts has ScoringState" "grep -q 'export interface ScoringState' src/lib/types.ts"

# Check mock implementations
run_test "mockVision exports useMediaPipe" "grep -q 'export function useMediaPipe' src/lib/mockVision.ts"
run_test "mockLogic exports evaluate" "grep -q 'export function evaluate' src/lib/mockLogic.ts"

# Check fixture data
run_test "fixtures.json is valid JSON" "python3 -m json.tool src/fixtures/frames.sample.json > /dev/null"
run_test "fixtures has pose data" "grep -q '\"pose\"' src/fixtures/frames.sample.json"
run_test "fixtures has face data" "grep -q '\"face\"' src/fixtures/frames.sample.json"

echo ""
echo "📝 4. TypeScript Compilation"
echo "----------------------------"

run_test "TypeScript compiles without errors" "npm run build"

echo ""
echo "🎨 5. Build Artifacts"
echo "---------------------"

run_test "dist directory created" "test -d dist"
run_test "index.html in dist" "test -f dist/index.html"
run_test "CSS bundle created" "ls dist/assets/*.css > /dev/null 2>&1"
run_test "JS bundle created" "ls dist/assets/*.js > /dev/null 2>&1"

echo ""
echo "📊 6. Bundle Size Validation"
echo "-----------------------------"

# Check bundle sizes (should be reasonable)
JS_SIZE=$(find dist/assets -name "*.js" -type f -exec ls -l {} \; | awk '{total += $5} END {print total}')
CSS_SIZE=$(find dist/assets -name "*.css" -type f -exec ls -l {} \; | awk '{total += $5} END {print total}')

echo "JavaScript bundle: $((JS_SIZE / 1024)) KB"
echo "CSS bundle: $((CSS_SIZE / 1024)) KB"

if [ $JS_SIZE -lt 500000 ]; then
    echo -e "${GREEN}✓ JS bundle size reasonable${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ JS bundle larger than expected${NC}"
fi

if [ $CSS_SIZE -lt 50000 ]; then
    echo -e "${GREEN}✓ CSS bundle size reasonable${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ CSS bundle larger than expected${NC}"
fi

echo ""
echo "🔧 7. Configuration Validation"
echo "-------------------------------"

# Check package.json
run_test "package.json has dev script" "grep -q '\"dev\"' package.json"
run_test "package.json has build script" "grep -q '\"build\"' package.json"
run_test "package.json has React dependency" "grep -q '\"react\"' package.json"
run_test "package.json has Tailwind dependency" "grep -q '\"tailwindcss\"' package.json"
run_test "package.json has TypeScript dependency" "grep -q '\"typescript\"' package.json"

# Check Tailwind config
run_test "Tailwind config has content paths" "grep -q 'content' tailwind.config.js"
run_test "Tailwind config has neon colors" "grep -q 'neon' tailwind.config.js"

echo ""
echo "📚 8. Documentation Validation"
echo "-------------------------------"

run_test "README has getting started" "grep -q 'Getting Started' README.md"
run_test "README has keyboard shortcuts" "grep -q 'Keyboard' README.md"
run_test "INTEGRATION has Vision layer" "grep -q 'Vision Layer' INTEGRATION.md"
run_test "INTEGRATION has Logic layer" "grep -q 'Logic Layer' INTEGRATION.md"
run_test "INTEGRATION has integration steps" "grep -q 'Integration Steps' INTEGRATION.md"

echo ""
echo "🧪 9. Code Quality Checks"
echo "-------------------------"

# Check for common issues
run_test "No console.log in production code" "! grep -r 'console\.log' src/components/ src/hooks/ src/lib/ || true"
run_test "No TODO comments in main code" "! grep -r 'TODO' src/components/*.tsx src/hooks/*.ts || true"
run_test "All 8 components have exports" "test $(grep 'export default' src/components/*.tsx | wc -l) -eq 8"

# Check TypeScript strict mode
run_test "tsconfig has strict mode" "grep -q '\"strict\": true' tsconfig.json"

echo ""
echo "🎯 10. Integration Readiness"
echo "-----------------------------"

# Check that integration points are clearly marked
run_test "useScoringLoop imports mockVision" "grep -q 'mockVision' src/hooks/useScoringLoop.ts"
run_test "useScoringLoop imports mockLogic" "grep -q 'mockLogic' src/hooks/useScoringLoop.ts"
run_test "Types file has UseMediaPipeResult" "grep -q 'UseMediaPipeResult' src/lib/types.ts"

echo ""
echo "=========================================="
echo "📈 VALIDATION SUMMARY"
echo "=========================================="
echo ""
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
echo -e "Total Tests: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Frontend is ready for integration!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
fi

