import {
  Controller,
  Post,
  Headers,
  RawBodyRequest,
  Req,
  Logger,
} from "@nestjs/common";
import { AppException } from "@common/errors/app-exception";
import { ErrorCode } from "@common/errors/error-codes.enum";
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from "@nestjs/swagger";
import { Request } from "express";
import { StripePaymentService } from "../services/stripe-payment.service";
import { PaymentsService } from "../payments.service";
import { NotificationsService } from "../../notifications/notifications.service";
import Stripe from "stripe";

@ApiTags("Webhooks")
@Controller("webhooks/stripe")
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private stripePaymentService: StripePaymentService,
    private paymentsService: PaymentsService,
    private notificationsService: NotificationsService
  ) {}

  @Post()
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: "Handle Stripe webhook events" })
  async handleWebhook(
    @Headers("stripe-signature") signature: string,
    @Req() request: RawBodyRequest<Request>
  ) {
    if (!signature) {
      throw AppException.badRequest(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Missing stripe-signature header"
      );
    }

    const payload = request.rawBody;
    if (!payload) {
      throw AppException.badRequest(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Missing request body"
      );
    }

    let event: Stripe.Event;

    try {
      event = this.stripePaymentService.verifyWebhookSignature(
        payload,
        signature
      );
    } catch (error) {
      this.logger.error("Webhook signature verification failed", error);
      throw AppException.badRequest(
        ErrorCode.INVALID_WEBHOOK_SIGNATURE,
        "Webhook signature verification failed"
      );
    }

    this.logger.log(`Processing webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case "payment_intent.succeeded":
          await this.handlePaymentIntentSucceeded(
            event.data.object
          );
          break;

        case "payment_intent.payment_failed":
          await this.handlePaymentIntentFailed(
            event.data.object
          );
          break;

        case "payment_intent.canceled":
          await this.handlePaymentIntentCanceled(
            event.data.object
          );
          break;

        case "charge.refunded":
          await this.handleChargeRefunded(event.data.object);
          break;

        case "charge.dispute.created":
          await this.handleDisputeCreated(event.data.object);
          break;

        case "customer.subscription.created":
          await this.handleSubscriptionCreated(
            event.data.object
          );
          break;

        case "customer.subscription.updated":
          await this.handleSubscriptionUpdated(
            event.data.object
          );
          break;

        case "customer.subscription.deleted":
          await this.handleSubscriptionDeleted(
            event.data.object
          );
          break;

        case "invoice.payment_succeeded":
          await this.handleInvoicePaymentSucceeded(
            event.data.object
          );
          break;

        case "invoice.payment_failed":
          await this.handleInvoicePaymentFailed(
            event.data.object
          );
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true, eventType: event.type };
    } catch (error) {
      this.logger.error(`Error processing webhook event: ${event.type}`, error);
      throw AppException.badRequest(
        ErrorCode.PAYMENT_FAILED,
        "Webhook processing failed"
      );
    }
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ) {
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);

    try {
      const payment = await this.paymentsService.findByGatewayTransactionId(
        paymentIntent.id
      );

      if (payment) {
        await this.paymentsService.updatePaymentStatusFromWebhook(
          payment.id,
          "COMPLETED",
          {
            stripePaymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            paymentMethod: paymentIntent.payment_method,
            receiptEmail: paymentIntent.receipt_email,
          }
        );
        this.logger.log(`Payment ${payment.id} marked as completed`);
      } else {
        this.logger.warn(
          `No payment found for Stripe payment intent: ${paymentIntent.id}`
        );
      }
    } catch (error) {
      this.logger.error("Error handling payment_intent.succeeded", error);
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment failed: ${paymentIntent.id}`);

    try {
      const payment = await this.paymentsService.findByGatewayTransactionId(
        paymentIntent.id
      );

      if (payment) {
        await this.paymentsService.updatePaymentStatusFromWebhook(
          payment.id,
          "FAILED",
          {
            stripePaymentIntentId: paymentIntent.id,
            failureReason: paymentIntent.last_payment_error?.message,
            metadata: paymentIntent.metadata,
          }
        );
        this.logger.log(`Payment ${payment.id} marked as failed`);
      }
    } catch (error) {
      this.logger.error("Error handling payment_intent.payment_failed", error);
    }
  }

  private async handlePaymentIntentCanceled(
    paymentIntent: Stripe.PaymentIntent
  ) {
    this.logger.log(`Payment canceled: ${paymentIntent.id}`);

    try {
      const payment = await this.paymentsService.findByGatewayTransactionId(
        paymentIntent.id
      );

      if (payment) {
        await this.paymentsService.updatePaymentStatusFromWebhook(
          payment.id,
          "CANCELLED",
          {
            stripePaymentIntentId: paymentIntent.id,
            cancellationReason: paymentIntent.cancellation_reason,
            metadata: paymentIntent.metadata,
          }
        );
        this.logger.log(`Payment ${payment.id} marked as cancelled`);
      }
    } catch (error) {
      this.logger.error("Error handling payment_intent.canceled", error);
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge) {
    this.logger.log(`Charge refunded: ${charge.id}`);

    try {
      if (charge.payment_intent) {
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent.id;

        const payment =
          await this.paymentsService.findByGatewayTransactionId(
            paymentIntentId
          );

        if (payment) {
          await this.paymentsService.updatePaymentStatusFromWebhook(
            payment.id,
            "REFUNDED",
            {
              chargeId: charge.id,
              refundAmount: charge.amount_refunded / 100,
              refundedAt: new Date(charge.created * 1000).toISOString(),
            }
          );
          this.logger.log(`Payment ${payment.id} marked as refunded`);
        }
      }
    } catch (error) {
      this.logger.error("Error handling charge.refunded", error);
    }
  }

  private async handleDisputeCreated(dispute: Stripe.Dispute) {
    this.logger.log(`Dispute created: ${dispute.id}`);

    try {
      const chargeId =
        typeof dispute.charge === "string" ? dispute.charge : dispute.charge.id;

      // Log dispute for manual review
      this.logger.warn(
        `DISPUTE ALERT: Charge ${chargeId} - Amount: ${dispute.amount / 100} - Reason: ${dispute.reason}`
      );

      // Mark payment with dispute info (keep PROCESSING status until resolved)
      const payment =
        await this.paymentsService.findByGatewayTransactionId(chargeId);
      if (payment) {
        await this.paymentsService.updatePaymentStatusFromWebhook(
          payment.id,
          "PROCESSING",
          {
            disputed: true,
            disputeId: dispute.id,
            disputeAmount: dispute.amount / 100,
            disputeReason: dispute.reason,
            disputeStatus: dispute.status,
            disputeCreatedAt: new Date(dispute.created * 1000).toISOString(),
          }
        );

        // Notify admin about the dispute
        await this.notificationsService.notifyAdmins({
          title: "Payment Dispute Alert",
          message: `A dispute has been created for payment ${payment.id}. Amount: ${dispute.amount / 100} ${dispute.currency.toUpperCase()}. Reason: ${dispute.reason}`,
          type: "PAYMENT_UPDATE",
          priority: "HIGH",
          metadata: { paymentId: payment.id, disputeId: dispute.id },
        });
      }
    } catch (error) {
      this.logger.error("Error handling dispute.created", error);
    }
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    this.logger.log(`Subscription created: ${subscription.id}`);

    try {
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      // Record subscription in the system
      await this.paymentsService.recordSubscription({
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        status: subscription.status,
        currentPeriodStart: new Date(
          (subscription as any).current_period_start * 1000
        ),
        currentPeriodEnd: new Date(
          (subscription as any).current_period_end * 1000
        ),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        items: subscription.items.data.map((item) => ({
          priceId: item.price.id,
          quantity: item.quantity ?? null,
        })),
      });

      this.logger.log(`Subscription ${subscription.id} recorded successfully`);
    } catch (error) {
      this.logger.error("Error handling subscription.created", error);
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    this.logger.log(`Subscription updated: ${subscription.id}`);

    try {
      // Update subscription status in the system
      await this.paymentsService.updateSubscriptionStatus(subscription.id, {
        status: subscription.status,
        currentPeriodStart: new Date(
          (subscription as any).current_period_start * 1000
        ),
        currentPeriodEnd: new Date(
          (subscription as any).current_period_end * 1000
        ),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : undefined,
      });

      // Notify user if subscription status changed significantly
      if (["past_due", "unpaid", "canceled"].includes(subscription.status)) {
        const userId = await this.paymentsService.getUserIdByStripeCustomerId(
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id
        );

        if (userId) {
          await this.notificationsService.createNotification({
            userId,
            title: "Subscription Status Update",
            message: `Your subscription status has changed to ${subscription.status}. Please check your account.`,
            type: "PAYMENT_UPDATE",
            priority: "HIGH",
          });
        }
      }

      this.logger.log(`Subscription ${subscription.id} updated successfully`);
    } catch (error) {
      this.logger.error("Error handling subscription.updated", error);
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    this.logger.log(`Subscription deleted: ${subscription.id}`);

    try {
      // Mark subscription as cancelled in the system
      await this.paymentsService.cancelSubscription(subscription.id);

      // Notify user about cancellation
      const userId = await this.paymentsService.getUserIdByStripeCustomerId(
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id
      );

      if (userId) {
        await this.notificationsService.createNotification({
          userId,
          title: "Subscription Cancelled",
          message:
            "Your subscription has been cancelled. You can renew anytime from your account settings.",
          type: "PAYMENT_UPDATE",
          priority: "NORMAL",
        });
      }

      this.logger.log(`Subscription ${subscription.id} cancelled successfully`);
    } catch (error) {
      this.logger.error("Error handling subscription.deleted", error);
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    this.logger.log(`Invoice payment succeeded: ${invoice.id}`);

    try {
      const subscriptionId = (invoice as any).subscription;

      // Record successful invoice payment
      await this.paymentsService.recordInvoicePayment({
        stripeInvoiceId: invoice.id,
        stripeCustomerId:
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id,
        stripeSubscriptionId:
          typeof subscriptionId === "string"
            ? subscriptionId
            : subscriptionId?.id,
        amountPaid: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: "paid",
        paidAt: invoice.status_transitions?.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000)
          : new Date(),
        periodStart: invoice.period_start
          ? new Date(invoice.period_start * 1000)
          : undefined,
        periodEnd: invoice.period_end
          ? new Date(invoice.period_end * 1000)
          : undefined,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
      });

      // Notify user about successful payment
      const userId = await this.paymentsService.getUserIdByStripeCustomerId(
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id || ""
      );

      if (userId) {
        await this.notificationsService.createNotification({
          userId,
          title: "Payment Successful",
          message: `Your payment of ${invoice.amount_paid / 100} ${invoice.currency.toUpperCase()} has been processed successfully.`,
          type: "PAYMENT_UPDATE",
          priority: "NORMAL",
        });
      }

      this.logger.log(`Invoice ${invoice.id} payment recorded successfully`);
    } catch (error) {
      this.logger.error("Error handling invoice.payment_succeeded", error);
    }
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    this.logger.log(`Invoice payment failed: ${invoice.id}`);

    try {
      const subscriptionId = (invoice as any).subscription;

      // Record failed invoice payment
      await this.paymentsService.recordInvoicePayment({
        stripeInvoiceId: invoice.id,
        stripeCustomerId:
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id,
        stripeSubscriptionId:
          typeof subscriptionId === "string"
            ? subscriptionId
            : subscriptionId?.id,
        amountDue: invoice.amount_due / 100,
        currency: invoice.currency,
        status: "failed",
        attemptCount: invoice.attempt_count,
        nextPaymentAttempt: invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000)
          : undefined,
      });

      // Notify user about failed payment
      const userId = await this.paymentsService.getUserIdByStripeCustomerId(
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id || ""
      );

      if (userId) {
        await this.notificationsService.createNotification({
          userId,
          title: "Payment Failed",
          message: `Your payment of ${invoice.amount_due / 100} ${invoice.currency.toUpperCase()} has failed. Please update your payment method.`,
          type: "PAYMENT_UPDATE",
          priority: "HIGH",
        });
      }

      this.logger.log(`Invoice ${invoice.id} payment failure recorded`);
    } catch (error) {
      this.logger.error("Error handling invoice.payment_failed", error);
    }
  }
}
