import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as admin from "firebase-admin";

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  icon?: string;
  clickAction?: string;
}

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);
  private isInitialized = false;

  onModuleInit() {
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initializeFirebase() {
    try {
      // Check if Firebase credentials are configured
      const projectId = process.env.FCM_PROJECT_ID;
      const privateKey = process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, "\n");
      const clientEmail = process.env.FCM_CLIENT_EMAIL;

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn(
          "⚠️ Firebase credentials not configured. Push notifications will be disabled. " +
            "Set FCM_PROJECT_ID, FCM_PRIVATE_KEY, and FCM_CLIENT_EMAIL environment variables."
        );
        return;
      }

      // Initialize Firebase Admin if not already initialized
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
          }),
        });
        this.logger.log("✅ Firebase Admin SDK initialized");
        this.isInitialized = true;
      } else {
        this.isInitialized = true;
      }
    } catch (error) {
      this.logger.error("❌ Failed to initialize Firebase Admin SDK:", error);
      this.isInitialized = false;
    }
  }

  /**
   * Send push notification to a single device
   */
  async sendToDevice(
    token: string,
    payload: PushNotificationPayload
  ): Promise<boolean> {
    if (!this.isInitialized) {
      this.logger.warn("Firebase not initialized. Skipping push notification.");
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.icon && { imageUrl: payload.icon }),
        },
        data: payload.data || {},
        webpush: payload.clickAction
          ? {
              fcmOptions: {
                link: payload.clickAction,
              },
            }
          : undefined,
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`✅ Push notification sent successfully: ${response}`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`❌ Failed to send push notification: ${errorMessage}`);

      // Check for invalid token errors
      if (errorMessage.includes("registration-token-not-registered")) {
        this.logger.warn(`Token no longer valid: ${token}`);
        // Token should be marked as inactive by caller
      }

      return false;
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToDevices(
    tokens: string[],
    payload: PushNotificationPayload
  ): Promise<{
    successCount: number;
    failureCount: number;
    invalidTokens: string[];
  }> {
    if (!this.isInitialized) {
      this.logger.warn(
        "Firebase not initialized. Skipping push notifications."
      );
      return {
        successCount: 0,
        failureCount: tokens.length,
        invalidTokens: [],
      };
    }

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.icon && { imageUrl: payload.icon }),
        },
        data: payload.data || {},
        webpush: payload.clickAction
          ? {
              fcmOptions: {
                link: payload.clickAction,
              },
            }
          : undefined,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      this.logger.log(
        `📊 Push notifications sent: ${response.successCount} success, ${response.failureCount} failed`
      );

      // Collect invalid tokens
      const invalidTokens: string[] = [];
      response.responses.forEach(
        (resp: admin.messaging.SendResponse, idx: number) => {
          if (!resp.success && resp.error) {
            const errorCode = resp.error.code;
            if (
              errorCode === "messaging/registration-token-not-registered" ||
              errorCode === "messaging/invalid-registration-token"
            ) {
              invalidTokens.push(tokens[idx]);
            }
          }
        }
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokens,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `❌ Failed to send multicast push notifications: ${errorMessage}`
      );
      return {
        successCount: 0,
        failureCount: tokens.length,
        invalidTokens: [],
      };
    }
  }

  /**
   * Send notification to topic (for broadcast notifications)
   */
  async sendToTopic(
    topic: string,
    payload: PushNotificationPayload
  ): Promise<boolean> {
    if (!this.isInitialized) {
      this.logger.warn(
        "Firebase not initialized. Skipping topic notification."
      );
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.icon && { imageUrl: payload.icon }),
        },
        data: payload.data || {},
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`✅ Topic notification sent successfully: ${response}`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `❌ Failed to send topic notification: ${errorMessage}`
      );
      return false;
    }
  }

  /**
   * Subscribe tokens to a topic
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn("Firebase not initialized. Cannot subscribe to topic.");
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
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`❌ Failed to subscribe to topic: ${errorMessage}`);
    }
  }

  /**
   * Unsubscribe tokens from a topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn(
        "Firebase not initialized. Cannot unsubscribe from topic."
      );
      return;
    }

    try {
      const response = await admin
        .messaging()
        .unsubscribeFromTopic(tokens, topic);
      this.logger.log(
        `✅ Unsubscribed ${response.successCount} devices from topic: ${topic}`
      );

      if (response.failureCount > 0) {
        this.logger.warn(
          `⚠️ Failed to unsubscribe ${response.failureCount} devices from topic: ${topic}`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`❌ Failed to unsubscribe from topic: ${errorMessage}`);
    }
  }

  /**
   * Verify if Firebase is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}
