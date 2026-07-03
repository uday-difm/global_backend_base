/**
 * Webhook Delivery Service
 * ---------------------------------------------------------------------------
 * Delivers outbound HTTP webhook notifications to all registered subscriber
 * URLs whenever CMS content events are emitted.
 *
 * Flow:
 *   EventBus.emit("page.updated", { siteId, data }) 
 *     → listeners.js calls webhookService.deliver(siteId, "page.updated", payload)
 *     → fetch active WebhookSubscription records for siteId + event
 *     → POST to each URL with HMAC-signed payload
 *     → log result to WebhookEvent table
 *     → auto-disable subscription after 10 consecutive failures
 */

import crypto from "crypto";
import prisma from "@/lib/prisma";

class WebhookService {
  /**
   * Deliver a webhook event to all active subscribers matching the event type.
   *
   * @param {string} siteId - The site that emitted the event
   * @param {string} eventType - e.g. "page.published", "post.published"
   * @param {object} payload - The event payload to deliver
   */
  async deliver(siteId, eventType, payload = {}) {
    if (!siteId || !eventType) return;

    let subscriptions;
    try {
      subscriptions = await prisma.webhookSubscription.findMany({
        where: {
          siteId,
          isActive: true,
          deletedAt: null,
          events: { has: eventType },
        },
      });
    } catch (err) {
      console.error(`[Webhook] Failed to fetch subscriptions for ${eventType}:`, err.message);
      return;
    }

    if (!subscriptions || subscriptions.length === 0) return;

    const body = JSON.stringify({
      event: eventType,
      siteId,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    await Promise.allSettled(
      subscriptions.map((sub) => this._send(sub, body, eventType, siteId))
    );
  }

  /**
   * Send a single webhook to one subscriber.
   * Retries once on transient failure. Disables after 10 failures.
   *
   * @private
   */
  async _send(subscription, body, eventType, siteId) {
    const signature = this._sign(body, subscription.secret);
    let success = false;
    let errorMessage = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(subscription.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cms-event": eventType,
          "x-cms-signature": signature,
          "x-cms-site-id": siteId,
          "User-Agent": "GlobalBackend-CMS-Webhook/1.0",
        },
        body,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (res.ok) {
        success = true;
      } else {
        errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      }
    } catch (err) {
      // Retry once on network error
      try {
        const res2 = await fetch(subscription.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-cms-event": eventType,
            "x-cms-signature": signature,
          },
          body,
        });
        success = res2.ok;
        if (!res2.ok) errorMessage = `Retry HTTP ${res2.status}`;
      } catch (retryErr) {
        errorMessage = retryErr.message || "Network error after retry";
      }
    }

    // Log the delivery attempt
    try {
      await prisma.webhookEvent.create({
        data: {
          siteId,
          type: eventType,
          payload: { subscriptionId: subscription.id, url: subscription.url, success, error: errorMessage },
        },
      });
    } catch (logErr) {
      console.error("[Webhook] Failed to log webhook event:", logErr.message);
    }

    // Track failure count — auto-disable after 10 consecutive failures
    try {
      if (!success) {
        const updated = await prisma.webhookSubscription.update({
          where: { id: subscription.id },
          data: {
            failCount: { increment: 1 },
            lastError: errorMessage,
          },
        });
        if (updated.failCount >= 10) {
          await prisma.webhookSubscription.update({
            where: { id: subscription.id },
            data: { isActive: false },
          });
          console.warn(`[Webhook] Subscription ${subscription.id} auto-disabled after 10 failures.`);
        }
      } else if (subscription.failCount > 0) {
        // Reset fail count on success
        await prisma.webhookSubscription.update({
          where: { id: subscription.id },
          data: { failCount: 0, lastError: null },
        });
      }
    } catch (updateErr) {
      console.error("[Webhook] Failed to update subscription failure count:", updateErr.message);
    }

    if (!success) {
      console.error(`[Webhook] Delivery failed for subscription ${subscription.id} → ${subscription.url}: ${errorMessage}`);
    } else {
      console.log(`[Webhook] ✓ Delivered ${eventType} to ${subscription.url}`);
    }
  }

  /**
   * Create an HMAC-SHA256 signature for the payload.
   * Frontend can verify: crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
   *
   * @param {string} body - Raw JSON string
   * @param {string} secret - Subscription secret
   * @returns {string} - "sha256=<hex_digest>"
   */
  _sign(body, secret) {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(body);
    return `sha256=${hmac.digest("hex")}`;
  }

  /**
   * Generate a random webhook secret for new subscriptions.
   */
  generateSecret() {
    return crypto.randomBytes(32).toString("hex");
  }
}

export const webhookService = new WebhookService();
