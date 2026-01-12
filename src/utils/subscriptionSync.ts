import { SubscriptionItem } from "../store/dataStore";

export const syncSubscriptions = async (): Promise<SubscriptionItem[]> => {
    const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || "";
    if (!GOOGLE_SCRIPT_URL) throw new Error("Google Script URL is not defined");

    // Optimized: Only fetch the Master Subscription Sheet
    // We removed 'Subscription Approval' and 'PAYMENT' sheet fetches because:
    // 1. Approval details (approvalDate) were not being effectively used by the consuming components.
    // 2. Payment details (paymentList) were calculated but explicitly NOT merged/returned in the previous implementation.
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=Subscription&_t=${Date.now()}`);
    const subJson = await response.json();

    if (!subJson.success) throw new Error(subJson.error || "Failed to fetch subscriptions");

    // Transform Base Subscriptions
    const subscriptionList: SubscriptionItem[] = subJson.data
        .map((row: any[], index: number) => {
            if (!row || row.length < 2) return null;

            let sn = (row[1] || '').toString().trim();
            const companyName = (row[2] || '').toString().trim();
            const subscriptionName = (row[4] || '').toString().trim();

            // Skip headers, empty rows, or metadata rows
            if (!sn ||
                sn.toLowerCase() === 'serial no' ||
                sn.toLowerCase().includes('create subscription') ||
                (!companyName && !subscriptionName)) {
                return null;
            }

            // Normalization logic
            const snMatch = sn.match(/(\d+)/);
            if (snMatch && sn.toUpperCase().startsWith('SN')) {
                sn = `SN-${String(snMatch[0]).padStart(3, '0')}`;
            } else if (snMatch && !sn.toUpperCase().startsWith('SN')) {
                sn = `SN-${String(snMatch[0]).padStart(3, '0')}`;
            }

            const planned2 = (row[13] || '').toString().trim(); // Column N (Planned 2)
            const actual2 = (row[14] || '').toString().trim(); // Column O (Actual 2)
            const approvalStatusCol = (row[16] || '').toString().trim(); // Column Q (Approval Status)
            const actual3 = (row[18] || '').toString().trim(); // Column S (Payment)
            const transactionId = (row[19] || '').toString().trim(); // Column T (Transaction ID)
            const renewalCount = (row[12] || '0').toString().trim(); // Column M (Renewal Count)
            const renewalStatusSheet = (row[11] || '').toString().trim(); // Column L (Renewal Status)
            const planned1 = (row[8] || '').toString().trim(); // Column I (Planned 1)
            const actual1 = (row[9] || '').toString().trim(); // Column J (Actual 1)

            // Determine Status based on workflow columns
            let computedStatus = 'Pending';
            if (actual3) {
                computedStatus = 'Paid';
            } else if (approvalStatusCol.toLowerCase() === 'approved') {
                computedStatus = 'Approved';
            } else if (approvalStatusCol.toLowerCase() === 'rejected') {
                computedStatus = 'Rejected';
            } else if (actual2) {
                computedStatus = 'Approved';
            }

            // Helper to format ISO timestamps
            const formatTimestamp = (dateStr: string) => {
                if (!dateStr) return '';
                if (dateStr.includes('T') || dateStr.includes('Z')) {
                    const d = new Date(dateStr);
                    if (!isNaN(d.getTime())) {
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        const hours = String(d.getHours()).padStart(2, '0');
                        const minutes = String(d.getMinutes()).padStart(2, '0');
                        return `${year}-${month}-${day} ${hours}:${minutes}`;
                    }
                }
                return dateStr;
            };

            const rawDate = (row[0] || '').toString().trim();

            return {
                id: `sub-${sn}-${index}`,
                sn: sn,
                requestedDate: formatTimestamp(rawDate),
                companyName: companyName || 'N/A',
                subscriberName: (row[3] || 'N/A').toString().trim(),
                subscriptionName: subscriptionName || 'N/A',
                price: (row[5] || 'N/A').toString().trim(),
                frequency: (row[6] || 'N/A').toString().trim(),
                purpose: (row[7] || 'N/A').toString().trim(),
                status: computedStatus,
                startDate: (row[20] || '').toString().trim(), // Col U
                endDate: (row[21] || '').toString().trim(),   // Col V
                paymentDate: actual3, // Use Actual 3 as payment date
                paymentMethod: '', // Not stored in Master
                transactionId: transactionId,
                paymentFile: (row[22] || '').toString().trim(), // Col W
                approvalDate: '', // Optimisation: Removed unused approval sheet fetch
                remarks: '',
                actual2,
                actual3,
                renewalStatus: renewalStatusSheet,
                planned1,
                planned2,
                actual1,
                renewalCount
            };
        })
        .filter((item: SubscriptionItem | null): item is SubscriptionItem => item !== null);

    return subscriptionList;
};
