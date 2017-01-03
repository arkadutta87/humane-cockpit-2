import React from 'react';
import FluxControllerMixin from 'reactjs-web-boilerplate/lib/app/flux/FluxControllerMixin';
import _ from 'lodash';
import QueryString from 'qs';
import Store from './../DashBoardStore';

const DashboardStoreKey = 'DashboardStore';

let component = React.createClass({

    mixins: [FluxControllerMixin],

    render() {

        return (<div className="row data-unavailable"><h2>This page will be live very soon. Stay tuned.</h2></div>
        );
    }

});

export default component;