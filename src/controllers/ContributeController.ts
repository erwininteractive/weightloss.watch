import { Request, Response } from "express";

export class ContributeController {
	/**
	 * GET /contribute
	 * Contribute page - how to contribute to the open source project.
	 */
	public index = (_req: Request, res: Response): void => {
		res.render("contribute/index", {
			title: "Contribute",
			description:
				"Weight Loss Watch is free and open source. Learn how to contribute to the project and join our community of developers.",
		});
	};
}
