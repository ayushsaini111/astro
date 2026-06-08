// data/products.js

export const PRODUCT_CATEGORIES = [
  "All",
  "Rudraksha",
  "Gemstones",
  "Bracelets",
  "Idols",
  "Spiritual Items"
];

export const ALL_PRODUCTS = [
  {
    id: 1,
    title: "5 Mukhi Rudraksha Bracelet",
    shortDescription: "For peace and prosperity",
    description: "Authentic 5 Mukhi Rudraksha bracelet blessed by pandits. Promotes inner peace, reduces stress, and enhances spiritual growth.",
    longDescription: "This sacred 5 Mukhi Rudraksha bracelet is carefully crafted with premium quality beads sourced from Nepal. Each bead represents Lord Shiva and is known for bringing peace, prosperity, and positive energy. Worn on the wrist, it helps balance the five elements in the body and promotes overall well-being.",
    category: "Rudraksha",
    price: 499,
    originalPrice: 799,
    rating: 4.8,
    reviews: 234,
    image: "/Products/product-1.png",
    images: ["/Products/product-1.png", "/Products/product-1.png", "/Products/product-1.png"],
    inStock: true,
    benefits: [
      "Reduces stress and anxiety",
      "Enhances focus and concentration",
      "Brings peace and prosperity",
      "Balances chakras",
      "Authentic Nepal origin"
    ],
    specifications: {
      material: "Genuine Rudraksha beads",
      size: "Adjustable (6-8 inches)",
      beadCount: "27 beads",
      origin: "Nepal",
      certification: "Lab certified"
    },
    testimonials: [
      {
        name: "Priya Sharma",
        location: "Mumbai",
        rating: 5,
        text: "Absolutely authentic! I can feel the positive energy. Highly recommended.",
        date: "2024-01-15"
      },
      {
        name: "Rajesh Kumar",
        location: "Delhi",
        rating: 5,
        text: "Great quality and fast delivery. The bracelet is beautiful and genuine.",
        date: "2024-01-10"
      }
    ]
  },
  {
    id: 2,
    title: "Blue Sapphire Gemstone",
    shortDescription: "For wisdom and prosperity",
    description: "Natural blue sapphire gemstone certified for astrological benefits.",
    longDescription: "This stunning natural blue sapphire (Neelam) is certified and energized for maximum astrological benefits. Known to bring wealth, wisdom, and protection from negative energies.",
    category: "Gemstones",
    price: 2499,
    originalPrice: 3999,
    rating: 4.9,
    reviews: 156,
    image: "/Products/product-1.png",
    images: ["/Products/product-1.png", "/Products/product-1.png"],
    inStock: true,
    benefits: [
      "Attracts wealth and prosperity",
      "Enhances mental clarity",
      "Protects from negative energies",
      "Strengthens Saturn (Shani)",
      "Lab certified authenticity"
    ],
    specifications: {
      weight: "3-5 carats",
      origin: "Sri Lanka",
      treatment: "None (Natural)",
      certification: "IGI Certified",
      metal: "Silver setting"
    },
    testimonials: [
      {
        name: "Amit Verma",
        location: "Bangalore",
        rating: 5,
        text: "Genuine gemstone! My luck changed after wearing this. Thank you!",
        date: "2024-01-12"
      }
    ]
  },
  {
    id: 3,
    title: "7 Chakra Healing Bracelet",
    shortDescription: "Balance your energy centers",
    description: "Multi-stone bracelet aligned with seven chakras for holistic healing.",
    longDescription: "This powerful 7 chakra bracelet combines seven different natural gemstones, each representing one of the body's energy centers. Wear it to balance your chakras and promote physical, emotional, and spiritual wellness.",
    category: "Bracelets",
    price: 699,
    originalPrice: 1099,
    rating: 4.7,
    reviews: 189,
    image: "/Products/product-1.png",
    images: ["/Products/product-1.png"],
    inStock: true,
    benefits: [
      "Balances all 7 chakras",
      "Promotes emotional healing",
      "Enhances meditation",
      "Natural gemstones",
      "Adjustable size"
    ],
    specifications: {
      stones: "Amethyst, Lapis, Turquoise, Green Aventurine, Citrine, Carnelian, Red Jasper",
      size: "Adjustable",
      material: "Natural stones + elastic cord",
      beadSize: "8mm"
    },
    testimonials: []
  },
  {
    id: 4,
    title: "Brass Ganesha Idol",
    shortDescription: "Remove obstacles from life",
    description: "Handcrafted brass Ganesha idol for home temple and spiritual practice.",
    longDescription: "Beautiful handcrafted brass idol of Lord Ganesha, the remover of obstacles. Perfect for your home temple or office. Each piece is crafted by skilled artisans with devotion.",
    category: "Idols",
    price: 899,
    originalPrice: 1499,
    rating: 4.9,
    reviews: 312,
    image: "/Products/product-1.png",
    images: ["/Products/product-1.png"],
    inStock: true,
    benefits: [
      "Removes obstacles",
      "Brings prosperity",
      "Handcrafted quality",
      "Spiritual ambiance",
      "Perfect for gifting"
    ],
    specifications: {
      material: "Pure brass",
      height: "6 inches",
      weight: "500 grams",
      finish: "Antique gold",
      origin: "India"
    },
    testimonials: [
      {
        name: "Sneha Patel",
        location: "Ahmedabad",
        rating: 5,
        text: "Beautiful craftsmanship! The idol looks divine in my home temple.",
        date: "2024-01-08"
      }
    ]
  }
];