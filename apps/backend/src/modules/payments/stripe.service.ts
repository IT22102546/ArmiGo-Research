import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("STRIPE_SECRET_KEY");

    if (!apiKey) {
      this.logger.warn(
        "Stripe API key not configured. Payment processing will not work."
      );
      // Initialize with dummy key for development
      this.stripe = new Stripe("sk_test_dummy", {
        apiVersion: "2025-12-15.clover",
      });
    } else {
      this.stripe = new Stripe(apiKey, {
        apiVersion: "2025-12-15.clover",
      });
      this.logger.log("Stripe service initialized successfully");
    }
  }

  /**
   * Create a payment intent for a payment
   */
  async createPaymentIntent(params: {
    amount: number;
    currency?: string;
    metadata?: Record<string, string>;
    description?: string;
  }): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(params.amount * 100), // Convert to cents
        currency: params.currency || "usd",
        metadata: params.metadata || {},
        description: params.description,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logger.log(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error("Failed to create payment intent:", error);
      throw AppException.badRequest(
        ErrorCode.STRIPE_INTENT_FAILED,
        "Failed to create payment intent"
      );
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: paymentMethodId,
        }
      );

      this.logger.log(`Payment intent confirmed: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error("Failed to confirm payment intent:", error);
      throw AppException.badRequest(
        ErrorCode.STRIPE_CONFIRM_FAILED,
        "Failed to confirm payment"
      );
    }
  }

  /**
   * Retrieve a payment intent
   */
  async retrievePaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error("Failed to retrieve payment intent:", error);
      throw AppException.badRequest(
        ErrorCode.STRIPE_RETRIEVE_FAILED,
        "Failed to retrieve payment intent"
      );
    }
  }

  /**
   * Create a refund for a payment
   */
  async createRefund(params: {
    paymentIntentId: string;
    amount?: number;
    reason?: string;
  }): Promise<Stripe.Refund> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: params.paymentIntentId,
      };

      if (params.amount) {
        refundParams.amount = Math.round(params.amount * 100); // Convert to cents
      }

      if (params.reason) {
        refundParams.reason = "requested_by_customer";
        refundParams.metadata = {
          reason: params.reason,
        };
      }

      const refund = await this.stripe.refunds.create(refundParams);
      this.logger.log(`Refund created: ${refund.id}`);
      return refund;
    } catch (error) {
      this.logger.error("Failed to create refund:", error);
      throw AppException.badRequest(
        ErrorCode.STRIPE_REFUND_FAILED,
        "Failed to create refund"
      );
    }
  }

  /**
   * Construct webhook event from request
   */
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event {
    const webhookSecret = this.configService.get<string>(
      "STRIPE_WEBHOOK_SECRET"
    );

    if (!webhookSecret) {
      throw AppException.badRequest(
        ErrorCode.WEBHOOK_NOT_CONFIGURED,
        "Webhook secret not configured"
      );
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
    } catch (error) {
      this.logger.error("Failed to verify webhook signature:", error);
      throw AppException.badRequest(
        ErrorCode.INVALID_WEBHOOK_SIGNATURE,
        "Invalid webhook signature"
      );
    }
  }

  /**
   * Create a customer in Stripe
   */
  async createCustomer(params: {
    email: string;
    name: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: params.metadata || {},
      });

      this.logger.log(`Customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error("Failed to create customer:", error);
      throw AppException.badRequest(
        ErrorCode.STRIPE_CUSTOMER_FAILED,
        "Failed to create customer"
      );
    }
  }

  /**
   * Retrieve a customer from Stripe
   */
  async retrieveCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);

      if (customer.deleted) {
        throw AppException.badRequest(
          ErrorCode.STRIPE_CUSTOMER_DELETED,
          "Customer has been deleted"
        );
      }

      return customer as Stripe.Customer;
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      this.logger.error("Failed to retrieve customer:", error);
      throw AppException.badRequest(
        ErrorCode.STRIPE_CUSTOMER_FAILED,
        "Failed to retrieve customer"
      );
    }
  }

  /**
   * Get Stripe instance for advanced operations
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }
}
