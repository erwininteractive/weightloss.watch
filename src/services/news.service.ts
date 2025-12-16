import {
	NewsArticle,
	NewsFetchOptions,
	NewsFetchResult,
	NewsCategory,
} from "../types/news";

/**
 * News Service - Fetches fitness and nutrition news from GNews.io
 *
 * Features:
 * - 12-hour caching to minimize API calls
 * - Category-specific searches
 *
 * Environment variables:
 * - GNEWS_API_KEY: API key from https://gnews.io/
 * - NEWS_CACHE_HOURS: Cache duration in hours (default: 12)
 */

interface GNewsArticle {
	title: string;
	description: string;
	content: string;
	url: string;
	image: string | null;
	publishedAt: string;
	source: {
		name: string;
		url: string;
	};
}

interface GNewsResponse {
	totalArticles: number;
	articles: GNewsArticle[];
}

interface CacheEntry {
	data: NewsFetchResult;
	timestamp: number;
}

// Category to search query mapping
const CATEGORY_QUERIES: Record<string, string> = {
	fitness: "fitness workout exercise gym",
	nutrition: "nutrition diet healthy eating food",
	"weight-loss": "weight loss diet calories metabolism",
	exercise: "exercise training cardio strength",
};

// In-memory cache
const cache: Map<string, CacheEntry> = new Map();

export class NewsService {
	private static apiUrl = "https://gnews.io/api/v4";

	/**
	 * Get API key (read at runtime, not module load time)
	 */
	private static get apiKey(): string | undefined {
		return process.env.GNEWS_API_KEY;
	}

	/**
	 * Get cache duration in milliseconds (default 12 hours)
	 */
	private static get cacheDurationMs(): number {
		const hours = parseInt(process.env.NEWS_CACHE_HOURS || "12", 10);
		return hours * 60 * 60 * 1000;
	}

	/**
	 * Check if API is configured
	 */
	private static isConfigured(): boolean {
		return !!this.apiKey;
	}

	/**
	 * Generate cache key from options
	 */
	private static getCacheKey(options: NewsFetchOptions): string {
		return `news:${options.category || "all"}:${options.limit || 10}`;
	}

	/**
	 * Get cached data if still valid
	 */
	private static getFromCache(key: string): NewsFetchResult | null {
		const entry = cache.get(key);
		if (!entry) return null;

		const age = Date.now() - entry.timestamp;
		if (age > this.cacheDurationMs) {
			cache.delete(key);
			return null;
		}

		return entry.data;
	}

	/**
	 * Store data in cache
	 */
	private static setCache(key: string, data: NewsFetchResult): void {
		cache.set(key, {
			data,
			timestamp: Date.now(),
		});
	}

	/**
	 * Transform GNews article to our format
	 */
	private static transformArticle(
		article: GNewsArticle,
		category: NewsCategory = "fitness"
	): NewsArticle {
		return {
			id: Buffer.from(article.url).toString("base64").slice(0, 20),
			title: article.title,
			description: article.description || "",
			url: article.url,
			imageUrl: article.image || undefined,
			source: {
				id: article.source.name.toLowerCase().replace(/\s+/g, "-"),
				name: article.source.name,
			},
			author: undefined,
			publishedAt: new Date(article.publishedAt),
			category,
		};
	}

	/**
	 * Fetch news articles from GNews API (with caching)
	 */
	static async fetchNews(
		options: NewsFetchOptions = {}
	): Promise<NewsFetchResult> {
		const { category, limit = 10 } = options;

		// If API not configured, return empty results
		if (!this.isConfigured()) {
			console.warn("GNews API key not configured. Set GNEWS_API_KEY in .env");
			return {
				articles: [],
				totalResults: 0,
				page: 1,
				hasMore: false,
			};
		}

		// Check cache first
		const cacheKey = this.getCacheKey(options);
		const cached = this.getFromCache(cacheKey);
		if (cached) {
			return cached;
		}

		try {
			let url: string;
			let newsCategory: NewsCategory = "fitness";

			if (category && CATEGORY_QUERIES[category]) {
				// Use search endpoint for specific categories
				const query = encodeURIComponent(CATEGORY_QUERIES[category]);
				url = `${this.apiUrl}/search?q=${query}&lang=en&max=${limit}&apikey=${this.apiKey}`;
				newsCategory = category as NewsCategory;
			} else {
				// Use top headlines for health topic (covers fitness/nutrition broadly)
				url = `${this.apiUrl}/top-headlines?topic=health&lang=en&max=${limit}&apikey=${this.apiKey}`;
			}

			const response = await fetch(url);

			if (!response.ok) {
				const errorText = await response.text();
				console.error("GNews API error:", response.status, errorText);
				return {
					articles: [],
					totalResults: 0,
					page: 1,
					hasMore: false,
				};
			}

			const data = (await response.json()) as GNewsResponse;

			const articles = data.articles.map((article) =>
				this.transformArticle(article, newsCategory)
			);

			const result: NewsFetchResult = {
				articles,
				totalResults: data.totalArticles,
				page: 1,
				hasMore: data.totalArticles > limit,
			};

			// Cache the result
			this.setCache(cacheKey, result);
			console.log(`News cached for ${this.cacheDurationMs / 1000 / 60 / 60} hours (key: ${cacheKey})`);

			return result;
		} catch (error) {
			console.error("Error fetching news from GNews:", error);
			return {
				articles: [],
				totalResults: 0,
				page: 1,
				hasMore: false,
			};
		}
	}

	/**
	 * Get featured/top articles for homepage
	 */
	static async getFeaturedNews(limit = 6): Promise<NewsArticle[]> {
		const result = await this.fetchNews({ limit });
		return result.articles;
	}

	/**
	 * Get articles by category
	 */
	static async getNewsByCategory(
		category: NewsCategory,
		limit = 10
	): Promise<NewsArticle[]> {
		const result = await this.fetchNews({ category, limit });
		return result.articles;
	}

	/**
	 * Format relative time for display
	 */
	static formatRelativeTime(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffMins < 60) {
			return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
		} else if (diffHours < 24) {
			return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
		} else if (diffDays < 7) {
			return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
		} else {
			return date.toLocaleDateString();
		}
	}
}
