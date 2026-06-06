#!/bin/bash
echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║     RAOUL CAPITAL — Union Loyalty Portal      ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

if [ -z "$SMTP_USER" ] || [ -z "$SMTP_PASS" ]; then
  echo "⚠️  Email not configured — set env variables for live email:"
  echo "   export SMTP_USER='your.gmail@gmail.com'"
  echo "   export SMTP_PASS='your-app-password'"
  echo "   (Admin notifications will be skipped without these)"
  echo ""
fi

echo "🚀 Starting server on http://localhost:3000"
echo "📋 Admin portal: http://localhost:3000 → click 'Admin Portal'"
echo "📧 Admin email:  david@cccsis.space"
echo ""
node server.js
