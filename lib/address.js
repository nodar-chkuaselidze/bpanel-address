const { base58 } = require('bstring');
const { Address } = require('bcoin');

const addressTypes = {
  UNKNOWN: 0,
  P2PKH: 1,
  P2SH: 2,
  P2WPKH: 3,
  P2WSH: 4
};

const addressTypeNames = ['UNKNOWN', 'P2PKH', 'P2SH', 'P2WPKH', 'P2WSH'];

const base58prefixes = {
  main: /^(1|3)/,
  testnet: /^(m|n|2)/,
  regtest: /^(R|G)/,
  simnet: /^(S|r)/
};

const base58typeByPrefix = {
  // main
  1: addressTypes.P2PKH,
  3: addressTypes.P2SH,

  // testnet
  m: addressTypes.P2PKH,
  n: addressTypes.P2PKH,
  2: addressTypes.P2SH,

  // regtest
  R: addressTypes.P2PKH,
  G: addressTypes.P2SH,

  // simnet
  S: addressTypes.P2PKH,
  r: addressTypes.P2SH
};

class AddressInfo {
  constructor() {
    this.network = 'main';
    this.version = -1;
    this.type = -1;
    this.encoding = '';
    this.address = null;

    // did we find checksum
    this.final = false;
  }

  fromBase58(addr) {
    const base58info = getBase58(addr);

    if (!base58info) {
      return this;
    }

    const network = base58info[0];
    let address;

    try {
      address = Address.fromBase58(addr);
    } catch (e) {}

    this.encoding = 'base58';

    if (address) {
      this.network = network;
      this.type = addressTypeNames[address.type + 1];
      this.version = address.version;
      this.final = true;

      return this;
    }

    const type = addressTypeNames[base58info[1]];

    this.network = network;
    this.type = type;

    return this;
  }

  static fromBase58(addr) {
    const info = new this().fromBase58(addr);

    if (info.encoding === 'base58') {
      return info;
    }

    throw new Error('Could not parse base58 address.');
  }

  fromString(addr) {
    this.fromBase58(addr);

    if (this.encoding === 'base58') {
      return this;
    }

    return this;
  }

  static fromString(addr) {
    return new this().fromString(addr);
  }
}

function getBase58(addr) {
  if (!base58.test(addr)) {
    return null;
  }

  const networkNames = Object.keys(base58prefixes);

  for (const network of networkNames) {
    const prefixChecker = base58prefixes[network];

    if (!prefixChecker.test(addr)) {
      continue;
    }

    let type = base58typeByPrefix[addr[0]];

    if (!type) {
      type = addressTypes.UNKNOWN;
    }

    return [network, type, addr[0]];
  }

  return null;
}

module.exports = AddressInfo;
