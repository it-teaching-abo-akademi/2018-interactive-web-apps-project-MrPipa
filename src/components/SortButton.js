import React, { Component } from 'react';

class SortButton  extends Component {
    constructor(props) {
        super(props);
        this.state = {
            sortDir: "none",
            sortDirArrow: ""
        }
    }
    eventClicked() {
        let sortDir = this.state.sortDir;
        if (sortDir === "none") {
            sortDir = "desc";
        }
        else if (sortDir === "desc") {
            sortDir = "asc";
        }
        else {
            sortDir = "none";
        }
        this.setSortDirArrow(sortDir);
    }
    setSortDirArrow(sortDir) {
        let state = this.state;
        state.sortDir = sortDir;
        if (sortDir === "desc") {
            state.sortDirArrow = ' ↓';
        }
        else if (sortDir === "asc") {
            state.sortDirArrow = ' ↑';
        }
        else {
            state.sortDirArrow = '';
        }
        this.setState(state);
        this.props.alertSorted(this.props.value, this.state.sortDir);
    }

    render() {
        return(
            <div className={"SortButton"} onClick={this.eventClicked.bind(this)}>
                {this.props.label}{this.state.sortDirArrow}
            </div>
        )
    }
}
export default SortButton;