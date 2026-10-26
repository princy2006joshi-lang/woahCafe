const menuItems = [
  {
    name: 'Classic Veg Burger',
    category: 'Burgers',
    description: 'Crisp vegetable patty with lettuce and house sauce. Ready in about 8 minutes.',
    price: 89,
  },
  {
    name: 'Aloo Tikki Burger',
    category: 'Burgers',
    description: 'Spiced potato patty with fresh onion and tangy sauce. Ready in about 8 minutes.',
    price: 79,
  },
  {
    name: 'Veg Cheese Burger',
    category: 'Burgers',
    description: 'Vegetable patty topped with melted cheese and lettuce. Ready in about 9 minutes.',
    price: 109,
  },
  {
    name: 'Paneer Burger',
    category: 'Burgers',
    description: 'Grilled paneer with crunchy vegetables and mint mayo. Ready in about 9 minutes.',
    price: 119,
  },
  {
    name: 'Double Cheese Burger',
    category: 'Burgers',
    description: 'Crisp veg patty with extra cheese and house sauce. Ready in about 10 minutes.',
    price: 129,
  },
  {
    name: 'Veg Cheese Sandwich',
    category: 'Sandwiches',
    description: 'Toasted bread with vegetables and melted cheese. Ready in about 7 minutes.',
    price: 79,
  },
  {
    name: 'Grilled Veg Sandwich',
    category: 'Sandwiches',
    description: 'Grilled seasonal vegetables with a light herb spread. Ready in about 7 minutes.',
    price: 69,
  },
  {
    name: 'Paneer Tikka Sandwich',
    category: 'Sandwiches',
    description: 'Spiced paneer, onion and capsicum in toasted bread. Ready in about 9 minutes.',
    price: 99,
  },
  {
    name: 'Corn Cheese Sandwich',
    category: 'Sandwiches',
    description: 'Sweet corn and cheese in a golden toasted sandwich. Ready in about 8 minutes.',
    price: 89,
  },
  {
    name: 'Masala Aloo Sandwich',
    category: 'Sandwiches',
    description: 'Seasoned potato filling with a crisp toasted finish. Ready in about 7 minutes.',
    price: 65,
  },
  {
    name: 'Masala Chai',
    category: 'Beverages',
    description: 'Freshly brewed tea with warming spices. Ready in about 5 minutes.',
    price: 25,
  },
  {
    name: 'Hot Coffee',
    category: 'Beverages',
    description: 'A freshly prepared cup of smooth hot coffee. Ready in about 5 minutes.',
    price: 35,
  },
  {
    name: 'Cold Coffee',
    category: 'Beverages',
    description: 'Chilled coffee blended with milk. Ready in about 6 minutes.',
    price: 69,
  },
  {
    name: 'Lemon Soda',
    category: 'Beverages',
    description: 'Refreshing lemon soda, served chilled. Ready in about 3 minutes.',
    price: 39,
  },
  {
    name: 'Hot Chocolate',
    category: 'Beverages',
    description: 'Warm, creamy chocolate made fresh to order. Ready in about 6 minutes.',
    price: 59,
  },
  {
    name: 'Classic Masala Maggi',
    category: 'Maggis',
    description: 'Noodles cooked with a quick, savoury masala. Ready in about 7 minutes.',
    price: 49,
  },
  {
    name: 'Egg Maggi',
    category: 'Maggis',
    description: 'Masala noodles tossed with a freshly cooked egg. Ready in about 8 minutes.',
    price: 69,
  },
  {
    name: 'Cheese Maggi',
    category: 'Maggis',
    description: 'Warm masala noodles finished with melted cheese. Ready in about 8 minutes.',
    price: 69,
  },
  {
    name: 'Vegetable Maggi',
    category: 'Maggis',
    description: 'Masala noodles with a mix of quick-cooked vegetables. Ready in about 8 minutes.',
    price: 59,
  },
  {
    name: 'Paneer Maggi',
    category: 'Maggis',
    description: 'Masala noodles topped with lightly spiced paneer. Ready in about 9 minutes.',
    price: 79,
  },
  {
    name: 'Aloo Tikki Roll',
    category: 'Rolls',
    description: 'Spiced potato tikki rolled with onion and chutney. Ready in about 8 minutes.',
    price: 69,
  },
  {
    name: 'Paneer Roll',
    category: 'Rolls',
    description: 'Grilled paneer and crunchy salad wrapped in a soft roll. Ready in about 9 minutes.',
    price: 99,
  },
  {
    name: 'Veg Cheese Roll',
    category: 'Rolls',
    description: 'Sautéed vegetables and melted cheese in a toasted wrap. Ready in about 8 minutes.',
    price: 89,
  },
  {
    name: 'Egg Roll',
    category: 'Rolls',
    description: 'Fresh egg wrapped with onion and a light house sauce. Ready in about 7 minutes.',
    price: 69,
  },
  {
    name: 'Double Egg Roll',
    category: 'Rolls',
    description: 'Two freshly cooked eggs with salad in a warm roll. Ready in about 9 minutes.',
    price: 89,
  },
  {
    name: 'Classic Masala Omelette',
    category: 'Omelettes',
    description: 'Two-egg omelette with onion, tomato and green chilli. Ready in about 7 minutes.',
    price: 59,
  },
  {
    name: 'Cheese Omelette',
    category: 'Omelettes',
    description: 'Fluffy omelette filled with melted cheese. Ready in about 8 minutes.',
    price: 79,
  },
  {
    name: 'Onion Tomato Omelette',
    category: 'Omelettes',
    description: 'Freshly cooked eggs with onion, tomato and herbs. Ready in about 7 minutes.',
    price: 69,
  },
  {
    name: 'Masala Cheese Omelette',
    category: 'Omelettes',
    description: 'Spiced omelette with onion and a layer of melted cheese. Ready in about 9 minutes.',
    price: 89,
  },
  {
    name: 'Egg White Omelette',
    category: 'Omelettes',
    description: 'Light omelette with egg whites, vegetables and herbs. Ready in about 8 minutes.',
    price: 79,
  },
]

const menuPhotos = {
  Burgers: [
    'photo-1568901346375-23c9450c58cd',
    'photo-1550547660-d9450f859349',
    'photo-1551782450-a2132b4ba21d',
    'photo-1571091718767-18b5b1457add',
    'photo-1565299507177-b0ac66763828',
  ],
  Sandwiches: [
    'photo-1528735602780-2552fd46c7af',
    'photo-1509722747041-616f39b57569',
    'photo-1554433607-66b5efe9d304',
    'photo-1482049016688-2d3e1b311543',
    'photo-1484723091739-30a097e8f929',
  ],
  Beverages: [
    'photo-1509042239860-f550ce710b93',
    'photo-1461023058943-07fcbe16d735',
    'photo-1517701604599-bb29b565090c',
    'photo-1511920170033-f8396924c348',
    'photo-1498804103079-a6351b050096',
  ],
  Maggis: [
    'photo-1569718212165-3a8278d5f624',
    'photo-1585032226651-759b368d7246',
    'photo-1557872943-16a5ac26437e',
    'photo-1588013273468-315fd88ea34c',
    'photo-1552611052-33e04de081de',
  ],
  Rolls: [
    'photo-1626700051175-6818013e1d4f',
    'photo-1551504734-5ee1c4a1479b',
    'photo-1611250188496-e966043a0629',
    'photo-1476224203421-9ac39bcb3327',
    'photo-1512058564366-18510be2db19',
  ],
  Omelettes: [
    'photo-1525351484163-7529414344d8',
    'photo-1510693206972-df098062cb71',
    'photo-1506084868230-bb9d95c24759',
    'photo-1490645935967-10de6ba17061',
    'photo-1504754524776-8f4f37790ca0',
  ],
}

export const menuImageUrl = (photoId) => (
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=960&q=82`
)

const categoryPhotoIndex = new Map()
const menuItemsWithPhotos = menuItems.map((item) => {
  const index = categoryPhotoIndex.get(item.category) || 0
  categoryPhotoIndex.set(item.category, index + 1)
  return {
    ...item,
    imageUrl: menuImageUrl(menuPhotos[item.category][index]),
    available: true,
  }
})

export default menuItemsWithPhotos
