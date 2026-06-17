import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HouseholdsModule } from './households/households.module';
import { SupportCasesModule } from './support-cases/support-cases.module';
import { TitlesModule } from './titles/titles.module';
import { SubscriptionRequestsModule } from './subscription-requests/subscription-requests.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HouseholdsModule,
    SupportCasesModule,
    TitlesModule,
    SubscriptionRequestsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
