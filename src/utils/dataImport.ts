import { collection, addDoc } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';

export const importLegacyLogs = async (familyId: string, userId: string): Promise<{ success: boolean; count: number; error?: any }> => {
    try {
        const response = await fetch('/old_logs.csv');
        if (!response.ok) throw new Error('Failed to fetch CSV file. Please ensure public/old_logs.csv exists.');
        const text = await response.text();
        const lines = text.split('\n');

        // Headers: id,user_id,kind,created_at,started_at,ended_at,note,payload,feeding_kind,breast_side,session_seconds,feeding_amount,feeding_unit,feeding_amount_ml,bottle_content,diaper_kind,expression_side,expression_amount,expression_unit,expression_amount_ml
        const headers = lines[0].split(',').map(h => h.trim());

        let count = 0;
        const total = lines.length - 1;
        console.log(`Starting import of ${total} logs...`);

        // We process in chunks to avoid overwhelming the browser/network, although addDoc is individual.
        // For 900 items, serial await is fine (approx 20-30s).

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const row = parseCSVLine(line);

            // Map row to object
            const map: any = {};
            headers.forEach((h, index) => {
                if (index < row.length) map[h] = row[index];
            });

            // Extract relevant fields
            const kind = map['kind']; // 'feeding', 'expression', 'diaper'

            // Skip unknown kinds
            if (!['feeding', 'expression', 'diaper'].includes(kind)) {
                // Check if it matches other types? (sleep?)
                // If the CSV doesn't have it, we skip.
                continue;
            }

            // Determine Timestamp
            // 'started_at' is preferred, fallback to 'created_at'.
            // Some rows like diapers only have created_at in the example? 
            // Row 10: diaper, created_at=..., started_at="" (empty). Use created_at.
            let timestamp = map['started_at'];
            if (!timestamp || timestamp === '') timestamp = map['created_at'];

            // Format timestamp to ISO if needed? The CSV has "2025-11-24 12:52:22.840147+00". Date.parse() handles this usually.
            // But +00 means UTC.
            const dateObj = new Date(timestamp);
            if (isNaN(dateObj.getTime())) {
                console.warn(`Invalid date for row ${i}: ${timestamp}`);
                continue;
            }
            const isoTimestamp = dateObj.toISOString();

            // Base Log Object
            const newLog: any = {
                familyId,
                userId,
                timestamp: isoTimestamp,
            };

            // Type Mapping
            if (kind === 'expression') {
                newLog.type = 'pumping';
                newLog.amount = parseFloat(map['expression_amount_ml'] || '0');
                // expression_side: "both", "left", "right"
                newLog.side = map['expression_side'] || 'both';
            }
            else if (kind === 'diaper') {
                newLog.type = 'diaper';
                // diaper_kind: "wet", "dirty", "mixed"
                let subType = map['diaper_kind'];
                if (subType === 'mixed') subType = 'both'; // Map mixed to both
                newLog.subType = subType;
            }
            else if (kind === 'feeding') {
                newLog.type = 'feeding';
                const feedKind = map['feeding_kind']; // 'breast' or 'bottle'

                if (feedKind === 'breast') {
                    newLog.subType = 'breast';
                    newLog.side = map['breast_side']; // 'left', 'right'
                    // session_seconds
                    const seconds = parseInt(map['session_seconds'] || '0', 10);
                    newLog.totalDuration = seconds;
                } else if (feedKind === 'bottle') {
                    newLog.subType = 'bottle';
                    newLog.amount = parseFloat(map['feeding_amount_ml'] || '0');
                    // bottle_content: 'breast_milk', 'formula'
                    newLog.contents = map['bottle_content'] === 'breast_milk' ? 'breast_milk' : 'formula';
                } else {
                    // Fallback for empty feeding_kind?
                    // Sometimes imported data is messy. 
                    // Inspect row 197: feeding, but no other info?
                    // If crucial info is missing, maybe default to generic or skip?
                    // We'll keep it as generic feeding sans subtype if strict mode is off, but UI might break.
                    // UI expects subType for feeding.
                    if (map['feeding_amount_ml']) {
                        newLog.subType = 'bottle';
                        newLog.amount = parseFloat(map['feeding_amount_ml']);
                    } else if (map['session_seconds']) {
                        newLog.subType = 'breast';
                        newLog.totalDuration = parseInt(map['session_seconds']);
                    } else {
                        // Skip invalid feeding
                        continue;
                    }
                }
            }

            if (map['note']) {
                newLog.notes = map['note'];
            }

            // Save to Firestore
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'baby_logs'), newLog);
            count++;
        }

        console.log(`Imported ${count} logs successfully.`);
        return { success: true, count };

    } catch (e) {
        console.error("Import failed:", e);
        return { success: false, count: 0, error: e };
    }
};

// Simple CSV parser handling quotes
function parseCSVLine(text: string): string[] {
    const result: string[] = [];
    let cell = '';
    let quote = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"' && text[i + 1] === '"') {
            cell += '"';
            i++;
        } else if (char === '"') {
            quote = !quote;
        } else if (char === ',' && !quote) {
            result.push(cell);
            cell = '';
        } else {
            cell += char;
        }
    }
    result.push(cell);
    return result;
}
