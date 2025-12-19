import { Router } from "express";
import { PostController } from "../controllers/PostController";
import { CommentController } from "../controllers/CommentController";
import { webAuthenticate } from "../middleware/webAuth";

const router = Router();

// All post routes require authentication
router.use(webAuthenticate);

// Team feed - redirect to team page (feed is now integrated)
router.get("/teams/:teamId/feed", (req, res) => {
	res.redirect(`/teams/${req.params.teamId}`);
});

// Create post in team
router.post(
	"/teams/:teamId/posts",
	PostController.postValidation,
	PostController.create,
);

// View individual post
router.get("/posts/:id", PostController.show);

// Update post
router.put("/posts/:id", PostController.postValidation, PostController.update);

// Delete post
router.delete("/posts/:id", PostController.delete);

// Like/unlike post
router.post("/posts/:id/like", PostController.toggleLike);

// Comments on posts
router.post(
	"/posts/:postId/comments",
	CommentController.commentValidation,
	CommentController.create,
);

// Reply to comment
router.post(
	"/comments/:commentId/replies",
	CommentController.commentValidation,
	CommentController.createReply,
);

// Update comment
router.put(
	"/comments/:id",
	CommentController.commentValidation,
	CommentController.update,
);

// Delete comment
router.delete("/comments/:id", CommentController.delete);

export default router;
