import React, { Component } from 'react';

class Stock extends Component{
    renderNow = undefined;
    constructor(props) {
        super(props);
        this.renderNow = this.props.renderNow;
        this.state = {
            id: this.props.id,
            updateSelected: this.props.updateSelected,
            getcurrency: this.props.getcurrency,
            name: this.props.name.toUpperCase(),
            unit_value: this.props.unit_value,
            unit_display_value: this.props.unit_display_value,
            quantity: this.props.quantity,
            total_value: (parseFloat(this.props.unit_display_value)*parseFloat(this.props.quantity)).toFixed(2),
            selected: false
        };
    }

    componentDidMount() {
        this.renderNow();
    }

    UNSAFE_componentWillReceiveProps(nextProps) {   // Magic of React
        let state = this.state;
        state.unit_value = nextProps.unit_value;
        state.unit_display_value = nextProps.unit_display_value;
        state.total_value = (state.unit_display_value*state.quantity).toFixed(2);
        this.setState(state);
    }

    onChange(e) {
        let state = this.state;
        state.selected = e.target.checked;
        this.setState(state);
        this.state.updateSelected(this.state.id, this.state.selected);
    }
    render() {
        return(
            <tr>
                <td>{this.state.name.toUpperCase()}</td>
                <td>{this.state.unit_display_value}</td>
                <td>{this.state.quantity}</td>
                <td>{this.state.total_value}</td>
                <td><input type='checkbox' onChange={this.onChange.bind(this)} checked={this.state.selected} value={this.key}/></td>
            </tr>
        );
    }
}
export default Stock;
