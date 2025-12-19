import { Request, Response, NextFunction } from "express";
import { NewsService } from "../services/news.service";

export class HomeController {
	/**
	 * GET /
	 * Home page with featured news.
	 */
	public index = async (
		_req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			// Fetch featured news for the homepage
			const featuredNews = await NewsService.getFeaturedNews(6);

			// Format the published dates for display
			const newsWithFormattedDates = featuredNews.map((article) => ({
				...article,
				formattedDate: NewsService.formatRelativeTime(article.publishedAt),
			}));

			res.render("home/index", {
				title: "WeighTogether - Track Together, Transform Together",
				featuredNews: newsWithFormattedDates,
			});
		} catch (error) {
			next(error);
		}
	};
}
