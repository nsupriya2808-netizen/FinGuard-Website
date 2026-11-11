import type { Transaction, TransactionType } from './types.ts';

const DOMESTIC_CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Seattle', 'Denver', 'Boston', 'Atlanta'
];

const FOREIGN_RISK_CITIES = [
  'Moscow', 'Lagos', 'Kyiv', 'Dubai', 'Zurich', 'Cayman Islands'
];

const TXN_TYPES: TransactionType[] = ['POS', 'Online', 'ATM', 'Wire Transfer', 'Mobile Transfer'];

/**
 * Generates 520 realistic demonstration transactions:
 * - 78% normal transactions
 * - 14% medium-risk anomalies (late night, unusual location, elevated amounts)
 * - 8% high-risk fraudulent spikes (large wire transfers, bursts, foreign sanctioned hubs)
 */
export function generateSyntheticTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  const baseAccounts = Array.from({ length: 45 }, (_, i) => `ACC${1000 + i * 17}`);

  // Date range across the last 30 days
  const now = new Date('2026-11-08T12:00:00Z');

  let idCounter = 10001;

  for (let i = 0; i < 520; i++) {
    const txnId = `TXN${idCounter++}`;
    const accId = baseAccounts[i % baseAccounts.length];

    // Days offset: between 0 and 28 days ago
    const dayOffset = Math.floor(i / 18);
    const dateObj = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    const dateStr = dateObj.toISOString().split('T')[0];

    // Determine category of transaction
    const rand = Math.random();

    let amount = 0;
    let timeStr = '12:00:00';
    let location = DOMESTIC_CITIES[Math.floor(Math.random() * DOMESTIC_CITIES.length)];
    let type: TransactionType = 'POS';

    if (rand < 0.78) {
      // 1. Normal everyday transaction
      type = ['POS', 'Online', 'ATM', 'Mobile Transfer'][Math.floor(Math.random() * 4)] as TransactionType;
      // Normal daylight hours: 08:00 to 21:00
      const hour = 8 + Math.floor(Math.random() * 13);
      const min = Math.floor(Math.random() * 60);
      const sec = Math.floor(Math.random() * 60);
      timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      amount = Number((12 + Math.random() * 220).toFixed(2));
    } else if (rand < 0.92) {
      // 2. Medium risk / suspicious scenario
      const scenario = Math.random();
      if (scenario < 0.4) {
        // Elevated amount on standard card
        type = 'Online';
        amount = Number((1800 + Math.random() * 3200).toFixed(2));
        const hour = 10 + Math.floor(Math.random() * 8);
        timeStr = `${String(hour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:15`;
      } else if (scenario < 0.7) {
        // Nocturnal transaction (01:00 - 04:30 AM)
        type = 'ATM';
        amount = Number((400 + Math.random() * 800).toFixed(2));
        const hour = 1 + Math.floor(Math.random() * 4);
        timeStr = `0${hour}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:45`;
      } else {
        // High-frequency burst candidate
        type = 'POS';
        amount = Number((350 + Math.random() * 500).toFixed(2));
        timeStr = '16:20:00';
      }
    } else {
      // 3. High risk fraud anomaly
      const fraudType = Math.random();
      if (fraudType < 0.45) {
        // High-value international Wire Transfer to offshore/risk hub
        type = 'Wire Transfer';
        amount = Number((9500 + Math.random() * 25000).toFixed(2));
        location = FOREIGN_RISK_CITIES[Math.floor(Math.random() * FOREIGN_RISK_CITIES.length)];
        // Nocturnal time
        timeStr = `0${2 + Math.floor(Math.random() * 3)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:10`;
      } else if (fraudType < 0.75) {
        // Extreme volume spike
        type = 'Online';
        amount = Number((12500 + Math.random() * 18000).toFixed(2));
        const hour = 3;
        timeStr = `0${hour}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:22`;
      } else {
        // Burst repeat pattern on same account
        type = 'POS';
        amount = 999.00;
        timeStr = '03:15:30';
      }
    }

    transactions.push({
      transaction_id: txnId,
      account_id: accId,
      transaction_amount: amount,
      transaction_date: dateStr,
      transaction_time: timeStr,
      location,
      transaction_type: type,
      created_at: new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Inject 3 controlled rapid burst attacks on ACC1017 and ACC1085 to guarantee velocity detection
  const burstDate = '2026-11-06';
  transactions.push(
    {
      transaction_id: `TXN${idCounter++}`,
      account_id: 'ACC1017',
      transaction_amount: 880.0,
      transaction_date: burstDate,
      transaction_time: '02:14:10',
      location: 'Miami',
      transaction_type: 'Online',
      created_at: `${burstDate}T02:14:10Z`,
    },
    {
      transaction_id: `TXN${idCounter++}`,
      account_id: 'ACC1017',
      transaction_amount: 890.0,
      transaction_date: burstDate,
      transaction_time: '02:15:30',
      location: 'Miami',
      transaction_type: 'Online',
      created_at: `${burstDate}T02:15:30Z`,
    },
    {
      transaction_id: `TXN${idCounter++}`,
      account_id: 'ACC1017',
      transaction_amount: 920.0,
      transaction_date: burstDate,
      transaction_time: '02:17:05',
      location: 'Miami',
      transaction_type: 'Online',
      created_at: `${burstDate}T02:17:05Z`,
    }
  );

  return transactions;
}
