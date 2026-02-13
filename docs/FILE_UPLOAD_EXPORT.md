# File Upload & Export Guide

## Supported File Formats

### Import (Upload)
- **JSON** (.json)
- **CSV** (.csv)
- **TXT** (.txt)

### Export (Download)
- **JSON** (.json)
- **CSV** (.csv)

## Import File Formats

### JSON Format

#### Array of Strings
```json
[
  "Hello, world!",
  "Welcome to our platform",
  "Get started today"
]
```

#### Array of Objects
```json
[
  {
    "source": "Hello, world!",
    "target": "Bonjour, monde!",
    "context": "greeting"
  },
  {
    "source": "Welcome to our platform",
    "target": "Bienvenue sur notre plateforme"
  }
]
```

#### Object with Key-Value Pairs
```json
{
  "greeting": "Hello, world!",
  "welcome": "Welcome to our platform",
  "cta": "Get started today"
}
```

**Supported Field Names:**
- Source: `source`, `text`, `source_text`, `value`
- Target: `target`, `translation`, `target_text`
- Context: `context`, `description`, `note`

### CSV Format

#### With Header
```csv
source,target,context
"Hello, world!","Bonjour, monde!","greeting"
"Welcome to our platform","Bienvenue sur notre plateforme","welcome message"
"Get started today","Commencez aujourd'hui","call to action"
```

#### Without Header (Source Only)
```csv
Hello, world!
Welcome to our platform
Get started today
```

**Notes:**
- First column: Source text (required)
- Second column: Target text (optional)
- Third column: Context/notes (optional)
- Values with commas or quotes are automatically escaped

### TXT Format

#### Paragraph Mode (Double Newlines)
```
This is the first paragraph.
It can span multiple lines.

This is the second paragraph.
Also multiple lines.

Third paragraph here.
```

#### Line Mode (Single Newlines)
```
First line becomes a segment
Second line becomes another segment
Third line is also a segment
```

**Notes:**
- If file contains double newlines (`\n\n`), splits by paragraphs
- Otherwise, splits by single newlines
- Empty lines are ignored

## Export Formats

### JSON Export
```json
[
  {
    "source": "Hello, world!",
    "target": "Bonjour, monde!",
    "status": "confirmed"
  },
  {
    "source": "Welcome to our platform",
    "target": "",
    "status": "draft"
  }
]
```

### CSV Export
```csv
Source,Target,Status
"Hello, world!","Bonjour, monde!","confirmed"
"Welcome to our platform","","draft"
```

## Usage

### Importing Files

1. Click "Import File" button in project detail page
2. Drag & drop file or click to browse
3. Preview first 5 segments
4. Click "Upload & Import" to add segments to project
5. Segments are created with "draft" status

### Exporting Translations

1. Click "Export" dropdown button
2. Choose format (JSON or CSV)
3. File downloads automatically with project name
4. Filename format: `{project_name}_translations.{format}`

## File Size Limits

- Maximum file size: 10 MB (browser limit)
- Recommended: < 5,000 segments per file
- Large files may take longer to process

## Error Handling

### Common Errors

**"Invalid JSON format"**
- Check JSON syntax with a validator
- Ensure proper quotes and commas

**"CSV file is empty"**
- File must contain at least one line of data
- Check for hidden characters

**"Unsupported file format"**
- Only .json, .csv, and .txt files are supported
- Check file extension

**"No valid segments found in file"**
- File parsed successfully but no segments extracted
- Check file structure matches expected format

## Best Practices

1. **Test with small files first** - Upload a sample file to verify format
2. **Use consistent formatting** - Stick to one JSON structure throughout
3. **Include context** - Add context/description fields for better translations
4. **Pre-translate when possible** - Include target text in import for review
5. **Export regularly** - Download backups of your translations
6. **Use CSV for spreadsheets** - Easy to edit in Excel/Google Sheets
7. **Use JSON for developers** - Better for programmatic access

## Integration Examples

### From Localization Tools

**i18next JSON:**
```json
{
  "greeting": "Hello",
  "welcome": "Welcome to our app"
}
```

**React-intl:**
```json
[
  { "id": "greeting", "defaultMessage": "Hello" },
  { "id": "welcome", "defaultMessage": "Welcome" }
]
```

### From Translation Memory

**TMX to CSV:**
1. Export TMX from your TM tool
2. Convert to CSV with source/target columns
3. Import to LinguaFlow

### To Translation Tools

**Export JSON:**
- Import to i18next, react-intl, or other frameworks
- Use as translation memory source

**Export CSV:**
- Open in Excel/Google Sheets
- Share with translators
- Re-import after translation

## API Integration

For programmatic access, use the segments API:

```javascript
// Create segments from array
const segments = parsedData.map(item => ({
  project_id: projectId,
  source_text: item.source,
  target_text: item.target,
  status: 'draft'
}));

// Bulk create
await Promise.all(
  segments.map(s => api.createSegment(s))
);
```
