export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  dietary?: string[];
  status?: 'available' | 'limited' | 'sold_out';
};

export const MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Gourmet Beef Burger',
    description: 'Angus beef patty, caramelized onions, cheddar cheese, and house sauce on a brioche bun.',
    price: 250,
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-1766589221001-96f4ecd3b6a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwYnVyZ2VyJTIwZnJpZXMlMjB3b29kZW4lMjBib2FyZHxlbnwxfHx8fDE3NzExMzM2NTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dietary: ['High Protein'],
    status: 'available'
  },
  {
    id: '2',
    name: 'Quinoa Power Bowl',
    description: 'Mixed greens, quinoa, avocado, cherry tomatoes, cucumber, and lemon vinaigrette.',
    price: 180,
    category: 'Salads',
    image: 'https://images.unsplash.com/photo-1615865417491-9941019fbc00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxoZWFsdGh5JTIwcXVpbm9hJTIwc2FsYWQlMjBib3dsfGVufDF8fHx8MTc3MTEzMzY1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dietary: ['Vegan', 'GF'],
    status: 'available'
  },
  {
    id: '3',
    name: 'Classic Pomodoro Pasta',
    description: 'Fresh homemade pasta tossed in slow-cooked tomato basil sauce with parmesan.',
    price: 195,
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-1574636573716-062c8c8c6179?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxmcmVzaCUyMHBhc3RhJTIwYmFzaWwlMjB0b21hdG8lMjBzYXVjZXxlbnwxfHx8fDE3NzExMzM2NTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dietary: ['Vegetarian'],
    status: 'limited'
  },
  {
    id: '4',
    name: 'Grilled Chicken Breast',
    description: 'Herb-marinated chicken breast served with roasted vegetables and mashed potatoes.',
    price: 220,
    category: 'Mains',
    image: 'https://images.unsplash.com/photo-1768726134294-92234fe2f76c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxnb3VybWV0JTIwZm9vZCUyMHNwcmVhZCUyMHRhYmxlJTIwb3ZlcmhlYWR8ZW58MXx8fHwxNzcxMTMzNjU1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dietary: ['High Protein', 'GF'],
    status: 'available'
  },
  {
    id: '5',
    name: 'Greek Salad',
    description: 'Crisp lettuce, feta cheese, kalamata olives, onions, and oregano dressing.',
    price: 160,
    category: 'Salads',
    image: 'https://images.unsplash.com/photo-1615865417491-9941019fbc00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxoZWFsdGh5JTIwcXVpbm9hJTIwc2FsYWQlMjBib3dsfGVufDF8fHx8MTc3MTEzMzY1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dietary: ['Vegetarian', 'GF'],
    status: 'sold_out'
  },
];
