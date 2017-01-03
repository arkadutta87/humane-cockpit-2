import React from 'react';
import FluxControllerMixin from 'reactjs-web-boilerplate/lib/app/flux/FluxControllerMixin';
import _ from 'lodash';
import QueryString from 'qs';
import Store from './../DashBoardStore';

const DashboardStoreKey = 'DashboardStore';

let component = React.createClass({

    mixins: [FluxControllerMixin],

    render() {

        return (<div className="row data-unavailable"><h2>Data un-available . To use this visualization contact admin.</h2></div>
        );
    }

});

export default component;