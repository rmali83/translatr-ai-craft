#!/bin/bash

# API Testing Script for CAT Tool
# Run this after starting the backend server

BASE_URL="http://localhost:5000"
USER_ID="00000000-0000-0000-0000-000000000003" # Translator

echo "🧪 Testing CAT Tool API"
echo "======================="
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
response=$(curl -s "${BASE_URL}/health")
if echo "$response" | grep -q "ok"; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    echo "$response"
fi
echo ""

# Test 2: Get Current User
echo "Test 2: Get Current User (RBAC)"
response=$(curl -s -H "x-user-id: ${USER_ID}" "${BASE_URL}/api/auth/me")
if echo "$response" | grep -q "success"; then
    echo "✅ User authentication passed"
    echo "$response" | jq '.data.primary_role'
else
    echo "❌ User authentication failed"
    echo "$response"
fi
echo ""

# Test 3: Create Project
echo "Test 3: Create Project"
project_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "x-user-id: ${USER_ID}" \
    -d '{
        "name": "API Test Project",
        "source_language": "English",
        "target_language": "French",
        "status": "draft"
    }' \
    "${BASE_URL}/api/projects")

if echo "$project_response" | grep -q "success"; then
    echo "✅ Project creation passed"
    PROJECT_ID=$(echo "$project_response" | jq -r '.data.id')
    echo "Project ID: $PROJECT_ID"
else
    echo "❌ Project creation failed"
    echo "$project_response"
fi
echo ""

# Test 4: Create Segment
echo "Test 4: Create Segment"
segment_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "x-user-id: ${USER_ID}" \
    -d "{
        \"project_id\": \"${PROJECT_ID}\",
        \"source_text\": \"Hello world\",
        \"target_text\": null,
        \"status\": \"draft\"
    }" \
    "${BASE_URL}/api/segments")

if echo "$segment_response" | grep -q "success"; then
    echo "✅ Segment creation passed"
    SEGMENT_ID=$(echo "$segment_response" | jq -r '.data.id')
    echo "Segment ID: $SEGMENT_ID"
else
    echo "❌ Segment creation failed"
    echo "$segment_response"
fi
echo ""

# Test 5: Translation with Quality Evaluation
echo "Test 5: Translation with Quality Evaluation"
translate_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "source_text": "Hello world",
        "source_lang": "English",
        "target_lang": "French",
        "use_glossary": true
    }' \
    "${BASE_URL}/api/translate")

if echo "$translate_response" | grep -q "success"; then
    echo "✅ Translation passed"
    echo "Translated text:" $(echo "$translate_response" | jq -r '.data.translated_text')
    echo "Quality score:" $(echo "$translate_response" | jq -r '.data.quality_score')
    echo "Source:" $(echo "$translate_response" | jq -r '.data.source')
else
    echo "❌ Translation failed"
    echo "$translate_response"
fi
echo ""

# Test 6: Get Segments
echo "Test 6: Get Segments"
segments_response=$(curl -s -H "x-user-id: ${USER_ID}" \
    "${BASE_URL}/api/segments?project_id=${PROJECT_ID}")

if echo "$segments_response" | grep -q "success"; then
    echo "✅ Get segments passed"
    segment_count=$(echo "$segments_response" | jq '.data | length')
    echo "Segment count: $segment_count"
else
    echo "❌ Get segments failed"
    echo "$segments_response"
fi
echo ""

# Test 7: Update Segment
echo "Test 7: Update Segment"
update_response=$(curl -s -X PUT \
    -H "Content-Type: application/json" \
    -H "x-user-id: ${USER_ID}" \
    -d '{
        "target_text": "Bonjour le monde",
        "status": "confirmed",
        "quality_score": 95
    }' \
    "${BASE_URL}/api/segments/${SEGMENT_ID}")

if echo "$update_response" | grep -q "success"; then
    echo "✅ Segment update passed"
else
    echo "❌ Segment update failed"
    echo "$update_response"
fi
echo ""

# Test 8: Workflow Status
echo "Test 8: Get Workflow Status"
workflow_response=$(curl -s -H "x-user-id: ${USER_ID}" \
    "${BASE_URL}/api/workflow/project/${PROJECT_ID}/status")

if echo "$workflow_response" | grep -q "success"; then
    echo "✅ Workflow status passed"
    echo "$workflow_response" | jq '.data'
else
    echo "❌ Workflow status failed"
    echo "$workflow_response"
fi
echo ""

# Test 9: Add Glossary Term
echo "Test 9: Add Glossary Term"
glossary_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "x-user-id: ${USER_ID}" \
    -d '{
        "source_term": "hello",
        "target_term": "bonjour",
        "language_pair": "English-French",
        "description": "Common greeting"
    }' \
    "${BASE_URL}/api/glossary")

if echo "$glossary_response" | grep -q "success"; then
    echo "✅ Glossary term creation passed"
else
    echo "❌ Glossary term creation failed"
    echo "$glossary_response"
fi
echo ""

# Test 10: RBAC - Try unauthorized action
echo "Test 10: RBAC - Unauthorized Action (Reviewer trying to edit)"
REVIEWER_ID="00000000-0000-0000-0000-000000000004"
rbac_response=$(curl -s -X PUT \
    -H "Content-Type: application/json" \
    -H "x-user-id: ${REVIEWER_ID}" \
    -d '{"status": "completed"}' \
    "${BASE_URL}/api/workflow/project/${PROJECT_ID}/status")

if echo "$rbac_response" | grep -q "403"; then
    echo "✅ RBAC protection working (403 Forbidden)"
else
    echo "⚠️  RBAC might not be working correctly"
    echo "$rbac_response"
fi
echo ""

echo "======================="
echo "🎉 API Testing Complete"
echo "======================="
