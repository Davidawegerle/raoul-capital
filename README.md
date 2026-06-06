# Raoul Capital — Union Loyalty Portal

Full-stack prototype: member application portal + admin dashboard.
Admin notifications → david@cccsis.space

---

## Quick start

```bash
cd raoul-capital
npm install
node server.js
```

Open http://localhost:3000

---

## Enable live email notifications

The server uses Gmail SMTP. Set two environment variables before starting:

```bash
export SMTP_USER="your.gmail@gmail.com"
export SMTP_PASS="your-16-char-app-password"
node server.js
```

**How to get a Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification if not already on
3. Go to App Passwords → create one for "Mail"
4. Paste the 16-character password as SMTP_PASS

When an application is submitted:
- Admin receives a formatted notification at david@cccsis.space
- Applicant receives a confirmation if they entered their email

---

## Application types & unique flows

| Product | Steps | Key features |
|---|---|---|
| Payday Loan | 4 | Live slider, fee + cashback calculator |
| Vehicle Finance | 4 | Live installment calc, affordability check |
| Home Loan | 5 | Bond estimate, FLISP check, union top-up |
| Medical Aid | 5 | Pre-existing conditions, plan selector |
| Insurance | 4 | Multi-cover selector, beneficiary capture |
| Diamond Card | 4 | Eligibility gate, card customisation |

---

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/apply | Submit application |
| GET | /api/applications | List all applications |
| GET | /api/applications/:ref | Get one application |
| PATCH | /api/applications/:ref | Update status |
| GET | /api/stats | Summary stats |

---

## File structure

```
raoul-capital/
├── server.js          ← Express backend + email
├── public/
│   └── index.html     ← Full frontend (apply + admin)
├── start.sh           ← Startup script
└── README.md
```

---

## Investor demo flow

1. Open http://localhost:3000
2. Click a product card (e.g. Payday Loan)
3. Complete the multi-step form and submit
4. Check david@cccsis.space for the admin notification email
5. Click "Admin Portal" in the nav bar to see the application in the dashboard
6. Use Approve / Callback / Reject buttons to process it
