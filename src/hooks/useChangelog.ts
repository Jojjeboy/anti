import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import rawCommits from '../commits.json';

interface Commit {
    hash: string;
    date: string;
    message: string;
}

interface UseChangelogResult {
    unseenCommits: Commit[];
    isOpen: boolean;
    dismiss: () => Promise<void>;
}

/**
 * Commit messages that are considered noise and should be filtered out.
 * Matches single short tokens like "mc", "wip", "update", etc.
 */
const NOISE_PATTERN = /^(mc|wip|updates?|minor|temp|fix|test|misc|bump|upd)$/i;

/**
 * Returns true if the commit message is meaningful enough to show to the user.
 */
function isMeaningfulCommit(commit: Commit): boolean {
    const trimmed = commit.message.trim();
    // Skip if it's a very short single word that matches noise pattern
    if (NOISE_PATTERN.test(trimmed)) return false;
    // Skip if it's just a number or hash-like string
    if (/^[a-f0-9]{4,}$/i.test(trimmed)) return false;
    // Skip completely empty messages
    if (trimmed.length === 0) return false;
    return true;
}

const META_DOC_PATH = (uid: string) => `users/${uid}/meta/changelog`;

/**
 * Hook that manages the "What's New" changelog popup.
 *
 * On mount it:
 * 1. Reads the lastSeenCommitHash from Firestore
 * 2. Filters commits.json to only those newer than the saved hash
 * 3. Removes noise commits
 * 4. Opens the modal if there are unseen meaningful commits
 *
 * On first visit (no saved hash) it silently saves the current HEAD hash
 * without showing the popup (alternativ B).
 */
export function useChangelog(uid: string | null | undefined): UseChangelogResult {
    const [unseenCommits, setUnseenCommits] = useState<Commit[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const commits = rawCommits as Commit[];

    useEffect(() => {
        if (!uid || commits.length === 0) return;

        let cancelled = false;

        async function checkChangelog() {
            try {
                const docRef = doc(db, META_DOC_PATH(uid!));
                const snap = await getDoc(docRef);

                if (!snap.exists()) {
                    // First visit – silently mark HEAD as seen, no popup shown
                    await setDoc(docRef, { lastSeenCommitHash: commits[0].hash });
                    return;
                }

                const { lastSeenCommitHash } = snap.data() as { lastSeenCommitHash: string };

                // Find the index of the last seen commit
                const seenIndex = commits.findIndex(c => c.hash === lastSeenCommitHash);

                // If we can't find it (e.g., old hash rotated out), just mark HEAD as seen
                if (seenIndex === -1) {
                    await setDoc(docRef, { lastSeenCommitHash: commits[0].hash });
                    return;
                }

                // All commits before seenIndex are newer (commits.json is newest-first)
                const newer = commits.slice(0, seenIndex).filter(isMeaningfulCommit);

                if (!cancelled && newer.length > 0) {
                    setUnseenCommits(newer);
                    setIsOpen(true);
                }
            } catch (err) {
                // Fail silently – changelog popup is non-critical
                console.warn('useChangelog: failed to check changelog', err);
            }
        }

        checkChangelog();

        return () => {
            cancelled = true;
        };
    }, [uid, commits]);

    const dismiss = useCallback(async () => {
        setIsOpen(false);
        if (!uid || commits.length === 0) return;
        try {
            const docRef = doc(db, META_DOC_PATH(uid));
            await setDoc(docRef, { lastSeenCommitHash: commits[0].hash });
        } catch (err) {
            console.warn('useChangelog: failed to save lastSeenCommitHash', err);
        }
    }, [uid, commits]);

    return { unseenCommits, isOpen, dismiss };
}
