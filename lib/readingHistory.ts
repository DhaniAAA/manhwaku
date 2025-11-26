/**
 * Reading History Utility with Cache (1 Month Expiry)
 * Manages localStorage for reading history tracking with automatic cache cleanup
 */

export interface ReadingHistoryItem {
    slug: string;
    title: string;
    cover: string;
    lastChapter: string;
    lastRead: number; // timestamp
    expiresAt: number; // timestamp - cache expiry (1 month from lastRead)
}

const STORAGE_KEY = 'manhwa_reading_history';
const MAX_HISTORY_ITEMS = 50; // Keep last 50 items
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 1 month in milliseconds (30 days)

/**
 * Remove expired items from cache
 */
function cleanupExpiredItems(items: ReadingHistoryItem[]): ReadingHistoryItem[] {
    const now = Date.now();
    return items.filter(item => item.expiresAt > now);
}

/**
 * Add or update reading history with cache expiry
 */
export function addToReadingHistory(item: Omit<ReadingHistoryItem, 'lastRead' | 'expiresAt'>) {
    try {
        // Get existing history and cleanup expired items
        const existing = getReadingHistory();

        // Remove if already exists (to update position)
        const filtered = existing.filter(h => h.slug !== item.slug);

        const now = Date.now();
        const expiresAt = now + CACHE_DURATION; // 1 month from now

        // Add new item at the beginning with cache expiry
        const updated: ReadingHistoryItem[] = [
            {
                ...item,
                lastRead: now,
                expiresAt: expiresAt,
            },
            ...filtered,
        ].slice(0, MAX_HISTORY_ITEMS); // Keep only MAX_HISTORY_ITEMS

        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        // Dispatch custom event for real-time updates
        window.dispatchEvent(new Event('reading-history-updated'));

        console.log(`✅ Added to reading history: ${item.title} (expires in 30 days)`);

        return true;
    } catch (error) {
        console.error('Error adding to reading history:', error);
        return false;
    }
}

/**
 * Get all reading history (auto-cleanup expired items)
 */
export function getReadingHistory(): ReadingHistoryItem[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];

        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];

        // Cleanup expired items
        const cleaned = cleanupExpiredItems(parsed);

        // If items were removed, update localStorage
        if (cleaned.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
            console.log(`🧹 Cleaned up ${parsed.length - cleaned.length} expired items from cache`);
        }

        return cleaned;
    } catch (error) {
        console.error('Error getting reading history:', error);
        return [];
    }
}

/**
 * Remove specific item from history
 */
export function removeFromReadingHistory(slug: string) {
    try {
        const existing = getReadingHistory();
        const filtered = existing.filter(h => h.slug !== slug);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new Event('reading-history-updated'));

        console.log(`🗑️ Removed from reading history: ${slug}`);

        return true;
    } catch (error) {
        console.error('Error removing from reading history:', error);
        return false;
    }
}

/**
 * Clear all reading history
 */
export function clearReadingHistory() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new Event('reading-history-updated'));

        console.log('🗑️ Cleared all reading history');

        return true;
    } catch (error) {
        console.error('Error clearing reading history:', error);
        return false;
    }
}

/**
 * Check if item exists in history (and not expired)
 */
export function isInReadingHistory(slug: string): boolean {
    const history = getReadingHistory();
    return history.some(h => h.slug === slug);
}

/**
 * Get last read chapter for a manhwa
 */
export function getLastReadChapter(slug: string): string | null {
    const history = getReadingHistory();
    const item = history.find(h => h.slug === slug);
    return item ? item.lastChapter : null;
}

/**
 * Get cache info (for debugging/stats)
 */
export function getCacheInfo() {
    try {
        const history = getReadingHistory();
        const now = Date.now();

        const stats = {
            totalItems: history.length,
            oldestItem: history.length > 0 ? new Date(Math.min(...history.map(h => h.lastRead))) : null,
            newestItem: history.length > 0 ? new Date(Math.max(...history.map(h => h.lastRead))) : null,
            expiringIn24h: history.filter(h => h.expiresAt - now < 24 * 60 * 60 * 1000).length,
            cacheDuration: `${CACHE_DURATION / (24 * 60 * 60 * 1000)} days`,
        };

        return stats;
    } catch (error) {
        console.error('Error getting cache info:', error);
        return null;
    }
}

/**
 * Manually cleanup expired items (can be called periodically)
 */
export function manualCleanupCache() {
    try {
        const history = getReadingHistory(); // This already cleans up
        console.log(`✅ Manual cache cleanup completed. ${history.length} items remaining.`);
        return history.length;
    } catch (error) {
        console.error('Error during manual cleanup:', error);
        return 0;
    }
}
