const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const ADMIN_EMAIL = 'david@cccis.space';
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const applications = [];
const users = [];

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', port: 587, secure: false,
  auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' }
});

const productLabel = t => ({payday:'Payday Loan',vehicle:'Vehicle Finance',home:'Home Loan',medical:'Medical Aid',insurance:'Insurance',diamond:'Diamond Card'}[t]||t);
const productColor = t => ({payday:'#3B6D11',vehicle:'#3C3489',home:'#633806',medical:'#791F1F',insurance:'#085041',diamond:'#3C3489'}[t]||'#C41E1E');
const tierFromPoints = p => p>=2000?'Diamond':p>=1000?'Gold':'Bronze';

const sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({ from:`"Raoul Capital" <${process.env.SMTP_USER}>`, to, subject, html });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch(e) { console.log(`Email failed to ${to}:`, e.message); }
};

// ── EMAIL TEMPLATES ──────────────────────────────────────────────

const wrap = (content) => `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f4f1;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0"><tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e3de">
<tr><td style="background:#1a1a1a;padding:18px 28px;display:flex;align-items:center;gap:12px">
  <span style="color:#fff;font-size:15px;font-weight:600;letter-spacing:1px">RAOUL CAPITAL</span>
  <span style="color:#C41E1E;font-size:9px;letter-spacing:2px;margin-left:8px">DRIVING THE PIONEERING SPIRIT</span>
</td></tr>
${content}
<tr><td style="padding:16px 28px;border-top:1px solid #e5e3de">
  <p style="margin:0;font-size:11px;color:#aaa">Raoul Capital (Pty) Ltd · Driving the Pioneering Spirit · Johannesburg, SA</p>
</td></tr>
</table></td></tr></table></body></html>`;

const tbl = (rows) => `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f5;border-radius:8px;padding:16px;border:1px solid #e5e3de">${rows}</table>`;
const row = (label, value, color='#1a1a1a') => `<tr><td style="padding:5px 0;font-size:13px;color:#6b6964;width:150px">${label}</td><td style="font-size:13px;font-weight:500;color:${color}">${value}</td></tr>`;

// Registration pending — to member
const emailRegistrationPending = u => wrap(`<tr><td style="padding:28px">
  <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a1a">Application received, ${u.firstName}!</h2>
  <p style="margin:0 0 20px;font-size:14px;color:#6b6964;line-height:1.7">Thank you for registering with Raoul Capital. Your membership application has been submitted and is currently <strong>pending admin approval</strong>. We'll notify you by email once reviewed — usually within 24 hours.</p>
  ${tbl(row('Member ID', u.memberId, '#C41E1E') + row('Name', u.firstName+' '+u.lastName) + row('Union', u.union) + row('Status', '⏳ Pending approval', '#854F0B') + row('Submitted', new Date(u.createdAt).toLocaleString('en-ZA',{timeZone:'Africa/Johannesburg'})))}
  <p style="margin:16px 0 0;font-size:13px;color:#6b6964">Questions? Reply to this email or call <strong>010 000 0000</strong>.</p>
</td></tr>`);

// New registration — to admin (with approve/reject links)
const emailAdminNewUser = u => wrap(`<tr><td style="padding:28px 28px 0">
  <div style="background:#E6F1FB;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:500;color:#185FA5;display:inline-block;margin-bottom:16px">⏳ New Member — Awaiting Approval</div>
  <h2 style="margin:0 0 4px;font-size:20px;color:#1a1a1a">New registration requires approval</h2>
  <p style="margin:0 0 20px;font-size:14px;color:#6b6964">Review the details below and approve or reject this membership application.</p>
</td></tr>
<tr><td style="padding:0 28px">
  ${tbl(row('Name', u.firstName+' '+u.lastName) + row('Member ID', u.memberId, '#C41E1E') + row('Email', u.email) + row('Mobile', u.mobile) + row('ID Number', u.idNumber||'—') + row('Union', u.union) + row('Registered', new Date(u.createdAt).toLocaleString('en-ZA',{timeZone:'Africa/Johannesburg'})))}
</td></tr>
<tr><td style="padding:20px 28px">
  <table cellpadding="0" cellspacing="0"><tr>
    <td style="background:#3B6D11;border-radius:8px;padding:10px 22px;margin-right:8px">
      <a href="${SITE_URL}/api/users/${u.id}/approve?token=admin" style="color:#fff;font-size:14px;font-weight:500;text-decoration:none">✓ Approve member</a>
    </td>
    <td style="padding-left:10px;background:#FEF2F2;border-radius:8px;padding:10px 22px;border:1px solid #fecaca">
      <a href="${SITE_URL}/api/users/${u.id}/reject?token=admin" style="color:#7F1D1D;font-size:14px;font-weight:500;text-decoration:none">✗ Reject</a>
    </td>
    <td style="padding-left:10px">
      <a href="${SITE_URL}" style="color:#6b6964;font-size:13px;text-decoration:none">Open admin portal →</a>
    </td>
  </tr></table>
</td></tr>`);

// Approval — to member
const emailApproved = u => wrap(`<tr><td style="padding:28px">
  <div style="background:#EAF3DE;border-radius:10px;padding:16px;text-align:center;margin-bottom:20px">
    <div style="font-size:32px;margin-bottom:8px">✅</div>
    <div style="font-size:18px;font-weight:600;color:#3B6D11">Membership Approved!</div>
  </div>
  <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a1a">Welcome to Raoul Capital, ${u.firstName}!</h2>
  <p style="margin:0 0 20px;font-size:14px;color:#6b6964;line-height:1.7">Your union membership has been <strong style="color:#3B6D11">approved</strong>. You can now log in and apply for exclusive financial products, earn loyalty points and access all member benefits.</p>
  ${tbl(row('Member ID', u.memberId, '#C41E1E') + row('Name', u.firstName+' '+u.lastName) + row('Union', u.union) + row('Tier', 'Bronze (100 welcome pts)', '#888') + row('Status', '✅ Approved', '#3B6D11'))}
  <table cellpadding="0" cellspacing="0" style="margin-top:20px"><tr>
    <td style="background:#C41E1E;border-radius:8px;padding:12px 28px">
      <a href="${SITE_URL}" style="color:#fff;font-size:15px;font-weight:500;text-decoration:none">Log in and start applying →</a>
    </td>
  </tr></table>
</td></tr>`);

// Rejection — to member
const emailRejected = (u, reason) => wrap(`<tr><td style="padding:28px">
  <div style="background:#FEF2F2;border-radius:10px;padding:16px;text-align:center;margin-bottom:20px">
    <div style="font-size:32px;margin-bottom:8px">❌</div>
    <div style="font-size:18px;font-weight:600;color:#7F1D1D">Membership Not Approved</div>
  </div>
  <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a1a">Hi ${u.firstName},</h2>
  <p style="margin:0 0 20px;font-size:14px;color:#6b6964;line-height:1.7">After reviewing your application, we are unable to approve your Raoul Capital membership at this time${reason ? ': <strong>'+reason+'</strong>' : '.'}.</p>
  ${tbl(row('Member ID', u.memberId) + row('Name', u.firstName+' '+u.lastName) + row('Union', u.union) + row('Status', '❌ Not approved', '#7F1D1D'))}
  <p style="margin:16px 0 0;font-size:13px;color:#6b6964;line-height:1.7">If you believe this is an error or would like to appeal, please contact us at <strong>${ADMIN_EMAIL}</strong> or call <strong>010 000 0000</strong>.</p>
</td></tr>`);

// Application emails
const emailAdminApp = a => { const color=productColor(a.type),label=productLabel(a.type); return wrap(`
<tr><td style="padding:28px 28px 0">
  <div style="background:${color}22;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:500;color:${color};display:inline-block;margin-bottom:16px">New Application — ${label}</div>
  <h2 style="margin:0 0 4px;font-size:20px;color:#1a1a1a">Action required</h2>
  <p style="margin:0 0 20px;font-size:14px;color:#6b6964">A new application is awaiting review.</p>
</td></tr>
<tr><td style="padding:0 28px">
  ${tbl(row('Reference', a.ref, '#C41E1E') + row('Product', label, color) + row('Applicant', (a.data.firstName||'')+ ' '+(a.data.lastName||'')) + row('Email', a.data.email||'—') + row('Union', a.data.union||'—') + (a.data.amount?row('Amount','R'+Number(a.data.amount).toLocaleString()):'') + row('Points awarded', '+'+a.pts+' pts', '#3B6D11'))}
</td></tr>
<tr><td style="padding:20px 28px">
  <table cellpadding="0" cellspacing="0"><tr>
    <td style="background:#C41E1E;border-radius:8px;padding:10px 22px">
      <a href="${SITE_URL}" style="color:#fff;font-size:14px;font-weight:500;text-decoration:none">Review in admin portal →</a>
    </td>
  </tr></table>
</td></tr>`); };

const emailApplicantApp = a => { const label=productLabel(a.type),color=productColor(a.type); return wrap(`<tr><td style="padding:28px">
  <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a1a">Application received</h2>
  <p style="margin:0 0 20px;font-size:14px;color:#6b6964;line-height:1.6">Hi ${a.data.firstName||'there'}, your <strong>${label}</strong> application has been received. Our team will be in touch within 24 hours.</p>
  ${tbl(row('Reference', a.ref, '#C41E1E') + row('Product', label, color) + row('Status', 'Under review', '#854F0B') + row('Points added', '+'+a.pts+' loyalty points', '#3B6D11'))}
  <p style="margin:16px 0 0;font-size:13px;color:#6b6964">Questions? Call <strong>010 000 0000</strong> or reply to this email.</p>
</td></tr>`); };

// ── USER ROUTES ───────────────────────────────────────────────────

app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, mobile, idNumber, union, password } = req.body;
  if (!firstName||!lastName||!email||!mobile||!password) return res.status(400).json({error:'All fields required'});
  if (users.find(u=>u.email===email)) return res.status(400).json({error:'Email already registered'});
  const memberId = 'RC-'+Math.floor(100000+Math.random()*900000);
  const user = {
    id: uuidv4(), memberId, firstName, lastName, email, mobile,
    idNumber: idNumber||'', union: union||'Other', password,
    points: 100, tier: 'Bronze',
    status: 'approved', // auto-approved for Phase 1 demo — change to 'pending' for production
    rejectionReason: '',
    createdAt: new Date().toISOString()
  };
  users.push(user);
  await sendMail(email, `Your Raoul Capital membership application — ${memberId}`, emailRegistrationPending(user));
  await sendMail(ADMIN_EMAIL, `[New Member — Action Required] ${firstName} ${lastName} — ${memberId}`, emailAdminNewUser(user));
  const {password:_,...safe} = user;
  res.json({success:true, user:safe});
});

// Admin credentials (hardcoded for Phase 1 demo)
const ADMIN_CREDS = { email: 'david@cccis.space', password: 'Admin@RC2026', firstName: 'David', lastName: 'Wegerle', role: 'admin' };

app.post('/api/login', (req, res) => {
  const {email,password} = req.body;
  // Check admin login
  if (email === ADMIN_CREDS.email && password === ADMIN_CREDS.password) {
    return res.json({success:true, user:{ id:'admin-001', memberId:'RC-ADMIN', firstName:ADMIN_CREDS.firstName, lastName:ADMIN_CREDS.lastName, email:ADMIN_CREDS.email, role:'admin', tier:'Diamond', points:0 }});
  }
  // Member login
  const user = users.find(u=>u.email===email&&u.password===password);
  if (!user) return res.status(401).json({error:'Invalid email or password'});
  const userApps = applications.filter(a=>a.data.email===email);
  const pts = 100+userApps.reduce((s,a)=>s+(a.pts||0),0);
  user.points=pts; user.tier=tierFromPoints(pts);
  const {password:_,...safe}=user;
  res.json({success:true, user:{...safe, role:'member', applications:userApps}});
});

app.get('/api/users', (req,res) => res.json(users.map(({password,...u})=>u)));

// Approve member (admin action — via email link or portal)
app.get('/api/users/:id/approve', async (req, res) => {
  const user = users.find(u=>u.id===req.params.id);
  if (!user) return res.status(404).send('User not found');
  user.status = 'approved';
  user.approvedAt = new Date().toISOString();
  await sendMail(user.email, `🎉 Your Raoul Capital membership has been approved! — ${user.memberId}`, emailApproved(user));
  // Simple HTML response for email link clicks
  res.send(`<!DOCTYPE html><html><body style="font-family:Arial;background:#f5f4f1;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
    <div style="background:#fff;border-radius:12px;padding:32px;text-align:center;max-width:400px">
      <div style="font-size:40px;margin-bottom:12px">✅</div>
      <h2 style="color:#3B6D11;margin-bottom:8px">Member approved!</h2>
      <p style="color:#6b6964;font-size:14px">${user.firstName} ${user.lastName} (${user.memberId}) has been approved. They have been notified by email.</p>
      <a href="${SITE_URL}" style="display:inline-block;margin-top:16px;background:#C41E1E;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px">Go to admin portal</a>
    </div></body></html>`);
});

// Reject member (admin action)
app.get('/api/users/:id/reject', async (req, res) => {
  const user = users.find(u=>u.id===req.params.id);
  if (!user) return res.status(404).send('User not found');
  user.status = 'rejected';
  user.rejectedAt = new Date().toISOString();
  await sendMail(user.email, `Your Raoul Capital membership application — ${user.memberId}`, emailRejected(user, ''));
  res.send(`<!DOCTYPE html><html><body style="font-family:Arial;background:#f5f4f1;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
    <div style="background:#fff;border-radius:12px;padding:32px;text-align:center;max-width:400px">
      <div style="font-size:40px;margin-bottom:12px">❌</div>
      <h2 style="color:#7F1D1D;margin-bottom:8px">Member rejected</h2>
      <p style="color:#6b6964;font-size:14px">${user.firstName} ${user.lastName} has been notified by email.</p>
      <a href="${SITE_URL}" style="display:inline-block;margin-top:16px;background:#1a1a1a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px">Go to admin portal</a>
    </div></body></html>`);
});

// Approve/reject from portal (PATCH)
app.patch('/api/users/:id', async (req, res) => {
  const user = users.find(u=>u.id===req.params.id);
  if (!user) return res.status(404).json({error:'User not found'});
  const { status, rejectionReason } = req.body;
  user.status = status;
  if (status==='approved') {
    user.approvedAt = new Date().toISOString();
    await sendMail(user.email, `🎉 Your Raoul Capital membership has been approved! — ${user.memberId}`, emailApproved(user));
  } else if (status==='rejected') {
    user.rejectedAt = new Date().toISOString();
    user.rejectionReason = rejectionReason||'';
    await sendMail(user.email, `Your Raoul Capital membership application — ${user.memberId}`, emailRejected(user, rejectionReason));
  }
  const {password:_,...safe}=user;
  res.json({success:true, user:safe});
});

// ── APPLICATION ROUTES ───────────────────────────────────────────

app.post('/api/apply', async (req,res) => {
  const {type,data,pts} = req.body;
  // Block if user is not approved
  if (data.email) {
    const u = users.find(u=>u.email===data.email);
    if (u && u.status !== 'approved') {
      return res.status(403).json({error: u.status==='pending' ? 'Your membership is pending admin approval. You can apply once approved.' : 'Your membership application was not approved. Please contact admin.'});
    }
  }
  const ref = 'RC-'+Math.floor(100000+Math.random()*900000);
  const application = {id:uuidv4(),ref,type,data,pts:pts||50,status:'new',submittedAt:new Date().toISOString()};
  applications.push(application);
  if (data.email) { const u=users.find(u=>u.email===data.email); if(u){u.points=(u.points||100)+(pts||50);u.tier=tierFromPoints(u.points);} }
  await sendMail(ADMIN_EMAIL, `[New Application] ${productLabel(type)} — ${ref}`, emailAdminApp(application));
  if (data.email) await sendMail(data.email, `Your ${productLabel(type)} application — ${ref}`, emailApplicantApp(application));
  res.json({success:true,ref,id:application.id});
});

app.get('/api/applications',(req,res)=>res.json(applications.sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt))));
app.get('/api/applications/:ref',(req,res)=>{const a=applications.find(a=>a.ref===req.params.ref);a?res.json(a):res.status(404).json({error:'Not found'});});
app.patch('/api/applications/:ref',(req,res)=>{const a=applications.find(a=>a.ref===req.params.ref);if(!a)return res.status(404).json({error:'Not found'});a.status=req.body.status||a.status;a.notes=req.body.notes||a.notes;a.updatedAt=new Date().toISOString();res.json(a);});
app.get('/api/stats',(req,res)=>res.json({total:applications.length,users:users.length,pending:users.filter(u=>u.status==='pending').length,approved:users.filter(u=>u.status==='approved').length,byStatus:applications.reduce((acc,a)=>{acc[a.status]=(acc[a.status]||0)+1;return acc;},{}),byType:applications.reduce((acc,a)=>{acc[a.type]=(acc[a.type]||0)+1;return acc;},{})}));

// QR code
app.get('/api/qr', async (req, res) => {
  try {
    const QRCode = require('qrcode');
    const url = req.query.url || `${SITE_URL}/#register`;
    const png = await QRCode.toBuffer(url, {width:400,margin:2,color:{dark:'#C41E1E',light:'#ffffff'}});
    res.set('Content-Type','image/png');
    res.send(png);
  } catch(e){res.status(500).json({error:'QR generation failed'});}
});

app.post('/api/qr/update', async (req, res) => {
  try {
    const QRCode = require('qrcode');
    const {url} = req.body;
    if (!url) return res.status(400).json({error:'URL required'});
    await QRCode.toFile('public/qr-register.png',url,{width:400,margin:2,color:{dark:'#C41E1E',light:'#ffffff'}});
    res.json({success:true,url});
  } catch(e){res.status(500).json({error:'QR update failed'});}
});

app.listen(process.env.PORT||3000,()=>console.log(`Raoul Capital server running on http://localhost:${process.env.PORT||3000}`));
