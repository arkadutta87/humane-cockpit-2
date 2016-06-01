import _ from 'lodash';
import React from 'react';
import Immutable from 'immutable';
import moment from 'moment';
import classnames from 'classnames';
import QueryString from 'qs';
import FluxControllerMixin from 'reactjs-web-boilerplate/lib/app/flux/FluxControllerMixin';
import NavBarContainer from 'reactjs-web-boilerplate/lib/app/components/NavBarContainer';
import LeftSection from 'reactjs-web-boilerplate/lib/app/components/LeftSection';
import MidSection from 'reactjs-web-boilerplate/lib/app/components/MidSection';
import RightSection from 'reactjs-web-boilerplate/lib/app/components/RightSection';
import {default as SearchInputStore} from './SearchInputStore';
import {default as SearchResultStore} from './SearchResultStore';
import {default as SuggestedQueriesStore} from './SuggestedQueriesStore';
import {default as DidYouMeanStore} from './DidYouMeanStore';
import {RelatedSearchesList} from './components/RelatedSearchesList';
import {DidYouMeanList} from './components/DidYouMeanList';

const SearchInputStoreKey = 'SearchInputStore';
const SearchResultStoreKey = 'SearchResultStore';
const SuggestedQueriesStoreKey = 'SuggestedQueriesStore';
const DidYouMeanStoreKey = 'DidYouMeanStore';

const SearchResult = (props) => {
    const result = props.data.result;
    const resultType = result.get('_type');
    const location = props.data.location;
    const appProperties = props.appProperties;

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
                    value = transform(value, {appProperties, _});
                }

                if (value) {
                    const type = valueProperty.get('type');

                    if (type === 'Date') {
                        value = moment(value).format(valueProperty.get('format') || 'MMM Do YYYY');
                    } else if (type === 'Duration') {
                        value = moment(value).fromNow();
                    } else if (type === 'Image') {
                        value = <img src={value} role="presentation"/>;
                    } else if (type === 'Chip') {
                        const uniqueSet = {};
                        value = value.filter(item => {
                            item = item.trim();
                            if (!item || item === '' || uniqueSet[item]) {
                                return false;
                            }

                            uniqueSet[item] = true;
                            return true;
                        })
                          .map(item => <span className="category chip small" key={item}>{item}</span>);
                    } else if (type === 'Table') {
                        const itemView = value.map(item =>
                          (<tr key={item.get(valueProperty.get('idField' || 'id'))}>
                              {valueProperty.get('tableFields').map(tableField => tableField.entrySeq().map(column => <td key={column[0]}>{item.get(column[1])}</td>))}
                          </tr>));

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
                                    itemView
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

    let weakResultDisclaimer = null;
    if (result.get('_weakResult')) {
        weakResultDisclaimer = (<div className="row">
            <div style={{backgroundColor: 'yellow', textAlign: 'center'}}>This is a weak result.</div>
        </div>);
    }

    return (<div className={classnames('card', 'search-result', result.get('_id'))}>
        <div className="card-body">
            {weakResultDisclaimer}
            <div className="row layout">
                <table className="col s24 right details bordered">
                    <tbody>
                        <tr>
                            <td className="name">Id</td>
                            <td className="value">
                                <span>{result.get('_id')}</span>
                                <a
                                  target="_blank"
                                  style={{marginLeft: 15}}
                                  href={`${appProperties && appProperties.get('baseUrl') || ''}/analyze/explain/search/${result.get('_id')}${location.search}`}>Explain</a>
                                <a
                                  target="_blank"
                                  style={{marginLeft: 15}}
                                  href={`${appProperties && appProperties.get('baseUrl') || ''}/analyze/termVectors/${result.get('_type')}/${result.get('_id')}`}>Term Vectors</a>
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
                                            <td>{result.get('_weight')}</td>
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

SearchResult.propTypes = {
    data: React.PropTypes.object.isRequired,
    appProperties: React.PropTypes.object.isRequired
};

export default React.createClass({
    propTypes: {
        location: React.PropTypes.object
    },

    mixins: [FluxControllerMixin],

    getInitialState() {
        const searchInputStore = this.searchInputStore = this.getFluxController().createStore(SearchInputStore, SearchInputStoreKey);
        this.searchResultStore = this.getFluxController().createStore(SearchResultStore, SearchResultStoreKey, searchInputStore);
        this.suggestedQueriesStore = this.getFluxController().createStore(SuggestedQueriesStore, SuggestedQueriesStoreKey, searchInputStore);
        this.didYouMeanResultStore = this.getFluxController().createStore(DidYouMeanStore, DidYouMeanStoreKey, searchInputStore);

        this.registerStores({
            [SearchInputStoreKey]: {dataKey: 'searchInputData'},
            [SearchResultStoreKey]: {dataKey: 'searchResultData'},
            [SuggestedQueriesStoreKey]: {dataKey: 'suggestedQueriesData'},
            [DidYouMeanStoreKey]: {dataKey: 'didYouMeanResultData'}
        });

        return {
            searchInputData: this.searchInputStore.data,
            searchResultData: this.searchResultStore.data,
            suggestedQueriesData: this.suggestedQueriesStore.data,
            didYouMeanResultData: this.didYouMeanResultStore.data
        };
    },

    componentDidMount() {
        if (this.props.location.search) {
            this.searchInputStore.setSearchParams(QueryString.parse(this.props.location.search.replace(/^\?/, ''), {allowDots: true}));
        }
    },

    topBar() {
        return (<div className="top-bar center-align middle-align">
            <h5 className="page-title">{this.getAppProperties().get('cockpitName', 'Cockpit')} - Search Results</h5>
        </div>);
    },

    paginate(e, page, type) {
        e.preventDefault();
        e.stopPropagation();

        this.searchInputStore.paginate(page, type);
    },

    handleSearchTextChange(e) {
        const text = e.target.value;
        this.searchInputStore.setSearchText(text);
    },

    handleSearchInputEnter(e) {
        // if (e.keyCode !== 13) {
        //     return;
        // }

        // this.searchInputStore.updateSearchParams({mode: 'organic'});
    },

    handlePrimaryLanguageChange(e) {
        if (e.target.checked) {
            this.searchInputStore.setPrimaryLanguage(e.target.value);
        }
    },

    handleSecondaryLanguageChange(e) {
        if (e.target.checked) {
            this.searchInputStore.addSecondaryLanguage(e.target.value);
        } else {
            this.searchInputStore.removeSecondaryLanguage(e.target.value);
        }
    },

    handleWeakResultsToggle(e) {
        this.searchInputStore.toggleWeakResults(e.target.checked);
    },

    handleFuzzySearchToggle(e) {
        this.searchInputStore.toggleFuzzySearch(e.target.checked);
    },

    handleFacetChange(key) {
        return (e) => {
            if (e.target.checked) {
                this.searchInputStore.addFacet(key, e.target.value);
            } else {
                this.searchInputStore.removeFacet(key, e.target.value);
            }
        };
    },

    renderPrimaryLanguages() {
        const primaryLanguages = this.getAppProperties().get('primaryLanguages');

        if (!primaryLanguages) {
            return null;
        }

        return (<div className="row">
            <div>
                <strong>Chose Primary Language: </strong>
            </div>
            <ul className="radio-group row">
                {primaryLanguages.map((lang) => {
                    const langKey = lang.get('key');
                    const langCode = lang.get('code');
                    const langUnicode = lang.get('unicode');

                    const id = `radio${langKey}`;
                    const checked = this.state.searchInputData.getIn(['filter', 'lang', 'primary']) === langCode;
                    return (<li className="col s12" key={id}>
                        <input name="primaryLanguages" type="radio" id={id} value={langCode || ''} onChange={this.handlePrimaryLanguageChange} checked={checked}/>
                        <label htmlFor={id}>{langKey} ({langUnicode})</label>
                    </li>);
                })}
            </ul>
        </div>);
    },

    renderSecondaryLanguages() {
        const secondaryLanguages = this.getAppProperties().get('secondaryLanguages');

        if (!secondaryLanguages) {
            return null;
        }

        return (<div className="row">
            <div>
                <strong>Chose Secondary Language(s): </strong>
            </div>
            <ul className="radio-group row">
                {this.getAppProperties().get('secondaryLanguages').map((lang) => {
                    const langKey = lang.get('key');
                    const langCode = lang.get('code');
                    const langUnicode = lang.get('unicode');

                    const id = `checkbox${langKey}`;
                    const disabled = this.state.searchInputData.getIn(['filter', 'lang', 'primary']) === langCode;
                    const checked = !disabled && this.state.searchInputData.getIn(['filter', 'lang', 'secondary'])
                      && this.state.searchInputData.getIn(['filter', 'lang', 'secondary']).some((code) => code === langCode);
                    return (<li className="col s12" key={id}>
                        <input type="checkbox" id={id} value={langCode || ''} onChange={this.handleSecondaryLanguageChange} disabled={disabled} checked={checked}/>
                        <label htmlFor={id}>{langKey} ({langUnicode})</label>
                    </li>);
                })}
            </ul>
        </div>);
    },

    renderFacets() {
        const facets = this.state.searchResultData.get('facets');

        if (facets) {
            const facetViews = facets.entrySeq().map(entry => {
                const facetName = entry[0];

                const handleFacetChange = this.handleFacetChange(facetName);

                const facetValueViews = entry[1].filter(value => !_.isEmpty(value.get('key'))).map(value => {
                    const key = value.get('key');
                    const count = value.get('count');

                    const checkedValues = this.state.searchInputData.getIn(['filter', facetName, 'values']);

                    const checked = checkedValues && checkedValues.some((code) => code === key);

                    return (<li className="col s12" key={key}>
                        <input type="checkbox" id={key} value={key || ''} onChange={handleFacetChange} checked={checked}/>
                        <label htmlFor={key}>{key} ({count})</label>
                    </li>);
                });

                return (<div className="card" key={facetName}>
                    <div className="card-header">
                        <h6 className="center-align">{facetName}</h6>
                    </div>
                    <div className="card-body">
                        <ul className="radio-group row">
                            {facetValueViews}
                        </ul>
                    </div>
                </div>);
            });

            return (<div>
                <h5 className="center-align">Facets</h5>
                {facetViews}
            </div>);
        }

        return <noscript/>;
    },

    renderFilterInputBody() {
        const primaryLanguageFilter = this.renderPrimaryLanguages();
        const secondaryLanguageFilter = this.renderSecondaryLanguages();

        if (!primaryLanguageFilter && !secondaryLanguageFilter) {
            return null;
        }

        return (<div className="card-body">
            {primaryLanguageFilter}
            {secondaryLanguageFilter}
        </div>);
    },

    renderFilterInputs() {
        const filterViews = this.renderFilterInputBody();
        if (!filterViews) {
            return null;
        }

        return (<div className="card">
            <div className="card-header">
                <h6 className="center-align">Filter</h6>
            </div>
            {filterViews}
        </div>);
    },

    renderSuggestedQueries() {
        const text = this.state.searchInputData.get('text');
        const filter = this.state.searchInputData.get('filter');
        const appProperties = this.getAppProperties();
        const suggestionsData = this.state.suggestedQueriesData;

        return (<RelatedSearchesList data={{suggestionsData, text, filter}} appProperties={appProperties}/>);
    },

    renderSearchForm() {
        const text = this.state.searchInputData.get('text');

        return (<form role="form" className="autocomplete-form" action="javascript:void(0);">

            <div className="input-field">
                <input
                  type="text"
                  className="validate"
                  id="text"
                  autoComplete="off"
                  placeholder="Your Search Query"
                  value={text || ''}
                  onChange={this.handleSearchTextChange}
                  onKeyUp={this.handleSearchInputEnter}/>
            </div>
        </form>);
    },

    renderSearchResult(result, appProperties, weakResults) {
        return (<SearchResult data={{result, location: this.props.location, weakResults}} appProperties={appProperties} key={result.get('_id')}/>);
    },

    renderSearchResults(results, appProperties) {
        const weakResults = this.state.searchInputData.get('weakResults');

        return results.filter(result => weakResults || !result.get('_weakResult')).map(result => this.renderSearchResult(result, appProperties, weakResults));
    },

    renderConfigInputs() {
        const weakResults = this.state.searchInputData.get('weakResults');
        const fuzzySearch = this.state.searchInputData.get('fuzzySearch');

        return (<div className="card">
            <div className="card-header">
                <h6 className="center-align">Configure</h6>
            </div>
            <div className="card-body">
                <ul className="radio-group row">
                    <li className="col s24">
                        <input type="checkbox" id="toggleWeakResultsInput" value={weakResults} checked={weakResults} onChange={this.handleWeakResultsToggle}/>
                        <label htmlFor="toggleWeakResultsInput">Weak Results</label>
                    </li>
                    <li className="col s24">
                        <input type="checkbox" id="toggleFuzzyInput" value={fuzzySearch} checked={fuzzySearch} onChange={this.handleFuzzySearchToggle}/>
                        <label htmlFor="toggleFuzzyInput">Fuzzy Search</label>
                    </li>
                </ul>
            </div>
        </div>);
    },

    render() {
        const appProperties = this.getAppProperties();

        const text = this.state.searchInputData.get('text');

        let resultListView = null;
        if (this.state.searchResultData.get('multi')) {
            const resultGroupViews = this.state.searchResultData.get('results').entrySeq().map(entry => {
                const resultGroup = entry[1];
                const name = resultGroup.get('name');
                const type = resultGroup.get('type');
                const currentPage = resultGroup.get('page');
                const hasMoreResults = resultGroup.get('hasMoreResults');

                let showMoreResultsLink = null;
                if (hasMoreResults) {
                    showMoreResultsLink = (<div className="search-result-navigation">
                        <a href="" onClick={e => this.paginate(e, currentPage + 1, type)}>+ Show more results</a>
                    </div>);
                }

                return (<div className="result-group">
                    <h5>Results for {name}</h5>
                    {this.renderSearchResults(resultGroup.get('results'), appProperties)}
                    {showMoreResultsLink}
                </div>);
            });
            resultListView = (<div className="search-result-list">
                {resultGroupViews}
            </div>);
        } else {
            const searchResults = this.state.searchResultData.get('results');
            if (searchResults && searchResults.count() > 0) {
                const currentPage = this.state.searchInputData.get('page');
                const hasMoreResults = this.state.searchResultData.get('hasMoreResults');

                let showMoreResultsLink = null;
                if (hasMoreResults) {
                    showMoreResultsLink = (<div className="search-result-navigation">
                        <a href="" onClick={e => this.paginate(e, currentPage + 1)}>+ Show more results</a>
                    </div>);
                }

                resultListView = (<div className="search-result-list">
                    {this.renderSearchResults(this.state.searchResultData.get('results'), appProperties)}
                    {showMoreResultsLink}
                </div>);
            } else {
                resultListView = (<div className="no-results">
                    <span className="message">No Results to show!</span>
                </div>);
            }
        }

        // TODO: render facets
        // TODO: render sortables
        return (<div className="page-content cockpit-page search-result-page">
            <header>
                <NavBarContainer>
                    {this.topBar()}
                </NavBarContainer>
            </header>
            <main>
                <div className="row">
                    <LeftSection>
                        {this.renderFilterInputs()}
                        {this.renderFacets()}
                    </LeftSection>
                    <MidSection>
                        <div className="section">
                            <div>
                                Mode = {this.state.searchInputData.get('mode', 'organic')}, Type = {this.state.searchInputData.get('type', '')}
                            </div>
                            {this.renderSearchForm()}
                        </div>
                        <DidYouMeanList
                          data={{suggestionsData: this.state.didYouMeanResultData, text, filter: this.state.searchInputData.get('filter')}}
                          appProperties={this.getAppProperties()}/>
                        <div className="section">
                            <div className="right-align time-taken">
                                Total Time: {this.state.searchResultData.get('totalTimeTaken')}ms, Service Time: {this.state.searchResultData.get('serviceTimeTaken')}ms, Query
                                Time: {this.state.searchResultData.get('queryTimeTaken')}ms
                            </div>
                            <div className="total-results">
                                Total Results: {this.state.searchResultData.get('totalResults')}
                            </div>
                            {resultListView}
                        </div>
                    </MidSection>
                    <RightSection>
                        <div className="section">
                            {this.renderConfigInputs()}
                        </div>
                        <div className="section">
                            {this.renderSuggestedQueries()}
                        </div>
                    </RightSection>
                </div>
            </main>
        </div>);
    }
});