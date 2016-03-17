import _ from 'lodash';
import Immutable from 'immutable';
import React from 'react';
import QueryString from 'qs';

import FluxControllerMixin from 'reactjs-web-boilerplate/lib/app/flux/FluxControllerMixin';

import NavBarContainer from 'reactjs-web-boilerplate/lib/app/components/NavBarContainer';
import MidSection from 'reactjs-web-boilerplate/lib/app/components/MidSection';
import LeftSection from 'reactjs-web-boilerplate/lib/app/components/LeftSection';
import RightSection from 'reactjs-web-boilerplate/lib/app/components/RightSection';

import {default as SearchInputStore} from './SearchInputStore';
import {default as AutocompleteStore} from './AutocompleteStore';

const AutocompleteStoreKey = 'AutocompleteStore';

const SearchInputStoreKey = 'SearchInputStore';

//<a target="_blank" style={{marginLeft: 15}} href={`/analyze/explain/autocomplete/${suggestion.get('_id')}`}>Explain</a>

const suggestionValue = (data, appProperties) => {
    const suggestion = data.suggestion;

    const properties = data.properties;
    const statFields = properties && properties.get('statFields') || Immutable.List();
    const valueField = properties && properties.get('valueField') || 'value';
    const unicodeValueField = properties && properties.get('unicodeValueField') || 'unicodeValue';

    const searchMode = properties && properties.get('searchMode');
    const searchType = properties && properties.get('searchType');

    let display = properties && _.isFunction(properties.get('display')) && properties.get('display')(suggestion);
    if (!display) {
        const displayField = properties && properties.get('displayField') || 'unicodeValue';
        if (suggestion.get('lang')) {
            display = `${suggestion.get(displayField)} (${suggestion.get('lang')})`;
        } else {
            display = suggestion.get(displayField);
        }
    }

    let url = null;
    if (searchMode) {
        let queryParams = {
            text: suggestion.get(valueField),
            unicodeText: suggestion.get(unicodeValueField),

            //lang: suggestion.get('lang'),
            filter: data.filter.toJS(),
            originalInput: data.inputText
        };

        queryParams = _.assign(queryParams, {mode: searchMode, type: searchType});

        url = `${appProperties && appProperties.get('cockpitUrlPrefix') || ''}/search-results?${QueryString.stringify(queryParams, {allowDots: true})}`;
    }

    let title = null;
    if (url) {
        title = <a target="_blank" href={url}>{display}</a>;
    } else {
        title = <span>{display}</span>;
    }

    const statKeys = [];
    const statValues = [];
    statFields.forEach(field => field.forEach((value, key) => {
        statKeys.push(<th key={key}>{key}</th>);
        statValues.push(<td key={key}>{suggestion.get(value)}</td>);
    }));

    let weakSuggestionDisclaimer = null;
    if (suggestion.get('_weakSuggestion')) {
        weakSuggestionDisclaimer = <div style={{backgroundColor: 'yellow', textAlign: 'center'}}>This is a weak suggestion.</div>;
    }

    return (<div className="suggestion-value">
        <div>
            {title}
            <a target="_blank" style={{marginLeft: 30, fontSize: '0.8em'}}
               href={`${appProperties && appProperties.get('cockpitUrlPrefix') || ''}/analyze/termVectors/${suggestion.get('_type')}/${suggestion.get('_id')}`}>Term Vectors</a>
        </div>
        <table className="bordered suggestion-stats">
            <thead>
            <tr>
                <th>Score</th>
                <th>Weight</th>
                {statKeys}
            </tr>
            </thead>
            <tbody>
            <tr>
                <td>{suggestion.get('_score').toFixed(5)}</td>
                <td>{suggestion.get('weight')}</td>
                {statValues}
            </tr>
            </tbody>
        </table>
        {weakSuggestionDisclaimer}
    </div>);
};

const Suggestion = (props) => (<div className="suggestion card">
    <div className="card-body">
        {suggestionValue(props.data, props.appProperties)}
    </div>
</div>);

Suggestion.propTypes = {
    data: React.PropTypes.object.isRequired,
    appProperties: React.PropTypes.object.isRequired
};

const SuggestionList = (props) => {
    if (!props.data) {
        return (<noscript/>);
    }

    const text = props.data.text;
    const filter = props.data.filter;
    const suggestions = props.data.suggestionsData.get('suggestions');
    const hideWeakSuggestions = props.data.suggestionsData.get('hideWeakSuggestions');

    if (!text || !suggestions) {
        return (<noscript/>);
    }

    const suggestionViews = [];

    const buildSuggestionViews = (key, results) => {
        if (results.count() > 0) {
            const properties = props.appProperties.getIn(['autocomplete', key]);
            const name = properties && properties.get('name') || key;

            suggestionViews.push(<div className="section small" key={key}>
                <div className="suggestion-section-heading"><strong>{name} suggestions: {results.count() || 0}</strong></div>
                {results.filter(suggestion => !hideWeakSuggestions || !suggestion.get('_weakSuggestion')).map((suggestion, index) => <Suggestion data={{suggestion, filter, text, key, properties}}
                                                                                                                                                 appProperties={props.appProperties}
                                                                                                                                                 key={`${key}-${index}`}/>)}
            </div>);
        }
    };

    // if multiple types of results - then resultGroups => {key : { type, results, totalResults }}
    // if single type of results - then { type, results, totalResults }
    if (suggestions.get('multi')) {
        suggestions.get('results').forEach((value, key) => {
            buildSuggestionViews(key, value.get('results'));
        });
    } else {
        const results = suggestions.get('results');
        const key = suggestions.get('name');

        buildSuggestionViews(key, results);
    }

    return (<div className="suggestions">
        <div className="section small time-taken right-align">
            Total Time: {props.data.suggestionsData.get('totalTimeTaken')}ms, Service Time: {suggestions.get('serviceTimeTaken')}ms, Query Time: {suggestions.get('queryTimeTaken')}ms
        </div>
        {suggestionViews}
    </div>);
};

SuggestionList.propTypes = {
    data: React.PropTypes.object.isRequired,
    appProperties: React.PropTypes.object.isRequired
};

export default React.createClass({
    mixins: [FluxControllerMixin],

    getInitialState() {
        const searchInputStore = this.searchInputStore = this.getFluxController().createStore(SearchInputStore, SearchInputStoreKey);
        this.autocompleteResultStore = this.getFluxController().createStore(AutocompleteStore, AutocompleteStoreKey, searchInputStore);

        this.registerStores({
            [SearchInputStoreKey]: {dataKey: 'searchInputData'},
            [AutocompleteStoreKey]: {dataKey: 'autocompleteResultData'}
        });

        return {
            searchInputData: this.searchInputStore.data,
            autocompleteResultData: this.autocompleteResultStore.data
        };
    },

    topBar() {
        return (<div className="top-bar center-align middle-align">
            <h5 className="page-title">{this.getAppProperties().get('cockpitName', 'Cockpit')} - Autocomplete</h5>
        </div>);
    },

    handleSearchTextChange(e) {
        const text = e.target.value;
        this.searchInputStore.setSearchText(text);
    },

    handleSearchInputEnter(e) {
        if (e.keyCode !== 13) {
            return;
        }

        const queryParams = {
            text: this.state.searchInputData.get('text'),
            filter: this.state.searchInputData.get('filter').toJS(),
            mode: 'organic'
        };

        const cockpitUrlPrefix = this.getAppProperties().get('cockpitUrlPrefix', '');

        window.open(`${cockpitUrlPrefix}/search-results?${QueryString.stringify(queryParams, {allowDots: true})}`, '_blank');
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

    handleSuggestionCountChange(e) {
        const count = e.target.value;
        this.autocompleteResultStore.setSuggestionCount(count);
    },

    handleHideWeakSuggestionsChange(e) {
        this.autocompleteResultStore.hideWeakSuggestions(e.target.checked);
    },

    handleFilterCollapsibleClick(e) {
        e.preventDefault();
        e.stopPropagation();

        this.setState({filterCollapsed: !this.state.filterCollapsed});
    },

    renderPrimaryLanguages() {
        const primaryLanguages = this.getAppProperties().get('primaryLanguages');

        if (!primaryLanguages) {
            return <noscript/>;
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
            return <noscript/>;
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
                    const checked = !disabled && this.state.searchInputData.getIn(['filter', 'lang', 'secondary']) && this.state.searchInputData.getIn(['filter', 'lang', 'secondary']).some((code) => code === langCode);
                    return (<li className="col s12" key={id}>
                        <input type="checkbox" id={id} value={langCode} onChange={this.handleSecondaryLanguageChange} disabled={disabled} checked={checked}/>
                        <label htmlFor={id}>{langKey} ({langUnicode})</label>
                    </li>);
                })}
            </ul>
        </div>);
    },

    renderFilterInputBody() {
        return (<div className="card-body">
            {this.renderPrimaryLanguages()}
            {this.renderSecondaryLanguages()}
        </div>);
    },

    renderFilterInputs() {
        const primaryLanguages = this.getAppProperties().get('primaryLanguages');
        const secondaryLanguages = this.getAppProperties().get('secondaryLanguages');

        if (!primaryLanguages && !secondaryLanguages) {
            return <noscript/>;
        }

        return (<div className="card">
              <div className="card-header">
                  <h6 className="center-align">Filter</h6>
              </div>
              {this.renderFilterInputBody()}
          </div>
        );
    },

    renderConfigInputs() {
        const suggestionCount = this.state.autocompleteResultData.get('count');

        const hideWeakSuggestions = this.state.autocompleteResultData.get('hideWeakSuggestions');

        return (<div className="card">
            <div className="card-header">
                <h6 className="center-align">Configure</h6>
            </div>
            <div className="card-body">
                <ul className="radio-group row">
                    <li className="col s24">
                        <input type="checkbox" id="hideWeakSuggestionsInput" value={hideWeakSuggestions} checked={hideWeakSuggestions} onChange={this.handleHideWeakSuggestionsChange}/>
                        <label htmlFor="hideWeakSuggestionsInput">Hide Weak Suggestions</label>
                    </li>
                </ul>
                <div className="range-field-section">
                    <strong className="range-field-heading" htmlFor="range">Suggestions count: </strong>
                    <div className="range-field">
                        <input type="range"
                               id="range"
                               value={suggestionCount}
                               min="1"
                               max="15"
                               step="1"
                               onChange={this.handleSuggestionCountChange}
                        />
                    </div>
                    <output className="range-field-output chip" htmlFor="id">{suggestionCount}</output>
                </div>
            </div>
        </div>);
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

    render() {
        const text = this.state.searchInputData.get('text');

        return (<div className="page-content cockpit-page autocomplete-page">
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
                        <div>
                            {this.renderSearchForm()}
                        </div>
                        <SuggestionList
                          data={{suggestionsData: this.state.autocompleteResultData, text, filter: this.state.searchInputData.get('filter')}}
                          appProperties={this.getAppProperties()}/>
                    </MidSection>
                    <RightSection>
                        {this.renderConfigInputs()}
                    </RightSection>
                </div>
            </main>
        </div>);
    }
});