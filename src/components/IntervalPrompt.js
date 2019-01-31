import React, { Component } from 'react';
import Button from "./Button";

import moment from 'moment'; // moment
import DatePicker from 'react-datepicker'; // react-datepicker
import 'react-datepicker/dist/react-datepicker.css';

import { Row } from 'react-bootstrap';   // react-bootstrap

class IntervalPrompt extends Component {
    constructor(props) {
        super(props);
        let today = moment();

        this.state = {
            startDate: today,
            endDate: today,
        };
    }
    callback(e) {
        let startDate = this.state.startDate.format("YYYY-MM-DD");
        let endDate = this.state.endDate.format("YYYY-MM-DD");
        this.props.callBack([startDate, endDate]);
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
        }
    }
    handleEndChange(date) {
        let state = this.state;
        if (date<state.endDate) {
            alert("End date can not be before start date");
            this.forceUpdate();
        }
        else {
            state.endDate = date;
            this.setState(state);
        }
    }
    closePrompt() {
        this.props.callBack("close");
    }
    render() {
        return(
            <div className="intervalprompt">
                
                <div className="ip-inner">
                    <Row>
                        <span>Pick start date</span>
                        <DatePicker
                            selected={this.state.startDate}
                            onChange={this.handleStartChange.bind(this)}
                        />
                    </Row>
                    <Row>
                        <span>Pick end date</span>
                        <DatePicker
                            selected={this.state.endDate}
                            onChange={this.handleEndChange.bind(this)}
                        />
                    </Row>
                    <Row>
                        <Button function={this.callback.bind(this)} label={"Ok"}/>
                        <Button function={this.closePrompt.bind(this)} label={"Cancel"}/>
                    </Row>
                </div>
            </div>
        );

    }
}
export default IntervalPrompt;