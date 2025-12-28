import { Response, NextFunction } from "express";
import { body, param, validationResult } from "express-validator";
import { AuthenticatedRequest } from "../types/auth";
import { MessageService } from "../services/message.service";
import prisma from "../services/database";

export class MessageController {
	/**
	 * Validation for creating a new conversation
	 */
	static newConversationValidation = [
		body("participantId")
			.optional()
			.isUUID()
			.withMessage("Invalid participant ID"),
		body("participantIds")
			.optional()
			.isArray()
			.withMessage("Participant IDs must be an array"),
		body("participantIds.*")
			.optional()
			.isUUID()
			.withMessage("Invalid participant ID"),
		body("name")
			.optional()
			.isString()
			.isLength({ min: 1, max: 100 })
			.withMessage("Group name must be 1-100 characters"),
		body("isGroup").optional().isBoolean(),
	];

	/**
	 * Validation for sending a message
	 */
	static sendMessageValidation = [
		param("conversationId").isUUID().withMessage("Invalid conversation ID"),
		body("content")
			.isString()
			.isLength({ min: 1, max: 5000 })
			.withMessage("Message must be 1-5000 characters"),
	];

	/**
	 * Validation for message actions
	 */
	static messageActionValidation = [
		param("conversationId").isUUID().withMessage("Invalid conversation ID"),
		param("messageId").isUUID().withMessage("Invalid message ID"),
	];

	/**
	 * Validation for editing a message
	 */
	static editMessageValidation = [
		...MessageController.messageActionValidation,
		body("content")
			.isString()
			.isLength({ min: 1, max: 5000 })
			.withMessage("Message must be 1-5000 characters"),
	];

	/**
	 * GET /messages
	 * List all conversations for the current user
	 */
	static async listConversations(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const userId = req.user!.sub;

			const user = await prisma.user.findUnique({
				where: { id: userId },
			});

			if (!user) {
				res.redirect("/login");
				return;
			}

			const conversations =
				await MessageService.getUserConversations(userId);

			// Add display names
			const conversationsWithNames = conversations.map((conv) => ({
				...conv,
				displayName: MessageService.getConversationDisplayName(
					conv,
					userId
				),
			}));

			res.render("messages/index", {
				title: "Messages",
				conversations: conversationsWithNames,
				user,
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /messages/new
	 * Show form to start a new conversation
	 */
	static async newConversationForm(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const searchQuery = req.query.q as string | undefined;
			let users: { id: string; username: string; avatarUrl: string | null }[] = [];

			if (searchQuery && searchQuery.length >= 2) {
				users = await MessageService.searchUsers(
					searchQuery,
					req.user!.sub
				);
			}

			res.render("messages/new", {
				title: "New Conversation",
				users,
				searchQuery: searchQuery || "",
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * POST /messages/new
	 * Create a new conversation (DM or group)
	 */
	static async createConversation(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				const searchQuery = req.query.q as string | undefined;
				let users: { id: string; username: string; avatarUrl: string | null }[] = [];
				if (searchQuery) {
					users = await MessageService.searchUsers(
						searchQuery,
						req.user!.sub
					);
				}
				res.render("messages/new", {
					title: "New Conversation",
					users,
					searchQuery: searchQuery || "",
					errors: errors.array(),
				});
				return;
			}

			const userId = req.user!.sub;
			const { participantId, participantIds, name, isGroup } = req.body;

			let conversation;

			if (isGroup && participantIds) {
				// Create group conversation
				conversation = await MessageService.createGroupConversation(
					name || "Group Chat",
					userId,
					participantIds
				);
			} else if (participantId) {
				// Create or get DM conversation
				conversation =
					await MessageService.getOrCreateDirectConversation(
						userId,
						participantId
					);
			} else {
				res.render("messages/new", {
					title: "New Conversation",
					users: [],
					searchQuery: "",
					errors: [{ msg: "Please select a user to message" }],
				});
				return;
			}

			res.redirect(`/messages/${conversation.id}`);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /messages/:conversationId
	 * Show a conversation with messages
	 */
	static async showConversation(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const userId = req.user!.sub;
			const { conversationId } = req.params;

			const conversation = await MessageService.getConversation(
				conversationId,
				userId
			);

			if (!conversation) {
				res.status(404).render("errors/404", {
					title: "Conversation Not Found",
					message: "This conversation doesn't exist or you don't have access to it.",
				});
				return;
			}

			const messages = await MessageService.getMessages(
				conversationId,
				userId
			);

			// Mark as read
			await MessageService.markAsRead(conversationId, userId);

			const displayName = MessageService.getConversationDisplayName(
				conversation,
				userId
			);

			res.render("messages/show", {
				title: displayName,
				conversation,
				messages,
				displayName,
				currentUserId: userId,
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * POST /messages/:conversationId
	 * Send a message to a conversation
	 */
	static async sendMessage(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.status(400).json({ errors: errors.array() });
				return;
			}

			const userId = req.user!.sub;
			const { conversationId } = req.params;
			const { content } = req.body;

			await MessageService.sendMessage(conversationId, userId, content);

			// Check if this is an AJAX request
			if (req.xhr || req.headers.accept?.includes("application/json")) {
				res.json({ success: true });
			} else {
				res.redirect(`/messages/${conversationId}`);
			}
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes("not a participant")
			) {
				res.status(403).render("errors/403", {
					title: "Access Denied",
					message: "You are not a participant in this conversation.",
				});
				return;
			}
			next(error);
		}
	}

	/**
	 * PUT /messages/:conversationId/:messageId
	 * Edit a message
	 */
	static async editMessage(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.status(400).json({ errors: errors.array() });
				return;
			}

			const userId = req.user!.sub;
			const { messageId } = req.params;
			const { content } = req.body;

			const message = await MessageService.editMessage(
				messageId,
				userId,
				content
			);

			if (!message) {
				res.status(404).json({
					error: "Message not found or you cannot edit it",
				});
				return;
			}

			res.json({ success: true, message });
		} catch (error) {
			next(error);
		}
	}

	/**
	 * DELETE /messages/:conversationId/:messageId
	 * Delete a message
	 */
	static async deleteMessage(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const userId = req.user!.sub;
			const { messageId } = req.params;

			const deleted = await MessageService.deleteMessage(
				messageId,
				userId
			);

			if (!deleted) {
				res.status(404).json({
					error: "Message not found or you cannot delete it",
				});
				return;
			}

			res.json({ success: true });
		} catch (error) {
			next(error);
		}
	}

	/**
	 * POST /messages/:conversationId/read
	 * Mark a conversation as read
	 */
	static async markAsRead(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const userId = req.user!.sub;
			const { conversationId } = req.params;

			await MessageService.markAsRead(conversationId, userId);

			res.json({ success: true });
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /api/messages/unread
	 * Get total unread count (for navbar badge)
	 */
	static async getUnreadCount(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const userId = req.user!.sub;
			const count = await MessageService.getTotalUnreadCount(userId);
			res.json({ unreadCount: count });
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /api/messages/:conversationId/messages
	 * Get messages for a conversation (API endpoint for infinite scroll)
	 */
	static async getMessages(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const userId = req.user!.sub;
			const { conversationId } = req.params;
			const before = req.query.before as string | undefined;
			const limit = parseInt(req.query.limit as string) || 50;

			const messages = await MessageService.getMessages(
				conversationId,
				userId,
				{ limit, before }
			);

			res.json({ messages });
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /api/users/search
	 * Search for users to message
	 */
	static async searchUsers(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const userId = req.user!.sub;
			const searchQuery = req.query.q as string;

			if (!searchQuery || searchQuery.length < 2) {
				res.json({ users: [] });
				return;
			}

			const users = await MessageService.searchUsers(searchQuery, userId);
			res.json({ users });
		} catch (error) {
			next(error);
		}
	}
}
