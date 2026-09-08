import type { Category } from "@prisma/client";

export type SeedProduct = {
  slug: string;
  name: string;
  category: Category;
  /** Launch MSRP in whole US dollars for the base configuration. */
  priceUSD: number;
  /** Year the product was announced. */
  year: number;
};

/**
 * Image artwork is category-based line art shipped in `public/products`.
 * Swap this for a CDN URL per product if you have real product photography.
 */
export const CATEGORY_IMAGE: Record<Category, string> = {
  IPHONE: "/product-art/iphone.svg",
  IPAD: "/product-art/ipad.svg",
  MAC: "/product-art/mac.svg",
  WATCH: "/product-art/watch.svg",
  AIRPODS: "/product-art/airpods.svg",
  VISION: "/product-art/vision.svg",
  DISPLAY: "/product-art/display.svg",
  TV_HOME: "/product-art/tv-home.svg",
  ACCESSORY: "/product-art/accessory.svg",
};

export const PRODUCTS: SeedProduct[] = [
  // ---------------------------------------------------------------- iPhone
  { slug: "iphone-17-pro-max", name: "iPhone 17 Pro Max", category: "IPHONE", priceUSD: 1199, year: 2025 },
  { slug: "iphone-17-pro", name: "iPhone 17 Pro", category: "IPHONE", priceUSD: 1099, year: 2025 },
  { slug: "iphone-air", name: "iPhone Air", category: "IPHONE", priceUSD: 999, year: 2025 },
  { slug: "iphone-17", name: "iPhone 17", category: "IPHONE", priceUSD: 799, year: 2025 },
  { slug: "iphone-16e", name: "iPhone 16e", category: "IPHONE", priceUSD: 599, year: 2025 },
  { slug: "iphone-16-pro-max", name: "iPhone 16 Pro Max", category: "IPHONE", priceUSD: 1199, year: 2024 },
  { slug: "iphone-16-pro", name: "iPhone 16 Pro", category: "IPHONE", priceUSD: 999, year: 2024 },
  { slug: "iphone-16-plus", name: "iPhone 16 Plus", category: "IPHONE", priceUSD: 899, year: 2024 },
  { slug: "iphone-16", name: "iPhone 16", category: "IPHONE", priceUSD: 799, year: 2024 },
  { slug: "iphone-15-pro-max", name: "iPhone 15 Pro Max", category: "IPHONE", priceUSD: 1199, year: 2023 },
  { slug: "iphone-15-pro", name: "iPhone 15 Pro", category: "IPHONE", priceUSD: 999, year: 2023 },
  { slug: "iphone-15-plus", name: "iPhone 15 Plus", category: "IPHONE", priceUSD: 899, year: 2023 },
  { slug: "iphone-15", name: "iPhone 15", category: "IPHONE", priceUSD: 799, year: 2023 },
  { slug: "iphone-14-pro-max", name: "iPhone 14 Pro Max", category: "IPHONE", priceUSD: 1099, year: 2022 },
  { slug: "iphone-14-pro", name: "iPhone 14 Pro", category: "IPHONE", priceUSD: 999, year: 2022 },
  { slug: "iphone-14-plus", name: "iPhone 14 Plus", category: "IPHONE", priceUSD: 899, year: 2022 },
  { slug: "iphone-14", name: "iPhone 14", category: "IPHONE", priceUSD: 799, year: 2022 },
  { slug: "iphone-13-pro-max", name: "iPhone 13 Pro Max", category: "IPHONE", priceUSD: 1099, year: 2021 },
  { slug: "iphone-13-pro", name: "iPhone 13 Pro", category: "IPHONE", priceUSD: 999, year: 2021 },
  { slug: "iphone-13", name: "iPhone 13", category: "IPHONE", priceUSD: 799, year: 2021 },
  { slug: "iphone-13-mini", name: "iPhone 13 mini", category: "IPHONE", priceUSD: 699, year: 2021 },
  { slug: "iphone-12-pro-max", name: "iPhone 12 Pro Max", category: "IPHONE", priceUSD: 1099, year: 2020 },
  { slug: "iphone-12-pro", name: "iPhone 12 Pro", category: "IPHONE", priceUSD: 999, year: 2020 },
  { slug: "iphone-12", name: "iPhone 12", category: "IPHONE", priceUSD: 799, year: 2020 },
  { slug: "iphone-12-mini", name: "iPhone 12 mini", category: "IPHONE", priceUSD: 699, year: 2020 },
  { slug: "iphone-11-pro-max", name: "iPhone 11 Pro Max", category: "IPHONE", priceUSD: 1099, year: 2019 },
  { slug: "iphone-11-pro", name: "iPhone 11 Pro", category: "IPHONE", priceUSD: 999, year: 2019 },
  { slug: "iphone-11", name: "iPhone 11", category: "IPHONE", priceUSD: 699, year: 2019 },
  { slug: "iphone-se-3", name: "iPhone SE (3rd generation)", category: "IPHONE", priceUSD: 429, year: 2022 },
  { slug: "iphone-se-2", name: "iPhone SE (2nd generation)", category: "IPHONE", priceUSD: 399, year: 2020 },

  // ------------------------------------------------------------------- Mac
  { slug: "macbook-air-13-m4", name: 'MacBook Air 13" (M4)', category: "MAC", priceUSD: 999, year: 2025 },
  { slug: "macbook-air-15-m4", name: 'MacBook Air 15" (M4)', category: "MAC", priceUSD: 1199, year: 2025 },
  { slug: "macbook-air-13-m3", name: 'MacBook Air 13" (M3)', category: "MAC", priceUSD: 1099, year: 2024 },
  { slug: "macbook-air-15-m3", name: 'MacBook Air 15" (M3)', category: "MAC", priceUSD: 1299, year: 2024 },
  { slug: "macbook-air-15-m2", name: 'MacBook Air 15" (M2)', category: "MAC", priceUSD: 1299, year: 2023 },
  { slug: "macbook-air-13-m2", name: 'MacBook Air 13" (M2)', category: "MAC", priceUSD: 1199, year: 2022 },
  { slug: "macbook-air-13-m1", name: 'MacBook Air 13" (M1)', category: "MAC", priceUSD: 999, year: 2020 },
  { slug: "macbook-pro-14-m5", name: 'MacBook Pro 14" (M5)', category: "MAC", priceUSD: 1599, year: 2025 },
  { slug: "macbook-pro-14-m4", name: 'MacBook Pro 14" (M4)', category: "MAC", priceUSD: 1599, year: 2024 },
  { slug: "macbook-pro-14-m4-pro", name: 'MacBook Pro 14" (M4 Pro)', category: "MAC", priceUSD: 1999, year: 2024 },
  { slug: "macbook-pro-14-m4-max", name: 'MacBook Pro 14" (M4 Max)', category: "MAC", priceUSD: 3199, year: 2024 },
  { slug: "macbook-pro-16-m4-pro", name: 'MacBook Pro 16" (M4 Pro)', category: "MAC", priceUSD: 2499, year: 2024 },
  { slug: "macbook-pro-16-m4-max", name: 'MacBook Pro 16" (M4 Max)', category: "MAC", priceUSD: 3499, year: 2024 },
  { slug: "macbook-pro-14-m3", name: 'MacBook Pro 14" (M3)', category: "MAC", priceUSD: 1599, year: 2023 },
  { slug: "macbook-pro-16-m3-pro", name: 'MacBook Pro 16" (M3 Pro)', category: "MAC", priceUSD: 2499, year: 2023 },
  { slug: "macbook-pro-13-m2", name: 'MacBook Pro 13" (M2)', category: "MAC", priceUSD: 1299, year: 2022 },
  { slug: "imac-24-m4", name: 'iMac 24" (M4)', category: "MAC", priceUSD: 1299, year: 2024 },
  { slug: "imac-24-m3", name: 'iMac 24" (M3)', category: "MAC", priceUSD: 1299, year: 2023 },
  { slug: "imac-24-m1", name: 'iMac 24" (M1)', category: "MAC", priceUSD: 1299, year: 2021 },
  { slug: "mac-mini-m4", name: "Mac mini (M4)", category: "MAC", priceUSD: 599, year: 2024 },
  { slug: "mac-mini-m4-pro", name: "Mac mini (M4 Pro)", category: "MAC", priceUSD: 1399, year: 2024 },
  { slug: "mac-mini-m2", name: "Mac mini (M2)", category: "MAC", priceUSD: 599, year: 2023 },
  { slug: "mac-studio-m4-max", name: "Mac Studio (M4 Max)", category: "MAC", priceUSD: 1999, year: 2025 },
  { slug: "mac-studio-m3-ultra", name: "Mac Studio (M3 Ultra)", category: "MAC", priceUSD: 3999, year: 2025 },
  { slug: "mac-studio-m2-max", name: "Mac Studio (M2 Max)", category: "MAC", priceUSD: 1999, year: 2023 },
  { slug: "mac-pro-m2-ultra", name: "Mac Pro (M2 Ultra)", category: "MAC", priceUSD: 6999, year: 2023 },

  // ------------------------------------------------------------------ iPad
  { slug: "ipad-pro-13-m4", name: 'iPad Pro 13" (M4)', category: "IPAD", priceUSD: 1299, year: 2024 },
  { slug: "ipad-pro-11-m4", name: 'iPad Pro 11" (M4)', category: "IPAD", priceUSD: 999, year: 2024 },
  { slug: "ipad-pro-12-9-m2", name: 'iPad Pro 12.9" (M2)', category: "IPAD", priceUSD: 1099, year: 2022 },
  { slug: "ipad-pro-11-m2", name: 'iPad Pro 11" (M2)', category: "IPAD", priceUSD: 799, year: 2022 },
  { slug: "ipad-air-13-m3", name: 'iPad Air 13" (M3)', category: "IPAD", priceUSD: 799, year: 2025 },
  { slug: "ipad-air-11-m3", name: 'iPad Air 11" (M3)', category: "IPAD", priceUSD: 599, year: 2025 },
  { slug: "ipad-air-13-m2", name: 'iPad Air 13" (M2)', category: "IPAD", priceUSD: 799, year: 2024 },
  { slug: "ipad-air-11-m2", name: 'iPad Air 11" (M2)', category: "IPAD", priceUSD: 599, year: 2024 },
  { slug: "ipad-air-5", name: "iPad Air (5th generation)", category: "IPAD", priceUSD: 599, year: 2022 },
  { slug: "ipad-a16", name: "iPad (A16)", category: "IPAD", priceUSD: 349, year: 2025 },
  { slug: "ipad-10", name: "iPad (10th generation)", category: "IPAD", priceUSD: 449, year: 2022 },
  { slug: "ipad-9", name: "iPad (9th generation)", category: "IPAD", priceUSD: 329, year: 2021 },
  { slug: "ipad-mini-a17-pro", name: "iPad mini (A17 Pro)", category: "IPAD", priceUSD: 499, year: 2024 },
  { slug: "ipad-mini-6", name: "iPad mini (6th generation)", category: "IPAD", priceUSD: 499, year: 2021 },

  // ----------------------------------------------------------- Apple Watch
  { slug: "apple-watch-ultra-3", name: "Apple Watch Ultra 3", category: "WATCH", priceUSD: 799, year: 2025 },
  { slug: "apple-watch-ultra-2", name: "Apple Watch Ultra 2", category: "WATCH", priceUSD: 799, year: 2023 },
  { slug: "apple-watch-ultra", name: "Apple Watch Ultra", category: "WATCH", priceUSD: 799, year: 2022 },
  { slug: "apple-watch-series-11", name: "Apple Watch Series 11", category: "WATCH", priceUSD: 399, year: 2025 },
  { slug: "apple-watch-series-10", name: "Apple Watch Series 10", category: "WATCH", priceUSD: 399, year: 2024 },
  { slug: "apple-watch-series-9", name: "Apple Watch Series 9", category: "WATCH", priceUSD: 399, year: 2023 },
  { slug: "apple-watch-series-8", name: "Apple Watch Series 8", category: "WATCH", priceUSD: 399, year: 2022 },
  { slug: "apple-watch-se-3", name: "Apple Watch SE (3rd generation)", category: "WATCH", priceUSD: 249, year: 2025 },
  { slug: "apple-watch-se-2", name: "Apple Watch SE (2nd generation)", category: "WATCH", priceUSD: 249, year: 2022 },

  // --------------------------------------------------------------- AirPods
  { slug: "airpods-pro-3", name: "AirPods Pro 3", category: "AIRPODS", priceUSD: 249, year: 2025 },
  { slug: "airpods-pro-2-usb-c", name: "AirPods Pro 2 (USB-C)", category: "AIRPODS", priceUSD: 249, year: 2023 },
  { slug: "airpods-pro-2", name: "AirPods Pro 2", category: "AIRPODS", priceUSD: 249, year: 2022 },
  { slug: "airpods-4-anc", name: "AirPods 4 (Active Noise Cancellation)", category: "AIRPODS", priceUSD: 179, year: 2024 },
  { slug: "airpods-4", name: "AirPods 4", category: "AIRPODS", priceUSD: 129, year: 2024 },
  { slug: "airpods-3", name: "AirPods (3rd generation)", category: "AIRPODS", priceUSD: 179, year: 2021 },
  { slug: "airpods-2", name: "AirPods (2nd generation)", category: "AIRPODS", priceUSD: 129, year: 2019 },
  { slug: "airpods-max-usb-c", name: "AirPods Max (USB-C)", category: "AIRPODS", priceUSD: 549, year: 2024 },
  { slug: "airpods-max", name: "AirPods Max", category: "AIRPODS", priceUSD: 549, year: 2020 },

  // ---------------------------------------------------------------- Vision
  { slug: "apple-vision-pro-m5", name: "Apple Vision Pro (M5)", category: "VISION", priceUSD: 3499, year: 2025 },
  { slug: "apple-vision-pro", name: "Apple Vision Pro", category: "VISION", priceUSD: 3499, year: 2024 },

  // -------------------------------------------------------------- Displays
  { slug: "studio-display", name: "Studio Display", category: "DISPLAY", priceUSD: 1599, year: 2022 },
  { slug: "studio-display-nano", name: "Studio Display (Nano-texture glass)", category: "DISPLAY", priceUSD: 1899, year: 2022 },
  { slug: "pro-display-xdr", name: "Pro Display XDR", category: "DISPLAY", priceUSD: 4999, year: 2019 },
  { slug: "pro-display-xdr-nano", name: "Pro Display XDR (Nano-texture glass)", category: "DISPLAY", priceUSD: 5999, year: 2019 },

  // ---------------------------------------------------------- Apple TV & Home
  { slug: "apple-tv-4k-128", name: "Apple TV 4K (128GB, Wi-Fi + Ethernet)", category: "TV_HOME", priceUSD: 149, year: 2022 },
  { slug: "apple-tv-4k-64", name: "Apple TV 4K (64GB)", category: "TV_HOME", priceUSD: 129, year: 2022 },
  { slug: "homepod-2", name: "HomePod (2nd generation)", category: "TV_HOME", priceUSD: 299, year: 2023 },
  { slug: "homepod-1", name: "HomePod (1st generation)", category: "TV_HOME", priceUSD: 349, year: 2018 },
  { slug: "homepod-mini", name: "HomePod mini", category: "TV_HOME", priceUSD: 99, year: 2020 },

  // ----------------------------------------------------------- Accessories
  { slug: "magic-keyboard-touch-id-numeric", name: "Magic Keyboard with Touch ID and Numeric Keypad", category: "ACCESSORY", priceUSD: 179, year: 2021 },
  { slug: "magic-keyboard-touch-id", name: "Magic Keyboard with Touch ID", category: "ACCESSORY", priceUSD: 149, year: 2021 },
  { slug: "magic-keyboard", name: "Magic Keyboard", category: "ACCESSORY", priceUSD: 99, year: 2021 },
  { slug: "magic-mouse-usb-c", name: "Magic Mouse (USB-C)", category: "ACCESSORY", priceUSD: 79, year: 2024 },
  { slug: "magic-mouse", name: "Magic Mouse", category: "ACCESSORY", priceUSD: 79, year: 2021 },
  { slug: "magic-trackpad-usb-c", name: "Magic Trackpad (USB-C)", category: "ACCESSORY", priceUSD: 129, year: 2024 },
  { slug: "magic-trackpad", name: "Magic Trackpad", category: "ACCESSORY", priceUSD: 129, year: 2021 },
  { slug: "apple-pencil-pro", name: "Apple Pencil Pro", category: "ACCESSORY", priceUSD: 129, year: 2024 },
  { slug: "apple-pencil-usb-c", name: "Apple Pencil (USB-C)", category: "ACCESSORY", priceUSD: 79, year: 2023 },
  { slug: "apple-pencil-2", name: "Apple Pencil (2nd generation)", category: "ACCESSORY", priceUSD: 129, year: 2018 },
  { slug: "apple-pencil-1", name: "Apple Pencil (1st generation)", category: "ACCESSORY", priceUSD: 99, year: 2015 },
  { slug: "magic-keyboard-ipad-pro-13", name: 'Magic Keyboard for iPad Pro 13"', category: "ACCESSORY", priceUSD: 349, year: 2024 },
  { slug: "magic-keyboard-ipad-pro-11", name: 'Magic Keyboard for iPad Pro 11"', category: "ACCESSORY", priceUSD: 299, year: 2024 },
  { slug: "airtag-4-pack", name: "AirTag (4 pack)", category: "ACCESSORY", priceUSD: 99, year: 2021 },
  { slug: "airtag", name: "AirTag", category: "ACCESSORY", priceUSD: 29, year: 2021 },
  { slug: "magsafe-charger", name: "MagSafe Charger", category: "ACCESSORY", priceUSD: 39, year: 2020 },
  { slug: "vesa-mount-adapter", name: "VESA Mount Adapter for Studio Display", category: "ACCESSORY", priceUSD: 199, year: 2022 },
  { slug: "pro-stand", name: "Pro Stand", category: "ACCESSORY", priceUSD: 999, year: 2019 },
  { slug: "siri-remote-3", name: "Siri Remote (3rd generation)", category: "ACCESSORY", priceUSD: 59, year: 2022 },
  { slug: "vision-pro-travel-case", name: "Apple Vision Pro Travel Case", category: "ACCESSORY", priceUSD: 199, year: 2024 },
  { slug: "power-adapter-140w", name: "140W USB-C Power Adapter", category: "ACCESSORY", priceUSD: 99, year: 2021 },
  { slug: "thunderbolt-4-pro-cable", name: "Thunderbolt 4 Pro Cable (1 m)", category: "ACCESSORY", priceUSD: 69, year: 2021 },
  { slug: "apple-watch-milanese-loop", name: "Apple Watch Milanese Loop", category: "ACCESSORY", priceUSD: 99, year: 2015 },
  { slug: "apple-watch-ocean-band", name: "Apple Watch Ocean Band", category: "ACCESSORY", priceUSD: 99, year: 2022 },
  { slug: "apple-watch-fast-charger", name: "Apple Watch Magnetic Fast Charger", category: "ACCESSORY", priceUSD: 29, year: 2022 },
  { slug: "polishing-cloth", name: "Polishing Cloth", category: "ACCESSORY", priceUSD: 19, year: 2021 },
];
