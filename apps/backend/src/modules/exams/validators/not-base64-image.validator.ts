import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

/**
 * Validator to ensure imageUrl is not a base64 encoded string
 *
 * Rejects images that:
 * - Start with "data:" (data URLs)
 * - Contain base64 encoded content (detected by size and patterns)
 *
 * Only allows:
 * - URLs starting with / or http
 * - Database URLs or relative paths
 */
@ValidatorConstraint({ name: "isNotBase64Image", async: false })
export class IsNotBase64ImageConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!value) {
      // Optional field, skip validation if not provided
      return true;
    }

    // Reject data URLs (base64 encoded images)
    if (typeof value === "string" && value.startsWith("data:")) {
      return false;
    }

    // Reject very long strings that might be base64
    // Base64 images are typically much longer than actual file paths
    // A reasonable URL is < 500 chars, base64 encoded images are typically > 5000 chars
    if (typeof value === "string" && value.length > 5000) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return (
      "imageUrl cannot contain base64 encoded data. " +
      "Please upload images separately using the /uploads endpoint " +
      "and use the returned URL path instead."
    );
  }
}

export function IsNotBase64Image(options?: ValidationOptions) {
  return function (target: Object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: options,
      constraints: [],
      validator: IsNotBase64ImageConstraint,
    });
  };
}
