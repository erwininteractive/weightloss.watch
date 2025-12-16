import { Request, Response } from "express";

export class ResourcesController {
	/**
	 * GET /resources
	 * Resources page with weight loss and nutrition links.
	 */
	public index = (_req: Request, res: Response): void => {
		res.render("resources/index", {
			title: "Resources",
			description:
				"Reliable resources for weight loss, nutrition, and healthy living from trusted health organizations.",
		});
	};
}
