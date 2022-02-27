import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RequestService } from './request.service';
import { RequestDocument } from './schemas/request.schema';

@Controller('requests')
export class RequestController {
  constructor(private requestService: RequestService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/')
  async findAll(@Request() req): Promise<RequestDocument[]> {
    return await this.requestService.findAll(req.user.id);
  }
}
