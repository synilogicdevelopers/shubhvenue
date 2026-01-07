# Venue API Test Script

यह script venue creation API को test करने के लिए है।

## Installation

पहले dependencies install करें:

```bash
npm install axios form-data
```

या अगर project में already installed हैं तो skip करें।

## Configuration

`test-venue-api.mjs` या `test-venue-api.js` file में अपने test vendor credentials update करें:

```javascript
const VENDOR_EMAIL = 'vendor@example.com'; // अपना vendor email
const VENDOR_PASSWORD = 'password123'; // अपना vendor password
```

## Run Test

### Option 1: Direct Node Command
```bash
node test-venue-api.mjs
```

### Option 2: Using Batch Script (Windows)
```bash
run-test.bat
```

### Option 3: Using PowerShell Script (Windows)
```powershell
.\run-test.ps1
```

### Option 4: Manual Run
अगर .js file use कर रहे हैं:
```bash
node test-venue-api.js
```

## Tests

Script 3 tests run करता है:

1. **Login Test**: Vendor login करता है और token लेता है
2. **Full Venue Creation**: सभी fields के साथ venue create करता है
3. **FormConfig Test**: केवल name field के साथ venue create करता है (formConfig test)

## Output

Script detailed logs दिखाएगा:
- ✅ Success messages
- ❌ Error messages with details
- 📥 Response data
- 📤 Request data

## Troubleshooting

अगर error आए:
1. Backend server running है check करें (port 8030)
2. Vendor credentials सही हैं check करें
3. Backend console में logs check करें
4. Network connectivity check करें

