import { SeasonalEvent } from "./seasonal-types";

// Static seed calendar for Malaysia and Global commercial events
export const SEASONAL_EVENTS: SeasonalEvent[] = [
  // January
  {
    id: "new_year_fitness",
    name: "New Year Fitness Season",
    scope: "Global",
    month: 1,
    approximateDate: "Early January",
    description: "Global surge in fitness and health resolutions.",
    defaultCategories: ["Fitness", "Health Supplements", "Sportswear"],
  },
  {
    id: "cny_prep",
    name: "Chinese New Year",
    scope: "Malaysia",
    month: 1, // Can fall in Jan or Feb, using Jan for prep
    approximateDate: "Late January / Early February",
    description: "Major cultural holiday driving gifting, apparel, and home decor.",
    defaultCategories: ["Decorations", "Fashion", "Home Cleaning", "Gifting", "Snacks"],
  },
  {
    id: "back_to_school_mar",
    name: "Back to School (March)",
    scope: "Malaysia",
    month: 2, // Prep starts in Feb
    approximateDate: "Late Feb / Early March",
    description: "Malaysian public school academic year start (historically March shift).",
    defaultCategories: ["School Supplies", "Bags", "Uniforms", "Stationery"],
  },
  
  // February
  {
    id: "valentines_day",
    name: "Valentine's Day",
    scope: "Global",
    month: 2,
    approximateDate: "February 14",
    description: "Global romantic gifting occasion.",
    defaultCategories: ["Gifting", "Jewelry", "Beauty", "Chocolates"],
  },

  // March
  {
    id: "ramadan_start",
    name: "Ramadan",
    scope: "Malaysia",
    month: 3,
    approximateDate: "March / April",
    description: "Month of fasting leading to high consumption in food, modest fashion, and home prep.",
    defaultCategories: ["Muslim Fashion", "Home Decor", "Kitchenware", "Food & Snacks", "Dates"],
  },

  // April
  {
    id: "hari_raya_aidilfitri",
    name: "Hari Raya Aidilfitri",
    scope: "Malaysia",
    month: 4,
    approximateDate: "April",
    description: "Major celebration marking the end of Ramadan. Peak shopping season.",
    defaultCategories: ["Baju Melayu", "Baju Kurung", "Raya Cookies", "Fragrance", "Home Decor"],
  },

  // May
  {
    id: "mothers_day",
    name: "Mother's Day",
    scope: "Global",
    month: 5,
    approximateDate: "Mid May",
    description: "Gifting occasion honoring mothers.",
    defaultCategories: ["Gifting", "Beauty", "Jewelry", "Small Appliances"],
  },

  // June
  {
    id: "hari_raya_haji",
    name: "Hari Raya Haji",
    scope: "Malaysia",
    month: 6,
    approximateDate: "June",
    description: "Festival of Sacrifice. Modest celebrations and family gatherings.",
    defaultCategories: ["Muslim Fashion", "Cookware", "Travel"],
  },
  {
    id: "mid_year_sales",
    name: "Mid-Year Mega Sales (6.6 / 7.7)",
    scope: "Shopping",
    month: 6,
    approximateDate: "June - July",
    description: "E-commerce platform mid-year push.",
    defaultCategories: ["Electronics", "Fashion", "Home & Living", "Beauty"],
  },

  // July
  {
    id: "summer_travel",
    name: "Summer / Mid-Year Travel",
    scope: "Global",
    month: 7,
    approximateDate: "July - August",
    description: "Peak travel season globally and regionally.",
    defaultCategories: ["Travel Accessories", "Luggage", "Summer Fashion", "Outdoor"],
  },

  // August
  {
    id: "merdeka_day",
    name: "Merdeka Day",
    scope: "Malaysia",
    month: 8,
    approximateDate: "August 31",
    description: "Malaysia's Independence Day.",
    defaultCategories: ["Patriotic Merchandise", "Flags", "Local Fashion", "Event Decorations"],
  },

  // September
  {
    id: "malaysia_day",
    name: "Malaysia Day",
    scope: "Malaysia",
    month: 9,
    approximateDate: "September 16",
    description: "Celebration of the establishment of the Malaysian federation.",
    defaultCategories: ["Travel", "Local Fashion"],
  },
  {
    id: "99_sale",
    name: "9.9 Super Shopping Day",
    scope: "Shopping",
    month: 9,
    approximateDate: "September 9",
    description: "Kickoff of the Q4 mega e-commerce sales festivals.",
    defaultCategories: ["Beauty", "Gadgets", "Household Items", "Small Appliances"],
  },

  // October
  {
    id: "1010_sale",
    name: "10.10 Sale",
    scope: "Shopping",
    month: 10,
    approximateDate: "October 10",
    description: "Continuation of Q4 e-commerce sales.",
    defaultCategories: ["Home & Living", "Electronics", "Fashion"],
  },
  {
    id: "deepavali",
    name: "Deepavali",
    scope: "Malaysia",
    month: 10,
    approximateDate: "Late Oct / Early Nov",
    description: "Festival of Lights celebrated by the Indian community.",
    defaultCategories: ["Ethnic Wear", "Home Decor", "Lighting", "Sweets", "Gifting"],
  },
  {
    id: "halloween",
    name: "Halloween",
    scope: "Global",
    month: 10,
    approximateDate: "October 31",
    description: "Global spooky festival driving costumes and decor.",
    defaultCategories: ["Costumes", "Decorations", "Candy", "Party Supplies"],
  },

  // November
  {
    id: "1111_sale",
    name: "11.11 Singles Day",
    scope: "Shopping",
    month: 11,
    approximateDate: "November 11",
    description: "The biggest e-commerce shopping festival of the year.",
    defaultCategories: ["Electronics", "Beauty", "Home Appliances", "Fashion"],
  },
  {
    id: "monsoon_season",
    name: "Monsoon Season",
    scope: "Malaysia",
    month: 11,
    approximateDate: "Nov - Jan",
    description: "Heavy rainfall season in Malaysia, especially East Coast.",
    defaultCategories: ["Raincoats", "Umbrellas", "Waterproof Bags", "Shoe Covers", "Car Accessories"],
  },
  {
    id: "black_friday",
    name: "Black Friday / Cyber Monday",
    scope: "Global",
    month: 11,
    approximateDate: "Late November",
    description: "Global mega discount weekend.",
    defaultCategories: ["Gadgets", "Software", "Electronics", "Fashion"],
  },

  // December
  {
    id: "1212_sale",
    name: "12.12 Year End Sale",
    scope: "Shopping",
    month: 12,
    approximateDate: "December 12",
    description: "Final e-commerce clearance of the year.",
    defaultCategories: ["Clearance", "Gifting", "Fashion", "Beauty"],
  },
  {
    id: "christmas",
    name: "Christmas",
    scope: "Malaysia",
    month: 12,
    approximateDate: "December 25",
    description: "Major global and local holiday driving massive gifting.",
    defaultCategories: ["Gifting", "Toys", "Decorations", "Electronics", "Party Supplies"],
  },
];

export function getMalaysiaHolidayCalendar(year: number): SeasonalEvent[] {
  // In the future, this can call an external API (like Google Calendar API)
  // For now, it returns the static list which is highly relevant for commerce.
  return SEASONAL_EVENTS;
}
