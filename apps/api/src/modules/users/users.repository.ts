import { Injectable } from '@nestjs/common';
import { RentalStatus, User } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { DomainError } from '../../common/errors/domain.error';

const RENTAL_PARTICIPANT_LOOKUP_STATUSES: RentalStatus[] = [
  RentalStatus.ACCEPTED,
  RentalStatus.AGREEMENT_PENDING,
  RentalStatus.PICKUP_PENDING,
  RentalStatus.PICKUP_APPROVAL_PENDING,
  RentalStatus.ACTIVE,
  RentalStatus.COMPLETED,
  RentalStatus.RATED,
];

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  findByCnic(cnic: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { cnic } });
  }

  findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  create(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    cnic: string;
    phone: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        fullName: data.fullName.trim(),
        cnic: data.cnic,
        phone: data.phone,
      },
    });
  }

  updateProfile(
    userId: string,
    data: { fullName?: string; profilePhotoUrl?: string | null },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.fullName !== undefined ? { fullName: data.fullName.trim() } : {}),
        ...(data.profilePhotoUrl !== undefined ? { profilePhotoUrl: data.profilePhotoUrl } : {}),
      },
    });
  }

  markEmailVerified(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
      },
    });
  }

  async getByIdOrThrow(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new DomainError('User not found', 'USER_NOT_FOUND', 404);
    }
    return user;
  }

  async hasSharedRental(userIdA: string, userIdB: string): Promise<boolean> {
    const rental = await this.prisma.rental.findFirst({
      where: {
        OR: [
          { ownerId: userIdA, renterId: userIdB },
          { ownerId: userIdB, renterId: userIdA },
        ],
        status: { in: RENTAL_PARTICIPANT_LOOKUP_STATUSES },
      },
      select: { id: true },
    });

    return rental !== null;
  }
}
