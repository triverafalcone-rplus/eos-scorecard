#!/usr/bin/env node

/**
 * R+ EOS Scorecard Weekly Sync
 * Queries all 19 Salesforce metrics, appends to scorecard-data.json
 * Keeps rolling 13-week history
 * Runs Monday 7 AM ET via GitHub Actions
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Environment variables (set in GitHub Actions secrets)
const SF_CLIENT_ID = process.env.SF_CLIENT_ID;
const SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET;
const SF_USERNAME = process.env.SF_USERNAME;
const SF_PASSWORD = process.env.SF_PASSWORD;
const SF_ORG_ID = process.env.SF_ORG_ID || 'redemptionplus'; // sandbox or prod

if (!SF_CLIENT_ID || !SF_CLIENT_SECRET || !SF_USERNAME || !SF_PASSWORD) {
  console.error('Missing Salesforce credentials in environment');
  process.exit(1);
}

const SF_LOGIN_URL = `https://login.salesforce.com/services/oauth2/token`;
const SF_INSTANCE_URL = 'https://redemptionplus.my.salesforce.com'; // Update if different

let accessToken = null;

// Helper: make HTTPS request
function httpsRequest(method, url, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const reqUrl = new URL(url);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...headers
      }
    };

    const req = https.request(reqUrl, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// 1. Get OAuth token
async function authenticate() {
  console.log('🔐 Authenticating with Salesforce...');
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: SF_CLIENT_ID,
    client_secret: SF_CLIENT_SECRET,
    username: SF_USERNAME,
    password: SF_PASSWORD
  }).toString();

  const { status, data } = await httpsRequest('POST', SF_LOGIN_URL, {}, body);

  if (status !== 200) {
    console.error('Auth failed:', data);
    throw new Error('Salesforce authentication failed');
  }

  accessToken = data.access_token;
  console.log('✅ Authenticated');
}

// 2. Execute SOQL query
async function query(soql) {
  const url = `${SF_INSTANCE_URL}/services/data/v67.0/query`;
  const fullUrl = `${url}?q=${encodeURIComponent(soql)}`;

  const { status, data } = await httpsRequest('GET', fullUrl, {
    Authorization: `Bearer ${accessToken}`
  });

  if (status !== 200) {
    console.error('Query failed:', soql, data);
    throw new Error(`SOQL query failed: ${data.message}`);
  }

  return data;
}

// 3. Calculate week ending (Saturday) from current date
function getWeekEnding(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 6 = Saturday
  const daysUntilSaturday = day === 0 ? 6 : (day === 6 ? 0 : 6 - day);
  d.setDate(d.getDate() + daysUntilSaturday);
  return d;
}

// 4. Format date as YYYY-MM-DD
function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

// 5. Get 13 weeks of dates (ending Saturdays)
function get13Weeks() {
  const weeks = [];
  const today = new Date();
  const lastSaturday = getWeekEnding(today);

  for (let i = 0; i < 13; i++) {
    const weekEnd = new Date(lastSaturday);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    weeks.push({
      endDate: formatDate(weekEnd),
      weekStart: formatDate(new Date(weekEnd.getTime() - 6 * 24 * 60 * 60 * 1000))
    });
  }
  return weeks;
}

// 6. Fetch all metrics for a single week
async function fetchWeekMetrics(weekStart, weekEnd) {
  console.log(`📊 Fetching metrics for week ${weekEnd}...`);

  const metrics = {
    week_ending: weekEnd,
    date_label: new Date(weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Sales: {},
    Marketing: {},
    Services: {},
    Product: {},
    Operations: {}
  };

  try {
    // Sales metrics
    metrics.Sales['Connections Last Week'] = {
      actual: (await query(
        `SELECT COUNT() FROM Task WHERE Status = 'Completed' AND CreatedDate >= ${weekStart}T00:00:00Z AND CreatedDate <= ${weekEnd}T23:59:59Z`
      )).totalSize,
      goal: 450
    };

    metrics.Sales['Discovery Calls CGOTBA'] = {
      actual: (await query(
        `SELECT COUNT() FROM Account WHERE CGOTBA_Date__c >= ${weekStart}T00:00:00Z AND CGOTBA_Date__c <= ${weekEnd}T23:59:59Z`
      )).totalSize,
      goal: 10
    };

    metrics.Sales['Leads Qualified'] = {
      actual: (await query(
        `SELECT COUNT() FROM Lead WHERE IsConverted = true AND ConvertedDate >= ${weekStart} AND ConvertedDate <= ${weekEnd}`
      )).totalSize,
      goal: 20
    };

    // Down Accounts (from KPI__c if exists, otherwise null)
    const downAcctResult = await query(
      `SELECT Actual__c FROM KPI__c WHERE Type__c = 'DownAccountsNotContacted' AND Start_Date__c >= ${weekStart} AND Start_Date__c <= ${weekEnd} ORDER BY Start_Date__c DESC LIMIT 1`
    );
    metrics.Sales['Down Accounts Not Contacted'] = {
      actual: downAcctResult.records && downAcctResult.records[0] ? parseFloat(downAcctResult.records[0].Actual__c) : null,
      goal: 0
    };

    // Marketing metrics (from KPI__c)
    const leadsGenResult = await query(
      `SELECT Actual__c FROM KPI__c WHERE Type__c = 'LeadsGenerated' AND Start_Date__c >= ${weekStart} AND Start_Date__c <= ${weekEnd} ORDER BY Start_Date__c DESC LIMIT 1`
    );
    metrics.Marketing['Leads Generated'] = {
      actual: leadsGenResult.records && leadsGenResult.records[0] ? parseFloat(leadsGenResult.records[0].Actual__c) : null,
      goal: 8
    };

    const ctrResult = await query(
      `SELECT Actual__c FROM KPI__c WHERE Type__c = 'ClickThroughRate' AND Start_Date__c >= ${weekStart} AND Start_Date__c <= ${weekEnd} ORDER BY Start_Date__c DESC LIMIT 1`
    );
    metrics.Marketing['Click Through Rate'] = {
      actual: ctrResult.records && ctrResult.records[0] ? parseFloat(ctrResult.records[0].Actual__c) : null,
      goal: 2
    };

    const websiteResult = await query(
      `SELECT Actual__c FROM KPI__c WHERE Type__c = 'Website Sessions' AND Start_Date__c >= ${weekStart} AND Start_Date__c <= ${weekEnd} ORDER BY Start_Date__c DESC LIMIT 1`
    );
    metrics.Marketing['Website Sessions'] = {
      actual: websiteResult.records && websiteResult.records[0] ? parseFloat(websiteResult.records[0].Actual__c) : null,
      goal: 2500
    };

    metrics.Marketing['NPS Score'] = {
      actual: null, // Pending: rolling 30-day average of Survey_Response__c.NPS_Score__c
      goal: 75
    };

    // Services metrics (sparse data)
    metrics.Services['Merchandise Project Avg Hours'] = { actual: null, goal: 4 };
    metrics.Services['Onsite Feedback L365'] = { actual: null, goal: 25.5 };
    metrics.Services['Cranes & Merchandisers Avg Hours'] = { actual: null, goal: 4 };
    metrics.Services['Refresh Time Tracking Hours'] = { actual: null, goal: 8 };

    // Product metrics (sparse data)
    metrics.Product['Package Design Update Penetration'] = { actual: null, goal: 50 };
    metrics.Product['Product Design Update Penetration'] = { actual: null, goal: 80 };
    metrics.Product['Top 200 OOS'] = { actual: null, goal: 0 };
    metrics.Product['Top 200 At-Risk No-PO'] = { actual: null, goal: 0 };

    // Operations metrics
    const ticketResult = await query(
      `SELECT Actual__c FROM KPI__c WHERE Type__c = 'TicketResponseRate' AND Start_Date__c >= ${weekStart} AND Start_Date__c <= ${weekEnd} ORDER BY Start_Date__c DESC LIMIT 1`
    );
    // People Operations metrics
    metrics.People_Operations = metrics.People_Operations || {};
    metrics.People_Operations['eNPS This Quarter'] = { actual: null, goal: 50 };

    // Technology metrics
    metrics.Technology = metrics.Technology || {};
    metrics.Technology['Ticket Response Rate'] = {
      actual: ticketResult.records && ticketResult.records[0] ? parseFloat(ticketResult.records[0].Actual__c) : null,
      goal: 100
    };

    // Operations metrics
    metrics.Operations = metrics.Operations || {};
    metrics.Operations['19K Order Tracker YoY'] = { actual: null, goal: 19000 };

  } catch (error) {
    console.error(`❌ Error fetching metrics for ${weekEnd}:`, error.message);
  }

  return metrics;
}

// 7. Load existing scorecard data
function loadScorecard() {
  const filepath = path.join(__dirname, 'scorecard-data.json');
  if (fs.existsSync(filepath)) {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  }
  return {
    metadata: {
      current_week: formatDate(new Date()),
      current_week_sales_seat: 'OPEN',
      note: '21 metrics (19 tracked + 2 placeholders) across 5 departments'
    },
    weeks: []
  };
}

// 8. Save scorecard data
function saveScorecard(data) {
  const filepath = path.join(__dirname, 'scorecard-data.json');
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`💾 Saved to ${filepath}`);
}

// 9. Main sync
async function sync() {
  try {
    await authenticate();

    const scorecard = loadScorecard();
    const weeks = get13Weeks();
    const newWeeks = [];

    // Fetch all 13 weeks
    for (const week of weeks) {
      const metrics = await fetchWeekMetrics(week.weekStart, week.endDate);
      newWeeks.push(metrics);
    }

    // Replace weeks, keep only 13
    scorecard.weeks = newWeeks.slice(0, 13);
    scorecard.metadata.current_week = formatDate(new Date());

    saveScorecard(scorecard);
    console.log('✅ Scorecard sync complete');

  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

sync();
