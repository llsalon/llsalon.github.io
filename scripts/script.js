const eli = el => document.getElementById(el);
const elq = el => document.querySelector(el);
const elqa = el => document.querySelectorAll(el);

const ENV = 'prod';

const scrollToElement = (elem) => {
  const coors = elem.getBoundingClientRect();
  try {
    window.scrollBy({
      top: coors.top,
      left: coors.left,
      behavior: 'smooth',
    });
  } catch (_) {
    window.scrollBy(coors.top, coors.left);
  }
};

const backClickHandler = () => {
  Stack.pop();
  Stack.change();
};

eli('servicesMenu').addEventListener('click', () => scrollToElement(eli('services')));
elq('#location .back').addEventListener('click', backClickHandler);
elq('header button.cart').addEventListener('click', () => Cart.ui.toggle());

// Service
class S {
  static count = 0;
  constructor(name, price, options = null) {
    this.id = ++S.count;
    this.name = name;
    this.price = price;
    servicesMap.set(this.id, this);

    if (options !== null) {
      if ('image' in options) {
        this.image = options.image;
      }
    }
  }
  click() {
    ENV == 'dev' && console.log(`Click ${this.name} service`);
    Cart.add(this);
  }
  setImage(image) {
    if (this.image) return;
    this.image = image;
  }
};

const servicesMap = new Map();

// Type
class T {
  constructor(name, data, options = null) {
    this.name = name;
    this.data = data;

    if (options !== null) {
      if ('image' in options) {
        this.setImage(options.image);
      }
    }
  }
  setImage(image) {
    if (this.image) return;
    this.image = image;
    for (const item of this.data) {
      item.setImage(image);
    }
  }
  click() {
    if (this.list) {
      Stack.popUntil(this);
    } else {
      Stack.popUntil(this.parent);
      Stack.push(this);
    }
    Stack.change();
  }
};
const Bar = {
  isShowing: false,
  container: eli('location'),
  push(obj) {
    const el = document.createElement('span');
    el.innerHTML = obj.name;
    el.addEventListener('click', () => obj.click());

    this.container.appendChild(el);

    obj.barItem = el;
  },
  remove(item) {
    item.remove();
  },
  show() {
    if (this.isShowing) return;
    this.container.style.visibility = 'visible';
    this.isShowing = true;
  },
  hide() {
    if (!this.isShowing) return;
    this.container.style.visibility = 'hidden';
    this.isShowing = false;
  },
};

const Item = {
  create(obj) {
    const item = document.createElement('li');

    if (obj instanceof S) {
      item.classList.add('service');
      if (obj.image) {
        item.style.backgroundImage = `url(../images/services/${obj.image})`;
      }

      const span = document.createElement('span');
      span.innerHTML = obj.name;

      const spanPrice = document.createElement('span');
      spanPrice.classList.add('price');
      spanPrice.innerHTML = `₹${obj.price}`;

      span.appendChild(spanPrice);

      const addtocart = document.createElement('input');

      addtocart.setAttribute('value', 'ADD TO CART');
      addtocart.setAttribute('type', 'button');
      addtocart.addEventListener('click', () => obj.click());

      span.appendChild(addtocart);

      const cover = document.createElement('div');

      item.appendChild(cover);
      item.appendChild(span);
    } else {
      item.innerHTML = `<span>${obj.name}</span>`;
      item.addEventListener('click', () => obj.click());
    }

    return item;
  },
};

const List = {
  create() {
    const list = document.createElement('ul');
    list.classList.add('list');
    return list;
  },
  push(list, obj) {
    list.appendChild(Item.create(obj));
  },
  remove(list) {
    list.remove();
  },
  pushItems(list, data) {
    for (const item of data) {
      List.push(list, item);
    }
  },
  getCurr() {
    return elq('.curr.list');
  },
  addCurr(list) {
    list.classList.add('curr');
  },
  removeCurr(list) {
    list?.classList.remove('curr');
  }
};

const Lists = {
  container: eli('lists'),
  push(list) {
    this.container.appendChild(list);
  },
  scroll() {
    this.container.scrollBy({
      top: 0,
      left: 1000,
      behavior: 'smooth',
    });
  },
};

const last = arr => arr[arr.length - 1];

const Stack = {
  stack: [],
  change() {
    if (this.stack.length <= 1) {
      Bar.hide();
    } else {
      Bar.show();
    }
    Lists.scroll();
  },
  push(obj) {
    this.stack.push(obj);

    Bar.push(obj);
    obj.list = List.create(obj.data);

    for (const child of obj.data) {
      child.parent = obj;
      List.push(obj.list, child);
    }

    Lists.push(obj.list);

    List.removeCurr(List.getCurr());
    List.addCurr(obj.list);
  },
  pop() {
    if (this.stack.length === 1) return;
    const obj = this.stack.pop();

    Bar.remove(obj.barItem);
    List.remove(obj.list);
    obj.list = null;
    List.addCurr(last(this.stack).list);
  },
  popUntil(obj) {
    while (last(this.stack) != obj) this.pop();
  },
};

const Cart = {
  data: {
    store: [],
    storeMap: new Map(),
    findItem(service) {
      // if (!(service instanceof S)) return false;

      // for (let i = 0; i < this.store.length; i++) {
      //   if (this.store[i].service == service) return i;
      // }
      // return null;
      return this.storeMap.has(service.id) ? this.storeMap.get(service.id) : null;
    },
    add(service) {
      const index = this.findItem(service);
      if (index === null) {
        this.store.push({
          service: service,
          quantity: 1,
        });
        this.storeMap.set(service.id, this.store.length - 1);
        return null;
      } else {
        this.store[index].quantity++;
        return index;
      }
    },
    remove(service) {
      const index = this.findItem(service);
      if (index === null) return null;

      this.store[index].quantity--;
      return index;
    },
    removeAll(service) {
      const index = this.findItem(service);
      if (index === null) return null;

      this.store.splice(index, 1);
      return index;
    },
    totalPrice() {
      return this.store.reduce((sum, item) => sum + (item.quantity * item.service.price), 0);
    },
  },
  ui: {
    isShowing: false,
    button: elq('header button.cart'),
    cart: elq('header > div.cart'),
    list: elq('header > div.cart table'),
    total: eli('totalValue'),
    toggle() {
      if (this.isCartShowing) {
        this.cart.style.display = 'none';
        this.isCartShowing = false;
      } else {
        this.cart.style.display = 'block';
        this.isCartShowing = true;
      }
    },
    genActions(item) {
      const dec = document.createElement('span');
      const inc = document.createElement('span');
      const rem = document.createElement('span');
      dec.classList.add('action', 'dec');
      inc.classList.add('action', 'inc');
      rem.classList.add('action', 'rem');
      inc.addEventListener('click', () => Cart.add(item.service));
      dec.addEventListener('click', () => Cart.remove(item.service));
      rem.addEventListener('click', () => Cart.removeAll(item.service));
      dec.innerHTML = '-';
      inc.innerHTML = '+';
      rem.innerHTML = 'x';
      return [dec, inc, rem];
    },
    addItem(item) {
      const row = document.createElement('tr');

      const name = document.createElement('td');
      const price = document.createElement('td');
      const quantity = document.createElement('td');
      const actions = document.createElement('td');

      name.classList.add('name');
      price.classList.add('price');
      quantity.classList.add('quantity');
      actions.classList.add('actions');

      name.innerHTML = item.service.name;
      price.innerHTML = `₹${item.service.price}`;
      quantity.innerHTML = item.quantity;
      this.genActions(item).map(el => actions.appendChild(el));

      row.appendChild(name);
      row.appendChild(price);
      row.appendChild(quantity);
      row.appendChild(actions);

      this.list.appendChild(row);
    },
    removeItem(index) {
      const row = elq(`header > div.cart table tr:nth-child(${index + 2})`);
      row.remove();
    },
    update(index, item) {
      const name = elq(`header > div.cart table tr:nth-child(${index + 2}) .name`);
      const price = elq(`header > div.cart table tr:nth-child(${index + 2}) .price`);
      const quantity = elq(`header > div.cart table tr:nth-child(${index + 2}) .quantity`);
      name.innerHTML = item.service.name;
      price.innerHTML = item.service.price;
      quantity.innerHTML = item.quantity;
    },
    setTotal(val) {
      this.total.innerHTML = `₹${val}`;
    },
  },
  load() {
    this.loadStorage();
    this.ui.setTotal(this.data.totalPrice());
  },
  add(service) {
    if (!(service instanceof S)) return;

    const index = this.data.add(service);
    if (index === null) {
      this.ui.addItem(last(this.data.store));
    } else {
      this.ui.update(index, this.data.store[index]);
    }
    this.ui.setTotal(this.data.totalPrice());

    this.updateStorage();
  },
  remove(service) {
    if (!(service instanceof S)) return;

    const index = this.data.remove(service);
    if (index === null) return;

    if (this.data.store[index].quantity == 0) {
      this.ui.removeItem(index);
      this.data.removeAll(service);
    } else {
      this.ui.update(index, this.data.store[index]);
    }
    this.ui.setTotal(this.data.totalPrice());

    this.updateStorage();
  },
  removeAll(service) {
    if (!(service instanceof S)) return;

    const index = this.data.removeAll(service);

    if (index === null) return;

    this.ui.removeItem(index);
    this.ui.setTotal(this.data.totalPrice());

    this.updateStorage();
  },
  toString() {
    return JSON.stringify(this.data.store.map(item => ({id: item.service.id, qty: item.quantity})));
  },
  updateStorage() {
    localStorage.setItem('cart', this.toString());
  },
  loadStorage() {
    const cart = localStorage.getItem('cart');
    if (!cart) return;

    for (const item of JSON.parse(cart)) {
      ENV == 'dev' && console.log(item);
      for (let i = 0; i < item.qty; i++) this.add(servicesMap.get(item.id));
    }
  },
  generateMessage() {
    return this.data.store
      .reduce((str, item) => `${str}\n${item.quantity} x ${item.service.name},`, 'Hi, can you please book services for ')
      .slice(0, -1);
  },
};

document.getElementById('buyButton').addEventListener(
  'click',
  () => window.open(`https://wa.me/918882518150?text=${encodeURIComponent(Cart.generateMessage())}`),
);

const services = new T('Services', [
  new T('Layered Luxury Special Offers', [
    new S('Layered Luxury Special (Free Cheryls Glovite Facial) - Detan/Oxy Bleach (Face and Neck), Dark Chocolate Wax (Full Arms + Full Legs + Under Arms), Threading (Eyebrows + Upper Lips)', 995),
    new S('Everytime Glow (Free Rica FUll Arms with Under Arms) - O3+ Whitening and Brightening Facial + Classic Pedicure + Threading Eyebrows and Upper Lips', 1699),
    new S('Pamper Yourself (Free VLCC Diamond Cleanup) - Honey Wax Full Arms, Full Legs and Under Arms + Head Massage (15 minutes) + Threading Eyebrows and Upper Lips', 745),
  ]),
  new T('Beauty Services', [
    new T('Waxing', [
      new T('Honey Regular', [
        new S('Honey Regular Wax - Half Arms', 95),
        new S('Honey Regular Wax - Half Legs', 125),
        new S('Honey Regular Full Arms Wax', 145),
        new S('Honey Regular Full Legs Wax', 195),
        new S('Honey Regular Underarms', 45),
        new S('Honey Regular Stomach Wax', 145),
        new S('Honey Regular Back Wax', 145),
        new S('Honey Regular Bikini + Butt + Bikini Line Wax', 499),
        new S('Honey Regular Bikini Wax', 345),
        new S('Honey Regular Full Body Wax', 725),
        new S('Honey Regular Full Body + Bikini Wax', 995),
      ]),
      new T('Dark Chocolate Wax', [
        new S('Half Arms Chocolate Wax', 145),
        new S('Half Legs Chocolate Wax', 195),
        new S('Full Arms (including Under Arms) Chocolate Wax', 245),
        new S('Full Legs (No Bikini Line) Chocolate Wax', 295),
        new S('Stomach Chocolate Wax', 295),
        new S('Back Chocolate Wax', 295),
        new S('Full Body Chocolate Wax', 725),
      ]),
      new T('Roll-On Wax', [
        new S('Chocolate Roll-On - Full Legs + Full Arms with Under Arms (RICA Peel-Off Wax) + Low-Contact Threading (Uppar Lip and Eye Brow)', 545),
        new S('Full Roll-On - Rica White Chocolate Full Legs + Full Arms with Under Arms + Threading (Eye Brows + Upper Lip Threading)', 845),
        new S('Full Arms Roll-On Wax', 445),
        new S('Full Legs Roll-On Wax', 345),
        new S('Half Legs Roll-On Wax', 245),
        new S('Stomach Roll-On', 245),
        new S('Back Roll-On', 295),
        new S('Full Body Roll-On', 1195),
      ]),
      new T('Rica Wax', [
        new S('Half Arms Rica Wax', 195),
        new S('Half Legs Rica Wax', 195),
        new S('Under Arms Rica Wax', 95),
        new S('Full Arms + Under Arms Rica Wax', 345),
        new S('Full Legs Rica Wax', 325),
        new S('Bikini Rica Wax', 495),
        new S('Butt Rica Wax', 375),
        new S('Bikini Line Rica Wax', 195),
        new S('Stomach Rica Wax', 225),
        new S('Back Rica Wax', 295),
        new S('Full Body Rica Wax', 1145),
        new S('Full Arms + Full Legs + Under Arms Rica Wax', 645),
        new S('Full Body + Bikini + Butt Rica Wax', 1795),
        new S('Bikini + Butt + Bikini Line Rica Wax', 995),
      ]),
    ], {
      image: 'waxing.jpg',
    }),
    new T('Facials and Clean-ups', [
      new S('VLCC Fruit Facial', 445),
      new S('VLCC Brightning Glow Facial', 445),
      new S('VLCC Detan Facial', 445),
      new S('Oxy Life Pro Radiance Pure Oxygen Facial', 595),
      new S('VLCC Gold Facial', 595),
      new S('L\'Oreal Cheryls Glovite Facial', 795),
      new S('L\'Oreal Cheryls Tan Clear Facial', 795),
      new S('L\'Oreal Cheryls Oxy Blast Facial', 895),
      new S('O3+ Whitening Facial with Peel-Off Mask', 1195),
      new S('O3+ Bridal Radiant and Glowing Skin Facial', 1695),
      new S('O3+ Bridal Vitamin - C Glowing Skin Facial', 1695),
      new S('O3+ Bridal Oxygenating Glow Skin Facial', 1695),
      new S('VLCC Fruit Clean-up', 345),
      new S('VLCC Tan Clear Clean-up', 345),
      new S('VLCC Diamond Clean-up', 495),
    ], {
      image: 'facial.jpg',
    }),
    new T('Body Massage - Relax and Heal Your Soul', [
      new S('Full Body Oil Massage', 575),
      new S('Full Body Massage with Olive Oil', 925),
      new S('Body Polishing (Cleanser -> Scrub -> Cream Massage -> Mask)', 1195),
      new S('Head Massage (25 mins) with Olive Oil', 245),
    ]),
    new T('Manicure and Pedicure', [
      new S('Classic Manicure (VLCC)', 245),
      new S('Classic Pedicure (VLCC)', 345),
      new S('Premium Manicure (Raga)', 345),
      new S('Premium Pedicure (Raga)', 445),
      new S('Luxury Manicure (O3+)', 445),
      new S('Luxury Pedicure (O3+)', 445),
      new S('Cut, File and Polish Feet', 145),
      new S('Cut, File and Polish Hands', 145),
      new S('Nailpaint - Hands', 45),
      new S('Nailpaint - Feet', 45),
    ], {
      image: 'pedicure.jpg',
    }),
    new T('Threading and Face Wax', [
      new S('Upper Lip Face Wax', 55),
      new S('Chin Face Wax', 75),
      new S('Side Locks Face Wax', 75),
      new S('Forehead Face Wax', 75),
      new S('Neckface Wax', 125),
      new S('Full Face Wax', 345),
      new S('Upper Lip Threading', 20),
      new S('Eyebrow Theading', 30),
      new S('Chin Threading', 30),
    ], {
      image: 'threading.jpg',
    }),
    new T('Bleach/Detan', [
      new S('Face and Neck Bleach', 145),
      new S('Full Arms Bleach', 245),
      new S('Full Legs Bleach', 345),
      new S('Stomach Bleach', 195),
      new S('Back Bleach', 295),
      new S('Full Body Bleach', 595),
      new S('Face and Neck Detan Pack', 145),
      new S('Full Arms Detan Pack', 245),
      new S('Full legs Detan Pack', 345),
      new S('Stomach Detan Pack', 195),
      new S('Back Detan Pack', 295),
      new S('Full Body Detan', 595),
    ], {
      image: 'bleach.jpg',
    }),
  ]),
  new T('Hair Services', [
    new T('For Women', [
      new T('Hair Colour', [
        new S('Hair Colour Application (Colour should be provided by client)', 299, {time: 30}),
        new S('Hair Henna Application', 299, {time: 30}),
        new S('L\'Oreal Root Touch-up (Majiral Colour No. 2, 3, 4, 5)', 599, {time: 30}),
        new S('L\'Oreal Global Colour (upto shoulder)', 1599),
        new S('L\'Oreal Global Colour (below shoulder)', 2199),
        new S('L\'Oreal Global Colour (upto waist)', 2799),
        new S('L\'Oreal Global Colour (below waist)', 3399),
        new S('L\'Oreal Global Fashion Colour (upto shoulder length)', 2399),
        new S('L\'Oreal Global Fashion Colour (below the shoulder)', 2999),
        new S('L\'Oreal Global Fashion Colour (upto the waist)', 3599),
        new S('L\'Oreal Global Fashion Colour (below the waist)', 4199),
      ]),
      new T('Hair Styling', [
        new S('Blow Dry Hair Styling', 299, {time: 30}),
        new S('Hair Ironing', 349, {time: 40}),
        new S('Tongs/Curling Hair Styling', 349, {time: 40}),
      ]),
      new T('Hair Care', [
        new S('L\'Oreal Nourishing Hair Spa', 699, {time: 60}),
        new S('Keratin Treatment', 2295, {time: 120}),
      ]),
      new T('Chemical Services', [
        new S('Hair Smoothening/Rebonding Upto Shoulder Length', 2795),
        new S('Hair Smoothening/Rebonding Below Shoulder Length', 3295),
        new S('Hair Smoothening/Rebonding Upto Waist Length', 3895),
        new S('Combo Offer - Hair Rebonding + Keratin Treatment upto Shoulder Length', 4495),
        new S('Combo Offer - Hair Rebonding + Keratin Treatment below Shoulder Length', 5995),
        new S('Combo Offer - Hair Rebonding + Keratin Treatment upto Waist Length', 6995),
        new S('Combo Offer - Hair Rebonding + Keratin Treatment + Global Highlights upto Shoulder Length', 6295),
        new S('Combo Offer - Hair Rebonding + Keratin Treatment + Global Highlights below Shoulder Length', 8495),
        new S('Combo Offer - Hair Rebonding + Keratin Treatment + Global Highlights upto Waist Length', 9795),
        new S('Combo Offer - Hair Rebonding + Keratin Treatment + Global Highlights upto Waist Length', 9795),
        new S('Single Foil Highlights', 300),
      ]),
      new T('Highlights & Fashion Colour', [
        new S('Highlights', 1999, {time: 90}),
        new S('Fashion Colour', 2399, {time: 90}),
      ]),
    ]),
    new T('For Men', [
      new S('Haircut + 5 minutes Head Massage', 199, {time: 40}),
      new S('Head, Neck & Shoulder Massage', 199, {time: 40}),
      new S('Beard Trimming + 15 minutes Head Massage', 199, {time: 40}),
      new S('Clean Shave', 99, {time: 20}),
      new S('Beard Trimming & Styling', 99, {time: 25}),
      new S('Head Massage', 50, {time: 10}),
      new S('Head Massage', 100, {time: 20}),
      new S('Detan Face & Neck', 395),
      new S('Hair Colour (Colour should be provided by client)', 125, {time: 30}),
      new S('Hair Spa', 399, {time: 30}),
    ]),
  ]),
  new T('Makeup and Hair Styles', [
    new S ('Basic Makeup with Hair Style (Mac, Maybelline)', 1445),
    new S('Basic Makeup with Hair Style for 2 people (Mac, Maybelline)', 2745),
    new S('Advaced Makeup with Hair Bun/Braids Hairdo (Makeup Studio, KyroLan, Forever 52)', 2545),
    new S('Advaced Makeup with Hair Bun/Braids Hairdo for 2 people (Makeup Studio, KyroLan, Forever 52)', 4545),
    new S('Only Hairstyles/Hairdo (499 onwards)', 499),
    new S('Advanced Hairstyles/Hairdo (900 onwards)', 900),
  ]),
  new T('Bridal Makeups', [
    new S('Basic Bridal Makeup including Hair Styles + Eye Lashes + Draping (Mac, Maybelline)', 6000),
    new S('HD Bridal Makeup including Hair Styles + Eye Lashes + Draping (Forever 52, Makeup Studio, Kryolan)', 11000),
    new S('Airbrush Makeup including Hair Styles + Eye Lashes + Draping (Makeup Studio)', 16000),
  ]),
  new T('Packages', [
    new T('For Men', [
      new S('Hair Cut + Beard Trim/Shave + VLCC Detan Facial', 599, {time: 110}),
      new S('Hair Cut + Beard Trim/Shave', 299, {time: 60}),
      new S('Hair Cut + Beard Trim/Shave + 10 minutes Head Massage', 299, {time: 60}),
      new S('Hair Cut + 25 minutes Head Massage', 299, {time: 60}),
      new S('Hair Cut + Beard Trim + VLCC Cleanup', 499, {time: 90}),
      new S('Hair Cut + Hair Application', 299, {time: 65}),
      new S('Hair Cut + Shave + 20 minutes Head Massage', 325, {time: 70}),
      new S('Hair Cut + Beard Trim + Hair Colour Application', 399, {time: 80}),
    ]),
    new T('Evergreen Packages', [
      new S('NORMAL Honey Regular Wax Full Arms + Half Leg Wax + VLCC Fruit/Anti-Tan/Brightening glow facial + low touch threading (eyebrows)', 602, {actualPrice: 735, discount: 18}),
      new S('GLOVITE Facial + RICA Wax Full Arms + Under Arms + Half Legs + Low-Touch Threading Eye Brows', 1353, {actualPrice: 1650, discount: 18}),
      new S('L\'Oreal GLOVITE/Tan Clear Facial + RICA Full Arms + Full legs + Classic Pedicure + Low-Touch Threading Eyebrows', 1717, {discount: 25, actualPrice: 2290}),
      new S('Mani-Pedi Classic - L\'Oreal HairSpa + Classic Manicure + Classic Pedicure + Face Hair Threading Eye-Brows, Upper Lips', 1275, {discount: 25, actualPrice: 1700}),
      new S('O3+ Bridal Vitamin-C/O3+ Bridal Radiant & Glowing/O3+ Bridal Oxygenating Glowing Facial + Dark Chocolate Wax Full Arms (including Under Arms) + Full Legs + Bleach/D-Tan Face and Neck + Pedicure Classic (Threading Eye Brows, Upper Lips Free)', 2432, {discount: 20, actualPrice: 3040}),
      new S('O3+ Whitening Facial with Put-off mask + Classic Manicure + Classic Pedicure + Honey Chocolate Wax - Full Arms + Full Legs & Under Arms + Free-Bleach Fruit/Oxy + Eyebrows Threading Upper Lips and Forehead', 2439, {discount: 18, actualPrice: 2975}),
    ]),
  ]),
]);

Stack.push(services);

Cart.load();
