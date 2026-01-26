#!/bin/bash
# Helper script to copy SQL files to clipboard (macOS)

if [ "$#" -eq 0 ]; then
    echo "Usage: ./scripts/copy-sql.sh <file>"
    echo ""
    echo "Examples:"
    echo "  ./scripts/copy-sql.sh schema.sql"
    echo "  ./scripts/copy-sql.sh migrations/001_stored_procedures.sql"
    echo "  ./scripts/copy-sql.sh migrations/002_auth_sync_trigger.sql"
    echo "  ./scripts/copy-sql.sh supabase/seed.sql"
    exit 1
fi

FILE=$1

if [ ! -f "$FILE" ]; then
    echo "❌ Error: File not found: $FILE"
    exit 1
fi

# Copy to clipboard (macOS)
if command -v pbcopy &> /dev/null; then
    cat "$FILE" | pbcopy
    echo "✅ Copied $FILE to clipboard!"
    echo "📋 Now paste it in Supabase SQL Editor and click 'Run'"
elif command -v xclip &> /dev/null; then
    cat "$FILE" | xclip -selection clipboard
    echo "✅ Copied $FILE to clipboard!"
    echo "📋 Now paste it in Supabase SQL Editor and click 'Run'"
else
    echo "⚠️  Clipboard command not found. Showing file contents:"
    echo ""
    cat "$FILE"
fi
