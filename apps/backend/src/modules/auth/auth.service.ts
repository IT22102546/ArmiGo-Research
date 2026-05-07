import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

private isBcryptHash(value?: string): boolean {
  if (!value) return false;
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

async validateUser(identifier: string, password: string, allowedRoles?: string[]): Promise<any> {
  console.log('\n========== AUTH DEBUG ==========');
  console.log(`1️⃣ validateUser called with identifier: "${identifier}"`);
  
  let user = await this.usersService.findByPhoneOrEmail(identifier);
  if (!user && identifier.includes("@")) {
    user = await this.usersService.ensureHospitalAdminAccountByEmail(identifier);
  }
  
  if (!user) {
    console.log('2️⃣ ❌ User not found in database');
    console.log('=================================\n');
    return null;
  }
  
  const userAny = user as any;

  if (userAny.status !== "ACTIVE") {
    console.log(`2️⃣ ❌ User account is inactive: ${userAny.email || userAny.phone}`);
    console.log('=================================\n');
    throw new UnauthorizedException("Account is inactive. Please contact administrator.");
  }

  if (
    userAny.role === "HOSPITAL_ADMIN" &&
    userAny.hospitalProfile?.hospital?.status &&
    userAny.hospitalProfile.hospital.status !== "ACTIVE"
  ) {
    console.log(`2️⃣ ❌ Hospital admin account blocked because hospital is inactive: ${userAny.email || userAny.phone}`);
    console.log('=================================\n');
    throw new UnauthorizedException("Account is inactive. Please contact administrator.");
  }

  console.log(`2️⃣ ✅ User found:`, {
    id: userAny.id,
    email: userAny.email,
    phone: userAny.phone,
    role: userAny.role,
    status: userAny.status
  });
  
  const isMainHospitalAdmin =
    userAny.role === "HOSPITAL_ADMIN" &&
    userAny.hospitalProfile?.hospital?.isMainHospital === true;
  const effectiveRole = isMainHospitalAdmin ? "SUPER_ADMIN" : userAny.role;

  // Check if user role is in allowedRoles if specified
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userAny.role) && !allowedRoles.includes(effectiveRole)) {
      console.log(`❌ User role ${userAny.role} / effective role ${effectiveRole} not in allowed roles:`, allowedRoles);
      console.log('=================================\n');
      return null;
    }
  }
  
  console.log(`3️⃣ Comparing passwords...`);
  let isPasswordValid = false;

  if (this.isBcryptHash(userAny.password)) {
    isPasswordValid = await bcrypt.compare(password, userAny.password);
  } else if (typeof userAny.password === "string" && userAny.password === password) {
    isPasswordValid = true;

    try {
      const migratedHash = await bcrypt.hash(password, 12);
      await this.usersService.updatePassword(userAny.id, migratedHash);
      userAny.password = migratedHash;
      console.log("3️⃣ 🔄 Migrated legacy plaintext password to bcrypt hash");
    } catch (migrationError) {
      console.log("3️⃣ ⚠️ Password verified but migration failed:", migrationError);
    }
  }
  
  if (isPasswordValid) {
    console.log(`4️⃣ ✅ Password valid!`);
    const { password, ...result } = userAny;
    const resultAny = result as any;
    resultAny.role = effectiveRole;
    resultAny.roles =
      effectiveRole === "SUPER_ADMIN" && userAny.role === "HOSPITAL_ADMIN"
        ? ["SUPER_ADMIN", "HOSPITAL_ADMIN"]
        : [effectiveRole];
    console.log(`5️⃣ ✅ Authentication successful for: ${userAny.email}`);
    console.log('=================================\n');
    return resultAny;
  }
  
  console.log(`4️⃣ ❌ Password invalid for user: ${userAny.email}`);
  console.log('=================================\n');
  return null;
}

  async login(user: any) {
    const roles = Array.isArray(user.roles)
      ? user.roles
      : user.role === "SUPER_ADMIN" && user.hospitalProfile?.hospital?.isMainHospital
        ? ["SUPER_ADMIN", "HOSPITAL_ADMIN"]
        : [user.role];

    const payload = { 
      sub: user.id, 
      phone: user.phone,
      email: user.email,
      role: user.role,
      roles,
    };
    
    const accessToken = this.jwtService.sign(payload);
    
    return {
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        roles,
        avatar: user.avatar || null,
        address: user.address || null,
        city: user.city || null,
        dateOfBirth: user.dateOfBirth || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async register(registerDto: any) {
    // You can implement registration if needed
    // For now, users are created by admin
    throw new UnauthorizedException("Registration not available");
  }
}