import prisma from "@/lib/prisma";

export const commentService = {
  async getComments(siteId, status = null) {
    const where = { siteId };
    if (status) {
      where.status = status;
    }
    return prisma.comment.findMany({
      where,
      include: {
        post: {
          select: { title: true, slug: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  },

  async updateCommentStatus(siteId, id, status) {
    return prisma.comment.update({
      where: { id, siteId },
      data: { status }
    });
  },

  async createComment(siteId, data) {
    const { postId, authorName, authorEmail, content } = data;
    return prisma.comment.create({
      data: {
        siteId,
        postId,
        authorName,
        authorEmail,
        content,
        status: "pending"
      }
    });
  },

  async deleteComment(siteId, id) {
    return prisma.comment.delete({
      where: { id, siteId }
    });
  }
};
