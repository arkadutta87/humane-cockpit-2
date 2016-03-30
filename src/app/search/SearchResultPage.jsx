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

const SearchInputStoreKey = 'SearchInputStore';
const SearchResultStoreKey = 'SearchResultStore';
const SuggestedQueriesStoreKey = 'SuggestedQueriesStore';

const buildSuggestionView = (suggestion, filter, text, appProperties) => {
    const name = suggestion.get('_name');
    const properties = appProperties.getIn(['autocomplete', name]);
    const valueField = properties && properties.get('valueField') || 'value';
    const unicodeValueField = properties && properties.get('unicodeValueField') || 'unicodeValue';

    const searchMode = properties && properties.get('searchMode');
    const searchType = properties && properties.get('searchType');

    const lang = suggestion.get('lang');

    let displayKey = null;
    let unicodeKey = null;
    let enKey = null;

    // to show name here
    let display = properties && _.isFunction(properties.get('display')) && properties.get('display')(suggestion);
    if (!display) {
        const displayField = properties && properties.get('displayField') || unicodeValueField;

        const displayText = suggestion.get(displayField);
        displayKey = _.lowerCase(displayText);

        unicodeKey = _.lowerCase(suggestion.get(unicodeValueField));
        enKey = _.lowerCase(suggestion.get(valueField));

        if (lang) {
            display = `${displayText} (${lang})`;
        } else {
            display = displayText;
        }
    }

    let url = null;
    if (searchMode) {
        let queryParams = {
            text: suggestion.get(valueField),
            unicodeText: suggestion.get(unicodeValueField),

            //lang: suggestion.get('lang'),
            filter: filter.toJS(),
            originalInput: text
        };

        queryParams = _.assign(queryParams, {mode: searchMode, type: searchType});

        url = `${appProperties && appProperties.get('cockpitUrlPrefix') || ''}/search-results?${QueryString.stringify(queryParams, {allowDots: true})}`;
    }

    return {id: suggestion.get('_id'), display, url, name, unicodeKey, enKey, displayKey};
};

const SuggestionList = (props) => {
    if (!props.data) {
        return <noscript/>;
    }

    const text = props.data.text;
    const filter = props.data.filter;
    const suggestions = props.data.suggestionsData.get('suggestions');

    if (!text || !suggestions) {
        return <noscript/>;
    }

    const buildSuggestionViews = (results) => {
        if (results.count() > 0) {
            const uniqueSuggestions = {[_.lowerCase(text)]: true};

            return results
              .filter(suggestion => !suggestion.get('_weakSuggestion'))
              .map(suggestion => buildSuggestionView(suggestion, filter, text, props.appProperties))
              .filter(response => {
                  if (uniqueSuggestions[response.enKey]
                    || uniqueSuggestions[response.displayKey]
                    || uniqueSuggestions[response.unicodeKey]) {
                      return false;
                  }

                  uniqueSuggestions[response.enKey] = true;
                  uniqueSuggestions[response.displayKey] = true;
                  uniqueSuggestions[response.unicodeKey] = true;

                  return true;
              })
              .map(response => {
                  let title = null;
                  if (response.url) {
                      title = <a href={response.url}>{response.display}</a>;
                  } else {
                      title = <span>{response.display}</span>;
                  }

                  return (<div className="suggestion card" key={response.id}>
                      <div className="card-body">
                          <div className="suggestion-title">
                              {title}
                          </div>
                          <div className="suggestion-name right-align" style={{fontSize: '0.8rem'}}>
                              {response.name}
                          </div>
                      </div>
                  </div>);
              });
        }

        return null;
    };

    const results = suggestions.get('results');

    const suggestionsView = buildSuggestionViews(results);
    if (!suggestionsView || suggestionsView.count() === 0) {
        return <noscript/>;
    }

    return (<div className="card">
        <div className="card-header">
            <h6 className="center-align">Related Searches</h6>
        </div>
        <div className="card-body suggestions">
            {suggestionsView}
        </div>
    </div>);
};

SuggestionList.propTypes = {
    data: React.PropTypes.object.isRequired,
    appProperties: React.PropTypes.object.isRequired
};

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
                        value = <img src={value}/>;
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
                            <a target="_blank" style={{marginLeft: 15}}
                               href={`${appProperties && appProperties.get('cockpitUrlPrefix') || ''}/analyze/explain/search/${result.get('_id')}${location.search}`}>Explain</a>
                            <a target="_blank" style={{marginLeft: 15}}
                               href={`${appProperties && appProperties.get('cockpitUrlPrefix') || ''}/analyze/termVectors/${result.get('_type')}/${result.get('_id')}`}>Term Vectors</a>
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

        this.registerStores({
            [SearchInputStoreKey]: {dataKey: 'searchInputData'},
            [SearchResultStoreKey]: {dataKey: 'searchResultData'},
            [SuggestedQueriesStoreKey]: {dataKey: 'suggestedQueriesData'}
        });

        return {
            searchInputData: this.searchInputStore.data,
            searchResultData: this.searchResultStore.data,
            suggestedQueriesData: this.suggestedQueriesStore.data
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
        if (e.keyCode !== 13) {
            return;
        }

        this.searchInputStore.updateSearchParams({mode: 'organic'});
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

    handleHideWeakResultsChange(e) {
        this.searchResultStore.hideWeakResults(e.target.checked);
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
                        <input name="primaryLanguages" type="radio" id={id} value={langCode} onChange={this.handlePrimaryLanguageChange} checked={checked}/>
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
                        <input type="checkbox" id={id} value={langCode} onChange={this.handleSecondaryLanguageChange} disabled={disabled} checked={checked}/>
                        <label htmlFor={id}>{langKey} ({langUnicode})</label>
                    </li>);
                })}
            </ul>
        </div>);
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
          </div>
        );
    },

    renderSuggestedQueries() {
        const text = this.state.searchInputData.get('text');
        const filter = this.state.searchInputData.get('filter');
        const appProperties = this.getAppProperties();
        const suggestionsData = this.state.suggestedQueriesData;

        return (<SuggestionList data={{suggestionsData, text, filter}} appProperties={appProperties}/>);
    },

    renderSearchForm() {
        const text = this.state.searchInputData.get('text');

        return (<form role="form" className="autocomplete-form" action="javascript:void(0);">

            <div className="input-field">
                <input type="text"
                       className="validate"
                       id="text"
                       autoComplete="off"
                       placeholder="Your Search Query"
                       value={text}
                       onChange={this.handleSearchTextChange}
                       onKeyUp={this.handleSearchInputEnter}/>
            </div>
        </form>);
    },

    renderSearchResult(result, appProperties, hideWeakResults) {
        return (<SearchResult data={{result, location: this.props.location, hideWeakResults}} appProperties={appProperties} key={result.get('_id')}/>);
    },

    renderSearchResults(results, appProperties) {
        const hideWeakResults = this.state.searchResultData.get('hideWeakResults');

        return results./*filter(result => !hideWeakResults || !result.get('_weakResult')).*/map(result => this.renderSearchResult(result, appProperties, hideWeakResults));
    },

    render() {
        const appProperties = this.getAppProperties();

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
                    </LeftSection>
                    <MidSection>
                        <div className="section">
                            <div>
                                Mode = {this.state.searchInputData.get('mode', 'organic')}, Type = {this.state.searchInputData.get('type', '')}
                            </div>
                            {this.renderSearchForm()}
                            <div className="right-align time-taken">
                                Total Time: {this.state.searchResultData.get('totalTimeTaken')}ms, Service Time: {this.state.searchResultData.get('serviceTimeTaken')}ms, Query
                                Time: {this.state.searchResultData.get('queryTimeTaken')}ms
                            </div>
                        </div>
                        <div className="section">
                            <div className="total-results">
                                Total Results: {this.state.searchResultData.get('totalResults')}
                            </div>
                            {resultListView}
                        </div>
                    </MidSection>
                    <RightSection>
                        {this.renderSuggestedQueries()}
                    </RightSection>
                </div>
            </main>
        </div>);
    }
});