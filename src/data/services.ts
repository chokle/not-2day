export type ServicePreset = {
  name: string;
  domain: string;
  category: string;
  typicalPrice: number;
  cycle: "monthly" | "yearly" | "weekly";
  cancelUrl: string;
  cancelSteps: string[];
  supportEmail?: string;
  trialDays?: number;
};

export const SERVICE_PRESETS: ServicePreset[] = [
  {
    name: "Netflix",
    domain: "netflix.com",
    category: "Streaming",
    typicalPrice: 15.49,
    cycle: "monthly",
    cancelUrl: "https://www.netflix.com/cancelplan",
    cancelSteps: [
      "Sign in to netflix.com",
      "Open Account from the profile menu",
      "Under Membership & Billing, choose Cancel Membership",
      "Confirm — you keep access until the period ends",
    ],
    supportEmail: "info@netflix.com",
  },
  {
    name: "Spotify Premium",
    domain: "spotify.com",
    category: "Music",
    typicalPrice: 11.99,
    cycle: "monthly",
    cancelUrl: "https://www.spotify.com/account/subscription/change/",
    cancelSteps: [
      "Go to your Spotify account page",
      "Open Manage your plan",
      "Scroll to Available plans and pick Spotify Free",
      "Select Cancel Premium and confirm",
    ],
    supportEmail: "support@spotify.com",
    trialDays: 30,
  },
  {
    name: "Disney+",
    domain: "disneyplus.com",
    category: "Streaming",
    typicalPrice: 9.99,
    cycle: "monthly",
    cancelUrl: "https://www.disneyplus.com/account/subscription",
    cancelSteps: [
      "Log in at disneyplus.com",
      "Open Account → Subscription",
      "Select your plan, then Cancel Subscription",
      "Pick a reason and confirm",
    ],
  },
  {
    name: "Amazon Prime",
    domain: "amazon.com",
    category: "Shopping",
    typicalPrice: 14.99,
    cycle: "monthly",
    cancelUrl: "https://www.amazon.com/gp/primecentral",
    cancelSteps: [
      "Open Prime Central on Amazon",
      "Choose Update, cancel and more under your membership",
      "Select End membership",
      "Click through the retention offers until it confirms",
    ],
    trialDays: 30,
  },
  {
    name: "YouTube Premium",
    domain: "youtube.com",
    category: "Streaming",
    typicalPrice: 13.99,
    cycle: "monthly",
    cancelUrl: "https://www.youtube.com/paid_memberships",
    cancelSteps: [
      "Open youtube.com/paid_memberships",
      "Select Manage membership",
      "Choose Deactivate → Continue to cancel",
    ],
  },
  {
    name: "ChatGPT Plus",
    domain: "openai.com",
    category: "AI tools",
    typicalPrice: 20,
    cycle: "monthly",
    cancelUrl: "https://chatgpt.com/#settings/Subscription",
    cancelSteps: [
      "Open ChatGPT and click your profile",
      "Settings → Subscription → Manage my subscription",
      "In the Stripe portal choose Cancel plan",
    ],
    supportEmail: "support@openai.com",
  },
  {
    name: "Adobe Creative Cloud",
    domain: "adobe.com",
    category: "Creative",
    typicalPrice: 59.99,
    cycle: "monthly",
    cancelUrl: "https://account.adobe.com/plans",
    cancelSteps: [
      "Sign in at account.adobe.com/plans",
      "Choose Manage plan on the plan you want gone",
      "Select Cancel your plan",
      "Watch for an early-termination fee before confirming",
    ],
    trialDays: 7,
  },
  {
    name: "Notion",
    domain: "notion.so",
    category: "Productivity",
    typicalPrice: 10,
    cycle: "monthly",
    cancelUrl: "https://www.notion.so/my-settings",
    cancelSteps: [
      "Open Settings & members → Billing",
      "Select Change plan → Downgrade to Free",
      "Confirm the downgrade",
    ],
    supportEmail: "team@makenotion.com",
  },
  {
    name: "Dropbox",
    domain: "dropbox.com",
    category: "Storage",
    typicalPrice: 11.99,
    cycle: "monthly",
    cancelUrl: "https://www.dropbox.com/account/plan",
    cancelSteps: [
      "Open dropbox.com/account/plan",
      "Select Cancel plan at the bottom",
      "Pick a reason and confirm the downgrade to Basic",
    ],
    trialDays: 30,
  },
  {
    name: "iCloud+",
    domain: "icloud.com",
    category: "Storage",
    typicalPrice: 2.99,
    cycle: "monthly",
    cancelUrl: "https://support.apple.com/en-us/HT202039",
    cancelSteps: [
      "On iPhone: Settings → your name → Subscriptions",
      "Tap iCloud+ then Cancel Subscription",
      "Or on Mac: System Settings → Apple ID → iCloud → Manage",
    ],
  },
  {
    name: "Microsoft 365",
    domain: "microsoft.com",
    category: "Productivity",
    typicalPrice: 9.99,
    cycle: "monthly",
    cancelUrl: "https://account.microsoft.com/services",
    cancelSteps: [
      "Sign in at account.microsoft.com/services",
      "Find Microsoft 365 → Manage",
      "Choose Cancel subscription and confirm",
    ],
    trialDays: 30,
  },
  {
    name: "HBO Max",
    domain: "max.com",
    category: "Streaming",
    typicalPrice: 16.99,
    cycle: "monthly",
    cancelUrl: "https://auth.max.com/settings/subscription",
    cancelSteps: [
      "Sign in at max.com",
      "Profile → Subscription",
      "Select Cancel Subscription and confirm",
    ],
  },
  {
    name: "Hulu",
    domain: "hulu.com",
    category: "Streaming",
    typicalPrice: 18.99,
    cycle: "monthly",
    cancelUrl: "https://secure.hulu.com/account",
    cancelSteps: [
      "Open secure.hulu.com/account",
      "Under Your Subscription choose Cancel",
      "Decline the pause offer and confirm",
    ],
    trialDays: 30,
  },
  {
    name: "Audible",
    domain: "audible.com",
    category: "Books",
    typicalPrice: 14.95,
    cycle: "monthly",
    cancelUrl: "https://www.audible.com/account/membership",
    cancelSteps: [
      "Open Account Details on Audible",
      "Select Cancel membership",
      "Decline the pause/discount offers and confirm",
    ],
    trialDays: 30,
  },
  {
    name: "Canva Pro",
    domain: "canva.com",
    category: "Creative",
    typicalPrice: 14.99,
    cycle: "monthly",
    cancelUrl: "https://www.canva.com/settings/billing-and-plans",
    cancelSteps: [
      "Open Settings → Billing & plans",
      "Choose Cancel subscription",
      "Confirm; access continues to the period end",
    ],
    trialDays: 30,
  },
  {
    name: "LinkedIn Premium",
    domain: "linkedin.com",
    category: "Career",
    typicalPrice: 39.99,
    cycle: "monthly",
    cancelUrl: "https://www.linkedin.com/premium/manage",
    cancelSteps: [
      "Open linkedin.com/premium/manage",
      "Select Cancel subscription",
      "Pick a reason and confirm",
    ],
    trialDays: 30,
  },
  {
    name: "Peloton App",
    domain: "onepeloton.com",
    category: "Fitness",
    typicalPrice: 12.99,
    cycle: "monthly",
    cancelUrl: "https://members.onepeloton.com/preferences/subscriptions",
    cancelSteps: [
      "Open Account → Subscriptions",
      "Select Cancel Membership",
      "Confirm the cancellation date",
    ],
    trialDays: 30,
  },
  {
    name: "New York Times",
    domain: "nytimes.com",
    category: "News",
    typicalPrice: 25,
    cycle: "monthly",
    cancelUrl: "https://www.nytimes.com/subscription/manage",
    cancelSteps: [
      "Open nytimes.com/subscription/manage",
      "Select Cancel subscription",
      "You may be routed to chat — insist on cancellation",
    ],
    supportEmail: "help@nytimes.com",
  },
  {
    name: "GitHub Copilot",
    domain: "github.com",
    category: "Developer",
    typicalPrice: 10,
    cycle: "monthly",
    cancelUrl: "https://github.com/settings/billing",
    cancelSteps: [
      "Open GitHub Settings → Billing and plans",
      "Find Copilot and choose Cancel trial / Cancel subscription",
    ],
    trialDays: 30,
  },
  {
    name: "Figma",
    domain: "figma.com",
    category: "Creative",
    typicalPrice: 15,
    cycle: "monthly",
    cancelUrl: "https://www.figma.com/files/team",
    cancelSteps: [
      "Open your team settings → Billing",
      "Select Downgrade to Starter",
      "Confirm at the end of the billing period",
    ],
  },
];

export function findPreset(name: string): ServicePreset | undefined {
  const n = name.trim().toLowerCase();
  if (!n) return undefined;
  return (
    SERVICE_PRESETS.find((p) => p.name.toLowerCase() === n) ??
    SERVICE_PRESETS.find(
      (p) => n.includes(p.name.toLowerCase().split(" ")[0]!) && p.name.split(" ")[0]!.length > 3,
    )
  );
}

export function logoUrl(domain?: string) {
  if (!domain) return undefined;
  return `https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=96&format=png`;
}
