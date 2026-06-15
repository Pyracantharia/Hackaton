import { Injectable} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(configService: ConfigService){
    const databaseUrl = configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error("La variable d'environnement DATABASE_URL est manquante ou vide !");
    }

    const pool = new Pool({connectionString: databaseUrl});
    const adapter = new PrismaPg(pool);
    super({adapter});
  }
}