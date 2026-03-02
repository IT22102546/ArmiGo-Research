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

async validateUser(identifier: string, password: string, allowedRoles?: string[]): Promise<any> {
  console.log('\n========== AUTH DEBUG ==========');
  console.log(`1️⃣ validateUser called with identifier: "${identifier}"`);
  
  const user = await this.usersService.findByPhoneOrEmail(identifier);
  
  if (!user) {
    console.log('2️⃣ ❌ User not found in database');
    console.log('=================================\n');
    return null;
  }
  
  console.log(`2️⃣ ✅ User found:`, {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status
  });
  
  // Check if user role is in allowedRoles if specified
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      console.log(`❌ User role ${user.role} not in allowed roles:`, allowedRoles);
      console.log('=================================\n');
      return null;
    }
  }
  
  console.log(`3️⃣ Comparing passwords...`);
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (isPasswordValid) {
    console.log(`4️⃣ ✅ Password valid!`);
    const { password, ...result } = user;
    console.log(`5️⃣ ✅ Authentication successful for: ${user.email}`);
    console.log('=================================\n');
    return result;
  }
  
  console.log(`4️⃣ ❌ Password invalid for user: ${user.email}`);
  console.log('=================================\n');
  return null;
}

  async login(user: any) {
    const payload = { 
      sub: user.id, 
      phone: user.phone,
      email: user.email,
      role: user.role 
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