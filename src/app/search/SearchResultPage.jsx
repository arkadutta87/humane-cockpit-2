import _ from 'lodash';
import React from 'react';
import Immutable from 'immutable';
import moment from 'moment';
import classnames from 'classnames';
import QueryString from 'qs';

import FluxControllerMixin from 'reactjs-web-boilerplate/lib/app/flux/FluxControllerMixin';

import NavBarContainer from 'reactjs-web-boilerplate/lib/app/components/NavBarContainer';
import MidSection from 'reactjs-web-boilerplate/lib/app/components/MidSection';
import InfiniteScroll from 'reactjs-web-boilerplate/lib/app/components/InfiniteScroll';

import {default as SearchResultStore} from './SearchResultStore';

const StoreKey = 'TermVectorsStore';

const SearchResult = (props) => {
    const result = props.data.result;
    const resultType = result.get('_type');
    const location = props.data.location;
    const appProperties = props.data.appProperties;

    const fieldViewList = [];
    appProperties.getIn(['searchResult', resultType, 'fields'])
      .forEach(fieldProperty =>
        fieldProperty.forEach((valueProperty, keyProperty) => {
            let value = null;
            if (_.isString(valueProperty)) {
                value = result.get(valueProperty);
            } else if (valueProperty instanceof Immutable.List) {
                value = result.getIn(valueProperty.toJS());
            } else {
                const name = valueProperty.get('field');
                if (_.isString(name)) {
                    value = result.get(name);
                } else if (name instanceof Immutable.List) {
                    value = result.getIn(name.toJS());
                }

                const transform = valueProperty.get('transform');
                if (transform && _.isFunction(transform)) {
                    value = transform(value);
                }

                if (value) {
                    const type = valueProperty.get('type');

                    if (type === 'Date') {
                        value = moment(value).format(valueProperty.get('format') || 'MMM Do YYYY');
                    } else if (type === 'Duration') {
                        value = moment(value).fromNow();
                    } else if (type === 'Image') {
                        value = <img src={value}/>;
                    } else if (type === 'Chip') {
                        value = value.map(item => <span className="category chip small" key={item}>{item}</span>);
                    } else if (type === 'Table') {
                        value = (<table>
                            <thead>
                            <tr>
                                {
                                    valueProperty.get('tableFields').map(tableField => tableField.entrySeq().map(column => <th key={column[0]}>{column[1]}</th>))
                                }
                            </tr>
                            </thead>
                            <tbody>
                            {
                                value.map(item =>
                                  <tr key={item.get(valueProperty.get('idField' || 'id'))}>
                                      {valueProperty.get('tableFields').map(tableField => tableField.entrySeq().map(column => <td key={column[0]}>{item.get(column[1])}</td>))}
                                  </tr>)
                            }
                            </tbody>
                        </table>);
                    }
                }
            }

            fieldViewList.push(
              (<tr key={keyProperty}>
                  <td className="name">{keyProperty}</td>
                  <td className="value">{value}</td>
              </tr>));
        }));

    const statKeys = [];
    const statValues = [];
    appProperties.getIn(['searchResult', resultType, 'statFields']).forEach(field => field.forEach((value, key) => {
        statKeys.push(<th key={key}>{key}</th>);
        statValues.push(<td key={key}>{result.get(value)}</td>);
    }));

    return (<div className={classnames('card', 'search-result', result.get('id'))}>
        <div className="card-body">
            <div className="row layout">
                <table className="col s24 right details bordered">
                    <tbody>
                    <tr>
                        <td className="name">Id</td>
                        <td className="value">
                            <span>{result.get('id')}</span>
                            <a target="_blank" style={{marginLeft: 15}} href={`/analyze/explain/search/${result.get('_id')}${location.search}`}>Explain</a>
                            <a target="_blank" style={{marginLeft: 15}} href={`/analyze/termVectors/${result.get('_type')}/${result.get('id')}`}>Term Vectors</a>
                        </td>
                    </tr>
                    <tr>
                        <td className="name">Stats</td>
                        <td className="value">
                            <table className="suggestion-stats">
                                <thead>
                                <tr>
                                    <th>Score</th>
                                    <th>Weight</th>
                                    {statKeys}
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    <td>{result.get('_score').toFixed(5)}</td>
                                    <td>{result.get('weight')}</td>
                                    {statValues}
                                </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    {fieldViewList}
                    </tbody>
                </table>
            </div>
        </div>
    </div>);
};

const Heading = (props) => {
    const lang = props.data.getIn(['params', 'lang']) ||
      _.union([props.data.getIn(['params', 'filter', 'lang', 'primary'])], props.data.getIn(['params', 'filter', 'lang', 'secondary']) || []).join(', ');

    return (<div className="section heading">
        <table className="params">
            <tbody>
            <tr>
                <td className="param-key">Query Text</td>
                <td>-</td>
                <td className="param-value">{props.data.getIn(['params', 'text'])}</td>
            </tr>
            <tr>
                <td className="param-key">Mode</td>
                <td>-</td>
                <td className="param-value">{props.data.getIn(['params', 'mode'], 'organic')}</td>
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
        <div className="time-taken">Total Results: {props.data.get('totalResults')}, Total Time: {props.data.get('totalTimeTaken')}ms, Service Time: {props.data.get('serviceTimeTaken')}ms, Query
            Time: {props.data.get('queryTimeTaken')}ms
        </div>
    </div>);
};

export default React.createClass({
    propTypes: {
        location: React.PropTypes.object
    },

    mixins: [FluxControllerMixin],

    getInitialState() {
        this.getFluxController().createStore(SearchResultStore, StoreKey);
        this.registerStore(StoreKey);

        return {
            data: this.getStoreData(StoreKey)
        };
    },

    componentDidMount() {
        if (this.props.location.search) {
            this.loadSearchResults(null, QueryString.parse(this.props.location.search.replace(/^\?/, ''), {allowDots: true}));
        }
    },

    store() {
        return this.getStore(StoreKey);
    },

    topBar() {
        return (<div className="top-bar center-align middle-align">
            <h5 className="page-title">{this.getAppProperties().get('cockpitName', 'Cockpit')} - Search Results</h5>
        </div>);
    },

    loadSearchResults(e, params) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        this.store().search(params);
    },

    render() {
        let resultListView = null;
        if (this.state.data.get('multi')) {
            const resultGroupViews = this.state.data.get('results').entrySeq().map(entry => {
                const resultGroup = entry[1];
                const name = resultGroup.get('name');
                const type = resultGroup.get('type');
                const currentPage = resultGroup.get('page');
                const hasMoreResults = resultGroup.get('hasMoreResults');

                let showMoreResultsLink = null;
                if (hasMoreResults) {
                    showMoreResultsLink = <div className="search-result-navigation"><a href="" onClick={e => this.loadSearchResults(e, {page: currentPage + 1, type})}>+ Show more results</a></div>;
                }

                return (<div className="result-group">
                    <h5>Results for {name}</h5>
                    {resultGroup.get('results').map(result => (<SearchResult data={{result, location: this.props.location, appProperties: this.getAppProperties()}} key={result.get('id')}/>))}
                    {showMoreResultsLink}
                </div>);
            });
            resultListView = (<div className="search-result-list">
                {resultGroupViews}
            </div>);
        } else {
            const searchResults = this.state.data.get('results');
            if (searchResults && searchResults.count() > 0) {
                const currentPage = this.state.data.get('page');
                const hasMoreResults = this.state.data.get('hasMoreResults');

                let showMoreResultsLink = null;
                if (hasMoreResults) {
                    showMoreResultsLink = <div className="search-result-navigation"><a href="" onClick={e => this.loadSearchResults(e, {page: currentPage + 1})}>+ Show more results</a></div>;
                }

                resultListView = (<div className="search-result-list">
                    {this.state.data.get('results').map(result => (<SearchResult data={{result, location: this.props.location, appProperties: this.getAppProperties()}} key={result.get('id')}/>))}
                    {showMoreResultsLink}
                </div>);
            } else {
                resultListView = (<div className="no-results">
                    <span className="message">No Results to show!</span>
                </div>);
            }
        }

        return (<div className="page-content cockpit-page search-result-page">
            <header>
                <NavBarContainer>
                    {this.topBar()}
                </NavBarContainer>
            </header>
            <main>
                <div className="row">
                    <MidSection>
                        <Heading data={this.state.data}/>
                        {resultListView}
                    </MidSection>
                </div>
            </main>
        </div>);
    }
});