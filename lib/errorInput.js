import React, { Component } from 'react';
import PropTypes from 'prop-types';

class ErrorInput extends Component {
  constructor(props) {
    super(props);

    this.ref = React.createRef();
    this.onKeyUp = this.onKeyUp.bind(this);
  }

  onKeyUp(e) {
    if (this.props.onChange) this.props.onChange(e.target.value);
  }

  render() {
    const { style, errors, errorStyle } = this.props;
    const content = this.props.content;
    const measureStyles = {
      ...style,
      width: '',
      height: '',
      position: 'absolute',
      visibility: 'hidden'
    };

    const errorElements = errors.map((pos, k) => {
      const positions = calculatePosition(this.ref, content, pos);
      const position = { position: 'relative' };
      const style = { ...errorStyle, ...positions, ...position };

      return <div style={style} key={k} />;
    });

    return (
      <div>
        <input defaultValue={content} style={style} onKeyUp={this.onKeyUp} />
        <span ref={this.ref} style={measureStyles} />
        {errorElements}
      </div>
    );
  }

  static get propTypes() {
    return {
      onChange: PropTypes.func,
      content: PropTypes.string,
      style: PropTypes.object,
      errorStyle: PropTypes.object,
      errors: PropTypes.array
    };
  }
}

ErrorInput.defaultProps = {
  content: '',
  style: {
    backgroundColor: 'white',
    width: '300px',
    height: '50px',
    borderColor: 'grey',
    borderSize: '1px',
    margin: '0px',
    padding: '1px'
  },
  errorStyle: {
    width: '10px',
    height: '2px',
    backgroundColor: 'red'
  }
};

function calculatePosition(ref, address, pos) {
  const span = ref.current;

  span.innerHTML = address.substring(0, pos);

  const rect = span.getBoundingClientRect();
  const width = Math.floor(rect.width);

  return {
    left: `${width}px`,
    top: '-17px'
  };
}

export default ErrorInput;
