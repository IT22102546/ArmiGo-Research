import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from "class-validator";

// Type definitions for exam DTOs used in validators
interface ExamDto {
  totalMarks?: number;
  passingMarks?: number;
  part1Marks?: number;
  part2Marks?: number;
  type?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  windowStart?: string;
  windowEnd?: string;
}

interface QuestionDto {
  type?: string;
  question?: string;
  options?: string[];
  correctAnswer?: string;
}

/**
 * Validator to ensure passing marks is less than or equal to total marks
 */
@ValidatorConstraint({ name: "isLessThanOrEqualToTotalMarks", async: false })
export class IsLessThanOrEqualToTotalMarksConstraint implements ValidatorConstraintInterface {
  validate(passingMarks: number, args: ValidationArguments): boolean {
    const object = args.object as ExamDto;
    const totalMarks = object.totalMarks;
    if (totalMarks === undefined || passingMarks === undefined) {
      return true; // Skip validation if either is undefined
    }
    return passingMarks <= totalMarks;
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as ExamDto;
    return `Passing marks (${args.value}) cannot exceed total marks (${object.totalMarks})`;
  }
}

export function IsLessThanOrEqualToTotalMarks(
  validationOptions?: ValidationOptions
) {
  return function (object: object, propertyKey: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: String(propertyKey),
      options: validationOptions,
      constraints: [],
      validator: IsLessThanOrEqualToTotalMarksConstraint,
    });
  };
}

/**
 * Validator to ensure part marks sum equals total marks for MIXED exam type
 */
@ValidatorConstraint({ name: "partMarksSumEqualsTotal", async: false })
export class PartMarksSumEqualsTotalConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const object = args.object as ExamDto;

    // Only validate for MIXED type exams
    if (object.type !== "MIXED") {
      return true;
    }

    const part1Marks = object.part1Marks;
    const part2Marks = object.part2Marks;
    const totalMarks = object.totalMarks;

    // If part marks are not defined, skip validation
    if (part1Marks === undefined && part2Marks === undefined) {
      return true;
    }

    // If only one part is defined, skip (partial update case)
    if (part1Marks === undefined || part2Marks === undefined) {
      return true;
    }

    return Math.abs(part1Marks + part2Marks - (totalMarks ?? 0)) < 0.01; // Allow small floating point tolerance
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as ExamDto;
    const sum = (object.part1Marks || 0) + (object.part2Marks || 0);
    return `For MIXED exams, Part 1 marks (${object.part1Marks}) + Part 2 marks (${object.part2Marks}) = ${sum} must equal total marks (${object.totalMarks})`;
  }
}

export function PartMarksSumEqualsTotal(validationOptions?: ValidationOptions) {
  return function (object: object, propertyKey: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: String(propertyKey),
      options: validationOptions,
      constraints: [],
      validator: PartMarksSumEqualsTotalConstraint,
    });
  };
}

/**
 * Validator to ensure end time is after start time
 */
@ValidatorConstraint({ name: "isAfterStartTime", async: false })
export class IsAfterStartTimeConstraint implements ValidatorConstraintInterface {
  validate(endTime: string, args: ValidationArguments): boolean {
    const object = args.object as ExamDto;
    const startTime = object.startTime;

    if (!startTime || !endTime) {
      return true; // Skip validation if either is missing
    }

    return new Date(endTime) > new Date(startTime);
  }

  defaultMessage(): string {
    return "End time must be after start time";
  }
}

export function IsAfterStartTime(validationOptions?: ValidationOptions) {
  return function (object: object, propertyKey: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: String(propertyKey),
      options: validationOptions,
      constraints: [],
      validator: IsAfterStartTimeConstraint,
    });
  };
}

/**
 * Validator to ensure duration fits within the exam time window
 */
@ValidatorConstraint({ name: "durationFitsInTimeWindow", async: false })
export class DurationFitsInTimeWindowConstraint implements ValidatorConstraintInterface {
  validate(duration: number, args: ValidationArguments): boolean {
    const object = args.object as ExamDto;
    const startTime = object.startTime;
    const endTime = object.endTime;

    if (!startTime || !endTime || !duration) {
      return true;
    }

    const availableMinutes =
      (new Date(endTime).getTime() - new Date(startTime).getTime()) /
      (1000 * 60);

    return duration <= availableMinutes;
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as ExamDto;
    const availableMinutes = Math.floor(
      (new Date(object.endTime ?? "").getTime() -
        new Date(object.startTime ?? "").getTime()) /
        (1000 * 60)
    );
    return `Exam duration (${args.value} minutes) exceeds available time window (${availableMinutes} minutes)`;
  }
}

export function DurationFitsInTimeWindow(
  validationOptions?: ValidationOptions
) {
  return function (object: object, propertyKey: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: String(propertyKey),
      options: validationOptions,
      constraints: [],
      validator: DurationFitsInTimeWindowConstraint,
    });
  };
}

/**
 * Validator for window times - window must be within exam time range
 */
@ValidatorConstraint({ name: "windowWithinExamTime", async: false })
export class WindowWithinExamTimeConstraint implements ValidatorConstraintInterface {
  validate(windowEnd: string, args: ValidationArguments): boolean {
    const object = args.object as ExamDto;
    const windowStart = object.windowStart;
    const startTime = object.startTime;
    const endTime = object.endTime;

    if (!windowStart || !windowEnd) {
      return true; // Skip if no window defined
    }

    if (!startTime || !endTime) {
      return true;
    }

    const windowStartDate = new Date(windowStart);
    const windowEndDate = new Date(windowEnd);
    const examStartDate = new Date(startTime);
    const examEndDate = new Date(endTime);

    // Window must be within exam time range
    return (
      windowStartDate >= examStartDate &&
      windowEndDate <= examEndDate &&
      windowEndDate > windowStartDate
    );
  }

  defaultMessage(): string {
    return "Access window must be within exam start and end time, and window end must be after window start";
  }
}

export function WindowWithinExamTime(validationOptions?: ValidationOptions) {
  return function (object: object, propertyKey: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: String(propertyKey),
      options: validationOptions,
      constraints: [],
      validator: WindowWithinExamTimeConstraint,
    });
  };
}

/**
 * Validator for MCQ questions - correctAnswer must be one of the options
 */
@ValidatorConstraint({ name: "correctAnswerInOptions", async: false })
export class CorrectAnswerInOptionsConstraint implements ValidatorConstraintInterface {
  validate(correctAnswer: string, args: ValidationArguments): boolean {
    const object = args.object as QuestionDto;
    const type = object.type;
    const options = object.options;

    // Only validate for MCQ and TRUE_FALSE types
    if (type !== "MULTIPLE_CHOICE" && type !== "TRUE_FALSE") {
      return true;
    }

    if (!options || !Array.isArray(options) || options.length === 0) {
      return true; // Let required validator handle empty options
    }

    if (!correctAnswer) {
      return true; // Let required validator handle empty answer
    }

    return options.includes(correctAnswer);
  }

  defaultMessage(args: ValidationArguments): string {
    return `Correct answer "${args.value}" must be one of the provided options`;
  }
}

export function CorrectAnswerInOptions(validationOptions?: ValidationOptions) {
  return function (object: object, propertyKey: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: String(propertyKey),
      options: validationOptions,
      constraints: [],
      validator: CorrectAnswerInOptionsConstraint,
    });
  };
}

/**
 * Validator for Fill in the Blank questions - must have [BLANK] marker
 */
@ValidatorConstraint({ name: "hasBLANKMarker", async: false })
export class HasBlankMarkerConstraint implements ValidatorConstraintInterface {
  validate(question: string, args: ValidationArguments): boolean {
    const object = args.object as QuestionDto;
    const type = object.type;

    if (type !== "FILL_BLANK") {
      return true;
    }

    if (!question) {
      return true;
    }

    return question.includes("[BLANK]") || question.includes("[blank]");
  }

  defaultMessage(): string {
    return "Fill in the blank questions must contain [BLANK] marker where the answer should go";
  }
}

export function HasBlankMarker(validationOptions?: ValidationOptions) {
  return function (object: object, propertyKey: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: String(propertyKey),
      options: validationOptions,
      constraints: [],
      validator: HasBlankMarkerConstraint,
    });
  };
}

/**
 * Validator to ensure exam start time is in the future (for new exams)
 */
@ValidatorConstraint({ name: "isFutureDate", async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(startTime: string): boolean {
    if (!startTime) {
      return true;
    }

    // Allow 5 minutes grace period
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(startTime) > fiveMinutesAgo;
  }

  defaultMessage(): string {
    return "Exam start time must be in the future";
  }
}

export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyKey: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: String(propertyKey),
      options: validationOptions,
      constraints: [],
      validator: IsFutureDateConstraint,
    });
  };
}
