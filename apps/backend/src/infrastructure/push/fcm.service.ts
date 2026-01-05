import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";

export interface FCMPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
  badge?: number;
  sound?: string;
  priority?: "high" | "normal";
  ttl?: number; // Time to live in seconds
}

export interface APNSPayload extends FCMPayload {
  subtitle?: string;
  category?: string;
  threadId?: string;
  interruptionLevel?: "passive" | "active" | "time-sensitive" | "critical";
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface MulticastResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
  results: SendResult[];
}

@Injectable()
export class FCMService implements OnModuleInit {
  private readonly logger = new Logger(FCMService.name);
  private isInitialized = false;
  private apnsKeyPath?: string;
  private apnsKeyId?: string;
  private apnsTeamId?: string;
  private apnsBundleId?: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeFirebase();
    this.loadAPNSConfig();
  }

  private initializeFirebase(): void {
    try {
      const projectId = this.configService.get<string>("FCM_PROJECT_ID");
      const privateKey = this.configService
        .get<string>("FCM_PRIVATE_KEY")
        ?.replace(/\\n/g, "\n");
      const clientEmail = this.configService.get<string>("FCM_CLIENT_EMAIL");

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn(
          "⚠️ FCM credentials not configured. Push notifications disabled. " +
            "Set FCM_PROJECT_ID, FCM_PRIVATE_KEY, FCM_CLIENT_EMAIL env vars."
        );
        return;
      }

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
          }),
        });
        this.logger.log("✅ Firebase Admin SDK initialized successfully");
      }

      this.isInitialized = true;
    } catch (error) {
      this.logger.error("❌ Failed to initialize Firebase Admin SDK:", error);
      this.isInitialized = false;
    }
  }

  private loadAPNSConfig(): void {
    this.apnsKeyPath = this.configService.get<string>("APNS_KEY_PATH");
    this.apnsKeyId = this.configService.get<string>("APNS_KEY_ID");
    this.apnsTeamId = this.configService.get<string>("APNS_TEAM_ID");
    this.apnsBundleId = this.configService.get<string>("APNS_BUNDLE_ID");

    if (this.apnsKeyId && this.apnsTeamId) {
      this.logger.log(
        "✅ APNS configuration loaded for iOS push notifications"
      );
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Send push notification to a single Android device via FCM
   */
  async sendToAndroid(token: string, payload: FCMPayload): Promise<SendResult> {
    if (!this.isInitialized) {
      return { success: false, error: "FCM not initialized" };
    }

    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: payload.priority === "high" ? "high" : "normal",
          ttl: (payload.ttl || 86400) * 1000, // Convert to milliseconds
          notification: {
            clickAction: payload.clickAction,
            sound: payload.sound || "default",
            channelId: "learnup_notifications",
            priority: payload.priority === "high" ? "high" : "default",
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.debug(`✅ Android notification sent: ${response}`);
      return { success: true, messageId: response };
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`❌ Android notification failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send push notification to a single iOS device via FCM/APNS
   */
  async sendToIOS(token: string, payload: APNSPayload): Promise<SendResult> {
    if (!this.isInitialized) {
      return { success: false, error: "FCM not initialized" };
    }

    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        apns: {
          headers: {
            "apns-priority": payload.priority === "high" ? "10" : "5",
            "apns-expiration": String(
              Math.floor(Date.now() / 1000) + (payload.ttl || 86400)
            ),
          },
          payload: {
            aps: {
              alert: {
                title: payload.title,
                subtitle: payload.subtitle,
                body: payload.body,
              },
              badge: payload.badge,
              sound: payload.sound || "default",
              category: payload.category,
              threadId: payload.threadId,
              contentAvailable: true,
              mutableContent: true,
              interruptionLevel: payload.interruptionLevel || "active",
            },
          },
          fcmOptions: {
            imageUrl: payload.imageUrl,
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.debug(`✅ iOS notification sent: ${response}`);
      return { success: true, messageId: response };
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`❌ iOS notification failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send push notification to a web browser
   */
  async sendToWeb(token: string, payload: FCMPayload): Promise<SendResult> {
    if (!this.isInitialized) {
      return { success: false, error: "FCM not initialized" };
    }

    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        webpush: {
          notification: {
            title: payload.title,
            body: payload.body,
            icon: payload.imageUrl || "/icons/notification-icon.png",
            badge: "/icons/badge-icon.png",
            requireInteraction: payload.priority === "high",
          },
          fcmOptions: {
            link: payload.clickAction,
          },
          headers: {
            TTL: String(payload.ttl || 86400),
            Urgency: payload.priority === "high" ? "high" : "normal",
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.debug(`✅ Web notification sent: ${response}`);
      return { success: true, messageId: response };
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`❌ Web notification failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send notification based on platform
   */
  async sendByPlatform(
    token: string,
    platform: "android" | "ios" | "web",
    payload: FCMPayload | APNSPayload
  ): Promise<SendResult> {
    switch (platform) {
      case "android":
        return this.sendToAndroid(token, payload);
      case "ios":
        return this.sendToIOS(token, payload as APNSPayload);
      case "web":
        return this.sendToWeb(token, payload);
      default:
        return { success: false, error: `Unknown platform: ${platform}` };
    }
  }

  /**
   * Send notification to multiple devices (multicast)
   */
  async sendToMultiple(
    tokens: string[],
    payload: FCMPayload
  ): Promise<MulticastResult> {
    if (!this.isInitialized) {
      return {
        successCount: 0,
        failureCount: tokens.length,
        invalidTokens: [],
        results: tokens.map(() => ({
          success: false,
          error: "FCM not initialized",
        })),
      };
    }

    if (tokens.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        invalidTokens: [],
        results: [],
      };
    }

    // FCM has a limit of 500 tokens per multicast
    const chunks = this.chunkArray(tokens, 500);
    const allResults: SendResult[] = [];
    const invalidTokens: string[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const chunk of chunks) {
      try {
        const message: admin.messaging.MulticastMessage = {
          tokens: chunk,
          notification: {
            title: payload.title,
            body: payload.body,
            imageUrl: payload.imageUrl,
          },
          data: payload.data || {},
          android: {
            priority: payload.priority === "high" ? "high" : "normal",
            notification: {
              sound: payload.sound || "default",
              channelId: "learnup_notifications",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: payload.sound || "default",
                badge: payload.badge,
              },
            },
          },
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        successCount += response.successCount;
        failureCount += response.failureCount;

        response.responses.forEach((resp, idx) => {
          if (resp.success) {
            allResults.push({ success: true, messageId: resp.messageId });
          } else {
            const errorCode = resp.error?.code;
            allResults.push({
              success: false,
              error: resp.error?.message || "Unknown error",
            });

            // Track invalid tokens for cleanup
            if (
              errorCode === "messaging/registration-token-not-registered" ||
              errorCode === "messaging/invalid-registration-token" ||
              errorCode === "messaging/invalid-argument"
            ) {
              invalidTokens.push(chunk[idx]);
            }
          }
        });
      } catch (error) {
        this.logger.error("Multicast send failed:", error);
        chunk.forEach(() => {
          allResults.push({
            success: false,
            error: this.getErrorMessage(error),
          });
          failureCount++;
        });
      }
    }

    this.logger.log(
      `📊 Multicast result: ${successCount} success, ${failureCount} failed, ${invalidTokens.length} invalid tokens`
    );

    return {
      successCount,
      failureCount,
      invalidTokens,
      results: allResults,
    };
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(topic: string, payload: FCMPayload): Promise<SendResult> {
    if (!this.isInitialized) {
      return { success: false, error: "FCM not initialized" };
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`✅ Topic notification sent to ${topic}: ${response}`);
      return { success: true, messageId: response };
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`❌ Topic notification failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Subscribe tokens to a topic
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn("FCM not initialized, cannot subscribe to topic");
      return;
    }

    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      this.logger.log(
        `✅ Subscribed ${response.successCount} devices to topic: ${topic}`
      );
      if (response.failureCount > 0) {
        this.logger.warn(
          `⚠️ Failed to subscribe ${response.failureCount} devices to topic: ${topic}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to subscribe to topic: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Unsubscribe tokens from a topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn("FCM not initialized, cannot unsubscribe from topic");
      return;
    }

    try {
      const response = await admin
        .messaging()
        .unsubscribeFromTopic(tokens, topic);
      this.logger.log(
        `✅ Unsubscribed ${response.successCount} devices from topic: ${topic}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to unsubscribe from topic: ${this.getErrorMessage(error)}`
      );
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
