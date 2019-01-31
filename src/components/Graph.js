import React, { Component } from 'react';
import Button from "./Button";
import LineChart from 'react-linechart'; // react-linechart
import moment from 'moment'; // moment
import '../../node_modules/react-linechart/dist/styles.css';
import 'react-datepicker/dist/react-datepicker.css';

import { Row } from 'react-bootstrap';   // react-bootstrap

import { getDate } from "../utils";
class Graph extends Component{
    constructor(props) {
        super(props);
        this.renderNow = this.props.renderNow;
        this.closeGraphCallback = this.props.closeGraph;
        //todo Determine what xDisplay function to use and add it to state.

        this.state = {
            name: this.props.name,
            data: this.props.data,
            startDate: moment(this.props.startDate),
            endDate: moment(this.props.endDate),
            interval: this.props.startDate + " - " + this.props.endDate,
            intervalType: this.props.intervalType,
        };
    }
    componentDidMount() {
        this.props.renderNow();
    }
    closeGraph() {
        this.closeGraphCallback();
    }
    handleStartChange(date) {
        let state = this.state;
        if (date>state.endDate) {
            alert("Start date can not be after end date");
            this.forceUpdate();
        }
        else {
            state.startDate = date;
            this.setState(state);
            let data = this.props.intervalChanged([date.format("YYYY-MM-DD"), this.state.endDate.format("YYYY-MM-DD")]);
            state.data = data;
            this.setState(state);
        }
    }
    handleEndChange(date) {
        let state = this.state;
        if (date<state.startDate) {
            alert("End date can not be before start date");
            this.forceUpdate();
        }
        else {
            state.endDate = date;
            this.setState(state);
            let data = this.props.intervalChanged([this.state.startDate.format("YYYY-MM-DD"), date.format("YYYY-MM-DD")]);
            state.data = data;
            this.setState(state);
        }
    }
    render() {
        if ( this.props.intervalType === "day" ) {
            return (
                <div className="graphContainer">
                    <Row>
                        <h1>{this.state.name}</h1>
                        <h3>Performance graph ({this.state.interval})</h3>
                        <h3>{"Intraday"}</h3>
                    </Row>
                    <Row>
                        <LineChart
                            width={800}
                            height={400}
                            xLabel={"Time"}
                            yLabel={"Closing value (USD)"}
                            data={this.state.data}
                            hidePoints={true}
                            pointRadius={0.5}
                            showLegends={true}
                            isDate={true}
                            xDisplay={getDate}
                        />
                    </Row>
                    <Row>
                        <Button function={this.closeGraph.bind(this)} className="closeGraphbtn" label="Close"/>
                    </Row>
                </div>
            );
        }
        else {
            return (
                <div className="graphContainer">
                    <Row>
                        <h1>{this.state.name}</h1>
                        <h3>Performance graph ({this.state.interval})</h3>
                        <h3>{"Intraday"}</h3>
                    </Row>
                    <Row>
                        <LineChart
                            width={800}
                            height={400}
                            xLabel={"Point"}
                            yLabel={"Closing value (USD)"}
                            data={this.state.data}
                            hidePoints={true}
                            pointRadius={0.5}
                            showLegends={true}
                            isDate={false}
                            xDisplay={null}
                        />
                    </Row>
                    <Row>
                        <Button function={this.closeGraph.bind(this)} label="Close"/>
                    </Row>
                </div>
            );
        }
    }
}
export default Graph;
