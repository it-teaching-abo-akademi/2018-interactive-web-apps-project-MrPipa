import React, { Component } from 'react';
import { getGuid } from "../utils";

class Button extends Component {
    constructor(props) {
        super(props);
        this.state = {
            function: props.function
        };
    }
    eventClick(e) {
        this.state.function(e);
    }
    render() {
        return (
            <button
                className="btn"
                key={getGuid()}
                value={this.props.value}
                onClick={this.eventClick.bind(this)}>
                {this.props.label}
            </button>
        );
    }
}
export default Button;