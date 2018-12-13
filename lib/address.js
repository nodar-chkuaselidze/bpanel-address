import assert from 'assert';
import { read } from 'bufio';
import { base58 } from 'bstring';
import { bech32 } from 'bstring-errors';
import { hash256 } from 'bcrypto';
import * as common from './common';

const addressTypes = {
  UNKNOWN: 0,
  P2PKH: 1,
  P2SH: 2,
  P2WPKH: 3,
  P2WSH: 4
};

const addressTypeNames = ['UNKNOWN', 'P2PKH', 'P2SH', 'P2WPKH', 'P2WSH'];

const base58charset = new RegExp(`^[${common.base58charset}]*$`);
const bech32charset = new RegExp(`^[^1]{2}1[${common.bech32charset}]*$`);

const addressTypesByPrefix = {
  main: {
    0x00: addressTypes.P2PKH,
    0x05: addressTypes.P2SH
  },
  testnet: {
    0x6f: addressTypes.P2PKH,
    0xc4: addressTypes.P2SH
  },
  regtest: {
    0x3c: addressTypes.P2PKH,
    0x26: addressTypes.P2SH
  },
  simnet: {
    0x3f: addressTypes.P2PKH,
    0x7b: addressTypes.P2SH
  }
};

// BCOIN Configs
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

// version is 0 = q
const bech32prefixes = {
  main: /^bc1q/i,
  testnet: /^tb1q/i,
  regtest: /^rb1q/i,
  simnet: /^sb1q/i
};

class AddressInfo {
  constructor(options) {
    this.options = new ParseOptions(options);

    this.address = '';
    this.network = '';
    this.type = -1;
    this.encoding = '';

    this.final = false; // did we find checksum.
    this.error = null; // may contain an error.
    this.errors = []; // list of error positions if available.
  }

  /**
   * @param {AddressInfo} addrInfo
   * @returns {Boolean}
   */

  equals(addrInfo) {
    if (this.errors.length !== addrInfo.errors.length) return false;

    for (let i = 0; i < this.errors.length; i++) {
      if (this.errors[i] !== addrInfo.errors[i]) return false;
    }

    return (
      this.address === addrInfo.address &&
      this.network === addrInfo.network &&
      this.type === addrInfo.type &&
      this.encoding === addrInfo.encoding &&
      this.final === addrInfo.final &&
      this.error === addrInfo.error
    );
  }

  /**
   * @param {String} address
   * @returns {Boolean}
   */

  fromBase58(address) {
    let network;

    for (const net of Object.keys(base58prefixes)) {
      const match = base58prefixes[net];

      if (match.test(address)) network = net;
    }

    if (!network) return false;

    // check if charset matches
    if (!base58charset.test(address)) return false;

    // so encoding is base58
    this.encoding = 'base58';
    this.network = network;
    this.type = base58typeByPrefix[address[0]];
    this.address = address;

    if (address.length > 34) throw new Error('Address too long.');
    if (address.length < 33) return true;

    const data = base58.decode(address);

    if (data.length !== 25) throw new Error('Address length incorrect.');

    // from here we verify correctness.
    this.final = true;

    const br = read(data, true);

    // double check type.
    const prefix = br.readU8();
    const type = addressTypesByPrefix[network][prefix];

    if (!type) throw new Error('Type mismatch');

    this.type = type;

    br.seek(br.left() - 4);

    // throws checksum mismatch error.
    br.verifyChecksum(hash256.digest);

    return true;
  }

  /**
   * @param {String} address
   * @returns {Boolean}
   */

  fromBech32(address) {
    let network;

    for (const net of Object.keys(bech32prefixes)) {
      const match = bech32prefixes[net];

      if (match.test(address)) network = net;
    }

    if (!network) return false;
    if (!bech32charset.test(address)) return false;

    this.encoding = 'bech32';
    this.network = network;
    this.address = address;

    if (address.length > 62) throw new Error('Address too long.');
    if (address.length < 42) return true;

    // we are at 42, it might be p2wpkh
    if (address.length === 42) {
      try {
        const errors = bech32.locateErrors(address);

        if (errors.length === 0) {
          this.final = true;
          return true;
        }

        this.type = addressTypes.P2WPKH;
        this.final = true;
        this.errors = errors;
        this.error = new Error('Misspelled bech32 address.');
        return true;
      } catch (e) {
        throw new Error('Could not determine address type.');
      }
    }

    this.type = addressTypes.P2WSH;

    // This is final p2wsh
    if (address.length === 62) {
      this.final = true;
      const errors = bech32.locateErrors(address);

      if (errors.length === 0) return true;

      this.errors = errors;
      this.error = new Error('Misspelled bech32 address.');
    }

    return true;
  }

  /**
   * @param {String} address
   * @returns {Partial
   */

  fromString(address) {
    if (address.length === 0) return this;

    try {
      const isBase58 = this.fromBase58(address);

      if (isBase58) return this;
    } catch (e) {
      this.error = e;
      return this;
    }

    this.reset();

    try {
      const isBech32 = this.fromBech32(address);

      if (isBech32) return this;
    } catch (e) {
      this.error = e;
      return this;
    }

    this.reset();
    this.error = new Error('Could not find address.');
    return this;
  }

  /**
   * @param {String} address
   * @param {Object} options - used for ParseOptions
   */

  static fromString(address, options) {
    const addressInfo = new this(options);

    return addressInfo.fromString(address);
  }

  toJSON() {
    const error = this.error ? this.error.message : null;
    const type = this.type !== -1 ? addressTypeNames[this.type] : '';

    return {
      address: this.address,
      network: this.network,
      type: type,
      encoding: this.encoding,
      final: this.final,
      error: error,
      errors: this.errors
    };
  }

  reset() {
    this.address = '';
    this.network = '';
    this.type = -1;
    this.encoding = '';

    this.final = false;
    this.error = null;
    this.errors = [];
  }
}

class ParseOptions {
  constructor(options) {
    this.network = null;
    this.errors = false;

    if (options) this.fromOptions(options);
  }

  fromOptions(options) {
    assert(options);

    if (options.network) {
      assert(typeof options.network === 'string');

      switch (options.network) {
        case 'main':
        case 'testnet':
        case 'regtest':
        case 'simnet':
          this.network = options.network;
          break;
        default:
          throw new Error('Incorrect network');
      }
    }

    if (options.errors) {
      assert(typeof options.errors === 'boolean');
      this.errors = options.errors;
    }

    return this;
  }

  static fromOptions(options) {
    return new this(options);
  }
}

export default AddressInfo;
