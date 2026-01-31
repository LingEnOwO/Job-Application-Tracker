# Job Application Tracker MVP

A local-only Chrome extension and web UI for tracking job applications with auto-extraction capabilities.

## 🎯 Overview

This is a **personal-use MVP** designed to eliminate manual copy/paste when applying to jobs.

**Chrome Extension** (Manifest V3) with:
- Auto-extraction from job postings
- Built-in sheet UI for managing applications

**All data is stored locally in your browser.** No backend, no cloud sync, no authentication required.

## ✨ Features

### Features

- **Auto-extraction** from Greenhouse, Lever, Ashby, Workday, and generic job sites
- **Review & edit** extracted data before saving
- **Built-in sheet UI** with interactive table view and expandable row details
- **Filters** by stage (Applied, OA, Phone, Onsite, Offer, Rejected)
- **Search** across company, position, notes, and job description
- **Notes section** for tracking deadlines and important info
- **Export/Import** data as CSV or JSON
- **Dark mode** support

## 📦 Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. The extension icon should appear in your toolbar

## 🚀 Usage

### Saving a Job Application

1. Navigate to a job posting page
2. Click the Job Application Tracker extension icon
3. The side panel opens with auto-extracted information
4. Review and edit the fields as needed
5. Click "Save Application"

### Managing Applications

1. After saving, click **"View All Applications"** link in the side panel
2. View all saved applications in the table
3. Click any row to open the side peek panel for detailed view
4. Edit fields directly in the table or side panel (changes auto-save)
5. Use filters to view specific stages
6. Use search to find applications by company, position, or notes
7. Add general notes in the notes section

### Exporting Data

**CSV Export** (for spreadsheet analysis):
- Click "Export CSV" in the Sheet UI
- Opens in Excel, Google Sheets, etc.

**JSON Export** (for backup):
- Click "Export JSON" in the Sheet UI
- Save the file as a backup

### Importing Data

1. Click "Import JSON" in the Sheet UI
2. Select a previously exported JSON file
3. Data will be merged with existing applications

## 📊 Data Model

Each job application includes:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Job URL | String | ✓ | Link to job posting |
| Apply Date | Date | ✓ | Date you applied (default: today) |
| Company | String | | Company name |
| Position | String | | Job title/role |
| Stage | Select | | Applied, OA, Phone, Onsite, Offer, Rejected |
| Job ID | String | | Internal job/requisition ID |
| Response Date | Date | | Date of company response |
| Resume Version | String | | Which resume you used |
| Referral | Boolean | | Applied via referral? |
| Job Description | Text | | Full job description |
| Notes | Text | | Personal notes (markdown) |

## 🔒 Data Storage

**Local Only**: All data is stored in your browser using `chrome.storage.local`.

**Important Notes**:
- Data is NOT synced across devices
- Data will be lost if you clear browser data or uninstall the extension
- **Always export backups regularly**

**Access**: Use the "View All Applications" link from the extension to access the sheet UI. This ensures you're using the extension context with proper storage access.

## ⚠️ Limitations

### Auto-Extraction
- Accuracy varies by job site and ATS
- No AI/LLM - uses deterministic heuristics only
- Always review extracted data before saving

### Data Persistence
- Data is browser-specific
- Not synced across devices
- Vulnerable to browser data clearing
- **Export backups to prevent data loss**

### Out of Scope (Not Implemented)
- Backend or API server
- Cloud sync
- Google Sheets integration
- Authentication
- AI-powered extraction
- Analytics dashboards

## 🛠️ Development

### Project Structure

```
JobSheet/
├── extension/              # Chrome extension (everything you need)
│   ├── manifest.json       # Extension manifest
│   ├── background.js       # Service worker
│   ├── content.js          # Content script with extraction logic
│   ├── sidepanel.html      # Review form UI
│   ├── sidepanel.js        # Review form logic
│   ├── sheet-ui.html       # Built-in sheet UI
│   ├── sheet-ui-app.js     # Sheet UI logic
│   ├── sheet-ui-styles.css # Sheet UI styles
│   ├── components/         # UI components
│   │   ├── table.js
│   │   └── sidepanel-view.js
│   ├── utils/              # Utilities
│   │   └── export-import.js
│   ├── lib/                # Core libraries
│   │   ├── storage.js      # Storage layer
│   │   └── utils.js        # Helper functions
│   ├── extractors/         # ATS-specific extractors (reference)
│   └── icon*.png           # Extension icons
└── README.md
```

### Tech Stack

- **Extension**: Vanilla JavaScript, Manifest V3
- **UI**: HTML, CSS, JavaScript (ES6 modules)
- **Storage**: chrome.storage.local
- **No frameworks or build tools required**

### Testing

Manual testing only for this MVP. Test on:
- Greenhouse job postings (e.g., Airbnb careers)
- Lever job postings (e.g., Netflix careers)
- Ashby job postings
- Workday job postings
- Generic job sites (LinkedIn, Indeed)

## 📝 License

This is a personal MVP project. Use as you wish.

## 🤝 Contributing

This is a personal-use MVP. Feel free to fork and customize for your own needs.

## 💡 Tips

1. **Export regularly** - Set a reminder to export your data weekly
2. **Use notes field** - Track interview prep, contacts, follow-ups
3. **Update stages** - Keep your pipeline current
4. **Bookmark Sheet UI** - For quick access
5. **Test extraction** - Always review auto-extracted data

## 🐛 Known Issues

- Extension icons are placeholder images
- No undo functionality
- Limited error handling
- No data validation beyond required fields
- Side panel may not work on some protected pages (chrome://, etc.)

## 🔮 Future Enhancements (Not in MVP)

- Google Sheets sync
- Email reminders for follow-ups
- Interview preparation notes
- Company research links
- Salary tracking
- Application analytics
- Browser sync
- Mobile app

---

**Remember**: This is a local-only tool. Export your data regularly to avoid loss!
