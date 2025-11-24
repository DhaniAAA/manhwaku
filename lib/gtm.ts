/**
 * Google Tag Manager Event Tracking Helper
 *
 * This file contains helper functions to push events to GTM dataLayer
 * for tracking user interactions across the ManhwaKu website.
 */

// Type definitions for better TypeScript support
interface GTMEvent {
    event: string;
    [key: string]: any;
}

declare global {
    interface Window {
        dataLayer: GTMEvent[];
    }
}

/**
 * Push event to GTM dataLayer
 * @param event - Event object to push
 */
const pushToDataLayer = (event: GTMEvent): void => {
    if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push(event);
    }
};

/**
 * Track when user views a manhwa detail page
 */
export const trackManhwaView = (manhwa: {
    title: string;
    slug: string;
    genres?: string[];
    status?: string;
    rating?: string;
}): void => {
    pushToDataLayer({
        event: 'view_manhwa',
        manhwa_title: manhwa.title,
        manhwa_slug: manhwa.slug,
        manhwa_genre: manhwa.genres?.[0] || 'Unknown',
        manhwa_status: manhwa.status || 'Unknown',
        manhwa_rating: manhwa.rating || 'N/A',
    });
};

/**
 * Track when user clicks on a manhwa card
 */
export const trackManhwaClick = (manhwa: {
    title: string;
    slug: string;
    position?: number;
}): void => {
    pushToDataLayer({
        event: 'manhwa_click',
        manhwa_title: manhwa.title,
        manhwa_slug: manhwa.slug,
        click_position: manhwa.position || 0,
    });
};

/**
 * Track search queries
 */
export const trackSearch = (searchTerm: string, resultsCount: number): void => {
    pushToDataLayer({
        event: 'search',
        search_term: searchTerm,
        search_results: resultsCount,
    });
};

/**
 * Track when user reads a chapter
 */
export const trackChapterRead = (data: {
    manhwaTitle: string;
    manhwaSlug: string;
    chapterNumber: string;
    chapterSlug: string;
}): void => {
    pushToDataLayer({
        event: 'read_chapter',
        manhwa_title: data.manhwaTitle,
        manhwa_slug: data.manhwaSlug,
        chapter_number: data.chapterNumber,
        chapter_slug: data.chapterSlug,
    });
};

/**
 * Track navigation clicks
 */
export const trackNavigation = (destination: string): void => {
    pushToDataLayer({
        event: 'navigation_click',
        nav_destination: destination,
    });
};

/**
 * Track when user reaches end of page/chapter
 */
export const trackContentComplete = (contentType: 'page' | 'chapter', contentId: string): void => {
    pushToDataLayer({
        event: 'content_complete',
        content_type: contentType,
        content_id: contentId,
    });
};

/**
 * Track filter/sort usage
 */
export const trackFilter = (filterType: string, filterValue: string): void => {
    pushToDataLayer({
        event: 'filter_applied',
        filter_type: filterType,
        filter_value: filterValue,
    });
};

/**
 * Track pagination
 */
export const trackPagination = (currentPage: number, totalPages: number): void => {
    pushToDataLayer({
        event: 'pagination_click',
        page_number: currentPage,
        total_pages: totalPages,
    });
};

/**
 * Track errors
 */
export const trackError = (errorType: string, errorMessage: string): void => {
    pushToDataLayer({
        event: 'error_occurred',
        error_type: errorType,
        error_message: errorMessage,
    });
};

/**
 * Track social share (if implemented)
 */
export const trackShare = (platform: string, contentType: string, contentId: string): void => {
    pushToDataLayer({
        event: 'share',
        share_platform: platform,
        content_type: contentType,
        content_id: contentId,
    });
};
