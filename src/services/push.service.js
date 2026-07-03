import prisma from "@/lib/prisma";

export const pushService = {
  async getNotifications(siteId) {
    return prisma.pushNotification.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" }
    });
  },

  async createNotification(siteId, data) {
    const { title, message, url, scheduledAt } = data;
    return prisma.pushNotification.create({
      data: {
        siteId,
        title,
        message,
        url,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? "scheduled" : "draft"
      }
    });
  },

  async deleteNotification(siteId, id) {
    return prisma.pushNotification.delete({
      where: { id, siteId }
    });
  },

  async sendPushNotification(siteId, notificationId) {
    const notification = await prisma.pushNotification.findFirst({
      where: { id: notificationId, siteId }
    });

    if (!notification) throw new Error("Notification not found");

    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { emailSettings: true }
    });

    const emailSettings = settings?.emailSettings || {};
    if (!emailSettings.oneSignalAppId || !emailSettings.oneSignalRestKey) {
      throw new Error("OneSignal credentials are not configured on this site");
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${emailSettings.oneSignalRestKey}`
      },
      body: JSON.stringify({
        app_id: emailSettings.oneSignalAppId,
        headings: { en: notification.title },
        contents: { en: notification.message },
        url: notification.url || undefined,
        included_segments: ["Subscribed Users"]
      })
    });

    const data = await response.json();

    if (response.ok && !data.errors) {
      await prisma.pushNotification.update({
        where: { id: notificationId },
        data: {
          status: "sent",
          oneSignalId: data.id,
          sentCount: data.recipients || 0,
          sentAt: new Date()
        }
      });
      return { success: true, recipients: data.recipients || 0 };
    } else {
      const errorMsg = data.errors ? data.errors.join(", ") : "OneSignal request failed";
      await prisma.pushNotification.update({
        where: { id: notificationId },
        data: { status: "failed" }
      });
      throw new Error(errorMsg);
    }
  }
};
