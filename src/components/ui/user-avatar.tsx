"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const userAvatarVariants = cva("", {
  variants: {
    size: {
      xs: "h-6 w-6 text-[10px]",
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
      xl: "h-16 w-16 text-lg",
      "2xl": "h-20 w-20 text-xl",
      "3xl": "h-24 w-24 text-2xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

const emojiSizeVariants = cva("", {
  variants: {
    size: {
      xs: "text-sm",
      sm: "text-base",
      md: "text-lg",
      lg: "text-xl",
      xl: "text-2xl",
      "2xl": "text-3xl",
      "3xl": "text-4xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

interface UserAvatarProps extends VariantProps<typeof userAvatarVariants> {
  /** User's name for generating initials */
  name?: string | null;
  /** Avatar value - can be image URL or emoji */
  avatar?: string | null;
  /** Additional class names */
  className?: string;
  /** Fallback class names */
  fallbackClassName?: string;
}

/**
 * Checks if the avatar value is an image URL
 */
export function isImageUrl(avatar: string | null | undefined): boolean {
  if (!avatar) return false;
  return (
    avatar.startsWith("/uploads") ||
    avatar.startsWith("http://") ||
    avatar.startsWith("https://") ||
    avatar.startsWith("data:image/") ||
    avatar.startsWith("/")
  );
}

/**
 * Checks if the avatar value is an emoji
 */
export function isEmoji(avatar: string | null | undefined): boolean {
  if (!avatar) return false;
  // Emoji regex pattern - matches most emojis
  const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:\u200D(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*$/u;
  return emojiRegex.test(avatar) || (avatar.length <= 2 && !avatar.match(/^[a-zA-Z0-9]+$/));
}

/**
 * Get initials from a name
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * UserAvatar - A reusable avatar component that handles:
 * - Image URLs (http/https, /uploads, data URIs)
 * - Emoji avatars
 * - Fallback to initials
 */
export function UserAvatar({
  name,
  avatar,
  size,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const hasImageUrl = isImageUrl(avatar);
  const hasEmoji = isEmoji(avatar);

  return (
    <Avatar className={cn(userAvatarVariants({ size }), className)}>
      {hasImageUrl && (
        <AvatarImage src={avatar!} alt={name || "User"} className="object-cover" />
      )}
      <AvatarFallback
        className={cn(
          "bg-primary text-primary-foreground font-semibold",
          hasEmoji && emojiSizeVariants({ size }),
          fallbackClassName
        )}
      >
        {hasEmoji ? avatar : getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

export { userAvatarVariants };
