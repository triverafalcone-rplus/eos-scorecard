# Redemption Plus EOS Scorecard

**Auto-syncing company scorecard with live Salesforce data, deployed to GitHub Pages.**

Updates **every Monday 7 AM ET** with the previous week's metrics from Salesforce.

---

## Live Scorecard

👉 **[eos-scorecard-mockup.html](./eos-scorecard-mockup.html)** (local file preview)

When deployed to GitHub Pages, this will be live at: `https://<your-org>.github.io/rp-eos-scorecard/eos-scorecard-mockup.html`

---

## What It Does

- **Pulls 19 metrics** from Salesforce weekly (Connections, CGOTBA, Leads, Down Accounts, Website Sessions, Ticket Response Rate, etc.)
- **Stores 13-week rolling history** in `scorecard-data.json`
- **Renders EOS scorecard layout** — WHO | MEASURABLES | GOAL | 13 weeks
- **Color-coded by performance** — Green ≥90%, Yellow 70–89%, Red <70%
- **Department-grouped** with R+ brand colors
- **Print-ready** for L10 meetings

---

## 21 Metrics Across 5 Departments

| Department | Metrics | Lead |
|---|---|---|
| **Sales** (OPEN) | Connections, CGOTBA, Leads Qualified, Down Accounts | — |
| **Marketing** | Leads Generated, Click Through Rate, Website Sessions, NPS Score | Steph |
| **Services** | Merchandise Hours, Onsite Feedback, Cranes Hours, Refresh Hours | Megan |
| **Product** | Package Design %, Product Design %, Top 200 OOS, Top 200 At-Risk | Anthony |
| **Operations** | Ticket Response Rate, eNPS, 19K Order Tracker YoY | RINCO |

---

## Setup: GitHub Actions + Salesforce OAuth

### 1. Create a Salesforce Connected App

1. In Salesforce Setup, go to **App Manager** → **New Connected App**
2. Fill in:
   - **Connected App Name**: `R+ EOS Scorecard`
   - **API Name**: `R_EOS_Scorecard`
   - **Contact Email**: your email
3. Under **OAuth Scopes**, select: `api` and `refresh_token`
4. **Save** → Copy the **Consumer Key** and **Consumer Secret**

### 2. Create a Salesforce API User

1. Setup → **Users** → **New User**
2. Fill in details (e.g., `rplus-scorecard-bot`)
3. **User License**: `Salesforce`
4. **Profile**: `System Administrator` (or custom profile with API access)
5. **Save**
6. Click the user → **Reset Password** → Note the temporary password

### 3. Add Secrets to GitHub

In your GitHub repo settings (`Settings → Secrets and variables → Actions`), add:

```
SF_CLIENT_ID=<Connected App Consumer Key>
SF_CLIENT_SECRET=<Connected App Consumer Secret>
SF_USERNAME=<Salesforce API User username>
SF_PASSWORD=<Salesforce API User temporary password>
```

(Example: `SF_PASSWORD` = `YourTempPassword123!XXXX`)

### 4. Deploy the Sync Script

1. Copy these files to your repo root:
   - `sync-scorecard.js` — Salesforce query engine
   - `.github/workflows/sync.yml` — Scheduled trigger (rename from `.github-workflows-sync.yml`)
   - `package.json` — Node.js deps
   - `scorecard-data.json` — Initial data

2. Commit and push:
   ```bash
   git add .github/workflows/sync.yml sync-scorecard.js package.json scorecard-data.json
   git commit -m "Add EOS scorecard sync automation"
   git push
   ```

### 5. Enable GitHub Pages

1. Repo **Settings → Pages**
2. **Source**: Deploy from branch → `main`
3. **Folder**: `/root` (or `/docs` if you move HTML there)
4. **Save**

Your scorecard will be live at: `https://<your-org>.github.io/<repo>/eos-scorecard-mockup.html`

---

## Test the Sync

### Manual run:
```bash
npm install
node sync-scorecard.js
```

### Or trigger via GitHub:
Go to **Actions → EOS Scorecard Sync → Run workflow**

The script will:
1. ✅ Authenticate with Salesforce
2. 📊 Query all 19 metrics for the last 13 weeks
3. 💾 Update `scorecard-data.json`
4. 📤 Commit and push changes

---

## Salesforce Queries (19 Metrics)

| # | Metric | Salesforce Query |
|---|--------|---|
| 1 | Connections Last Week | `Task WHERE Status='Completed' AND CreatedDate >= [week_start]` |
| 2 | CGOTBA Discovery Calls | `Account WHERE CGOTBA_Date__c >= [week_start]` |
| 3 | Leads Qualified | `Lead WHERE IsConverted=true AND ConvertedDate >= [week_start]` |
| 4 | Down Accounts % | `KPI__c WHERE Type__c='DownAccountsNotContacted'` |
| 5 | Leads Generated | `KPI__c WHERE Type__c='LeadsGenerated'` |
| 6 | Click Through Rate | `KPI__c WHERE Type__c='ClickThroughRate'` |
| 7 | Website Sessions | `KPI__c WHERE Type__c='Website Sessions'` |
| 8 | NPS Score | `Survey_Response__c` (rolling 30-day) — *PENDING* |
| 9–12 | Services Time Tracking | Time_Tracking__c — *SPARSE DATA* |
| 13–14 | Design Penetration | PackageUpdateLog__c, Product_Warehouse__c — *NOT YET TRACKED* |
| 15–16 | OOS / At-Risk Inventory | Product_Warehouse__c — *NOT YET TRACKED* |
| 17 | Ticket Response Rate | `KPI__c WHERE Type__c='TicketResponseRate'` |
| 18 | eNPS This Quarter | `KPI__c WHERE Type__c='eNPS'` |
| 19 | 19K Order Tracker YoY | `RPlus_Order__c` (count by year) |

**Note:** Metrics 8–16 are sparse or unmapped. The script populates them as `null` until data tracking improves.

---

## File Structure

```
.
├── sync-scorecard.js              # Weekly Salesforce sync script
├── scorecard-data.json            # 13-week rolling data (auto-updated)
├── eos-scorecard-mockup.html      # React-rendered scorecard UI
├── package.json                   # Node.js deps
├── .github/workflows/sync.yml     # GitHub Actions trigger (Monday 7 AM ET)
└── README.md                      # This file
```

---

## Customization

### Change Sync Schedule
Edit `.github/workflows/sync.yml`:
```yaml
cron: '0 11 * * 1'  # Monday 11 AM UTC = 7 AM ET (adjust for DST)
```

### Add/Remove Metrics
Edit `sync-scorecard.js`, add/remove SOQL queries in `fetchWeekMetrics()`.

### Change Goals
Edit `scorecard-data.json` → each metric's `goal` field.

### Customize Layout
Edit `eos-scorecard-mockup.html` — CSS vars for colors, fonts, spacing.

---

## Troubleshooting

### "Auth failed" in GitHub Actions
- Verify `SF_USERNAME` and `SF_PASSWORD` in Secrets
- Reset the Salesforce API user's password in Setup
- Ensure Connected App has `api` and `refresh_token` scopes

### Scorecard shows old data
- Check GitHub Actions run logs: **Actions → EOS Scorecard Sync**
- Verify `scorecard-data.json` was committed (check git log)
- Try manual sync: **Actions → Run workflow**

### No data for a metric
- Some metrics are sparse (Services hours, Design updates)
- Check Salesforce to confirm data exists for that week
- Add `console.log()` in sync script to debug SOQL results

---

## Maintenance

- **Weekly**: Scorecard auto-updates Monday 7 AM ET (no action needed)
- **Monthly**: Review metrics with Michael/leadership during L10 meetings
- **Quarterly**: Validate SOQL queries haven't broken (check GitHub Actions logs)
- **Annual**: Update goals in `scorecard-data.json` for new year

---

## Questions?

- **Scorecard layout/UI**: See `eos-scorecard-mockup.html`
- **Salesforce data issues**: Check `rp-salesforce-guide.md`
- **Automation issues**: See GitHub Actions logs or contact Michael

---

**Last updated:** September 10, 2026  
**Owner:** Tanya Rivera-Falcone (Redemption Plus People Operations)
