import _ from 'lodash';
import React from 'react';
import Immutable from 'immutable';
import QueryString from 'qs';

import FluxControllerMixin from 'reactjs-web-boilerplate/lib/app/flux/FluxControllerMixin';

import NavBarContainer from 'reactjs-web-boilerplate/lib/app/components/NavBarContainer';
import LeftSection from 'reactjs-web-boilerplate/lib/app/components/LeftSection';
import MidSection from 'reactjs-web-boilerplate/lib/app/components/MidSection';

import {default as ExplainSearchResultStore} from './ExplainSearchResultStore';

const StoreKey = 'TermVectorsStore';

const Heading = (props) => {
    const lang = props.data.getIn(['params', 'lang']) ||
      _.union([props.data.getIn(['params', 'filter', 'lang', 'primary'])],
        props.data.getIn(['params', 'filter', 'lang', 'secondary']) || []).join(', ');

    return (<div className="section heading">
        <table className="params">
            <tbody>
            <tr>
                <td className="param-key">Id</td>
                <td>-</td>
                <td className="param-value">{props.data.getIn(['params', 'id'])}</td>
            </tr>
            <tr>
                <td className="param-key">Query Text</td>
                <td>-</td>
                <td className="param-value">{props.data.getIn(['params', 'text'])}</td>
            </tr>
            <tr>
                <td className="param-key">Mode</td>
                <td>-</td>
                <td className="param-value">{props.data.getIn(['params', 'mode'])}</td>
            </tr>
            <tr>
                <td className="param-key">Type</td>
                <td>-</td>
                <td className="param-value">{props.data.getIn(['params', 'type'])}</td>
            </tr>
            <tr>
                <td className="param-key">Lang</td>
                <td>-</td>
                <td className="param-value">{lang}</td>
            </tr>
            </tbody>
        </table>
        <div className="time-taken">
            Total Time: {props.data.get('totalTimeTaken')}ms, Service Time: {props.data.get('serviceTimeTaken')}ms
        </div>
    </div>);
};

export default React.createClass({
    mixins: [FluxControllerMixin],

    getInitialState() {
        this.getFluxController().createStore(ExplainSearchResultStore, StoreKey);
        this.registerStore(StoreKey);

        return {
            data: this.getStoreData(StoreKey)
        };
    },

    componentDidMount() {
        const params = QueryString.parse(this.props.location.search.replace(/^\?/, ''));
        params.id = this.props.params.id;
        this.store().explain(this.props.params.api, Immutable.fromJS(params));
    },

    store() {
        return this.getStore(StoreKey);
    },

    topBar() {
        return (<div className="top-bar center-align middle-align">
            <h5 className="page-title">{this.getAppProperties().get('cockpitName', 'Cockpit')} - Explain Result</h5>
        </div>);
    },

    render() {
        return (<div className="page-content cockpit-page explain-result-page">
            <header>
                <NavBarContainer>
                    {this.topBar()}
                </NavBarContainer>
            </header>
            <main>
                <div className="row">
                    <LeftSection/>
                    <MidSection>
                        <Heading data={this.state.data}/>
                        <pre>
                            {JSON.stringify(this.state.data.get('result').toJS(), null, 2)}
                        </pre>
                    </MidSection>
                </div>
            </main>
        </div>);
    }
});