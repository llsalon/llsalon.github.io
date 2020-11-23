const eli = el => document.getElementById(el);
const elq = el => document.querySelector(el);
const elqa = el => document.querySelectorAll(el);

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
    console.log(`Click ${this.name} service`);
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
      price.innerHTML = item.service.price;
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
      this.total.innerHTML = val;
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
      console.log(item);
      for (let i = 0; i < item.qty; i++) this.add(servicesMap.get(item.id));
    }
  },
};

const services = new T('Services', [
  new T('Beauty Services', [
    new T('Waxing', [
      new T('Honey Regular', [
        new S('Honey Regular Wax - Half Arms', 95),
        new S('Honey Regular Wax - Half Legs', 145),
        new S('Honey Regular Full Arms Wax', 145),
        new S('Honey Regular Full Legs Wax', 195),
        new S('Honey Regular Underarms', 45),
        new S('Honey Regular Stomach Wax', 245),
        new S('Honey Regular Back Wax', 245),
        new S('Honey Regular Full Body Wax', 845),
      ]),
      new T('White Chocolate/Dark Chocolate Wax', [
        new S('Half Arms Chocolate Wax', 145),
        new S('Half Legs Chocolate Wax', 195),
        new S('Full Arms (including Under Arms) Chocolate Wax', 295),
        new S('Full Legs (No Bikini Line) Chocolate Wax', 345),
        new S('Stomach Chocolate Wax', 345),
        new S('Back Chocolate Wax', 345),
        new S('Full Body Chocolate Wax', 1295),
      ]),
      new T('Roll-On Wax', [
        new S('Chocolate Roll-On - Full Legs + Full Arms with Under Arms (RICA Peel-Off Wax) + Low-Contact Threading (Uppar Lip and Eye Brow)', 545),
        new S('Full Roll-On - Rica White Chocolate Full Legs + Full Arms with Under Arms + Threading (Eye Brows + Upper Lip Threading)', 845),
        new S('Full Arms Roll-On Wax', 645),
        new S('Full Legas Roll-On Wax', 495),
        new S('Hlaf Leg Roll-On Wax', 395),
        new S('Stomach Roll-On', 495),
        new S('Back Roll-On', 595),
        new S('Full Body Roll-On', 1795),
      ]),
      new T('Rica Wax', [
        new S('Regular Wax Rica White Chocolate', 245),
        new S('Half Arms Wax', 245),
        new S('Half Legs Wax', 245),
        new S('Under Arms Wax', 95),
        new S('Full Arms Wax + Under Arms', 495),
        new S('Full Legs Wax', 395),
        new S('Bikini Wax', 995),
        new S('Full Body Wax', 1595),
        new S('Bikini Line Wax', 195),
        new S('Stomach Wax', 345),
        new S('Back Wax', 445),
      ]),
    ], {
      image: 'waxing.jpg',
    }),
    new T('Facials', [
      new S('VLCC Fruit Facial', 445),
      new S('VLCC Brightning Glow Facial', 445),
      new S('VLCC Detan Facial', 445),
      new S('Oxy Life Pro Radiance Pure Oxygen Facial', 595),
      new S('VLCC Gold Facial', 695),
      new S('L\'Oreal Cheryls Glovite Facial', 895),
      new S('L\'Oreal Cheryls Tan Clear Facial', 895),
      new S('L\'Oreal Cheryls Oxy Blast Facial', 1295),
      new S('O3+ Whitening Facial with Peel-Off Mask', 1495),
      new S('O3+ Bridal Radiant and Glowing Skin Facial', 1695),
      new S('O3+ Bridal Vitamin - C Glowing Skin Facial', 1695),
      new S('O3+ Bridal Oxygenating Glow Skin Facial', 1695),
    ], {
      image: 'facial.jpg',
    }),
    new T('Manicure and Pedicure', [
      new S('Classic Manicure', 345),
      new S('Classic Pedicure', 495),
      new S('Premium Manicure', 495),
      new S('Premium Pedicure', 895),
      new S('Detan Manicure', 495),
      new S('Detan Pedicure', 795),
      new S('Cut, File and Polish Feet', 195),
      new S('Cut, File and Polish Hands', 195),
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
      new S('Face and Neck Bleach', 295),
      new S('Full arms Bleach', 345),
      new S('Full legs Bleach', 445),
      new S('Front Bleach', 345),
      new S('Back Bleach', 345),
      new S('Full Body Bleach', 1295),
      new S('Face and Neck Detan Pack', 295),
      new S('Full Arms Detan Pack', 295),
      new S('Full legs Detan Pack', 445),
      new S('Front Detan Pack', 345),
      new S('Back Detan Pack', 345),
      new S('Full Body Detan', 1295),
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
      ]),
      new T('Hair Styling', [
        new S('Blow Dry Hair Styling', 299, {time: 30}),
        new S('Hair Ironing', 349, {time: 40}),
        new S('Tongs/Curling Hair Styling', 349, {time: 40}),
      ]),
      new T('Hair Care', [
        new S('Relaxing Head Massage', 299, {time: 25}),
        new S('L\'Oreal Nourishing Hair Spa', 799, {time: 60}),
        new S('Keratin Treatment', 2295, {time: 120}),
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
      new S('Lara Detan Face & Neck', 195),
      new S('Hair Colour (Colour should be provided by client)', 125, {time: 30}),
      new S('Hair Spa', 399, {time: 30}),
    ]),
  ]),
  new T('Packages', [
    new T('For Men', [
      new S('Hair Cut + Beard Trim/Shave + VLCC Detan Facial', 599, {time: 110}),
      new S('Hair Cut + Beard Trim/Shave', 299, {time: 60}),
      new S('Hair Cut + Beard Trim/Shave + 10 minutes Head Massage', 299, {time: 60}),
      new S('Hair Cut + 25 minutes Head Massage', 299, {time: 60}),
      new S('Hair Cut + Beard Trim + Cleanup + Detan Facial', 499, {time: 90}),
      new S('Hair Cut + Hair Application', 299, {time: 65}),
      new S('Hair Cut + Shave + 20 minutes Head Massage', 325, {time: 70}),
      new S('Hair Cut + Beard Trim + Hair Colour Application', 399, {time: 80}),
    ]),
  ]),
]);

Stack.push(services);

Cart.load();
