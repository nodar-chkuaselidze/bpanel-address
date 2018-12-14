import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AddressInfo from './address';
import ErrorInput from './errorInput';

class AddressInput extends Component {
  constructor(props) {
    super(props);

    this.state = AddressInfo.fromString('').toJSON();
    this.onChange = this.onChange.bind(this);
  }

  updateAddress(addr) {
    const info = AddressInfo.fromString(addr).toJSON();

    //if (info.address.length > 10) info.errors = [2, 8];

    this.setState(info);

    return info.errors;
  }

  getError() {
    return this.state.error;
  }

  onChange(addr) {
    this.updateAddress(addr);
  }

  onKeyUp(text) {
    this.updateAddress(text);
  }

  render() {
    const { containerStyle, inputStyle, statusStyle, errorStyle } = this.props;
    const { type, network } = this.props;

    const istyle = inputStyle ? { ...inputStyle } : {};
    const estyle = errorStyle ? { ...errorStyle } : {};

    let statusPanel = '';

    // status panel
    if (network && this.state.network)
      statusPanel += ` Network=${this.state.network}`;

    if (type && this.state.type) statusPanel += ` Type=${this.state.type}`;
    if (this.state.encoding) statusPanel += ` Enc=${this.state.encoding}`;

    // TODO: Fix temporary styles
    if (this.state.error) istyle.borderColor = '#900';

    // We got ourselves an address.
    if (!this.state.error && this.final) istyle.borderColor = '#090';

    const { address, errors } = this.state;
    const error = this.getError();
    const content = address;

    return (
      <div style={containerStyle}>
        <ErrorInput
          style={istyle}
          content={content}
          onChange={this.onChange}
          errors={errors}
        />
        <div style={statusStyle}>{statusPanel}</div>
        <div style={estyle}>{error}</div>
      </div>
    );
  }

  static get propTypes() {
    return {
      // try to detect chain (btc, bch, hsk)
      chain: PropTypes.bool,

      // try to detect network (mainnet, testnet, regtest, simnet)
      network: PropTypes.bool,

      // try to detect type (p2wpkh, p2wsh, p2kh, p2sh)
      type: PropTypes.bool,

      // try to detect errors (up to 2 errors in an address)
      errors: PropTypes.bool,

      // TODO: styling
      containerStyle: PropTypes.object,
      inputStyle: PropTypes.object,
      statusStyle: PropTypes.object,
      errorStyle: PropTypes.object
    };
  }
}

AddressInput.defaultProps = {
  chain: true,
  network: true,
  type: true,
  errors: true,

  containerStyle: {
    width: '500px',
    height: '100px'
  },
  inputStyle: {
    width: '500px',
    height: '50px',
    border: '1px solid black',
    backgroundColor: 'grey',
    fontSize: '14px'
  },
  statusStyle: {
    width: '350px',
    height: '50px',
    fontSize: '1em'
  },
  errorStyle: {
    color: 'darkred'
  }
};

// TODO:
//function themeProvider() {
//}

//function emptyDispatch() {
//  return {};
//}

//export default connect(themeProvider, emptyDispatch)(AddressInput);

export default AddressInput;
