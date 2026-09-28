import {
  Controller,
  Get,
  Query,
  Res,
} from "@nestjs/common";

import type { Response } from "express";

import { VnpayService } from "./vnpay.service.js";

@Controller("vnpay")
export class VnpayController {
  constructor(
    private readonly vnpayService: VnpayService,
  ) {}

  /**
   * VNPAY redirect browser về endpoint này.
   *
   * Endpoint KHÔNG cộng tiền.
   * Việc cộng tiền chỉ được thực hiện bởi IPN.
   */
  @Get("return")
  handleReturn(
    @Query() query: Record<string, string>,
    @Res() response: Response,
  ) {
    const redirectUrl =
      this.vnpayService.buildReturnRedirectUrl(
        query,
      );

    return response.redirect(
      302,
      redirectUrl,
    );
  }

  /**
   * Server VNPAY gọi endpoint này.
   *
   * Đây mới là nơi xác nhận giao dịch
   * và cộng tiền vào ví.
   */
  @Get("ipn")
  handleIpn(
    @Query() query: Record<string, string>,
  ) {
    return this.vnpayService.handleIpn(
      query,
    );
  }
}