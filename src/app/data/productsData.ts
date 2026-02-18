import { MenuItem } from './menuData';
import wagyuImage from '@/assets/8c595f77b0f6c6a4e120f0ff7933588169362821.png';
import truffleTallowImage from '@/assets/160215f3ea9218f7a75c4b731c311da2201d5e42.png';
import garlicTallowImage from '@/assets/0e7adf1a8302b61a90b4137cc09ce905117461d4.png';
import smokedTallowImage from '@/assets/a8c41eee83ebf2ec311e73401c5c88657d0797ba.png';
import boneBrothImage from '@/assets/1494aeef704c5481b3858e6294f84ac9d6829a9d.png';

export const PRODUCTS: MenuItem[] = [
  {
    id: 'p1',
    name: 'Wagyu Beef Tallow - Original',
    description: '310ml of pure, rendered Wagyu fat. The secret to restaurant-quality searing and roasting.',
    price: 350,
    category: 'Tallow',
    image: wagyuImage,
    dietary: ['Keto', 'Carnivore', 'GF'],
    status: 'available'
  },
  {
    id: 'p2',
    name: 'Wagyu Beef Tallow - Garlic & Herbs',
    description: '310ml infused with roasted garlic, rosemary, and thyme. Perfect for steaks and potatoes.',
    price: 375,
    category: 'Tallow',
    image: garlicTallowImage,
    dietary: ['Keto', 'Carnivore', 'GF'],
    status: 'available'
  },
  {
    id: 'p3',
    name: 'Wagyu Beef Tallow - Black Truffle',
    description: '310ml of luxury. Infused with black truffle essence for an earthy, aromatic finish.',
    price: 450,
    category: 'Tallow',
    image: truffleTallowImage,
    dietary: ['Keto', 'Carnivore', 'GF'],
    status: 'limited'
  },
  {
    id: 'p4',
    name: 'Wagyu Beef Tallow - Smoked',
    description: '310ml cold-smoked over hickory wood. Adds a deep, barbecue flavor to any dish.',
    price: 375,
    category: 'Tallow',
    image: smokedTallowImage,
    dietary: ['Keto', 'Carnivore', 'GF'],
    status: 'available'
  },
  {
    id: 'p5',
    name: 'Bone Broth Concentrate',
    description: '310ml of 48-hour slow-simmered beef bone broth. Rich in collagen and minerals.',
    price: 280,
    category: 'Broth',
    image: boneBrothImage,
    dietary: ['High Protein', 'Keto', 'GF'],
    status: 'available'
  }
];
