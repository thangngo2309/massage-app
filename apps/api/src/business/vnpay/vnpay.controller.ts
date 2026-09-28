import { Controller, Get, Query, Res } from '@nestjs/common';

import type { Response } from 'express';

import { VnpayService } from './vnpay.service.js';

@Controller('vnpay')
export class VnpayController {
  constructor(private readonly vnpayService: VnpayService) {}

  @Get('return')
  handleReturn(
    @Query() query: Record<string, string>,
    @Res() response: Response,
  ) {
    const valid = this.vnpayService.verifyReturn(query);

    const success =
      valid &&
      query['vnp_ResponseCode'] === '00' &&
      query['vnp_TransactionStatus'] === '00';

    const txnRef = query['vnp_TxnRef'] ?? '';

    /*
     * Tạm thời trả HTML đơn giản.
     *
     * Sau này khi web/mobile hoàn thiện có thể
     * redirect về deep-link hoặc URL frontend.
     */
    const title = success
      ? 'Thanh toán thành công'
      : 'Thanh toán không thành công';

    const message = success
      ? 'VNPAY đã ghi nhận thanh toán. Số dư ví sẽ được cập nhật sau khi hệ thống xác nhận giao dịch.'
      : 'Giao dịch chưa hoàn tất hoặc không hợp lệ.';

    return response.status(200).type('html').send(`
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />
    <title>${title}</title>
  </head>
  
  <body>
    <main>
      <h1>${title}</h1>
  
      <p>${message}</p>
  
      <p>
        Mã giao dịch:
        <strong>${txnRef}</strong>
      </p>
    </main>
  </body>
  </html>
        `);
  }

  @Get('ipn')
  handleIpn(@Query() query: Record<string, string>) {
    return this.vnpayService.handleIpn(query);
  }
}
