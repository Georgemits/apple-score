import type { SeedProduct } from "./products";

/**
 * Discontinued and vintage Apple hardware.
 *
 * Prices are US launch MSRPs for the base configuration, as with the current
 * catalogue. Two caveats worth knowing:
 *
 * 1. iPhones from the 3G through the 5s were sold at carrier-subsidised prices
 *    ($199/$299 with a two-year contract). Those are the figures quoted here,
 *    because they are the prices Apple announced and the ones people remember —
 *    but they are not comparable to today's unsubsidised pricing. The original
 *    2007 iPhone is listed at its unsubsidised $599.
 * 2. Pre-1990 machines are listed at their original dollar prices, not adjusted
 *    for inflation. A $2,495 Macintosh 128K in 1984 is roughly $7,500 today, so
 *    a vintage collection scores lower than it "should". Deliberate: the score
 *    is defined as sticker price, and mixing in inflation adjustments would make
 *    it much harder to reason about.
 */
export const LEGACY_PRODUCTS: SeedProduct[] = [
  // ------------------------------------------------- Classic / pre-Macintosh
  { slug: "apple-i", name: "Apple I", category: "CLASSIC", priceUSD: 666, year: 1976, legacy: true },
  { slug: "apple-ii", name: "Apple II", category: "CLASSIC", priceUSD: 1298, year: 1977, legacy: true },
  { slug: "apple-iii", name: "Apple III", category: "CLASSIC", priceUSD: 4340, year: 1980, legacy: true },
  { slug: "apple-lisa", name: "Apple Lisa", category: "CLASSIC", priceUSD: 9995, year: 1983, legacy: true },
  { slug: "newton-messagepad", name: "Newton MessagePad", category: "CLASSIC", priceUSD: 699, year: 1993, legacy: true },
  { slug: "quicktake-100", name: "Apple QuickTake 100", category: "CLASSIC", priceUSD: 749, year: 1994, legacy: true },
  { slug: "emate-300", name: "eMate 300", category: "CLASSIC", priceUSD: 799, year: 1997, legacy: true },

  // ------------------------------------------------------------ Classic Macs
  { slug: "macintosh-128k", name: "Macintosh 128K", category: "MAC", priceUSD: 2495, year: 1984, legacy: true },
  { slug: "macintosh-512k", name: "Macintosh 512K", category: "MAC", priceUSD: 2795, year: 1984, legacy: true },
  { slug: "macintosh-plus", name: "Macintosh Plus", category: "MAC", priceUSD: 2599, year: 1986, legacy: true },
  { slug: "macintosh-se", name: "Macintosh SE", category: "MAC", priceUSD: 2900, year: 1987, legacy: true },
  { slug: "macintosh-ii", name: "Macintosh II", category: "MAC", priceUSD: 5498, year: 1987, legacy: true },
  { slug: "powerbook-100", name: "PowerBook 100", category: "MAC", priceUSD: 2500, year: 1991, legacy: true },
  { slug: "power-macintosh-6100", name: "Power Macintosh 6100", category: "MAC", priceUSD: 1819, year: 1994, legacy: true },
  { slug: "twentieth-anniversary-mac", name: "Twentieth Anniversary Macintosh", category: "MAC", priceUSD: 7499, year: 1997, legacy: true },
  { slug: "imac-g3", name: "iMac G3", category: "MAC", priceUSD: 1299, year: 1998, legacy: true },
  { slug: "ibook-g3-clamshell", name: "iBook G3 (Clamshell)", category: "MAC", priceUSD: 1599, year: 1999, legacy: true },
  { slug: "power-mac-g4-cube", name: "Power Mac G4 Cube", category: "MAC", priceUSD: 1799, year: 2000, legacy: true },
  { slug: "powerbook-g4-titanium", name: "PowerBook G4 (Titanium)", category: "MAC", priceUSD: 2599, year: 2001, legacy: true },
  { slug: "imac-g4", name: "iMac G4", category: "MAC", priceUSD: 1299, year: 2002, legacy: true },
  { slug: "emac", name: "eMac", category: "MAC", priceUSD: 1099, year: 2002, legacy: true },
  { slug: "power-mac-g5", name: "Power Mac G5", category: "MAC", priceUSD: 1999, year: 2003, legacy: true },
  { slug: "imac-g5", name: "iMac G5", category: "MAC", priceUSD: 1299, year: 2004, legacy: true },
  { slug: "mac-mini-g4", name: "Mac mini (G4)", category: "MAC", priceUSD: 499, year: 2005, legacy: true },
  { slug: "macbook-pro-15-2006", name: 'MacBook Pro 15" (Intel, 2006)', category: "MAC", priceUSD: 1999, year: 2006, legacy: true },
  { slug: "macbook-2006", name: "MacBook (2006)", category: "MAC", priceUSD: 1099, year: 2006, legacy: true },
  { slug: "imac-intel-2006", name: "iMac (Intel, 2006)", category: "MAC", priceUSD: 1299, year: 2006, legacy: true },
  { slug: "mac-pro-2006", name: "Mac Pro (2006)", category: "MAC", priceUSD: 2499, year: 2006, legacy: true },
  { slug: "macbook-air-2008", name: "MacBook Air (2008)", category: "MAC", priceUSD: 1799, year: 2008, legacy: true },
  { slug: "macbook-air-11-2010", name: 'MacBook Air 11" (2010)', category: "MAC", priceUSD: 999, year: 2010, legacy: true },
  { slug: "mac-pro-2013", name: "Mac Pro (2013)", category: "MAC", priceUSD: 2999, year: 2013, legacy: true },
  { slug: "macbook-12-retina", name: 'MacBook 12" (Retina)', category: "MAC", priceUSD: 1299, year: 2015, legacy: true },
  { slug: "macbook-pro-13-touch-bar-2016", name: 'MacBook Pro 13" (Touch Bar, 2016)', category: "MAC", priceUSD: 1799, year: 2016, legacy: true },
  { slug: "imac-pro", name: "iMac Pro", category: "MAC", priceUSD: 4999, year: 2017, legacy: true },
  { slug: "mac-pro-2019", name: "Mac Pro (2019, Intel)", category: "MAC", priceUSD: 5999, year: 2019, legacy: true },
  { slug: "macbook-pro-16-2019", name: 'MacBook Pro 16" (Intel, 2019)', category: "MAC", priceUSD: 2399, year: 2019, legacy: true },

  // ------------------------------------------------------------------- iPods
  { slug: "ipod-1st-gen", name: "iPod (1st generation)", category: "IPOD", priceUSD: 399, year: 2001, legacy: true },
  { slug: "ipod-mini", name: "iPod mini", category: "IPOD", priceUSD: 249, year: 2004, legacy: true },
  { slug: "ipod-photo", name: "iPod photo", category: "IPOD", priceUSD: 499, year: 2004, legacy: true },
  { slug: "ipod-shuffle-1st-gen", name: "iPod shuffle (1st generation)", category: "IPOD", priceUSD: 99, year: 2005, legacy: true },
  { slug: "ipod-nano-1st-gen", name: "iPod nano (1st generation)", category: "IPOD", priceUSD: 199, year: 2005, legacy: true },
  { slug: "ipod-5th-gen-video", name: "iPod (5th generation, Video)", category: "IPOD", priceUSD: 299, year: 2005, legacy: true },
  { slug: "ipod-hi-fi", name: "iPod Hi-Fi", category: "IPOD", priceUSD: 349, year: 2006, legacy: true },
  { slug: "ipod-touch-1st-gen", name: "iPod touch (1st generation)", category: "IPOD", priceUSD: 299, year: 2007, legacy: true },
  { slug: "ipod-classic-160", name: "iPod classic (160GB)", category: "IPOD", priceUSD: 349, year: 2007, legacy: true },
  { slug: "ipod-shuffle-4th-gen", name: "iPod shuffle (4th generation)", category: "IPOD", priceUSD: 49, year: 2010, legacy: true },
  { slug: "ipod-nano-7th-gen", name: "iPod nano (7th generation)", category: "IPOD", priceUSD: 149, year: 2012, legacy: true },
  { slug: "ipod-touch-7th-gen", name: "iPod touch (7th generation)", category: "IPOD", priceUSD: 199, year: 2019, legacy: true },

  // ---------------------------------------------------------- Legacy iPhones
  { slug: "iphone-1st-gen", name: "iPhone (1st generation)", category: "IPHONE", priceUSD: 599, year: 2007, legacy: true },
  { slug: "iphone-3g", name: "iPhone 3G", category: "IPHONE", priceUSD: 199, year: 2008, legacy: true },
  { slug: "iphone-3gs", name: "iPhone 3GS", category: "IPHONE", priceUSD: 199, year: 2009, legacy: true },
  { slug: "iphone-4", name: "iPhone 4", category: "IPHONE", priceUSD: 199, year: 2010, legacy: true },
  { slug: "iphone-4s", name: "iPhone 4S", category: "IPHONE", priceUSD: 199, year: 2011, legacy: true },
  { slug: "iphone-5", name: "iPhone 5", category: "IPHONE", priceUSD: 199, year: 2012, legacy: true },
  { slug: "iphone-5c", name: "iPhone 5c", category: "IPHONE", priceUSD: 99, year: 2013, legacy: true },
  { slug: "iphone-5s", name: "iPhone 5s", category: "IPHONE", priceUSD: 199, year: 2013, legacy: true },
  { slug: "iphone-6", name: "iPhone 6", category: "IPHONE", priceUSD: 649, year: 2014, legacy: true },
  { slug: "iphone-6-plus", name: "iPhone 6 Plus", category: "IPHONE", priceUSD: 749, year: 2014, legacy: true },
  { slug: "iphone-6s", name: "iPhone 6s", category: "IPHONE", priceUSD: 649, year: 2015, legacy: true },
  { slug: "iphone-6s-plus", name: "iPhone 6s Plus", category: "IPHONE", priceUSD: 749, year: 2015, legacy: true },
  { slug: "iphone-se-1", name: "iPhone SE (1st generation)", category: "IPHONE", priceUSD: 399, year: 2016, legacy: true },
  { slug: "iphone-7", name: "iPhone 7", category: "IPHONE", priceUSD: 649, year: 2016, legacy: true },
  { slug: "iphone-7-plus", name: "iPhone 7 Plus", category: "IPHONE", priceUSD: 769, year: 2016, legacy: true },
  { slug: "iphone-8", name: "iPhone 8", category: "IPHONE", priceUSD: 699, year: 2017, legacy: true },
  { slug: "iphone-8-plus", name: "iPhone 8 Plus", category: "IPHONE", priceUSD: 799, year: 2017, legacy: true },
  { slug: "iphone-x", name: "iPhone X", category: "IPHONE", priceUSD: 999, year: 2017, legacy: true },
  { slug: "iphone-xr", name: "iPhone XR", category: "IPHONE", priceUSD: 749, year: 2018, legacy: true },
  { slug: "iphone-xs", name: "iPhone XS", category: "IPHONE", priceUSD: 999, year: 2018, legacy: true },
  { slug: "iphone-xs-max", name: "iPhone XS Max", category: "IPHONE", priceUSD: 1099, year: 2018, legacy: true },

  // ------------------------------------------------------------ Legacy iPads
  { slug: "ipad-1st-gen", name: "iPad (1st generation)", category: "IPAD", priceUSD: 499, year: 2010, legacy: true },
  { slug: "ipad-2", name: "iPad 2", category: "IPAD", priceUSD: 499, year: 2011, legacy: true },
  { slug: "ipad-3", name: "iPad (3rd generation)", category: "IPAD", priceUSD: 499, year: 2012, legacy: true },
  { slug: "ipad-mini-1", name: "iPad mini (1st generation)", category: "IPAD", priceUSD: 329, year: 2012, legacy: true },
  { slug: "ipad-4", name: "iPad (4th generation)", category: "IPAD", priceUSD: 499, year: 2012, legacy: true },
  { slug: "ipad-air-1", name: "iPad Air", category: "IPAD", priceUSD: 499, year: 2013, legacy: true },
  { slug: "ipad-air-2", name: "iPad Air 2", category: "IPAD", priceUSD: 499, year: 2014, legacy: true },
  { slug: "ipad-pro-12-9-2015", name: 'iPad Pro 12.9" (1st generation)', category: "IPAD", priceUSD: 799, year: 2015, legacy: true },
  { slug: "ipad-pro-9-7-2016", name: 'iPad Pro 9.7"', category: "IPAD", priceUSD: 599, year: 2016, legacy: true },

  // ----------------------------------------------------- Legacy Apple Watch
  { slug: "apple-watch-1st-gen", name: "Apple Watch (1st generation)", category: "WATCH", priceUSD: 349, year: 2015, legacy: true },
  { slug: "apple-watch-edition-gold", name: "Apple Watch Edition (18-carat gold)", category: "WATCH", priceUSD: 10000, year: 2015, legacy: true },
  { slug: "apple-watch-series-1", name: "Apple Watch Series 1", category: "WATCH", priceUSD: 269, year: 2016, legacy: true },
  { slug: "apple-watch-series-2", name: "Apple Watch Series 2", category: "WATCH", priceUSD: 369, year: 2016, legacy: true },
  { slug: "apple-watch-series-3", name: "Apple Watch Series 3", category: "WATCH", priceUSD: 329, year: 2017, legacy: true },
  { slug: "apple-watch-series-4", name: "Apple Watch Series 4", category: "WATCH", priceUSD: 399, year: 2018, legacy: true },
  { slug: "apple-watch-series-5", name: "Apple Watch Series 5", category: "WATCH", priceUSD: 399, year: 2019, legacy: true },
  { slug: "apple-watch-se-1", name: "Apple Watch SE (1st generation)", category: "WATCH", priceUSD: 279, year: 2020, legacy: true },
  { slug: "apple-watch-series-6", name: "Apple Watch Series 6", category: "WATCH", priceUSD: 399, year: 2020, legacy: true },
  { slug: "apple-watch-series-7", name: "Apple Watch Series 7", category: "WATCH", priceUSD: 399, year: 2021, legacy: true },

  // ---------------------------------------------------------- Legacy AirPods
  { slug: "airpods-1st-gen", name: "AirPods (1st generation)", category: "AIRPODS", priceUSD: 159, year: 2016, legacy: true },
  { slug: "airpods-pro-1st-gen", name: "AirPods Pro (1st generation)", category: "AIRPODS", priceUSD: 249, year: 2019, legacy: true },

  // --------------------------------------------------------- Legacy displays
  { slug: "apple-studio-display-crt", name: 'Apple Studio Display 21" (CRT)', category: "DISPLAY", priceUSD: 1999, year: 1998, legacy: true },
  { slug: "apple-cinema-display-30", name: 'Apple Cinema HD Display 30"', category: "DISPLAY", priceUSD: 3299, year: 2004, legacy: true },
  { slug: "led-cinema-display-24", name: 'LED Cinema Display 24"', category: "DISPLAY", priceUSD: 899, year: 2008, legacy: true },
  { slug: "thunderbolt-display-27", name: 'Thunderbolt Display 27"', category: "DISPLAY", priceUSD: 999, year: 2011, legacy: true },

  // ------------------------------------------------------ Legacy TV and home
  { slug: "apple-tv-1st-gen", name: "Apple TV (1st generation)", category: "TV_HOME", priceUSD: 299, year: 2007, legacy: true },
  { slug: "apple-tv-2nd-gen", name: "Apple TV (2nd generation)", category: "TV_HOME", priceUSD: 99, year: 2010, legacy: true },
  { slug: "apple-tv-3rd-gen", name: "Apple TV (3rd generation)", category: "TV_HOME", priceUSD: 99, year: 2012, legacy: true },
  { slug: "apple-tv-hd", name: "Apple TV HD (4th generation)", category: "TV_HOME", priceUSD: 149, year: 2015, legacy: true },

  // ------------------------------------------------------ Legacy accessories
  { slug: "apple-mighty-mouse", name: "Mighty Mouse", category: "ACCESSORY", priceUSD: 49, year: 2005, legacy: true },
  { slug: "airport-express-1st-gen", name: "AirPort Express (1st generation)", category: "ACCESSORY", priceUSD: 129, year: 2004, legacy: true },
  { slug: "airport-extreme", name: "AirPort Extreme", category: "ACCESSORY", priceUSD: 199, year: 2007, legacy: true },
  { slug: "time-capsule", name: "Time Capsule", category: "ACCESSORY", priceUSD: 299, year: 2008, legacy: true },
  { slug: "isight", name: "iSight", category: "ACCESSORY", priceUSD: 149, year: 2003, legacy: true },
  { slug: "magic-mouse-1st-gen", name: "Magic Mouse (1st generation)", category: "ACCESSORY", priceUSD: 69, year: 2009, legacy: true },
  { slug: "apple-wireless-keyboard", name: "Apple Wireless Keyboard", category: "ACCESSORY", priceUSD: 69, year: 2007, legacy: true },
  { slug: "magsafe-duo-charger", name: "MagSafe Duo Charger", category: "ACCESSORY", priceUSD: 129, year: 2020, legacy: true },
  { slug: "apple-battery-charger", name: "Apple Battery Charger", category: "ACCESSORY", priceUSD: 29, year: 2010, legacy: true },
  { slug: "apple-remote", name: "Apple Remote (aluminium)", category: "ACCESSORY", priceUSD: 19, year: 2009, legacy: true },
];
