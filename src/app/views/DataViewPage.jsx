import _ from 'lodash';
import React from 'react';
import Immutable from 'immutable';
import QueryString from 'qs';

import FluxControllerMixin from 'reactjs-web-boilerplate/lib/app/flux/FluxControllerMixin';

import NavBarContainer from 'reactjs-web-boilerplate/lib/app/components/NavBarContainer';
import LeftSection from 'reactjs-web-boilerplate/lib/app/components/LeftSection';
import MidSection from 'reactjs-web-boilerplate/lib/app/components/MidSection';

import {default as DataViewStore} from './DataViewStore';

const DataRow = (props) =>
  (<tr>
      {props.viewConfig.get('fields').map(field => field.valueSeq().map((value, index) => <td key={index}>{props.data.get(value)}</td>))}
  </tr>);

DataRow.propTypes = {
    viewConfig: React.PropTypes.object.isRequired
};

const DataView = (props) => {
    if (!props.data) {
        return (<noscript/>);
    }

    const viewConfig = props.viewConfig;

    const results = props.data.get('results') && props.data.get('results').map(result =>
        (<DataRow data={result} key={result.get('unicode')} viewConfig={viewConfig}/>));

    return (<table className="value-list bordered centered">
        <thead>
        <tr>
            {viewConfig.get('fields').map(field => field.keySeq().map((key, index) => <th key={index}><h6>{key}</h6></th>))}
        </tr>
        </thead>
        <tbody>
        {results}
        </tbody>
    </table>);
};

DataView.propTypes = {
    viewConfig: React.PropTypes.object.isRequired
};

const Heading = (props) => {
    const viewConfig = props.viewConfig;

    return (<div className="section heading">
        <table className="params">
            <tbody>
            <tr>
                <td className="param-key">Data</td>
                <td>-</td>
                <td className="param-value">{viewConfig.get('name')}</td>
            </tr>
            <tr>
                <td className="param-key">Type</td>
                <td>-</td>
                <td className="param-value">{_.capitalize(viewConfig.getIn(['params', 'type']))}</td>
            </tr>
            <tr>
                <td className="param-key">Filters</td>
                <td>-</td>
                <td className="param-value">{JSON.stringify(viewConfig.getIn(['params', 'filter']))}</td>
            </tr>
            </tbody>
        </table>
        <div className="time-taken">
            Total Results: {props.data.get('totalResults')}, Total Time: {props.data.get('totalTimeTaken')}ms, Service Time: {props.data.get('serviceTimeTaken')}ms
        </div>
    </div>);
};

Heading.propTypes = {
    viewConfig: React.PropTypes.object.isRequired
};

const Notes = (props) => {
    const notes = props.viewConfig.get('notes');
    if (!notes) {
        return <noscript/>;
    }

    return (<div className="notes section">
        <h6>Please note:</h6>
        <ol>
            {notes.map((note, index) => <li key={index}>{note}</li>)}
        </ol>
    </div>);
};

Notes.propTypes = {
    viewConfig: React.PropTypes.object.isRequired
};

const StoreKey = 'DataViewStore';

export default React.createClass({
    propTypes: {
        params: React.PropTypes.object,
        location: React.PropTypes.object
    },

    mixins: [FluxControllerMixin],

    getInitialState() {
        this.getFluxController().createStore(DataViewStore, StoreKey);
        this.registerStore(StoreKey);

        return {
            data: this.getStoreData(StoreKey),
            viewConfig: this.viewConfig()
        };
    },

    componentDidMount() {
        const query = QueryString.parse(this.props.location.search.replace(/^\?/, ''), {allowDots: true});

        const apiParams = _.extend({type: this.props.params.type}, {filter: query.filter});

        this.store().load(Immutable.fromJS(apiParams));
    },

    store() {
        return this.getStore(StoreKey);
    },

    topBar() {
        return (<div className="top-bar center-align middle-align">
            <h5 className="page-title">{this.getAppProperties().get('cockpitName', 'Cockpit')} - Data View</h5>
        </div>);
    },

    viewConfig() {
        const viewKey = this.props.location.query.__view_key__;
        const viewType = this.props.location.query.__view_type__;

        let matchingViewConfig = null;

        // find out the view of same type and key
        const findMatchingView = function (items) {
            items.forEach(viewConfig => {
                if (viewConfig.get('type') === 'group') {
                    // we recursively go inside
                    return findMatchingView(viewConfig.get('items'));
                } else if (viewConfig.get('type') === viewType && viewConfig.get('key') === viewKey) {
                    // we got a match - short circuit by returning false
                    matchingViewConfig = viewConfig;
                    return false;
                }

                return true;
            });
        };

        findMatchingView(this.getAppProperties().get('views'));
        return matchingViewConfig;
    },

    render() {
        return (<div className="page-content data-view-page">
            <header>
                <NavBarContainer>
                    {this.topBar()}
                </NavBarContainer>
            </header>
            <main>
                <div className="row">
                    <LeftSection/>
                    <MidSection>
                        <Heading data={this.state.data} viewConfig={this.state.viewConfig}/>
                        <Notes data={this.state.data} viewConfig={this.state.viewConfig}/>
                        <DataView data={this.state.data} viewConfig={this.state.viewConfig}/>
                    </MidSection>
                </div>
            </main>
        </div>);
    }
});