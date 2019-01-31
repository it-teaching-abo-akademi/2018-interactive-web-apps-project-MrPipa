import React, { Component } from 'react';

import Button from "./components/Button";
import Graph from "./components/Graph";
import Portfolio from "./components/Portfolio";

import { Grid, Row } from 'react-bootstrap';   // react-bootstrap

import { getGuid, 
    getStockData, 
    getExchangeRateUSDtoEUR, 
    storageAvailable, 
    daysDifference, 
    xhttpRequest, 
    getRandomColor,
    setEuroValue,
    getEuroValue,
    getAPIKey
 } from "./utils"; // Global methods/functions
import './App.css'; // Global CSS

let API_KEY = getAPIKey();

class App extends Component {
    loaded = false;
    graphDataStorage = [];

    constructor(props) {
        super(props);
        let portfolios = [];
        let jsPortfolios = {};

        this.state = {
            portfolios: portfolios,
            jsPortfolios: jsPortfolios,
            graph: undefined,
            graphLines: [],
            graphLinesTotal: 0,
            graphLinesCount: 0
        }
    }

    // #region Update functions
    updateEuroExchangeRate(jsonObj) {
        if (jsonObj["Realtime Currency Exchange Rate"] !== undefined) {
            setEuroValue(jsonObj["Realtime Currency Exchange Rate"]["5. Exchange Rate"]);
        }
        else {
            console.log("Could not get data from API");
        }
        localStorage.euroValue = getEuroValue();

        this.updateUnitValues();

        this.forceUpdate();
    }
    updateUnitValues() {
        let jsPortfolios = this.state.jsPortfolios;
        let nameList = [];
        //For each portfolio
        Object.keys(jsPortfolios).forEach(function(pkey) {
            let jsPortfolio = jsPortfolios[pkey].jsStocks;
            //For each stock
            Object.keys(jsPortfolio).forEach(function(skey) {
                let stock = jsPortfolio[skey];
                let name = stock.name;
                //If stock not in list of stocknames
               if (nameList.indexOf(name) < 0) {
                   //Add stock to list
                   nameList.push(name);
               }
            });

        });
        //For each stockname in list
        nameList.forEach(function(name) {
            //Fetch current unit value with updateUnitValue as callback function.
            getStockData(this.updateUnitValue.bind(this), name, null);
        }.bind(this));
    }
    updateUnitValue(jsonObj) {
        if (jsonObj['Meta Data'] === undefined) { return; }

        let name = Object.values(jsonObj['Meta Data'])[1];                              // stock symbol
        let latestClose = Object.values(jsonObj["Time Series (1min)"])[0]["4. close"];  // most recent value of the stock
        let state = this.state;
        let jsPortfolios = state.jsPortfolios;

        //For each portfolio
        Object.keys(jsPortfolios).forEach(function(pkey) {
            let portfolio = jsPortfolios[pkey];
            let total_value = 0.0;
            let stocks = portfolio.jsStocks;

            //For each stock
            Object.keys(stocks).forEach(function(skey) {
                if(stocks[skey] === undefined){ return; }
                var stock = stocks[skey];
                if (stock.name === name) {
                    stock.unit_value = latestClose;
                    stocks[skey] = stock;
                }
                //Increment portfolios total value
                total_value += stock.unit_value*stock.quantity;

            });
            //Remove extra decimals
            portfolio.total_value = total_value.toFixed(2);
            //Set jsPortfolios[pkey] to the new version
            jsPortfolios[pkey] = portfolio;
        });
        state.jsPortfolios = jsPortfolios;
        //update state and local storage
        this.setState(state);
        this.updateLocalStorage();
    }
    componentDidMount() {
        //this.updateUnitValues();
        getExchangeRateUSDtoEUR(this.updateEuroExchangeRate.bind(this));  // Sets the USD to EUR exchange rate (aka. euroValue variable) when loading the page
            //This will eventually also update the stock values

        let portfolios = [];
        let jsPortfolios = {};
        if (storageAvailable("localStorage")) { // Check if cookies are enabled and if they contain portfolios
            if (localStorage.jsPortfolios !== undefined) {  // There are portfolios in the cookies
                jsPortfolios = JSON.parse(localStorage.jsPortfolios);
                Object.keys(jsPortfolios).forEach(function(key) {
                    let portfolio = <Portfolio
                        key={(jsPortfolios[key].id)}
                        id={jsPortfolios[key].id}
                        name={(jsPortfolios[key].name)}
                        setGraph={this.setGraph.bind(this)}
                        deletePortfolio={this.deletePortfolio.bind(this)}
                        updatePortfolio={this.updatePortfolio.bind(this)}
                        setPrompt={this.setPrompt.bind(this)}
                        currency={jsPortfolios[key].currency}
                        jsStocks={jsPortfolios[key].jsStocks}/>;
                    portfolios.push(portfolio);
                }.bind(this));
            }
            else {
                localStorage.portfolios = portfolios;
            }
        }
        else {
            alert("Please enable cookies for this page");
        }
        let state = this.state;
        state.portfolios = portfolios;
        state.jsPortfolios = jsPortfolios;
        this.setState(state);

        this.loaded = true;
    }
    updateLocalStorage() {
        if (this.loaded) {
            //This will probably be useless after Reactyfying
            let jsPortfolios = this.state.jsPortfolios;
            localStorage.euroValue = JSON.stringify(getEuroValue());
            localStorage.jsPortfolios = JSON.stringify(jsPortfolios);
        }
    }
    // #endregion Update functions

    // #region Portfolio
    addPortfolio() {
        if (Object.keys(this.state.jsPortfolios).length >= 10) {
            alert("You can only have 10 portfolios");
            return;
        }
        var name = prompt("Pick a name for the portfolio.");
        if (name === null || name.trim() === "") {
            alert("The name cannot be empty.");
        }
        else {
            //Get current list of portfolios, push this new portfolio to it and update the state and local storage.
            let portfolios = this.state.portfolios;
            let jsPortfolios = this.state.jsPortfolios;
            if (jsPortfolios === undefined) {
                jsPortfolios = {};
            }
            let state = this.state;
            let id = getGuid();
            let stocks = {};
            portfolios.push(<Portfolio key={id}
                                       id={id}
                                       name={name}
                                       setGraphApp={this.setGraph.bind(this)}
                                       updatePortfolio={this.updatePortfolio.bind(this)}
                                       deletePortfolio={this.deletePortfolio.bind(this)}
                                       setPrompt={this.setPrompt.bind(this)}
            />);
            state.portfolios = portfolios;
            jsPortfolios[id] = {
                key: id,
                id: id,
                name: name,
                currency: "euro",
                stocks: stocks
            };
            this.setState(state);
            this.updateLocalStorage();
        }
    }
    updatePortfolio(portfolio) {
        let state = this.state;
        state.jsPortfolios[portfolio.id] = portfolio;
        this.setState(state);
        this.updateLocalStorage();
    }
    deletePortfolio(key) {
        //Delete the portfolio whose [X] button was just clicked.
        let state = this.state;
        let jsPortfolios = this.state.jsPortfolios;
        delete jsPortfolios[key];

        let portfolios = this.state.portfolios;
        portfolios.forEach(function(portfolio) {
           if (key === portfolio.key) {
               portfolios.splice(portfolios.indexOf(portfolio), 1);
           }
        });
        state.jsPortfolios = jsPortfolios;
        state.portfolios = portfolios;
        this.setState(state);
        this.updateLocalStorage();
    }
    // #endregion Portfolio

    // #region Graph
    setPrompt(prompt) {
        let state = this.state;
        state.prompt = prompt;
        this.setState(state);
    }
    setGraph(data) {
        let name = data[0];
        let jsStocks = data[1];
        let intervalInfo = data[2];
        let state = this.state;
        state.intervalStart = intervalInfo[0];
        state.intervalEnd = intervalInfo[1];
        state.cancelGraph = false;
        state.graphName = name;
        state.graphLines = [];
        let stockNames = [];

        //todo currently adds same symbol multiple times.
        //Grab names of the stocks
        Object.keys(jsStocks).forEach(function(key) {
            let name = jsStocks[key].name;
            if (stockNames.indexOf(name) < 0) { //If not in list add it
                stockNames.push(name);
            }
        });
        state.graphLinesTotal = stockNames.length;
        state.graphLinesCount = 0;
        this.setState(state);
        let intervalSize = daysDifference(state.intervalStart, state.intervalEnd);
        //For each stock name get the data
        stockNames.forEach(function(name) {
            let url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol="+name+"&outputsize=compact&apikey=" + API_KEY;
            state.intervalType = "day";
            this.setState(state);
            if (intervalSize > 80) { //There are weekends and holidays and stuff so it can't be 100 (80 is just a guess).
                url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol="+name+"&outputsize=full&apikey=" + API_KEY;
            }
            else if (intervalSize === 0) {
                state.intervalType = "intraday";
                this.setState(state);
                //intraday 15 min interval; compact because there's only 96 15min intervals in a day.
                url = "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol="+name+"&interval=15min&outputsize=compact&apikey=" + API_KEY;
            }
            xhttpRequest(this.addGraphData.bind(this), url, null);
        }.bind(this));
        state.graph = <div>
                          <Button function={this.closeGraph.bind(this)} className="closeGraphButton" label="Close"/>
                      </div>;
        this.setState(state);
    }
    addGraphData(jsonObj) {
        //If the client hasn't pressed the X to cancel the graph, then do the following.
        if (!this.state.cancelGraph) {
            let state = this.state;
            if (jsonObj["Meta Data"] === undefined) {
                alert("Could not get data from API, try again.");
                state.graph = undefined;
                this.setState(state);
                return;
            }

            let symbol = jsonObj["Meta Data"]["2. Symbol"];
            let timeSeries = null;
            if (state.intervalType === "day") {
                timeSeries = jsonObj["Time Series (Daily)"];
            }
            else {
                timeSeries = jsonObj["Time Series (15min)"];
            }

            let color = getRandomColor();
            let points = [];
            state.graphLinesCount = state.graphLinesCount + 1;

            //For each value in the time series, get the date and the closing value and make a JSON point of it.
            //Then add that point to the list of points.
            let counter = 1;
            Object.keys(timeSeries).forEach(function(key) {
                let date = key;
                let startDiff = daysDifference(date, state.intervalStart);
                let endDiff = daysDifference(state.intervalEnd, date);

                //Check if it's within the interval
                if (state.intervalType === "day") {
                    if (startDiff > 0 || endDiff > 0) {
                        //Not adding
                    }
                    else {
                        let close = timeSeries[key]["4. close"];
                        let jsPoint = {x: date, y: parseFloat(close)};
                        points.push(jsPoint);
                    }
                }
                else {
                    //Intraday stuff has to be same day but since we fetch more 15 min intervals than fit in a day
                    // there will also be other days included so we better remove those.
                    let close = timeSeries[key]["4. close"];
                    let jsPoint = {x: counter, y: parseFloat(close)};
                    points.push(jsPoint);
                    counter++;
                }

            });
            points.reverse();
            //Push this line to the list of graph lines in state.
            state.graphLines.push({
                name: symbol.toUpperCase(),
                color: color,
                points: points
            });

            //Only create the graph when the final value has arrived.
            if (state.graphLinesCount === state.graphLinesTotal) {
                state.graph = <Graph
                                startDate={this.state.intervalStart}
                                endDate={this.state.intervalEnd}
                                intervalType={this.state.intervalType}
                                name={state.graphName}
                                data={state.graphLines}
                                renderNow={this.renderNow.bind(this)}
                                closeGraph={this.closeGraph.bind(this)}/>;
            }
            this.setState(state);
        }
    }
    closeGraph() {
        let state = this.state;
        state.graph = undefined;
        state.cancelGraph = true;
        this.setState(state);
    }
    // #endregion Graph

    // #region Render
    renderNow() {
        this.forceUpdate();
    }
    render() {
        if (this.state.graph !== undefined) {
            return (
                <Grid>
                    <Row className="header">
                        <Row>
                            <span>Stock portfolio Manager</span>
                        </Row>
                        <Row>
                            <Button function={this.addPortfolio.bind(this)} label="Add portfolio"/>
                        </Row>
                    </Row>
                    <Row>
                        {this.state.graph}
                    </Row>
                </Grid>
            );
        }
        else if (this.state.prompt !== undefined) {
            return (
                <Grid>
                    <Row className="header">
                        <Row>
                            <span>Stock portfolio Manager</span>
                        </Row>
                        <Row>
                            <Button function={this.addPortfolio.bind(this)} label="Add portfolio"/>
                        </Row>
                    </Row>
                    <Row>
                        {this.state.portfolios}
                        {this.state.prompt}
                    </Row>
                </Grid>
            );
        }
        else {
            return (
                <Grid>
                    <Row className="header">
                        <Row>
                            <span>Stock portfolio Manager</span>
                        </Row>
                        <Row>
                            <Button function={this.addPortfolio.bind(this)} label="Add portfolio"/>
                        </Row>
                    </Row>
                    <Row>
                        {this.state.portfolios}
                    </Row>
                </Grid>
            );
        }
    }
    // #endregion Render
}

export default App;
