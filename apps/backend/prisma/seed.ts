import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seeding...')
  
  // Hash the password for super admin
  const hashedPassword = await bcrypt.hash('Armigo@2026', 10)
  
  // Create super admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'armigo@gmail.com' },
    update: {},
    create: {
      email: 'armigo@gmail.com',
      phone: '+94710000000',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      displayId: 'AGU-0001',
    }
  })
  
  console.log('✅ Super admin created:', superAdmin.email)
  
  // Create a sample district
  const district = await prisma.district.upsert({
    where: { name: 'Colombo' },
    update: {},
    create: {
      name: 'Colombo',
      code: 'CMB',
    }
  })
  
  console.log('✅ Sample district created:', district.name)
  
  // Create a sample zone
  const zone = await prisma.zone.upsert({
    where: { name: 'Colombo Central' },
    update: {},
    create: {
      name: 'Colombo Central',
      code: 'CMB-C',
      districtId: district.id,
    }
  })
  
  console.log('✅ Sample zone created:', zone.name)
  
  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })