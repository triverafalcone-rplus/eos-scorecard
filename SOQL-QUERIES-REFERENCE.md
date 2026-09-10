# R+ EOS Scorecard — SOQL Queries Reference

**Copy-paste SOQL for all 19 metrics.** Replace `[week_start]` and `[week_end]` with actual dates.

**Date format:** `YYYY-MM-DD` (e.g., `2026-09-05`)  
**Datetime format:** `YYYY-MM-DDTHH:MM:SSZ` (e.g., `2026-09-05T23:59:59Z`)

---

## SALES (4 metrics)

### 1. Connections Last Week
```sql
SELECT COUNT() FROM Task 
WHERE Status = 'Completed' 
AND CreatedDate >= [week_start]T00:00:00Z 
AND CreatedDate <= [week_end]T23:59:59Z
```
**Goal:** 450 | **Source:** Task object  
**Data availability:** ✅ 13/13 weeks

---

### 2. Discovery Calls (CGOTBA)
```sql
SELECT COUNT() FROM Account 
WHERE CGOTBA_Date__c >= [week_start]T00:00:00Z 
AND CGOTBA_Date__c <= [week_end]T23:59:59Z
```
**Goal:** 10 | **Source:** Account.CGOTBA_Date__c (custom date field)  
**Data availability:** ✅ 13/13 weeks | **Status:** ALL RED (actual 0–6)

---

### 3. Leads Qualified
```sql
SELECT COUNT() FROM Lead 
WHERE IsConverted = true 
AND ConvertedDate >= [week_start] 
AND ConvertedDate <= [week_end]
```
**Goal:** 20 | **Source:** Lead object (IsConverted + ConvertedDate)  
**Data availability:** ❌ Needs testing (not in KPI__c)

---

### 4. Down Accounts Not Contacted (%)
```sql
SELECT Actual__c FROM KPI__c 
WHERE Type__c = 'DownAccountsNotContacted' 
AND Start_Date__c >= [week_start] 
AND Start_Date__c <= [week_end] 
ORDER BY Start_Date__c DESC LIMIT 1
```
**Goal:** 0% (inverse metric) | **Source:** KPI__c.Type__c  
**Data availability:** ✅ 9/13 weeks | **Current:** 47.55%

---

## MARKETING (4 metrics)

### 5. Leads Generated
```sql
SELECT Actual__c FROM KPI__c 
WHERE Type__c = 'LeadsGenerated' 
AND Start_Date__c >= [week_start] 
AND Start_Date__c <= [week_end] 
ORDER BY Start_Date__c DESC LIMIT 1
```
**Goal:** 8 | **Source:** KPI__c.Type__c  
**Data availability:** ✅ 6/13 weeks

---

### 6. Click Through Rate (%)
```sql
SELECT Actual__c FROM KPI__c 
WHERE Type__c = 'ClickThroughRate' 
AND Start_Date__c >= [week_start] 
AND Start_Date__c <= [week_end] 
ORDER BY Start_Date__c DESC LIMIT 1
```
**Goal:** 2% | **Source:** KPI__c.Type__c  
**Data availability:** ✅ 8/13 weeks

---

### 7. Website Sessions
```sql
SELECT Actual__c FROM KPI__c 
WHERE Type__c = 'Website Sessions' 
AND Start_Date__c >= [week_start] 
AND Start_Date__c <= [week_end] 
ORDER BY Start_Date__c DESC LIMIT 1
```
**Goal:** 2,500 | **Source:** KPI__c.Type__c  
**Data availability:** ✅ 11/13 weeks

---

### 8. NPS Score (Customer — 30-day rolling avg)
```sql
SELECT AVG(NPS_Score__c) FROM Survey_Response__c 
WHERE CreatedDate >= 2026-08-06T00:00:00Z 
AND CreatedDate <= 2026-09-05T23:59:59Z
```
**Goal:** 75 | **Source:** Survey_Response__c.NPS_Score__c (0–10 scale)  
**Data availability:** ❌ Sparse (31 responses in 5+ months)  
**Note:** 30-day rolling (not weekly); different from eNPS

---

## SERVICES (4 metrics)

### 9. Merchandise Project Avg Hours
```sql
SELECT AVG(Duration__c / 60) FROM Time_Tracking__c 
WHERE Project_Type__c = 'Merchandising' 
AND CreatedDate >= [week_start]T00:00:00Z 
AND CreatedDate <= [week_end]T23:59:59Z
```
**Goal:** 4 hours | **Ranges:** Green 4–6, Yellow >6, Red <4  
**Source:** Time_Tracking__c (Duration in minutes)  
**Data availability:** ❌ Sparse (11 records in 2026)

---

### 10. Onsite Feedback L365 (Avg rating, 1–5 scale)
```sql
SELECT AVG(Overall__c) FROM Survey_Response__c 
WHERE CreatedDate >= 2025-09-05T00:00:00Z 
AND CreatedDate <= 2026-09-05T23:59:59Z
```
**Goal:** 25.5 | **Source:** Survey_Response__c.Overall__c  
**Data availability:** ❌ Sparse (only 3 onsite surveys with scores)

---

### 11. Cranes & Merchandisers Avg Hours
```sql
SELECT AVG(Duration__c / 60) FROM Time_Tracking__c 
WHERE Project__r.Cranes_and_Merchandisers__c = true 
AND CreatedDate >= [week_start]T00:00:00Z 
AND CreatedDate <= [week_end]T23:59:59Z
```
**Goal:** 4 hours | **Ranges:** Green 2–4, Yellow >4, Red <2  
**Source:** Time_Tracking__c.Project__r.Cranes_and_Merchandisers__c  
**Data availability:** ❌ Sparse

---

### 12. Refresh Time Tracking Hours (Sum)
```sql
SELECT SUM(Duration__c / 60) FROM Time_Tracking__c 
WHERE Project__r.Project_Type__c IN (
  'Virtual Refresh',
  'Onsite Refresh',
  'Rolling Refresh',
  'Theme Swap Refresh',
  'Pro Partner Refresh'
) 
AND CreatedDate >= [week_start]T00:00:00Z 
AND CreatedDate <= [week_end]T23:59:59Z
```
**Goal:** 8 hours | **Ranges:** Green 6–8, Yellow >8, Red <6  
**Source:** Time_Tracking__c.Project__r.Project_Type__c  
**Data availability:** ❌ Very sparse (only 3 records)

---

## PRODUCT (4 metrics)

### 13. Package Design Update Penetration (%)
```sql
-- Count items with package updates / total items
SELECT COUNT() FROM PackageUpdateLog__c 
WHERE CreatedDate >= [week_start]T00:00:00Z 
AND CreatedDate <= [week_end]T23:59:59Z
```
**Goal:** 50% | **Source:** PackageUpdateLog__c  
**Data availability:** ❌ Not tracked weekly (868 total records; most from May)  
**Note:** Needs weekly aggregation logic

---

### 14. Product Design Update Penetration (%)
```sql
-- Count items with product design updates / total items
SELECT COUNT() FROM Product__c 
WHERE Product_Design_Updated__c = true 
AND Product_Design_Update_Date__c >= [week_start] 
AND Product_Design_Update_Date__c <= [week_end]
```
**Goal:** 80% | **Source:** Product__c (or custom object)  
**Data availability:** ❌ Not tracked weekly; needs field confirmation

---

### 15. Top 200 Out of Stock
```sql
SELECT COUNT() FROM Product2 
WHERE Out_Of_Stock_Percent__c > 0 
ORDER BY Out_Of_Stock_Days__c DESC LIMIT 200
```
**Goal:** 0 (inverse: fewer OOS is better) | **Source:** Product2  
**Data availability:** ❌ Point-in-time only (not weekly trend)  
**Current:** 417 products OOS

---

### 16. Top 200 At-Risk No-PO
```sql
SELECT COUNT() FROM Product_Warehouse__c 
WHERE QuantityOnPurchaseOrder__c = 0 
AND QuantityOnHand__c <= 0 LIMIT 200
```
**Goal:** 0 (inverse) | **Source:** Product_Warehouse__c  
**Data availability:** ❌ Point-in-time only (not weekly trend)  
**Current:** 41,710 at-risk items

---

## OPERATIONS (3 metrics)

### 17. Ticket Response Rate (%)
```sql
SELECT Actual__c FROM KPI__c 
WHERE Type__c = 'TicketResponseRate' 
AND Start_Date__c >= [week_start] 
AND Start_Date__c <= [week_end] 
ORDER BY Start_Date__c DESC LIMIT 1
```
**Goal:** 100% | **Source:** KPI__c.Type__c  
**Data availability:** ✅ 10/13 weeks

---

### 18. eNPS This Quarter
```sql
SELECT Actual__c FROM KPI__c 
WHERE Type__c = 'eNPS' 
AND Start_Date__c >= [quarter_start] 
AND Start_Date__c <= [quarter_end] 
ORDER BY Start_Date__c DESC LIMIT 1
```
**Goal:** 50 | **Source:** KPI__c.Type__c  
**Data availability:** ❌ Quarterly only (1 record: Jul 1, 2026)  
**Note:** Different from NPS (customer); eNPS is internal employee/partner

---

### 19. 19K Order Tracker YoY (Count)
```sql
SELECT COUNT() FROM RPlus_Order__c 
WHERE CALENDAR_YEAR(CreatedDate) = CALENDAR_YEAR(TODAY())
```
**Goal:** 19,000 | **Source:** RPlus_Order__c  
**Data availability:** ❌ Single metric, not weekly breakdown  
**Current:** ~13,006 YTD (as of Sep 10)

---

## Testing Queries

### Check what fields exist on Task
```sql
SELECT Id, Subject, Type, Status, CreatedDate FROM Task LIMIT 5
```

### Check KPI__c Type__c values
```sql
SELECT DISTINCT Type__c FROM KPI__c ORDER BY Type__c
```

### Check Account CGOTBA dates (sample)
```sql
SELECT Name, CGOTBA_Date__c FROM Account 
WHERE CGOTBA_Date__c != null 
ORDER BY CGOTBA_Date__c DESC LIMIT 10
```

### Check Survey_Response__c fields
```sql
SELECT Id, NPS_Score__c, Overall__c, CreatedDate FROM Survey_Response__c LIMIT 10
```

### Check Time_Tracking__c coverage
```sql
SELECT COUNT() FROM Time_Tracking__c
-- Should see ~100–200 records; if <50, needs ramp-up
```

---

## Dates for Most Recent 13 Weeks (as of Sep 10, 2026)

Copy-paste these dates into queries above:

```
Week 1  (Sep 5):  start=2026-08-30  end=2026-09-05
Week 2  (Aug 29): start=2026-08-23  end=2026-08-29
Week 3  (Aug 22): start=2026-08-16  end=2026-08-22
Week 4  (Aug 15): start=2026-08-09  end=2026-08-15
Week 5  (Aug 8):  start=2026-08-02  end=2026-08-08
Week 6  (Aug 1):  start=2026-07-26  end=2026-08-01
Week 7  (Jul 25): start=2026-07-19  end=2026-07-25
Week 8  (Jul 18): start=2026-07-12  end=2026-07-18
Week 9  (Jul 11): start=2026-07-05  end=2026-07-11
Week 10 (Jul 4):  start=2026-06-28  end=2026-07-04
Week 11 (Jun 27): start=2026-06-21  end=2026-06-27
Week 12 (Jun 20): start=2026-06-14  end=2026-06-20
Week 13 (Jun 13): start=2026-06-07  end=2026-06-13
```

---

## Data Readiness Summary

| Status | Count | Metrics |
|---|---|---|
| ✅ Ready | 6 | Connections, CGOTBA, Leads Gen, CTR, Web Sessions, Ticket Response |
| 🟡 Partial | 2 | Down Accounts (9/13), Leads Qualified (needs testing) |
| ❌ Sparse | 8 | Onsite Feedback, Merchandise Hours, Cranes Hours, Refresh Hours, Design %, NPS, eNPS, OOS, At-Risk |

---

## Sync Script Implementation

In `sync-scorecard.js`, the `fetchWeekMetrics()` function will loop through all 19 queries.  
Each query wraps in try-catch; if it fails, the metric gets `actual: null`.

Example pattern:
```javascript
const result = await query(
  `SELECT COUNT() FROM Account 
   WHERE CGOTBA_Date__c >= ${weekStart}T00:00:00Z 
   AND CGOTBA_Date__c <= ${weekEnd}T23:59:59Z`
);
metrics.Sales['Discovery Calls CGOTBA'] = {
  actual: result.totalSize,
  goal: 10
};
```

---

**Last updated:** September 10, 2026  
**Owner:** Tanya Rivera-Falcone
