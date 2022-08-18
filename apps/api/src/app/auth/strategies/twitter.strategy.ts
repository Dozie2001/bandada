import { Injectable, Logger } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { Profile, Strategy } from "passport-twitter"
import { AuthService } from "../auth.service"

@Injectable()
export class TwitterStrategy extends PassportStrategy(Strategy, "twitter") {
    logger = new Logger(this.constructor.name)

    constructor(private readonly authService: AuthService) {
        super({
            consumerKey: process.env.TWITTER_CONSUMER_KEY,
            consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
            callbackURL: `${process.env.BASE_URL}/api/auth/twitter/callback`
        })
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any) => void
    ) {
        if (profile) {
            const token = await this.authService.findOrCreateAccount({
                service: "twitter",
                userId: profile.id,
                accessToken,
                refreshToken,
                username: profile.username,
                fullName: profile.displayName,
                avatarURL: profile.photos[0].value
            })

            // TODO: generate jwt token here.
            done(null, token)
        }
    }
}