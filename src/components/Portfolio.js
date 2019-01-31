import React, { Component } from 'react';
import Button from "./Button";
import SortButton from "./SortButton";
import IntervalPrompt from "./IntervalPrompt";
import Stock from "./Stock";

import { Row, Col } from 'react-bootstrap';   // react-bootstrap

import { getGuid, getStockData, getEuroValue } from "../utils";

let sortWorking = false;

let currency = "EUR";
let euroSymbol = "€";
let dollarSymbol = "$";
let MAX_STOCKS = 50;


class Portfolio extends Component {
    updatePortfolio = undefined;
    deleteThis      = undefined;
    setGraph        = undefined;
    loaded          = false;
    

    constructor(props) {
        
        super(props);
        this.deleteThis      = this.props.deletePortfolio;
        this.updatePortfolio = this.props.updatePortfolio;
        this.setGraph     = this.props.setGraph;
        this.state = {
            name:        this.props.name,
            currency:    currency,
            id:          this.props.id,
            originaljsStocksOrder: this.props.jsStocks,
            jsStocks:    this.props.jsStocks,
            showStocks: this.showStocks,
            total_value: 0.0,
            selected:    [],
            sortDirections: {
                symbol: "none",
                unit_value: "none",
                quantity: "none",
                total_value: "none"
            }
        };
        this.loaded = true;
    }

    componentDidMount() {
        //Don't try to setState() before component is properly mounted.
        if (this.state.jsStocks !== undefined) {
            this.updateToShow();
        }
    }
    stockSpaceAvailable(symbol) {
        if (this.state.jsStocks === undefined) {
            let state = this.state;
            state.jsStocks = {};
            this.setState(state);
            return true;
        }
        if (Object.keys(this.state.jsStocks).length < MAX_STOCKS) {
            return true;
        }
        else {
            let names = [];
            Object.keys(this.state.jsStocks).forEach(function(key) {
                let name = this.state.jsStocks[key].name;
                if (names.indexOf(name) < 0) { //If not in list add it
                    names.push(name);
                }
            }.bind(this));
            if (names.length < MAX_STOCKS) {
                return true;
            }
            if (names.length >= MAX_STOCKS && names.indexOf(symbol) >= 0) {
                return true;
            }
            return false;
        }
    }
    addStockPrompt() {
        let symbol;
        while( symbol === undefined || symbol === "" ) {
            symbol = prompt("Enter stock symbol:");
            if(symbol === null) { // User presses cancel
                return;
            }
        }
        let quantity = "";
        while( quantity === undefined || quantity === "" ) {
            quantity = prompt("Enter amount of shares of "+ symbol + ":");
            if(quantity === null) { // User presses cancel
                return;
            }
            try{ quantity = parseFloat(quantity) }
            catch(Exception){ quantity = undefined }
        }
        try{
            getStockData(this.addStock.bind(this), symbol, quantity);
        }catch(e) {
            alert("That's not a valid input");
        }


    }
    addStock(jsonObj, quantity) {
        if (Object.keys(jsonObj)[0] === "Error Message") {
            alert("Could not find a stock with that symbol. Double check and try again.");
        }
        else {
            let state = this.state;
            let name = Object.values(jsonObj['Meta Data'])[1]; // The symbol
            if (!this.stockSpaceAvailable(name)) {
                alert("You have reached the maximum of 50 stocks per portfolio");
                return;
            }
            let firstVal = Object.values(jsonObj['Time Series (1min)'])[0]; //First row of the time series
            let latestClose = firstVal['4. close']; //The close value of the first row (most recent)
            let oldValue = state.total_value;
            let id = getGuid();
            state.total_value = (parseFloat(oldValue) + parseFloat(latestClose)*parseFloat(quantity)).toFixed(2);

            //Reacty part. The <Stock /> still needs to be created but only when showing.
            let jsStocks = state.jsStocks;
            if (jsStocks === undefined) {
                jsStocks = {};
                jsStocks[id] = {
                    id: id,
                    name: name,
                    unit_value: latestClose,
                    quantity: quantity
                };
                state.jsStocks = jsStocks;
            }
            else {
                jsStocks[id] = {
                    id: id,
                    name: name,
                    unit_value: latestClose,
                    quantity: quantity
                };
                state.jsStocks = jsStocks;
            }
            this.setState(state);
            //Since we now changed this Portfolio we need to pass the information up!
            //that is done in the end of updateToShow
            this.updateToShow();
        }
    }
    perfGraph() {
        this.props.setPrompt(<IntervalPrompt callBack={this.intervalPromptCallback.bind(this)}/>);
    }
    intervalPromptCallback(info) {
        if (info === "close") {
            this.props.setPrompt(undefined);
        }
        else {
            this.props.setPrompt(undefined);
            let state = this.state;
            this.setGraph([this.state.name, state.jsStocks, info]);
        }
    }
    deletePortfolio() {
        let input = window.confirm("Are you sure you want to delete this portfolio?");
        if (input) {
            this.deleteThis(this.state.id);
        }
    }
    showEuro() {
        this.updateCurrency("EUR");
    }
    showDollar() {
        this.updateCurrency("USD");
    }
    updateCurrency(currency) {
        let state = this.state;
        state.currency = currency;
        this.setState(state);
        this.updateToShow();
    }
    updateStocks(stocks, newTotalValue) {
        let state = this.state;
        state.jsStocks = stocks;
        state.total_value = newTotalValue;

        this.setState(state);
        this.updateToShow();
    }
    renderNow() {
        this.forceUpdate();
    }
    updateToShow() {
        let state = this.state;
        let jsStocks = state.jsStocks;
        let showStocks = [];
        let getcurr = this.getCurrency.bind(this);
        let updateSelected = this.setSelected.bind(this);
        let multiplier = 0;
        let totalValue = 0;

        if (jsStocks !== undefined) {
            totalValue = this.getTotalValue(jsStocks);
            if (state.currency === "EUR") {
                multiplier = getEuroValue();
                if(multiplier === 0.0){
                    multiplier = parseFloat(localStorage.euroValue); // exchangerate hasn't updated yet, use value from cookie
                    if(multiplier === undefined || multiplier === 0.0){
                        return; // exchangerate could not be found, abort and update later
                    }
                }
            }
            else {
                multiplier = 1.0; // Use USD
            }
        }
        totalValue = (totalValue * multiplier).toFixed(2);

        //For each stock in jsStocks create a <Stock/> to push to the showStocks list
        Object.keys(jsStocks).forEach(function(key) {
            let stock = jsStocks[key];
            let unit_value = stock.unit_value;
            let unit_display_value = (unit_value * multiplier).toFixed(2);
            //let total_stock_value = unit_display_value * stock.quantity;
            let id = stock.id;
            let newStock = <Stock
                updateSelected = {updateSelected}
                getcurrency = {getcurr}
                key = {id}
                id = {id}
                name = {stock.name.toUpperCase()}
                unit_value = {unit_value}
                unit_display_value = {unit_display_value}
                quantity = {stock.quantity}
                renderNow = {this.renderNow.bind(this)}
                />;
            showStocks.push(newStock);
        }.bind(this));

        //Update state, forcing rerender
        state.showStocks = showStocks;
        state.total_value = totalValue;
        this.setState(state);

        //Since this is the last stop for all modifying functions in this class we pass the change up at this point.
        this.passItUp();
    }
    passItUp() {
        let state = this.state;
        let save = {
            name: state.name,
            id: state.id,
            currency: state.currency,
            jsStocks: state.jsStocks,
            total_value: state.total_value,
        };
        this.updatePortfolio(save);
    }
    getCurrency() {
        return this.state.currency;
    }
    getTotalValue(jsStocks) {
        let totalValue = 0;
        Object.keys(jsStocks).forEach(function(key) {
            let current = jsStocks[key];
            totalValue += parseFloat(current.quantity)*parseFloat(current.unit_value);
        });
        return totalValue;
    }
    setSelected(key, bool) {
        let state = this.state;
        let selected = this.state.selected;
        if (bool) {
            //The stock with this key is now selected
            //Add it to the list
            selected.push(key);
            state.selected = selected;
            this.setState(state);
        }
        else {
            //The stock with this key is now unselected
            //Remove it from the list
            let index = selected.indexOf(key);
            selected.splice(index, 1);
            state.selected = selected;
            this.setState(state);
        }
    }
    removeSelected() {
        let jsStocks = this.state.jsStocks;
        let selected = this.state.selected;
        let i = selected.length;
        while(i--) { // eslint-disable-next-line
            Object.keys(jsStocks).forEach(function(key) {
                if (selected[i] === key) {
                    delete jsStocks[key];
                    selected.splice(selected.indexOf(key), 1);
                }
            });
        }
        this.updateStocks(jsStocks, this.getTotalValue(jsStocks));
    }
    sortStocks(label, direction) {
        let state = this.state;
        let jsStocks = state.jsStocks;
        let sorted = {};

        //Sort ascending
        if (direction === "asc") {
            //While length of sorted is less than that of jsStocks
            while(Object.keys(sorted).length < Object.keys(jsStocks).length) {
                //For each stock in jsStocks
                Object.keys(jsStocks).forEach(function(key) {
                    let stock = jsStocks[key];
                    Object.keys(sorted).forEach(function(sortedStock) {
                        if (stock[label] >= sortedStock[label]) {
                            sorted[sorted.indexOf(sortedStock) +1] = stock;
                        }
                    });
                });
            }
        //Sort descending
        }
        else if (direction === "desc") {
            //While length of sorted is less than that of jsStocks
            while(Object.keys(sorted).length < Object.keys(jsStocks).length) {
                //For each stock in jsStocks
                Object.keys(jsStocks).forEach(function (key) {
                    let stock = jsStocks[key];
                    Object.keys(sorted).forEach(function(sortedStock) {
                        if (stock[label] < sortedStock[label]) {
                            sorted[sorted.indexOf(sortedStock) +1] = stock;
                        }
                    });
                });
            }
        }
        state.jsStocks = sorted;
        this.setState(sorted);
    }
    alertSort(label, direction) {
        if (sortWorking) {
            //Set all directions to "none" and set this one to {direction}
            let state = this.state;
            state.sortDirections.symbol = "none";
            state.sortDirections.unit_value = "none";
            state.sortDirections.quantity = "none";
            state.sortDirections.total_value = "none";
            state.sortDirections[label] = direction;
            this.setState(state);
            if (direction !== "none") {
                this.sortStocks(label, direction);
            }
        }
    }
    render() {
        let currencySymbol = dollarSymbol;
        if (this.state.currency === "EUR") {
            currencySymbol = euroSymbol;
        }
        return (
            <Col xs={12} md={6} >
                <div className="pf-container">
                    <Row className="pf-header">
                        <Col xs={5}>
                            <span className="pf-title">{this.props.name}</span>
                        </Col>
                        <Col xs={7}>
                            <Button function={this.showDollar.bind(this)} className="tile" label="USD"/>
                            <Button function={this.showEuro.bind(this)} className="tile" label="EUR"/>
                            <Button function={this.deletePortfolio.bind(this)} className="tile" label="Remove"/>
                        </Col>
                    </Row>
                    <Row>
                        <table>
                            <thead>
                            <tr>
                                <th>
                                    <SortButton
                                        label={"Stock"}
                                        value={"symbol"}
                                        alertSorted={this.alertSort.bind(this)}
                                        direction={this.state.sortDirections.symbol}
                                    />
                                </th>
                                <th>
                                    <SortButton
                                        label={"Value/Unit"}
                                        value={"unit_value"}
                                        alertSorted={this.alertSort.bind(this)}
                                        direction={this.state.sortDirections.unit_value}
                                    />
                                </th>
                                <th>
                                    <SortButton
                                        label={"Quantity"}
                                        value={"quantity"}
                                        alertSorted={this.alertSort.bind(this)}
                                        direction={this.state.sortDirections.quantity}
                                    />
                                </th>
                                <th>
                                    <SortButton
                                        label={"Value"}
                                        value={"total_value"}
                                        alertSorted={this.alertSort.bind(this)}
                                        direction={this.state.sortDirections.total_value}
                                    />
                                </th>
                                <th>
                                    Select
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                                {this.state.showStocks}
                            </tbody>
                        </table>
                    </Row>
                    <Row>
                        <Button function={this.addStockPrompt.bind(this)} label="Add stock"/>
                        <Button function={this.perfGraph.bind(this)} label="Performance graph"/>
                        <Button function={this.removeSelected.bind(this)} label="Remove selected"/>
                        <p><label> Total value: {this.state.total_value}{currencySymbol} </label></p>
                    </Row>
                </div>
            </Col>
           
        );
    }
}

export default Portfolio;