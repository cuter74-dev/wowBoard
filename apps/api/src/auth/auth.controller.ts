import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { OAuthProfile } from './oauth-profile';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  // ───────── Google ─────────
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    /* passport redirects */
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleCallback(req, res);
  }

  // ───────── Kakao ─────────
  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  kakaoLogin() {}

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleCallback(req, res);
  }

  // ───────── Naver ─────────
  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  naverLogin() {}

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleCallback(req, res);
  }

  // ───────── Apple (uses form_post → POST callback) ─────────
  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  appleLogin() {}

  @Post('apple/callback')
  @UseGuards(AuthGuard('apple'))
  async appleCallbackPost(@Req() req: Request, @Res() res: Response) {
    return this.handleCallback(req, res);
  }

  // ───────── Session ─────────
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return {
      id: user.id,
      provider: user.provider,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    return { ok: true };
  }

  // ───────── Guest (login-less / demo entry) ─────────
  @Post('guest')
  async guest(@Res({ passthrough: true }) res: Response) {
    const user = await this.auth.upsertGuest();
    this.setAuthCookie(res, this.auth.signToken(user.id));
    return {
      id: user.id,
      provider: user.provider,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  }

  // ───────── shared ─────────
  private setAuthCookie(res: Response, token: string) {
    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // set true behind HTTPS in production
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  private async handleCallback(req: Request, res: Response) {
    const profile = req.user as OAuthProfile | undefined;
    if (!profile) throw new UnauthorizedException();

    const user = await this.auth.upsertFromProfile(profile);
    this.setAuthCookie(res, this.auth.signToken(user.id));

    const webOrigin = this.config
      .get<string>('WEB_ORIGIN', 'http://localhost:7100')
      .split(',')[0]
      .trim();
    return res.redirect(webOrigin);
  }
}
