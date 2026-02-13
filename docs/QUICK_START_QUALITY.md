# Quick Start: AI Quality Evaluation

## 🚀 Setup in 3 Steps

### 1. Run Database Migration

```bash
# Connect to your Supabase database
# Run the migration SQL file
psql -U postgres -d your_database -f server/database/quality-score-update.sql
```

Or in Supabase SQL Editor:
```sql
-- Copy and paste contents of quality-score-update.sql
ALTER TABLE segments ADD COLUMN IF NOT EXISTS quality_score INTEGER;
ALTER TABLE segments ADD COLUMN IF NOT EXISTS quality_violations TEXT[];
ALTER TABLE segments ADD COLUMN IF NOT EXISTS quality_suggestions TEXT[];
```

### 2. Configure AI Provider

```env
# .env (for testing)
AI_PROVIDER=mock

# .env (for production)
AI_PROVIDER=openai
OPENAI_API_KEY=your_key_here
```

### 3. Start and Test

```bash
# Start backend
cd server
npm run dev

# Start frontend (in another terminal)
npm run dev
```

## ✨ See It in Action

1. Open any project
2. Click "Translate" on a segment
3. Wait 3-5 seconds
4. See quality badge appear: `[92/100]`
5. Hover over badge for details

## 🎨 Quality Badge Colors

| Badge | Score | Meaning |
|-------|-------|---------|
| 🟢 95/100 | 95-100 | Excellent - Perfect! |
| 🔵 88/100 | 85-94 | Good - Minor improvements |
| 🟡 78/100 | 70-84 | Fair - Needs review |
| 🔴 65/100 | 0-69 | Poor - Requires revision |

## 📊 What You'll See

### In the UI

**Quality Badge:**
```
[draft] [92/100] ← Quality score
```

**Hover Tooltip:**
```
Quality: Good

Violations:
• "Software" should be "Logiciel"

Suggestions:
• Consider more formal tone
```

**Toast Notification:**
```
✓ Translated
Source: AI (2 glossary terms) (Quality: 92/100 ✓)
```

### In the API Response

```json
{
  "translated_text": "Bonjour le monde",
  "quality_score": 92,
  "quality_passed": true,
  "quality_violations": [],
  "quality_suggestions": []
}
```

## 🧪 Testing with Mock Provider

For quick testing without API costs:

```env
AI_PROVIDER=mock
```

Mock provider:
- Generates random scores (70-100)
- Instant responses
- No API costs
- Perfect for development

## 🎯 Common Scenarios

### Scenario 1: High Quality Translation

```
Input: "Hello world"
Output: "Bonjour le monde"
Score: 98/100 🟢
Status: Excellent
Action: Auto-approve
```

### Scenario 2: Good Translation

```
Input: "Click the button"
Output: "Cliquez sur le bouton"
Score: 88/100 🔵
Status: Good
Action: Quick review
```

### Scenario 3: Needs Improvement

```
Input: "Save your work"
Output: "Sauver votre travail"
Score: 76/100 🟡
Status: Fair
Violations: ["Should use 'Enregistrer' not 'Sauver'"]
Suggestions: ["Use 'Enregistrez votre travail' for imperative"]
Action: Review and fix
```

### Scenario 4: Poor Quality

```
Input: "Delete file"
Output: "Supprimer fichier"
Score: 62/100 🔴
Status: Poor
Violations: ["Missing article 'le'"]
Suggestions: ["Use 'Supprimer le fichier'", "Add proper article"]
Action: Re-translate
```

## 🔧 Troubleshooting

### Badge Not Showing?

**Check:**
1. Database migration ran? ✓
2. AI provider configured? ✓
3. Translation completed? ✓

**Fix:**
```bash
# Re-run migration
psql -f server/database/quality-score-update.sql

# Check server logs
cd server
npm run dev
# Look for "Translation quality score: X/100"
```

### Score Seems Wrong?

**Try:**
1. Use real AI provider (not mock)
2. Add more glossary terms
3. Provide better context
4. Re-translate the segment

### Slow Performance?

**Optimize:**
1. Use mock provider for testing
2. Translation Memory caches scores
3. Batch translations when possible

## 📈 Monitor Quality

### Check Average Quality

```sql
SELECT AVG(quality_score) as avg_quality
FROM segments
WHERE quality_score IS NOT NULL;
```

### Quality Distribution

```sql
SELECT 
  CASE 
    WHEN quality_score >= 95 THEN '🟢 Excellent'
    WHEN quality_score >= 85 THEN '🔵 Good'
    WHEN quality_score >= 70 THEN '🟡 Fair'
    ELSE '🔴 Poor'
  END as level,
  COUNT(*) as count
FROM segments
WHERE quality_score IS NOT NULL
GROUP BY level
ORDER BY MIN(quality_score) DESC;
```

### Low Quality Segments

```sql
SELECT 
  source_text,
  target_text,
  quality_score,
  quality_violations
FROM segments
WHERE quality_score < 85
ORDER BY quality_score ASC
LIMIT 10;
```

## 💡 Pro Tips

1. **Set Standards**: Define minimum acceptable score (e.g., 85)
2. **Review Low Scores**: Always review segments below threshold
3. **Learn from AI**: Read suggestions to improve future translations
4. **Update Glossary**: Add terms that cause violations
5. **Track Trends**: Monitor quality over time

## 🎓 Best Practices

### For Translators
- ✅ Review all scores below 85
- ✅ Address violations immediately
- ✅ Apply suggestions to improve
- ✅ Re-translate if score below 70

### For Reviewers
- ✅ Prioritize low-scoring segments
- ✅ Verify AI suggestions are valid
- ✅ Fast-track excellent translations (95+)
- ✅ Provide feedback on patterns

### For Project Managers
- ✅ Set quality thresholds
- ✅ Monitor team averages
- ✅ Identify training needs
- ✅ Update glossary regularly

## 📚 Learn More

- **Full Guide**: `docs/QUALITY_EVALUATION_GUIDE.md`
- **Implementation**: `docs/QUALITY_EVALUATION_SUMMARY.md`
- **AI Service**: `server/services/AI_SERVICE_GUIDE.md`

## 🆘 Need Help?

1. Check server logs for errors
2. Verify database schema
3. Test with mock provider
4. Review documentation
5. Check API provider status

## ✅ Success Checklist

- [ ] Database migration completed
- [ ] AI provider configured
- [ ] Backend server running
- [ ] Frontend connected
- [ ] Quality badges visible
- [ ] Tooltips showing details
- [ ] Scores being saved
- [ ] TM caching working

## 🎉 You're Ready!

Start translating and see quality scores in real-time!

**Next Steps:**
1. Translate a few segments
2. Review quality scores
3. Address any violations
4. Monitor quality trends
5. Adjust glossary as needed
