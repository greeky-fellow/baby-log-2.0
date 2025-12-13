import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';

export const removeDuplicateLogs = async (familyId: string): Promise<{ success: boolean; deletedCount: number; error?: any }> => {
    try {
        console.log(`Starting deduplication for family: ${familyId}`);
        // 1. Fetch all logs for the current family
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'baby_logs'), where('familyId', '==', familyId));
        const querySnapshot = await getDocs(q);

        const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

        // 2. Identify Duplicates
        // We define a duplicate as having the same: type, timestamp, userId, and key payload data (amount/duration).
        // Since firestore IDs are unique per insert, we rely on content.

        const seen = new Set<string>();
        const duplicates: string[] = [];

        logs.forEach(log => {
            // Create a unique fingerprint for the log content
            // We round amounts/durations to avoid floating point issues if any, though imports should be identical strings.
            const fingerprint = `${log.type}|${log.timestamp}|${log.subType || ''}|${log.amount || 0}|${log.totalDuration || 0}|${log.side || ''}`;

            if (seen.has(fingerprint)) {
                duplicates.push(log.id);
            } else {
                seen.add(fingerprint);
            }
        });

        console.log(`Found ${duplicates.length} duplicates out of ${logs.length} total logs.`);

        // 3. Delete Duplicates
        if (duplicates.length > 0) {
            // Firestore batch limit is 500. If we have more, we can loop relativey safely or settle for serial deletion since this is a rare action.
            // Serial deletion for simplicity and safety feedback.
            let deletedCount = 0;
            for (const id of duplicates) {
                await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'baby_logs', id));
                deletedCount++;
            }
            return { success: true, deletedCount };
        } else {
            return { success: true, deletedCount: 0 };
        }

    } catch (e) {
        console.error("Deduplication failed:", e);
        return { success: false, deletedCount: 0, error: e };
    }
};
