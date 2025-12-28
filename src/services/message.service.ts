import prisma from "./database";
import { Conversation, Message, User } from "@prisma/client";

export interface ConversationWithDetails extends Conversation {
	participants: {
		user: {
			id: string;
			username: string;
			avatarUrl: string | null;
		};
		lastReadAt: Date | null;
	}[];
	messages: {
		id: string;
		content: string;
		createdAt: Date;
		sender: {
			id: string;
			username: string;
		};
	}[];
	_count: {
		messages: number;
	};
	unreadCount?: number;
}

export interface MessageWithSender extends Message {
	sender: {
		id: string;
		username: string;
		avatarUrl: string | null;
	};
}

export class MessageService {
	/**
	 * Get all conversations for a user
	 */
	static async getUserConversations(
		userId: string
	): Promise<ConversationWithDetails[]> {
		const conversations = await prisma.conversation.findMany({
			where: {
				participants: {
					some: {
						userId,
					},
				},
			},
			include: {
				participants: {
					include: {
						user: {
							select: {
								id: true,
								username: true,
								avatarUrl: true,
							},
						},
					},
				},
				messages: {
					orderBy: {
						createdAt: "desc",
					},
					take: 1,
					where: {
						deletedAt: null,
					},
					include: {
						sender: {
							select: {
								id: true,
								username: true,
							},
						},
					},
				},
				_count: {
					select: {
						messages: true,
					},
				},
			},
			orderBy: {
				updatedAt: "desc",
			},
		});

		// Calculate unread count for each conversation
		const conversationsWithUnread = await Promise.all(
			conversations.map(async (conv: typeof conversations[number]) => {
				const participant = conv.participants.find(
					(p: typeof conv.participants[number]) => p.userId === userId
				);
				const lastReadAt = participant?.lastReadAt || new Date(0);

				const unreadCount = await prisma.message.count({
					where: {
						conversationId: conv.id,
						createdAt: {
							gt: lastReadAt,
						},
						senderId: {
							not: userId,
						},
						deletedAt: null,
					},
				});

				return {
					...conv,
					unreadCount,
				};
			})
		);

		return conversationsWithUnread;
	}

	/**
	 * Get or create a direct message conversation between two users
	 */
	static async getOrCreateDirectConversation(
		userId1: string,
		userId2: string
	): Promise<Conversation> {
		// Look for existing DM conversation between these two users
		const existing = await prisma.conversation.findFirst({
			where: {
				isGroup: false,
				teamId: null,
				AND: [
					{
						participants: {
							some: {
								userId: userId1,
							},
						},
					},
					{
						participants: {
							some: {
								userId: userId2,
							},
						},
					},
				],
			},
			include: {
				participants: true,
			},
		});

		// If exists and has exactly 2 participants, return it
		if (existing && existing.participants.length === 2) {
			return existing;
		}

		// Create new DM conversation
		return prisma.conversation.create({
			data: {
				isGroup: false,
				participants: {
					create: [{ userId: userId1 }, { userId: userId2 }],
				},
			},
		});
	}

	/**
	 * Create a group conversation
	 */
	static async createGroupConversation(
		name: string,
		creatorId: string,
		participantIds: string[],
		teamId?: string
	): Promise<Conversation> {
		// Ensure creator is in participants
		const allParticipants = new Set([creatorId, ...participantIds]);

		return prisma.conversation.create({
			data: {
				name,
				isGroup: true,
				teamId,
				participants: {
					create: Array.from(allParticipants).map((userId) => ({
						userId,
					})),
				},
			},
			include: {
				participants: {
					include: {
						user: {
							select: {
								id: true,
								username: true,
								avatarUrl: true,
							},
						},
					},
				},
			},
		});
	}

	/**
	 * Get a conversation by ID with permission check
	 */
	static async getConversation(
		conversationId: string,
		userId: string
	): Promise<ConversationWithDetails | null> {
		const conversation = await prisma.conversation.findFirst({
			where: {
				id: conversationId,
				participants: {
					some: {
						userId,
					},
				},
			},
			include: {
				participants: {
					include: {
						user: {
							select: {
								id: true,
								username: true,
								avatarUrl: true,
							},
						},
					},
				},
				messages: {
					orderBy: {
						createdAt: "desc",
					},
					take: 1,
					where: {
						deletedAt: null,
					},
					include: {
						sender: {
							select: {
								id: true,
								username: true,
							},
						},
					},
				},
				_count: {
					select: {
						messages: true,
					},
				},
			},
		});

		return conversation as ConversationWithDetails | null;
	}

	/**
	 * Get messages for a conversation with pagination
	 */
	static async getMessages(
		conversationId: string,
		userId: string,
		options: { limit?: number; before?: string } = {}
	): Promise<MessageWithSender[]> {
		const { limit = 50, before } = options;

		// First verify user is a participant
		const isParticipant = await prisma.conversationParticipant.findFirst({
			where: {
				conversationId,
				userId,
			},
		});

		if (!isParticipant) {
			return [];
		}

		const messages = await prisma.message.findMany({
			where: {
				conversationId,
				deletedAt: null,
				...(before && {
					createdAt: {
						lt: (
							await prisma.message.findUnique({
								where: { id: before },
							})
						)?.createdAt,
					},
				}),
			},
			include: {
				sender: {
					select: {
						id: true,
						username: true,
						avatarUrl: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			take: limit,
		});

		// Return in chronological order
		return messages.reverse();
	}

	/**
	 * Send a message
	 */
	static async sendMessage(
		conversationId: string,
		senderId: string,
		content: string,
		mediaUrls?: string[]
	): Promise<MessageWithSender> {
		// Verify sender is a participant
		const isParticipant = await prisma.conversationParticipant.findFirst({
			where: {
				conversationId,
				userId: senderId,
			},
		});

		if (!isParticipant) {
			throw new Error("User is not a participant in this conversation");
		}

		// Create message and update conversation timestamp
		const [message] = await prisma.$transaction([
			prisma.message.create({
				data: {
					conversationId,
					senderId,
					content,
					mediaUrls: mediaUrls || [],
				},
				include: {
					sender: {
						select: {
							id: true,
							username: true,
							avatarUrl: true,
						},
					},
				},
			}),
			prisma.conversation.update({
				where: { id: conversationId },
				data: { updatedAt: new Date() },
			}),
		]);

		return message;
	}

	/**
	 * Edit a message (only by sender)
	 */
	static async editMessage(
		messageId: string,
		userId: string,
		newContent: string
	): Promise<Message | null> {
		const message = await prisma.message.findFirst({
			where: {
				id: messageId,
				senderId: userId,
				deletedAt: null,
			},
		});

		if (!message) {
			return null;
		}

		return prisma.message.update({
			where: { id: messageId },
			data: {
				content: newContent,
				isEdited: true,
			},
		});
	}

	/**
	 * Soft delete a message (only by sender)
	 */
	static async deleteMessage(
		messageId: string,
		userId: string
	): Promise<boolean> {
		const message = await prisma.message.findFirst({
			where: {
				id: messageId,
				senderId: userId,
				deletedAt: null,
			},
		});

		if (!message) {
			return false;
		}

		await prisma.message.update({
			where: { id: messageId },
			data: { deletedAt: new Date() },
		});

		return true;
	}

	/**
	 * Mark conversation as read
	 */
	static async markAsRead(
		conversationId: string,
		userId: string
	): Promise<void> {
		await prisma.conversationParticipant.updateMany({
			where: {
				conversationId,
				userId,
			},
			data: {
				lastReadAt: new Date(),
			},
		});
	}

	/**
	 * Get total unread message count for a user
	 */
	static async getTotalUnreadCount(userId: string): Promise<number> {
		const conversations = await prisma.conversationParticipant.findMany({
			where: { userId },
			select: {
				conversationId: true,
				lastReadAt: true,
			},
		});

		let totalUnread = 0;

		for (const conv of conversations) {
			const lastReadAt = conv.lastReadAt || new Date(0);
			const unreadCount = await prisma.message.count({
				where: {
					conversationId: conv.conversationId,
					createdAt: { gt: lastReadAt },
					senderId: { not: userId },
					deletedAt: null,
				},
			});
			totalUnread += unreadCount;
		}

		return totalUnread;
	}

	/**
	 * Search for users to start a conversation with
	 */
	static async searchUsers(
		query: string,
		currentUserId: string,
		limit = 10
	): Promise<Pick<User, "id" | "username" | "avatarUrl">[]> {
		return prisma.user.findMany({
			where: {
				id: { not: currentUserId },
				emailVerified: true,
				OR: [
					{ username: { contains: query, mode: "insensitive" } },
					{ email: { contains: query, mode: "insensitive" } },
				],
			},
			select: {
				id: true,
				username: true,
				avatarUrl: true,
			},
			take: limit,
		});
	}

	/**
	 * Get display name for a conversation
	 * For DMs: returns other participant's name
	 * For groups: returns conversation name
	 */
	static getConversationDisplayName(
		conversation: ConversationWithDetails,
		currentUserId: string
	): string {
		if (conversation.isGroup && conversation.name) {
			return conversation.name;
		}

		// For DMs, find the other participant
		const otherParticipant = conversation.participants.find(
			(p) => p.user.id !== currentUserId
		);

		return otherParticipant?.user.username || "Unknown User";
	}
}
