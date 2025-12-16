import { Request, Response } from "express";

export class AboutController {
	/**
	 * GET /about
	 * About Us page.
	 */
	public index = (_req: Request, res: Response): void => {
		res.render("about/index", {
			title: "About Us",
			description:
				"Learn about Weight Loss Watch - a community-driven platform for sustainable weight loss through tracking, teams, and accountability.",
		});
	};
}
