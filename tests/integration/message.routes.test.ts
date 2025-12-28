import request from "supertest";
import app from "../../src/server";
import {
	prisma,
	resetDatabase,
	createAuthenticatedUser,
	createTestUser,
	createTestConversation,
	createTestMessage,
	createTestTeam,
} from "../helpers";

describe("Message Routes", () => {
	beforeEach(async () => {
		await resetDatabase();
	});

	describe("GET /messages", () => {
		it("should render team feed for authenticated user", async () => {
			const { tokens } = await createAuthenticatedUser();

			const response = await request(app)
				.get("/messages")
				.set("Cookie", [`refreshToken=${tokens.refreshToken}`])
				.expect(200);

			expect(response.text).toContain("Team Feed");
		});

		it("should redirect to login if not authenticated", async () => {
			const response = await request(app).get("/messages").expect(302);

			expect(response.headers.location).toContain("/login");
		});

		it("should show posts from user's teams", async () => {
			const { user, tokens } = await createAuthenticatedUser();

			// Create a team
			const team = await createTestTeam(user.id, { name: "My Team" });

			// Create a post in the team
			await prisma.post.create({
				data: {
					authorId: user.id,
					teamId: team.id,
					content: "Hello from the team!",
					type: "GENERAL",
					visibility: "TEAM",
				},
			});

			const response = await request(app)
				.get("/messages")
				.set("Cookie", [`refreshToken=${tokens.refreshToken}`])
				.expect(200);

			expect(response.text).toContain("Hello from the team!");
			expect(response.text).toContain("My Team");
		});
	});

	describe("GET /messages/:conversationId", () => {
		it("should render conversation with messages", async () => {
			const { user, tokens } = await createAuthenticatedUser();
			const otherUser = await createTestUser({ username: "chatpartner" });
			const conversation = await createTestConversation([user.id, otherUser.id]);

			await createTestMessage(conversation.id, otherUser.id, {
				content: "Hello there!",
			});

			const response = await request(app)
				.get(`/messages/${conversation.id}`)
				.set("Cookie", [`refreshToken=${tokens.refreshToken}`])
				.expect(200);

			expect(response.text).toContain("chatpartner");
			expect(response.text).toContain("Hello there!");
		});

		it("should return 404 for non-existent conversation", async () => {
			const { tokens } = await createAuthenticatedUser();

			const response = await request(app)
				.get("/messages/00000000-0000-0000-0000-000000000000")
				.set("Cookie", [`refreshToken=${tokens.refreshToken}`])
				.expect(404);

			expect(response.text).toContain("Conversation Not Found");
		});

		it("should return 404 if user is not a participant", async () => {
			const { tokens } = await createAuthenticatedUser();
			const user1 = await createTestUser();
			const user2 = await createTestUser();
			const conversation = await createTestConversation([user1.id, user2.id]);

			const response = await request(app)
				.get(`/messages/${conversation.id}`)
				.set("Cookie", [`refreshToken=${tokens.refreshToken}`])
				.expect(404);

			expect(response.text).toContain("Conversation Not Found");
		});
	});

	describe("POST /messages/:conversationId", () => {
		it("should send a message to the conversation", async () => {
			const { user, tokens } = await createAuthenticatedUser();
			const otherUser = await createTestUser();
			const conversation = await createTestConversation([user.id, otherUser.id]);

			const response = await request(app)
				.post(`/messages/${conversation.id}`)
				.set("Cookie", [`refreshToken=${tokens.refreshToken}`])
				.send({ content: "Test message content" })
				.expect(302);

			// Should redirect back to conversation
			expect(response.headers.location).toBe(`/messages/${conversation.id}`);

			// Verify message was created
			const message = await prisma.message.findFirst({
				where: { conversationId: conversation.id },
			});

			expect(message).not.toBeNull();
			expect(message!.content).toBe("Test message content");
			expect(message!.senderId).toBe(user.id);
		});

		it("should return JSON success for AJAX requests", async () => {
			const { user, tokens } = await createAuthenticatedUser();
			const otherUser = await createTestUser();
			const conversation = await createTestConversation([user.id, otherUser.id]);

			const response = await request(app)
				.post(`/messages/${conversation.id}`)
				.set("Cookie", [`refreshToken=${tokens.refreshToken}`])
				.set("Accept", "application/json")
				.send({ content: "AJAX message" })
				.expect(200);

			expect(response.body.success).toBe(true);
		});

		it("should reject empty messages", async () => {
			const { user, tokens } = await createAuthenticatedUser();
			const otherUser = await createTestUser();
			const conversation = await createTestConversation([user.id, otherUser.id]);

			const response = await request(app)
				.post(`/messages/${conversation.id}`)
				.set("Cookie", [`refreshToken=${tokens.refreshToken}`])
				.set("Accept", "application/json")
				.send({ content: "" })
				.expect(400);

			expect(response.body.errors).toBeDefined();
		});
	});

	describe("POST /messages/:conversationId/read", () => {
		it("should mark conversation as read", async () => {
			const { user, tokens } = await createAuthenticatedUser();
			const otherUser = await createTestUser();
			const conversation = await createTestConversation([user.id, otherUser.id]);

			const response = await request(app)
				.post(`/messages/${conversation.id}/read`)
				.set("Cookie", [`refreshToken=${tokens.refreshToken}`])
				.expect(200);

			expect(response.body.success).toBe(true);

			// Verify lastReadAt was updated
			const participant = await prisma.conversationParticipant.findFirst({
				where: { conversationId: conversation.id, userId: user.id },
			});

			expect(participant!.lastReadAt).not.toBeNull();
		});
	});

	describe("PUT /messages/:conversationId/:messageId", () => {
		it("should allow user to edit their own message", async () => {
			const { user, tokens } = await createAuthenticatedUser();
			const otherUser = await createTestUser();
			const conversation = await createTestConversation([user.id, otherUser.id]);
			const message = await createTestMessage(conversation.id, user.id, {
				content: "Original",
			});

			const response = await request(app)
				.put(`/messages/${conversation.id}/${message.id}`)
				.set("Cookie", [`refreshToken=${tokens.refreshToken}`])
				.send({ content: "Edited" })
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message.content).toBe("Edited");
			expect(response.body.message.isEdited).toBe(true);
		});

		it("should not allow editing another user's message", async () => {
			const { user, tokens } = await createAuthenticatedUser();
			const otherUser = await createTestUser();
			const conversation = await createTestConversation([user.id, otherUser.id]);
			const message = await createTestMessage(conversation.id, otherUser.id, {
				content: "Not yours",
			});

			const response = await request(app)
				.put(`/messages/${conversation.id}/${message.id}`)
				.set("Cookie", [`refreshToken=${tokens.refreshToken}`])
				.send({ content: "Hacked" })
				.expect(404);

			expect(response.body.error).toContain("not found");
		});
	});

	describe("DELETE /messages/:conversationId/:messageId", () => {
		it("should allow user to delete their own message", async () => {
			const { user, tokens } = await createAuthenticatedUser();
			const otherUser = await createTestUser();
			const conversation = await createTestConversation([user.id, otherUser.id]);
			const message = await createTestMessage(conversation.id, user.id, {
				content: "To be deleted",
			});

			const response = await request(app)
				.delete(`/messages/${conversation.id}/${message.id}`)
				.set("Cookie", [`refreshToken=${tokens.refreshToken}`])
				.expect(200);

			expect(response.body.success).toBe(true);

			// Verify soft deleted
			const deleted = await prisma.message.findUnique({
				where: { id: message.id },
			});
			expect(deleted!.deletedAt).not.toBeNull();
		});

		it("should not allow deleting another user's message", async () => {
			const { user, tokens } = await createAuthenticatedUser();
			const otherUser = await createTestUser();
			const conversation = await createTestConversation([user.id, otherUser.id]);
			const message = await createTestMessage(conversation.id, otherUser.id, {
				content: "Not yours",
			});

			const response = await request(app)
				.delete(`/messages/${conversation.id}/${message.id}`)
				.set("Cookie", [`refreshToken=${tokens.refreshToken}`])
				.expect(404);

			expect(response.body.error).toContain("not found");
		});
	});
});
