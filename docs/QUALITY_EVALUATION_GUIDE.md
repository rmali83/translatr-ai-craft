# AI Translation Quality Evaluation Guide

## Overview

The application now includes automatic AI-powered quality evaluation for all translations. After each translation, the AI analyzes the quality and provides a score from 0-100, detects terminology violations, and suggests improvements when needed.

## Features

### 1. Automatic Quality Scoring
- Every AI translation receives a quality score (0-100)
- Scores are stored in the database
- Visual badges display quality in the UI

### 2. Terminology Violation Detection
- AI checks if glossary terms were used correctly
- Violations are flagged and displayed
- Helps maintain consistency

### 3. Improvement Suggestions
- Translations scoring below 85 receive suggestions
- AI provides specific recommendations
- Helps translators improve quality

## Quality Score Ranges

| Score | Label | Color | Meaning |
|-------|-------|-------|---------|
| 95-100 | Excellent | Green | Perfect translation, no issues |
| 85-94 | Good | Blue | High quality, minor improvements possible |
| 70-84 | Fair | Yellow | Acceptable but needs review |
| 0-69 | Poor | Red | Significant issues, requires revision |

## Evaluation Criteria

The AI evaluates translations based on:

1. **Accuracy** (40%)
   - Does it convey the same meaning?
   - Are there any mistranslations?
   - Is the context preserved?

2. **Fluency** (25%)
   - Is it natural in the target language?
   - Does it read smoothly?
   - Are there awkward phrasings?

3. **Terminology** (20%)
   - Are glossary terms used correctly?
   - Is domain-specific vocabulary accurate?
   - Is terminology consistent?

4. **Grammar** (10%)
   - Are there grammatical errors?
   - Is punctuation correct?
   - Is capitalization appropriate?

5. **Style** (5%)
   - Is the tone appropriate?
   - Is the formality level correct?
   - Does it match the source style?

## User Interface

### Quality Badge

Each segment displays a quality badge next to the status badge:

```
[draft] [85/100]
```

The badge color indicates quality level:
- 🟢 Green (95-100): Excellent
- 🔵 Blue (85-94): Good
- 🟡 Yellow (70-84): Fair
- 🔴 Red (0-69): Poor

### Quality Tooltip

Hover over the quality badge to see details:

```
Quality: Good

Violations:
• "Software" should be translated as "Logiciel" (glossary term)

Suggestions:
• Consider using more formal tone
• Review punctuation in target text
```

### Translation Response

When translating, you'll see quality information in the toast notification:

```
✓ Translated
Source: AI (2 glossary terms) (Quality: 92/100 ✓)
```

## API Response

### Translation with Quality

```json
{
  "success": true,
  "data": {
    "source_text": "Hello world",
    "translated_text": "Bonjour le monde",
    "source_lang": "English",
    "target_lang": "French",
    "source": "AI",
    "quality_score": 92,
    "quality_passed": true,
    "quality_violations": [],
    "quality_suggestions": []
  }
}
```

### Low Quality Example

```json
{
  "success": true,
  "data": {
    "source_text": "Click the button",
    "translated_text": "Cliquer le bouton",
    "source_lang": "English",
    "target_lang": "French",
    "source": "AI",
    "quality_score": 78,
    "quality_passed": false,
    "quality_violations": [
      "Missing article: should be 'le bouton' or 'sur le bouton'"
    ],
    "quality_suggestions": [
      "Consider using 'Cliquez sur le bouton' for better fluency",
      "Review article usage in French"
    ]
  }
}
```

## Database Schema

### Segments Table

```sql
ALTER TABLE segments ADD COLUMN quality_score INTEGER;
ALTER TABLE segments ADD COLUMN quality_violations TEXT[];
ALTER TABLE segments ADD COLUMN quality_suggestions TEXT[];
```

### Translation Memory Table

```sql
ALTER TABLE translation_memory ADD COLUMN quality_score INTEGER;
```

## Configuration

### AI Provider

Quality evaluation uses the same AI provider as translation:

```env
# .env
AI_PROVIDER=openai  # or anthropic, or mock
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
```

### Mock Provider

For testing without API costs, use the mock provider:

```env
AI_PROVIDER=mock
```

Mock provider generates random scores between 70-100.

## Implementation Details

### Backend Flow

1. User requests translation
2. AI translates the text
3. AI evaluates the translation quality
4. Quality score and details are stored
5. Response includes quality information

### Quality Evaluation Prompt

The AI receives:
- Source text
- Translated text
- Source and target languages
- Glossary terms (if any)

And returns:
```json
{
  "score": 85,
  "terminology_violations": ["..."],
  "suggestions": ["..."]
}
```

### Caching

Quality scores are stored in:
- Translation Memory (for reuse)
- Segments table (for project tracking)

When a TM match is found, the stored quality score is returned.

## Best Practices

### For Translators

1. **Review Low Scores**
   - Always review translations scoring below 85
   - Address violations and suggestions
   - Re-translate if score is below 70

2. **Learn from Suggestions**
   - Read AI suggestions carefully
   - Apply improvements to future translations
   - Build better translation habits

3. **Verify Terminology**
   - Check glossary terms are used correctly
   - Report false violations to project manager
   - Update glossary if needed

### For Project Managers

1. **Set Quality Standards**
   - Define minimum acceptable score (e.g., 85)
   - Require review for scores below threshold
   - Track quality trends over time

2. **Monitor Quality**
   - Review segments with low scores
   - Identify common issues
   - Provide feedback to translators

3. **Update Glossary**
   - Add terms that cause violations
   - Clarify ambiguous terms
   - Keep glossary up to date

### For Reviewers

1. **Prioritize Low Scores**
   - Review segments with scores below 85 first
   - Verify AI suggestions are valid
   - Provide additional feedback

2. **Validate Violations**
   - Check if violations are accurate
   - Correct false positives
   - Report systematic issues

3. **Approve High Quality**
   - Fast-track segments scoring 95+
   - Focus time on problematic translations
   - Trust AI for excellent translations

## Troubleshooting

### Quality Score Not Showing

**Possible Causes:**
- Translation from TM (old entry without score)
- Database migration not run
- API error during evaluation

**Solutions:**
1. Run database migration: `quality-score-update.sql`
2. Re-translate the segment to get new score
3. Check server logs for errors

### Inaccurate Scores

**Possible Causes:**
- AI model limitations
- Ambiguous source text
- Missing context

**Solutions:**
1. Provide more context in source text
2. Add relevant glossary terms
3. Manually review and override if needed

### Evaluation Timeout

**Possible Causes:**
- Long text segments
- API rate limits
- Network issues

**Solutions:**
1. Break long texts into smaller segments
2. Check API quota and limits
3. Retry after a moment

## Performance Considerations

### API Costs

Quality evaluation requires an additional API call per translation:
- Translation: ~500 tokens
- Evaluation: ~1000 tokens
- Total: ~1500 tokens per segment

**Cost Optimization:**
- Use TM to avoid re-evaluation
- Batch translations when possible
- Use mock provider for testing

### Response Time

Quality evaluation adds ~2-3 seconds to translation time:
- Translation: 1-2 seconds
- Evaluation: 2-3 seconds
- Total: 3-5 seconds

**Speed Optimization:**
- Consider async evaluation for large batches
- Cache results in TM
- Use faster AI models for evaluation

## Future Enhancements

1. **Custom Scoring Criteria**
   - Allow projects to define custom weights
   - Industry-specific evaluation
   - Client-specific requirements

2. **Quality Trends**
   - Track quality over time
   - Identify improving/declining translators
   - Generate quality reports

3. **Automated Actions**
   - Auto-reject translations below threshold
   - Auto-approve excellent translations
   - Trigger notifications for low quality

4. **Human Feedback Loop**
   - Allow users to rate AI evaluations
   - Improve evaluation accuracy over time
   - Train custom evaluation models

5. **Comparative Analysis**
   - Compare multiple translation options
   - Show quality differences
   - Suggest best alternative

## API Reference

### Translate with Quality

```typescript
POST /api/translate

Request:
{
  "source_text": "Hello world",
  "source_lang": "English",
  "target_lang": "French",
  "use_glossary": true
}

Response:
{
  "success": true,
  "data": {
    "translated_text": "Bonjour le monde",
    "quality_score": 92,
    "quality_passed": true,
    "quality_violations": [],
    "quality_suggestions": []
  }
}
```

### Update Segment with Quality

```typescript
PUT /api/segments/:id

Request:
{
  "target_text": "Bonjour le monde",
  "quality_score": 92,
  "quality_violations": [],
  "quality_suggestions": []
}
```

## Monitoring

### Server Logs

Quality evaluation is logged:

```
✓ Translation quality score: 92/100 (PASSED)
⚠ Terminology violations: ["Software" should be "Logiciel"]
```

### Database Queries

Check quality distribution:

```sql
SELECT 
  CASE 
    WHEN quality_score >= 95 THEN 'Excellent'
    WHEN quality_score >= 85 THEN 'Good'
    WHEN quality_score >= 70 THEN 'Fair'
    ELSE 'Poor'
  END as quality_level,
  COUNT(*) as count
FROM segments
WHERE quality_score IS NOT NULL
GROUP BY quality_level;
```

Average quality by project:

```sql
SELECT 
  p.name,
  AVG(s.quality_score) as avg_quality,
  COUNT(*) as total_segments
FROM projects p
JOIN segments s ON s.project_id = p.id
WHERE s.quality_score IS NOT NULL
GROUP BY p.id, p.name
ORDER BY avg_quality DESC;
```

## Support

For issues or questions:
- Check server logs for evaluation errors
- Verify database schema is up to date
- Test with mock provider first
- Review AI provider documentation
