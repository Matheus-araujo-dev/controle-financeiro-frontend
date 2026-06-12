#!/bin/bash

set -e

echo "=== Frontend Security Check ==="

echo ""
echo "[1/2] Running npm audit..."
npm audit --audit-level=moderate
if [ $? -ne 0 ]; then
    echo "AUDIT FAILED: Vulnerabilities found"
    exit 1
fi
echo "Audit passed" -ForegroundColor Green

echo ""
echo "[2/2] Checking for outdated packages..."
npm outdated
echo "Outdated check completed"

echo ""
echo "SECURITY CHECK PASSED"
exit 0