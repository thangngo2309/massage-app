import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  Max,
  Min,
} from "class-validator";

export enum PaymentClient {
  WEB = "web",
  MOBILE = "mobile",
}

export class CreateWalletTopupDto {
  @Type(() => Number)
  @IsInt()
  @Min(10_000)
  @Max(100_000_000)
  amount: number;

  @IsEnum(PaymentClient)
  client: PaymentClient;
}