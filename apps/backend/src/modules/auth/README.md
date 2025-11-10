# Authentication Module - Refactored Architecture

## 📁 Directory Structure

```
auth/
├── interfaces/
│   ├── auth.interface.ts      # Type definitions and interfaces
│   └── index.ts
├── services/
│   ├── password.service.ts    # Password hashing & verification
│   ├── otp.service.ts         # OTP generation & verification
│   ├── session.service.ts     # JWT tokens & session management
│   ├── token-blacklist.service.ts  # Token invalidation
│   ├── two-factor.service.ts  # 2FA operations
│   └── index.ts
├── strategies/
│   ├── jwt.strategy.ts        # Passport JWT strategy
│   └── index.ts
├── dto/
│   ├── auth.dto.ts            # Data transfer objects
│   └── index.ts
├── tasks/
│   └── token-cleanup.task.ts  # Scheduled token cleanup
├── tests/
│   └── jwt-security.spec.ts   # Security tests
├── auth.service.ts            # Main auth service (legacy, to be migrated)
├── auth-core.service.ts       # NEW: Refactored core auth service
├── auth.controller.ts         # HTTP endpoints
├── auth.module.ts             # Module configuration
└── README.md                  # This file
```

## 🎯 Service Responsibilities

### 1. PasswordService (`password.service.ts`)
**Purpose:** Centralized password management
- ✅ Hash passwords with bcrypt (configurable salt rounds)
- ✅ Verify passwords against hashes
- ✅ Validate password strength (8+ chars, uppercase, lowercase, number, special char)
- ✅ Generate secure random passwords

**Usage:**
```typescript
constructor(private passwordService: PasswordService) {}

// Hash password
const hash = await this.passwordService.hashPassword(plainPassword);

// Verify password
const isValid = await this.passwordService.verifyPassword(plain, hash);

// Validate strength
const { isValid, message } = this.passwordService.validatePasswordStrength(pwd);
```

### 2. OtpService (`otp.service.ts`)
**Purpose:** OTP lifecycle management
- ✅ Generate cryptographically secure 6-digit OTPs
- ✅ Send OTPs via Email (primary) with HTML formatting
- ✅ Send OTPs via SMS (QuickSend API integration)
- ✅ Automatic fallback: SMS → Email
- ✅ Store OTPs in database with expiry timestamps
- ✅ Verify OTPs with expiry checking
- ✅ Rate limiting for OTP requests
- ✅ Clear OTPs after use

**Usage:**
```typescript
constructor(private otpService: OtpService) {}

// Send OTP with automatic fallback
const result = await this.otpService.sendOtpWithFallback(
  userId,
  'user@example.com',
  true  // isEmail
);

// Verify OTP
const isValid = await this.otpService.verifyOtp(userId, otpCode);

// Clear OTP after successful verification
await this.otpService.clearOtp(userId);
```

### 3. SessionService (`session.service.ts`)
**Purpose:** JWT tokens and session lifecycle
- ✅ Generate access & refresh token pairs
- ✅ Create session records with device tracking
- ✅ Validate sessions by ID
- ✅ Refresh tokens with automatic rotation
- ✅ Invalidate individual sessions
- ✅ Invalidate all user sessions (for logout/security)
- ✅ Cleanup expired sessions
- ✅ Get active sessions for a user

**Usage:**
```typescript
constructor(private sessionService: SessionService) {}

// Generate token pair
const tokens = await this.sessionService.generateTokenPair(
  user,
  { ipAddress, userAgent, deviceId }
);

// Refresh tokens
const newTokens = await this.sessionService.refreshTokens(refreshToken);

// Invalidate all sessions
await this.sessionService.invalidateAllUserSessions(userId);

// Validate session
const result = await this.sessionService.validateSession(sessionId);
```

### 4. TokenBlacklistService (`token-blacklist.service.ts`)
**Purpose:** Token revocation and blacklisting
- Blacklist tokens immediately (logout, security breach)
- Check if token is blacklisted
- Automatic cleanup of expired blacklist entries

### 5. TwoFactorService (`two-factor.service.ts`)
**Purpose:** Two-factor authentication
- Generate 2FA secrets
- Verify 2FA tokens
- QR code generation for authenticator apps

## 🔄 Migration Path

### Current State
- ❌ **auth.service.ts**: Monolithic service (1925 lines)
  - Mixed responsibilities
  - Hard to test individual features
  - Difficult to maintain

### Target State
- ✅ **auth-core.service.ts**: Clean orchestration layer
  - Delegates to specialized services
  - Single Responsibility Principle
  - Easy to test and maintain

### Migration Steps

#### Phase 1: Parallel Running (CURRENT)
Both services exist side-by-side:
- `auth.service.ts` - Legacy (existing endpoints)
- `auth-core.service.ts` - New (ready for migration)
- All specialized services (Password, OTP, Session) available

#### Phase 2: Gradual Migration (NEXT)
Update `auth.service.ts` to use specialized services internally:
```typescript
// OLD
const hash = await bcrypt.hash(password, saltRounds);

// NEW
const hash = await this.passwordService.hashPassword(password);
```

#### Phase 3: Controller Migration
Update `auth.controller.ts` to use `auth-core.service.ts`:
```typescript
// OLD
constructor(private authService: AuthService) {}

// NEW
constructor(private authCoreService: AuthCoreService) {}
```

#### Phase 4: Deprecation
- Rename `auth.service.ts` to `auth.service.legacy.ts`
- Rename `auth-core.service.ts` to `auth.service.ts`
- Remove legacy service after verification

## 🧪 Testing Strategy

### Unit Tests
Each service can be tested independently:
```typescript
describe('PasswordService', () => {
  it('should hash password correctly', async () => {
    const hash = await service.hashPassword('test123');
    expect(hash).toBeDefined();
    expect(hash).not.toBe('test123');
  });

  it('should verify correct password', async () => {
    const hash = await service.hashPassword('test123');
    const isValid = await service.verifyPassword('test123', hash);
    expect(isValid).toBe(true);
  });
});
```

### Integration Tests
Test service interactions:
```typescript
describe('Auth Registration Flow', () => {
  it('should register user with hashed password and generate tokens', async () => {
    const result = await authService.register(registerDto);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });
});
```

## 🔐 Security Improvements

### Before Refactoring
- ❌ Password hashing logic scattered
- ❌ OTP generation using `Math.random()` (predictable)
- ❌ Token management mixed with business logic
- ❌ Hard to audit security-critical code

### After Refactoring
- ✅ Centralized password operations (PasswordService)
- ✅ Cryptographically secure OTP using `crypto.randomInt()`
- ✅ Isolated session management (SessionService)
- ✅ Clear security boundaries
- ✅ Easy to audit and test each service

## 📊 Benefits

### 1. Maintainability
- **Single Responsibility:** Each service has one clear purpose
- **Small Files:** ~200-300 lines per service vs 1925 lines monolith
- **Clear Dependencies:** Easy to understand what each service needs

### 2. Testability
- **Unit Tests:** Test each service in isolation
- **Mock Dependencies:** Easy to mock specialized services
- **Coverage:** Better test coverage per service

### 3. Reusability
- **Shared Services:** Use PasswordService in user management, admin operations
- **Composition:** Build new features by combining services
- **Consistency:** Same password hashing everywhere

### 4. Performance
- **Optimization:** Optimize individual services without affecting others
- **Caching:** Add caching to specific services (e.g., session validation)
- **Monitoring:** Track performance per service

## 🚀 Next Steps

1. ✅ **Create specialized services** (COMPLETED)
2. ✅ **Update auth module** (COMPLETED)
3. 🔄 **Migrate auth.service.ts internals** (IN PROGRESS)
4. ⏳ **Update controller to use auth-core.service** (PENDING)
5. ⏳ **Add comprehensive tests** (PENDING)
6. ⏳ **Performance benchmarking** (PENDING)
7. ⏳ **Documentation & training** (PENDING)

## 📝 Code Examples

### Example 1: User Registration Flow
```typescript
// auth-core.service.ts
async register(registerDto: RegisterDto, deviceInfo?: DeviceInfo) {
  // 1. Hash password (PasswordService)
  const hashedPassword = await this.passwordService.hashPassword(
    registerDto.password
  );

  // 2. Create user in database
  const user = await this.prisma.user.create({ data: { ...userData } });

  // 3. Generate tokens (SessionService)
  const tokens = await this.sessionService.generateTokenPair(user, deviceInfo);

  return { user, ...tokens };
}
```

### Example 2: Password Reset Flow
```typescript
// 1. Request OTP
async sendPasswordResetOtp(email: string) {
  const user = await this.usersService.findByEmail(email);
  const result = await this.otpService.sendOtpWithFallback(
    user.id,
    email,
    true
  );
  return result;
}

// 2. Verify OTP
async verifyPasswordResetOtp(email: string, otp: string) {
  const user = await this.usersService.findByEmail(email);
  const isValid = await this.otpService.verifyOtp(user.id, otp);
  if (!isValid) throw new BadRequestException('Invalid OTP');
  
  await this.otpService.clearOtp(user.id);
  return { resetToken: this.generateResetToken(user.id) };
}

// 3. Reset password
async resetPassword(resetToken: string, newPassword: string) {
  const userId = this.validateResetToken(resetToken);
  const hash = await this.passwordService.hashPassword(newPassword);
  await this.prisma.user.update({
    where: { id: userId },
    data: { password: hash }
  });
  await this.sessionService.invalidateAllUserSessions(userId);
}
```

## 🎓 Best Practices

### 1. Service Injection
Always inject services through constructor:
```typescript
constructor(
  private readonly passwordService: PasswordService,
  private readonly otpService: OtpService,
  private readonly sessionService: SessionService,
) {}
```

### 2. Error Handling
Use specific exceptions:
```typescript
if (!user) {
  throw new NotFoundException('User not found');
}

if (!isValid) {
  throw new UnauthorizedException('Invalid credentials');
}
```

### 3. Logging
Use structured logging:
```typescript
this.logger.log(`✅ Login successful for user: ${user.email}`);
this.logger.warn(`⚠️ Failed login attempt: ${identifier}`);
this.logger.error(`❌ Registration failed:`, error);
```

### 4. Async/Await
Always use async/await for database operations:
```typescript
// ❌ Bad
this.prisma.user.create(data).then(user => { ... });

// ✅ Good
const user = await this.prisma.user.create({ data });
```

---

**Last Updated:** December 11, 2025
**Version:** 2.0.0 (Refactored)
**Maintainer:** Backend Team
