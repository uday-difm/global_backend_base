import prisma from "@/lib/prisma";
import { emailService } from "./email.service";

export const campaignService = {
  async getTemplates(siteId) {
    return prisma.emailTemplate.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" }
    });
  },

  async createTemplate(siteId, data) {
    const { name, subject, htmlContent, designJson } = data;
    return prisma.emailTemplate.create({
      data: {
        siteId,
        name,
        subject,
        htmlContent,
        designJson,
      }
    });
  },

  async updateTemplate(siteId, id, data) {
    const { name, subject, htmlContent, designJson } = data;
    // Verify ownership before updating
    const existing = await prisma.emailTemplate.findFirst({ where: { id, siteId } });
    if (!existing) throw new Error("Template not found");
    return prisma.emailTemplate.update({
      where: { id },
      data: { name, subject, htmlContent, designJson }
    });
  },

  async deleteTemplate(siteId, id) {
    // Verify ownership before deleting
    const existing = await prisma.emailTemplate.findFirst({ where: { id, siteId } });
    if (!existing) throw new Error("Template not found");
    return prisma.emailTemplate.delete({ where: { id } });
  },

  async getCampaigns(siteId) {
    return prisma.emailCampaign.findMany({
      where: { siteId },
      include: {
        list: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  },

  async createCampaign(siteId, data) {
    const { name, subject, body, listId, scheduledAt } = data;
    return prisma.emailCampaign.create({
      data: {
        siteId,
        name,
        subject,
        body,
        // Allow null listId for draft campaigns not yet assigned to a list
        listId: listId || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? "scheduled" : "draft",
      }
    });
  },

  async deleteCampaign(siteId, id) {
    return prisma.emailCampaign.delete({
      where: { id, siteId }
    });
  },

  async sendTestEmail(siteId, campaignId, targetEmail) {
    const campaign = await prisma.emailCampaign.findFirst({
      where: { id: campaignId, siteId }
    });
    if (!campaign) throw new Error("Campaign not found");

    const { transporter, fromEmail } = await emailService.getTransporterForSite(siteId);

    await transporter.sendMail({
      from: `"Global Backend" <${fromEmail}>`,
      to: targetEmail,
      subject: `[TEST] ${campaign.subject}`,
      html: campaign.body
    });

    return { success: true };
  },

  async executeCampaign(siteId, campaignId) {
    const campaign = await prisma.emailCampaign.findFirst({
      where: { id: campaignId, siteId },
      include: {
        list: {
          include: {
            subscribers: {
              include: {
                subscriber: true
              }
            }
          }
        }
      }
    });
    if (!campaign) throw new Error("Campaign not found");
    if (!campaign.list) throw new Error("Campaign list not selected or empty");

    const { transporter, fromEmail } = await emailService.getTransporterForSite(siteId);

    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: "sending" }
    });

    const members = campaign.list.subscribers;
    let sentCount = 0;
    let failedCount = 0;

    for (const member of members) {
      const sub = member.subscriber;
      if (sub.status !== "active") continue;

      try {
        await transporter.sendMail({
          from: `"Global Backend" <${fromEmail}>`,
          to: sub.email,
          subject: campaign.subject,
          html: campaign.body
        });

        await prisma.campaignLog.create({
          data: {
            campaignId,
            subscriberId: sub.id,
            status: "sent",
            sentAt: new Date()
          }
        });
        sentCount++;
      } catch (err) {
        await prisma.campaignLog.create({
          data: {
            campaignId,
            subscriberId: sub.id,
            status: "failed",
            errorMessage: err.message
          }
        });
        failedCount++;
      }
    }

    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: failedCount > 0 && sentCount === 0 ? "failed" : "sent",
        sentAt: new Date()
      }
    });

    return { success: true, sentCount, failedCount };
  }
};
