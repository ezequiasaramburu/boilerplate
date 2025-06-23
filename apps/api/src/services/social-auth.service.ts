import { prisma } from '@my/database';
import { authService } from './auth.service.js';
import {
  type OAuthProfile,
  Provider,
  type SocialAuthResponse,
} from '@my/types';

export class SocialAuthService {
  async handleOAuthCallback(profile: OAuthProfile): Promise<SocialAuthResponse> {
    try {
      // First, check if social account already exists
      const existingSocialAccount = await prisma.socialAccount.findUnique({
        where: {
          provider_providerId: {
            provider: profile.provider,
            providerId: profile.id,
          },
        },
        include: { user: true },
      });

      if (existingSocialAccount) {
        // User exists with this social account, log them in
        const tokens = await authService.generateTokens(existingSocialAccount.user);

        return {
          user: authService.formatUserResponse(existingSocialAccount.user),
          tokens,
          isNewUser: false,
        };
      }

      // Check if user exists with this email
      let user = null;
      if (profile.email) {
        user = await prisma.user.findUnique({
          where: { email: profile.email },
        });
      }

      let isNewUser = false;

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: profile.email || `${profile.provider.toLowerCase()}_${profile.id}@placeholder.com`,
            name: profile.name || profile.username,
            avatar: profile.avatar,
            // No password for social-only users
            // emailVerified will use default value from schema
          },
        });
        isNewUser = true;
      }

      // Link social account to user
      await prisma.socialAccount.create({
        data: {
          provider: profile.provider,
          providerId: profile.id,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
          userId: user.id,
        },
      });

      // Update user avatar if they don't have one
      if (!user.avatar && profile.avatar) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatar: profile.avatar },
        });
      }

      const tokens = await authService.generateTokens(user);

      return {
        user: authService.formatUserResponse(user),
        tokens,
        isNewUser,
      };
    } catch (error) {
      console.error('Social auth error:', error);
      throw new Error('Social authentication failed');
    }
  }

  async linkSocialAccount(userId: string, profile: OAuthProfile): Promise<void> {
    // Check if this social account is already linked to another user
    const existingSocialAccount = await prisma.socialAccount.findUnique({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.id,
        },
      },
    });

    if (existingSocialAccount && existingSocialAccount.userId !== userId) {
      throw new Error('This social account is already linked to another user');
    }

    if (existingSocialAccount && existingSocialAccount.userId === userId) {
      throw new Error('This social account is already linked to your account');
    }

    // Link the social account
    await prisma.socialAccount.create({
      data: {
        provider: profile.provider,
        providerId: profile.id,
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        userId,
      },
    });
  }

  async unlinkSocialAccount(userId: string, provider: Provider): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { socialAccounts: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has password or other social accounts
    const hasPassword = !!user.password;
    const otherSocialAccounts = user.socialAccounts.filter(acc => acc.provider !== provider);

    if (!hasPassword && otherSocialAccounts.length === 0) {
      throw new Error('Cannot unlink the only authentication method. Please set a password first.');
    }

    await prisma.socialAccount.deleteMany({
      where: {
        userId,
        provider,
      },
    });
  }

  async getUserSocialAccounts(userId: string) {
    return prisma.socialAccount.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });
  }

  // Helper method to format OAuth profiles from different providers
  formatGoogleProfile(profile: any): OAuthProfile {
    return {
      id: profile.id,
      provider: Provider.GOOGLE,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value,
      username: profile.username,
    };
  }

  formatGitHubProfile(profile: any): OAuthProfile {
    return {
      id: profile.id.toString(),
      provider: Provider.GITHUB,
      email: profile.emails?.[0]?.value,
      name: profile.displayName || profile.username,
      avatar: profile.photos?.[0]?.value,
      username: profile.username,
    };
  }

  formatFacebookProfile(profile: any): OAuthProfile {
    return {
      id: profile.id,
      provider: Provider.FACEBOOK,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value,
      username: profile.username,
    };
  }

  formatLinkedInProfile(profile: any): OAuthProfile {
    return {
      id: profile.id,
      provider: Provider.LINKEDIN,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value,
      username: profile.username,
    };
  }

  formatDiscordProfile(profile: any): OAuthProfile {
    return {
      id: profile.id,
      provider: Provider.DISCORD,
      email: profile.email,
      name: profile.username,
      avatar: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : undefined,
      username: profile.username,
    };
  }
}

export const socialAuthService = new SocialAuthService();
