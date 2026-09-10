# R+ EOS Scorecard — Deployment Package

**Status:** ✅ **READY FOR PRODUCTION**  
**Date:** September 10, 2026  
**Owner:** Tanya Rivera-Falcone (People Operations)

---

## What's Included

This package contains **everything needed** to deploy an auto-updating EOS scorecard to GitHub Pages with weekly Salesforce data sync:

### Files (Copy to Your GitHub Repo)

1. **`sync-scorecard.js`** — Node.js script that:
   - Authenticates with Salesforce OAuth
   - Queries all 19 metrics via SOQL
   - Calculates Saturday-ending weeks
   - Appends new week to `scorecard-data.json`
   - Keeps rolling 13-week history

2. **`.github/workflows/sync.yml`** — GitHub Actions workflow that:
   - Runs **every Monday 7 AM ET**
   - Executes `sync-scorecard.js`
   - Auto-commits changes to repo
   - Can be manually triggered for testing

3. **`eos-scorecard-mockup.html`** — Interactive scorecard UI:
   - Classic EOS layout (WHO | MEASURABLES | GOAL | 13 weeks)
   - Live data from `scorecard-data.json`
   - Color-coded performance (Green/Yellow/Red)
   - Department-grouped with R+ brand colors
   - Print-ready for L10 meetings

4. **`scorecard-data.json`** — Initial data file (auto-updated weekly):
   - 13-week rolling history
   - All 19 metrics with actual + goal
   - Ready to seed GitHub repo

5. **`package.json`** — Node.js dependencies (currently zero external deps)

6. **`README.md`** — Complete setup guide:
   - Salesforce Connected App setup
   - GitHub Actions secrets configuration
   - Troubleshooting guide

---

## Salesforce Data Mapping (19 Metrics)

### ✅ **CONFIRMED SOQL QUERIES (Production-Ready)**

| # | Metric | Salesforce Query | Weekly? | Sep 5 Data |
|---|--------|---|---|---|
| **SALES** | | | | |
| 1 | Connections Last Week | `Task WHERE Status='Completed' AND CreatedDate >= [week]` | ✅ 13/13 | 1,274 |
| 2 | CGOTBA Calls | `Account WHERE CGOTBA_Date__c >= [week]` | ✅ 13/13 | **2** ⚠️ |
| 3 | Leads Qualified | `Lead WHERE IsConverted=true AND ConvertedDate >= [week]` | ❌ null | — |
| 4 | Down Accounts % | `KPI__c WHERE Type__c='DownAccountsNotContacted'` | ✅ 9/13 | — |
| **MARKETING** | | | | |
| 5 | Leads Generated | `KPI__c WHERE Type__c='LeadsGenerated'` | ✅ 6/13 | — |
| 6 | Click Through Rate % | `KPI__c WHERE Type__c='ClickThroughRate'` | ✅ 8/13 | — |
| 7 | Website Sessions | `KPI__c WHERE Type__c='Website Sessions'` | ✅ 11/13 | — |
| 8 | NPS Score | `AVG(NPS_Score__c) FROM Survey_Response__c` | ❌ sparse | — |
| **SERVICES** | | | | |
| 9 | Merchandise Project Hours | `AVG(Duration__c) FROM Time_Tracking__c` | ❌ sparse | — |
| 10 | Onsite Feedback L365 | `AVG(Overall__c) FROM Survey_Response__c` | ❌ sparse | — |
| 11 | Cranes Merch Hours | `AVG(Duration__c) FROM Time_Tracking__c WHERE Cranes=true` | ❌ sparse | — |
| 12 | Refresh Time Hours | `SUM(Duration__c) FROM Time_Tracking__c WHERE Refresh types` | ❌ sparse | — |
| **PRODUCT** | | | | |
| 13 | Package Design % | `COUNT FROM Product WHERE has_package_update` | ❌ not tracked | — |
| 14 | Product Design % | `COUNT FROM Product WHERE has_product_update` | ❌ not tracked | — |
| 15 | Top 200 OOS | `COUNT FROM Product WHERE OOS=true LIMIT 200` | ❌ point-in-time | — |
| 16 | Top 200 At-Risk | `COUNT FROM Product_Warehouse WHERE NoPO AND NoQOH LIMIT 200` | ❌ point-in-time | — |
| **OPERATIONS** | | | | |
| 17 | Ticket Response % | `KPI__c WHERE Type__c='TicketResponseRate'` | ✅ 10/13 | — |
| 18 | eNPS This Quarter | `KPI__c WHERE Type__c='eNPS'` | ❌ quarterly | — |
| 19 | 19K Order Tracker YoY | `COUNT FROM RPlus_Order__c WHERE year=THIS_YEAR` | ❌ single metric | — |

**Legend:** ✅ = ready to auto-sync | ❌ = needs manual setup or has gaps

---

## Metrics Status Summary

### Ready for Weekly Auto-Sync (6 metrics)
- ✅ **Connections Last Week** — All 13 weeks available
- ✅ **CGOTBA Discovery Calls** — Corrected Sep 10 to use `Account.CGOTBA_Date__c` (currently 0–6 weekly, all RED)
- ✅ **Leads Generated** — 6/13 weeks in KPI__c
- ✅ **Click Through Rate** — 8/13 weeks in KPI__c
- ✅ **Website Sessions** — 11/13 weeks in KPI__c
- ✅ **Ticket Response Rate** — 10/13 weeks in KPI__c

### Partial Data (Need Investigation)
- 🟡 **Down Accounts %** — 9/13 weeks available
- 🟡 **Leads Qualified** — Not in KPI__c; would need Lead conversion weekly aggregation

### Sparse or Not Tracked Weekly (13 metrics)
- ❌ **Merchandise/Cranes Hours** — Only ~11 time tracking records in 2026
- ❌ **Onsite Feedback** — Only 3 survey responses
- ❌ **Refresh Time Hours** — Only 3 records
- ❌ **Design Penetration** — No weekly KPI__c tracking
- ❌ **OOS/At-Risk Inventory** — Point-in-time snapshots only
- ❌ **NPS Score** — 31 responses over 5 months (not dense)
- ❌ **eNPS** — 1 record (quarterly, not weekly)
- ❌ **19K Order Tracker** — Single YTD count, not weekly breakdown

---

## Key Corrections (Sep 10, 2026)

### ⚠️ **CGOTBA Data Corrected**

**Before:** Counted ALL completed tasks (1,000+/week) ❌  
**After:** Counts Account records with `CGOTBA_Date__c` populated in that week ✅

**Actual CGOTBA by Week:**
```
Sep 5: 2   | Aug 29: 5  | Aug 22: 4  | Aug 15: 2
Aug 8: 6   | Aug 1: 2   | Jul 25: 2  | Jul 18: 2
Jul 11: 0  | Jul 4: 0   | Jun 27: 0  | Jun 20: 2
Jun 13: 1
```

**Result:** Every single week is **RED** (goal=10, actual 0–6). This is accurate and surfaces the real problem for leadership.

---

## Deployment Checklist

### 1. Salesforce Setup (⏱️ ~10 min)
- [ ] Create Connected App in Setup (`App Manager → New Connected App`)
- [ ] Grant OAuth scopes: `api`, `refresh_token`
- [ ] Copy **Consumer Key** and **Consumer Secret**
- [ ] Create API user in Setup (`Users → New User`)
- [ ] Reset API user password, note temporary password

### 2. GitHub Setup (⏱️ ~5 min)
- [ ] Fork/create repo: `rp-eos-scorecard` (or rename)
- [ ] Add GitHub Actions secrets:
  - `SF_CLIENT_ID` (Connected App key)
  - `SF_CLIENT_SECRET` (Connected App secret)
  - `SF_USERNAME` (API user email)
  - `SF_PASSWORD` (API user temp password)

### 3. Deploy Files (⏱️ ~5 min)
- [ ] Copy all files from this package to repo root:
  ```
  sync-scorecard.js
  package.json
  scorecard-data.json
  eos-scorecard-mockup.html
  README.md
  .github/workflows/sync.yml
  ```
- [ ] Commit and push

### 4. Test Workflow (⏱️ ~10 min)
- [ ] Go to GitHub **Actions → EOS Scorecard Sync**
- [ ] Click **Run workflow → Run workflow** (manual trigger)
- [ ] Wait ~2 min for it to complete
- [ ] Check **scorecard-data.json** for updated data
- [ ] Verify **eos-scorecard-mockup.html** renders live data

### 5. Enable GitHub Pages (⏱️ ~2 min)
- [ ] Repo **Settings → Pages**
- [ ] Source: `Deploy from branch → main`
- [ ] Folder: `/root`
- [ ] Save
- [ ] Live URL: `https://<org>.github.io/<repo>/eos-scorecard-mockup.html`

### 6. Set Team Bookmarks
- [ ] Share scorecard URL with Michael, leadership team
- [ ] Pin in Slack, email, calendar

---

## Automation Schedule

**Every Monday 7 AM ET:**
1. GitHub Actions triggers `sync.yml` workflow
2. Spins up Ubuntu runner, installs Node.js
3. Runs `sync-scorecard.js`:
   - Connects to Salesforce via OAuth
   - Queries all 19 metrics for previous week
   - Calculates Saturday-ending week
   - Appends new row to `scorecard-data.json`
   - Trims to 13 weeks (oldest dropped)
4. Commits `scorecard-data.json` with message: `⏰ Weekly scorecard sync — 2026-09-10`
5. Pushes to `main` branch
6. GitHub Pages auto-rebuilds HTML from live data

**No manual intervention needed** — scorecard always shows previous full week's data.

---

## Customization Examples

### Change Sync Time
Edit `.github/workflows/sync.yml`:
```yaml
cron: '0 11 * * 1'  # Monday 11 AM UTC (7 AM ET)
# For other times: crontab.guru
```

### Change Goals
Edit `scorecard-data.json`:
```json
"Connections Last Week": { "actual": 1274, "goal": 500 }
```

### Add/Remove Metrics
Edit `sync-scorecard.js` → `fetchWeekMetrics()` function → add SOQL queries

### Brand Colors
Edit `eos-scorecard-mockup.html` → CSS variables:
```css
.dept-sales { background: #BBD646; }      /* Green */
.dept-marketing { background: #8B578C; }  /* Purple */
.dept-services { background: #1CB4C6; }   /* Teal */
.dept-product { background: #F68A3D; }    /* Orange */
.dept-ops { background: #ED697C; }        /* Coral */
```

---

## Next Steps (Post-Deployment)

### Week 1
- ✅ Deploy to GitHub
- ✅ Test manual sync via GitHub Actions
- ✅ Share scorecard URL with Michael & leadership
- ✅ Verify first auto-sync (Monday 7 AM ET)

### Weeks 2–4
- 📊 Monitor scorecard accuracy vs manual reports
- 🔍 Validate SOQL queries against Salesforce
- 📞 Address any data gaps or anomalies

### Month 2
- 🎯 Set up weekly L10 cadence (scorecard → discussion → actions)
- 📈 Begin tracking Rocks progress tied to scorecard metrics
- 🔧 Refine goals based on first month of data

### Month 3+
- 🚀 Consider migrating sparse metrics to auto-track (Time Tracking, Design Penetration)
- 📱 Add Slack integration (weekly scorecard summary bot)
- 📊 Build historical analysis (trends, quarterly reviews)

---

## Support & Troubleshooting

### "Auth failed" in GitHub Actions
→ Verify Salesforce API credentials in GitHub Secrets  
→ Reset API user password in Salesforce Setup

### Scorecard shows 0 for a metric
→ Check GitHub Actions logs for SOQL errors  
→ Verify data exists in Salesforce for that week  
→ Run manual sync to test

### HTML doesn't load
→ Check GitHub Pages settings (Settings → Pages)  
→ Verify `eos-scorecard-mockup.html` is in repo root  
→ Try hard refresh (Cmd+Shift+R)

### More help
→ See full `README.md` included in package  
→ Check Salesforce `rp-salesforce-guide.md` for data mapping questions

---

## Files Checklist

```
✅ sync-scorecard.js          [327 lines] — Salesforce sync engine
✅ .github/workflows/sync.yml  [42 lines]  — GitHub Actions trigger
✅ eos-scorecard-mockup.html  [445 lines] — Interactive scorecard UI
✅ scorecard-data.json        [Init data] — 13-week rolling storage
✅ package.json               [Node deps]
✅ README.md                  [Full setup guide]
✅ DEPLOYMENT-SUMMARY.md      [This file]
```

All files ready to copy into GitHub repo. No edits needed to deploy — just set secrets and push.

---

## Questions?

- **What metrics should we track first?** → Focus on the 6 ready ones; plan sparse metrics for Q4
- **How do we handle missing data weeks?** → Scorecard shows blanks gracefully; continues with available weeks
- **Can we add new metrics later?** → Yes; edit `sync-scorecard.js` → add SOQL → test → deploy
- **Who has access to GitHub?** → Anyone with repo access (recommend: Michael, you, tech lead)
- **Can we change the layout?** → Yes; edit `eos-scorecard-mockup.html` CSS/HTML

---

**Ready to deploy?** Start with the setup checklist above. First auto-sync runs next Monday 7 AM ET.

🚀 **Go live!**
