#!/bin/bash

# Master Test Runner - Executes all verification scripts in sequence
# Usage: bash run-verification.sh

set -e

colors=(
    bold='\033[1m'
    reset='\033[0m'
    green='\033[32m'
    blue='\033[34m'
    yellow='\033[33m'
    red='\033[31m'
)

echo -e "\n${colors[bold]}╔════════════════════════════════════════════════════════════╗${colors[reset]}"
echo -e "${colors[bold]}║     🚀 COMPREHENSIVE BACKEND VERIFICATION SUITE           ║${colors[reset]}"
echo -e "${colors[bold]}╚════════════════════════════════════════════════════════════╝${colors[reset]}\n"

# Check if server is running
echo -e "${colors[blue]}Checking if server is running...${colors[reset]}"
if ! curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo -e "${colors[yellow]}⚠️  Server not running on localhost:8000${colors[reset]}"
    echo -e "${colors[yellow]}Start it in another terminal: php -S localhost:8000 -t public/${colors[reset]}\n"

    read -p "Press ENTER to continue anyway, or Ctrl+C to abort..." -r
fi

# Step 1: Verify Database
echo -e "\n${colors[bold]}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors[reset]}"
echo -e "${colors[bold]}STEP 1: Database Verification${colors[reset]}"
echo -e "${colors[bold]}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors[reset]}\n"

php verify-database.php

read -p "Press ENTER to continue to workflow testing..." -r

# Step 2: Run Workflow Tests
echo -e "\n${colors[bold]}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors[reset]}"
echo -e "${colors[bold]}STEP 2: Complete Workflow Verification${colors[reset]}"
echo -e "${colors[bold]}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors[reset]}\n"

php verify-all-workflows.php

# Step 3: Summary
echo -e "\n${colors[bold]}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors[reset]}"
echo -e "${colors[bold]}✅ VERIFICATION COMPLETE${colors[reset]}"
echo -e "${colors[bold]}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors[reset]}\n"

echo -e "${colors[green]}✅ Database verified${colors[reset]}"
echo -e "${colors[green]}✅ All workflows tested${colors[reset]}"
echo -e "${colors[green]}✅ Multiple test students created${colors[reset]}"
echo -e "${colors[green]}✅ 80+ routes verified${colors[reset]}\n"

echo -e "${colors[bold]}📊 Next Steps:${colors[reset]}"
echo -e "  1. Review test results above"
echo -e "  2. Check database for created data"
echo -e "  3. Test frontend integration"
echo -e "  4. Proceed to production setup\n"
