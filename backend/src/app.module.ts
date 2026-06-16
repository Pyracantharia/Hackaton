import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HouseholdsModule } from './households/households.module';
import { SupportCasesModule } from './support-cases/support-cases.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HouseholdsModule,
    SupportCasesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
