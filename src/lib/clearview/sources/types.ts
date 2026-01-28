/**
 * Types for rage weather data sources
 */

export type Platform = "twitter" | "bluesky" | "reddit" | "threads";

export type PoliticalLean =
  | "left"
  | "center_left"
  | "center"
  | "center_right"
  | "right";

export type Gender = "male" | "female" | "org" | "mixed";

export type Category =
  // Political
  | "pundit_left"
  | "pundit_right"
  | "pundit_center"
  | "politician"
  | "journalist"
  // Cultural/Lifestyle
  | "parenting"
  | "womens_media"
  | "entertainment"
  | "health_wellness"
  | "relationships"
  // News
  | "news_outlet"
  | "news_outlet_left"
  | "news_outlet_right"
  // Other
  | "viral_account"
  | "activist"
  | "creator";

export type Demographic = "gen_z" | "millennial" | "gen_x" | "boomer" | "mixed";

export interface TwitterAccount {
  handle: string;
  name: string;
  category: Category;
  gender: Gender;
  politicalLean?: PoliticalLean;
  demographic?: Demographic;
  notes?: string;
  followerCount?: number; // approximate, for reference
}

export interface BlueskyAccount {
  handle: string; // e.g., "user.bsky.social" or custom domain
  name: string;
  category: Category;
  gender: Gender;
  politicalLean?: PoliticalLean;
  notes?: string;
}

export interface RedditSource {
  subreddit: string; // without r/ prefix
  name: string;
  category: Category;
  genderSkew: Gender; // which gender dominates
  demographic?: Demographic;
  notes?: string;
  subscribers?: number; // approximate
}

export interface ThreadsAccount {
  handle: string;
  name: string;
  category: Category;
  gender: Gender;
  notes?: string;
}

export interface WomensMediaOutlet {
  name: string;
  type: "newsletter" | "website" | "social_brand";
  reach?: string; // e.g., "5M subscribers"
  platforms: {
    twitter?: string;
    instagram?: string;
    threads?: string;
    bluesky?: string;
    website?: string;
  };
  demographic: Demographic;
  notes?: string;
}
