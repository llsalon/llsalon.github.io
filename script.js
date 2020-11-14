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
  constructor(name, price) {
    this.id = ++S.count;
    this.name = name;
    this.price = price;
    servicesMap.set(this.id, this);
  }
  click() {
    console.log(`Click ${this.name} service`);
    Cart.add(this);
  }
};

const servicesMap = new Map();

// Type
class T {
  constructor(name, data) {
    this.name = name;
    this.data = data;
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
    item.innerHTML = `<span>${obj.name}${obj instanceof S ? ' - ₹' + obj.price : ''}</span>`;
    item.addEventListener('click', () => obj.click());
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

      const name = document.createElement('th');
      const price = document.createElement('th');
      const quantity = document.createElement('th');
      const actions = document.createElement('th');

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
        new S('Honey Regular Full Body', 845),
      ]),
      new T('White Chocolate/Dark Chocolate Wax', [
        new S('Half Arms', 145),
        new S('Half Legs', 195),
        new S('Full Arms (including Under Arms)', 295),
        new S('Full Legs (No Bikini Line)', 345),
        new S('Stomach Wax', 345),
        new S('Back Wax', 345),
        new S('Full Body', 1295),
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
        new S('Bikini Line', 195),
        new S('Stomach Wax', 345),
        new S('Back Wax', 445),
      ]),
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
      ]),
      new T('Manicure and Pedicure', [
        new S('Classic Manicure', 345),
        new S('Classic Pedicure', 495),
        new S('Premium Manicure', 495),
        new S('Premium Pedicure', 895),
        new S('Detan Manicure', 495),
        new S('Detan Pedicure', 795),
        new S('Cut, File and Polish feet', 195),
        new S('Cur, File and Polish hands', 195),
      ]),
      new T('Threading and Face Wax', [
        new S('Upper Lip Face Wax', 55),
        new S('Chin Face Wax', 75),
        new S('Side Locks Face Wax', 75),
        new S('Forehead Face Wax', 75),
        new S('Neckface Wax', 125),
        new S('Full Face Wax', 345),
        new S('Upper Lip Threading', 20),
        new S('Eyebrow theading', 30),
        new S('Chin threading', 30),
      ]),
      new T('Bleach/Detan', [
        new S('Face and Neck Bleach', 295),
        new S('Full arms bleach', 345),
        new S('Full legs bleach', 445),
        new S('Front bleach', 345),
        new S('Back bleach', 345),
        new S('Full body bleach', 1295),
        new S('Face and Neck Detan Pack', 295),
        new S('Full Arms Detan Pack', 295),
        new S('Full legs Detan Pack', 445),
        new S('Front Detan Pack', 345),
        new S('Back Detan Pack', 345),
        new S('Full Body Detan', 1295),
      ]),
    ]),
  ])
]);

Stack.push(services);

Cart.load();
