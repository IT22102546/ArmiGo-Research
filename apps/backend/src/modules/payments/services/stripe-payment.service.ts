import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { AppException } from "../../../common/errors/app-exception";
import { ErrorCode } from "../../../common/errors/error-codes.enum";

export interface StripePaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface StripeRefundResult {
  id: string;
  amount: number;
  status: string;
  reason: string;
}

@Injectable()
export class StripePaymentService {
  private readonly logger = new Logger(StripePaymentService.name);
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>("STRIPE_SECRET_KEY");

    if (!stripeSecretKey) {
      this.logger.warn(
        "Stripe Secret Key not configured. Payment processing will use mock mode."
      );
      // Don't initialize Stripe if key is missing
    } else {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2025-12-15.clover",
      });
      this.logger.log("Stripe payment gateway initialized successfully");
    }
  }

  /**
   * Create a payment intent with Stripe
   */
  async createPaymentIntent(
    amount: number,
    currency: string = "usd",
    metadata: Record<string, any> = {}
  ): Promise<StripePaymentIntent> {
    try {
      if (!this.stripe) {
        return this.createMockPaymentIntent(amount, currency);
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          ...metadata,
          platform: "learnup",
          createdAt: new Date().toISOString(),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logger.log(`Payment intent created: ${paymentIntent.id}`);

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      this.logger.error("Failed to create payment intent", error);
      throw AppException.badRequest(
        ErrorCode.STRIPE_INTENT_FAILED,
        `Payment intent creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Retrieve payment intent status
   */
  async retrievePaymentIntent(
    paymentIntentId: string
  ): Promise<StripePaymentIntent> {
    try {
      if (!this.stripe) {
        return this.createMockPaymentIntent(100, "usd");
      }

      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      this.logger.error("Failed to retrieve payment intent", error);
      throw AppException.badRequest(
        ErrorCode.STRIPE_RETRIEVE_FAILED,
        `Failed to retrieve payment: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<StripePaymentIntent> {
    try {
      if (!this.stripe) {
        return this.createMockPaymentIntent(100, "usd");
      }

      const confirmParams: Stripe.PaymentIntentConfirmParams = {};
      if (paymentMethodId) {
        confirmParams.payment_method = paymentMethodId;
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        confirmParams
      );

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      this.logger.error("Failed to confirm payment intent", error);
      throw AppException.badRequest(
        ErrorCode.STRIPE_CONFIRM_FAILED,
        `Payment confirmation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Create a refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason: string = "requested_by_customer"
  ): Promise<StripeRefundResult> {
    try {
      if (!this.stripe) {
        return this.createMockRefund(paymentIntentId, amount || 0, reason);
      }

      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        reason: reason as Stripe.RefundCreateParams.Reason,
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await this.stripe.refunds.create(refundParams);

      this.logger.log(`Refund created: ${refund.id}`);

      return {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status || "pending",
        reason: refund.reason || reason,
      };
    } catch (error) {
      this.logger.error("Failed to create refund", error);
      throw AppException.badRequest(
        ErrorCode.STRIPE_REFUND_FAILED,
        `Refund failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Create a customer in Stripe
   */
  async createCustomer(
    email: string,
    name: string,
    metadata: Record<string, any> = {}
  ): Promise<Stripe.Customer | null> {
    try {
      if (!this.stripe) {
        this.logger.warn("Stripe not configured, skipping customer creation");
        return null;
      }

      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          ...metadata,
          platform: "learnup",
        },
      });

      this.logger.log(`Stripe customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error("Failed to create Stripe customer", error);
      return null;
    }
  }

  /**
   * Retrieve customer payment methods
   */
  async getCustomerPaymentMethods(
    customerId: string
  ): Promise<Stripe.PaymentMethod[]> {
    try {
      if (!this.stripe) {
        return [];
      }

      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });

      return paymentMethods.data;
    } catch (error) {
      this.logger.error("Failed to retrieve payment methods", error);
      return [];
    }
  }

  /**
   * Create a subscription for recurring payments
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    metadata: Record<string, any> = {}
  ): Promise<Stripe.Subscription | null> {
    try {
      if (!this.stripe) {
        this.logger.warn(
          "Stripe not configured, subscription creation skipped"
        );
        return null;
      }

      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: {
          ...metadata,
          platform: "learnup",
        },
      });

      this.logger.log(`Subscription created: ${subscription.id}`);
      return subscription;
    } catch (error) {
      this.logger.error("Failed to create subscription", error);
      return null;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription | null> {
    try {
      if (!this.stripe) {
        return null;
      }

      const subscription =
        await this.stripe.subscriptions.cancel(subscriptionId);
      this.logger.log(`Subscription cancelled: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      this.logger.error("Failed to cancel subscription", error);
      return null;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event {
    const webhookSecret = this.configService.get<string>(
      "STRIPE_WEBHOOK_SECRET"
    );

    if (!webhookSecret || !this.stripe) {
      throw AppException.badRequest(
        ErrorCode.WEBHOOK_NOT_CONFIGURED,
        "Webhook verification not configured"
      );
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
    } catch (error) {
      this.logger.error("Webhook signature verification failed", error);
      throw AppException.badRequest(
        ErrorCode.INVALID_WEBHOOK_SIGNATURE,
        "Invalid webhook signature"
      );
    }
  }

  // ==================== MOCK METHODS ====================

  private createMockPaymentIntent(
    amount: number,
    currency: string
  ): StripePaymentIntent {
    const mockId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return {
      id: mockId,
      clientSecret: `${mockId}_secret_${Math.random().toString(36).substring(7)}`,
      amount,
      currency,
      status: "requires_payment_method",
    };
  }

  private createMockRefund(
    paymentIntentId: string,
    amount: number,
    reason: string
  ): StripeRefundResult {
    return {
      id: `re_mock_${Date.now()}`,
      amount,
      status: "succeeded",
      reason,
    };
  }

  /**
   * Check if Stripe is configured
   */
  isConfigured(): boolean {
    return !!this.stripe;
  }
}
