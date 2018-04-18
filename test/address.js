/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

'use strict';

const assert = require('assert');
const AddressInfo = require('../lib/address');
const bcoin = require('bcoin');
const { hd, Script, KeyRing } = bcoin;

const networkNames = ['main', 'testnet', 'regtest', 'simnet'];
const addresses = generateAddresses();

describe('Address', function() {
  describe('Base58', function() {
    it('should identify network in partial P2PKH (3)', () => {
      for (const network of networkNames) {
        const address = addresses[network].P2PKH;
        const info = AddressInfo.fromString(address.substr(0, 3));

        assert.strictEqual(info.type, 'P2PKH');
        assert.strictEqual(info.network, network);
        assert.strictEqual(info.encoding, 'base58');
      }
    });
  });
});

function generateAddresses() {
  const priv1 = hd.PrivateKey.generate();
  const priv2 = hd.PrivateKey.generate();
  const ringP2PKH = KeyRing.fromPrivate(priv1.privateKey);
  const ringP2SH = KeyRing.fromPrivate(priv1.privateKey);

  ringP2SH.script = Script.fromMultisig(2, 2, [
    priv1.publicKey,
    priv2.publicKey
  ]);

  const addresses = Object.create(null);

  for (const network of networkNames) {
    ringP2PKH.witness = false;
    ringP2SH.witness = false;
    ringP2PKH.refresh();
    ringP2SH.refresh();

    addresses[network] = {
      P2PKH: ringP2PKH.getAddress('string', network),
      P2SH: ringP2SH.getAddress('string', network)
    };

    ringP2PKH.refresh();
    ringP2SH.refresh();
    ringP2PKH.witness = true;
    ringP2SH.witness = true;

    addresses[network].P2WPKH = ringP2PKH.getAddress('string', network);
    addresses[network].P2WSH = ringP2SH.getAddress('string', network);
  }

  return addresses;
}
