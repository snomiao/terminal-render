#!/bin/bash

echo "Simple test output"
echo "Line 1"
echo "Line 2"
printf "Progress: 10%%\r"
sleep 0.1
printf "Progress: 50%%\r" 
sleep 0.1
printf "Progress: 100%%\r"
echo ""
echo "Complete!"
