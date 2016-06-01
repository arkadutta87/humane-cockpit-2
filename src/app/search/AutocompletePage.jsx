import React from 'react';
import QueryString from 'qs';
import FluxControllerMixin from 'reactjs-web-boilerplate/lib/app/flux/FluxControllerMixin';
import NavBarContainer from 'reactjs-web-boilerplate/lib/app/components/NavBarContainer';
import MidSection from 'reactjs-web-boilerplate/lib/app/components/MidSection';
import LeftSection from 'reactjs-web-boilerplate/lib/app/components/LeftSection';
import RightSection from 'reactjs-web-boilerplate/lib/app/components/RightSection';
import {default as SearchInputStore} from './SearchInputStore';
import {default as AutocompleteStore} from './AutocompleteStore';
import {default as DidYouMeanStore} from './DidYouMeanStore';
import {DidYouMeanList} from './components/DidYouMeanList';
import {AutocompleteSuggestionList} from './components/AutocompleteSuggestionList';

const AutocompleteStoreKey = 'AutocompleteStore';
const DidYouMeanStoreKey = 'DidYouMeanStore';
const SearchInputStoreKey = 'SearchInputStore';

//<a target="_blank" style={{marginLeft: 15}} href={`/analyze/explain/autocomplete/${suggestion.get('_id')}`}>Explain</a>

export default React.createClass({
    mixins: [FluxControllerMixin],

    getInitialState() {
        const searchInputStore = this.searchInputStore = this.getFluxController().createStore(SearchInputStore, SearchInputStoreKey);
        this.autocompleteResultStore = this.getFluxController().createStore(AutocompleteStore, AutocompleteStoreKey, searchInputStore);
        this.didYouMeanResultStore = this.getFluxController().createStore(DidYouMeanStore, DidYouMeanStoreKey, searchInputStore);

        this.registerStores({
            [SearchInputStoreKey]: {dataKey: 'searchInputData'},
            [AutocompleteStoreKey]: {dataKey: 'autocompleteResultData'},
            [DidYouMeanStoreKey]: {dataKey: 'didYouMeanResultData'}
        });

        return {
            searchInputData: this.searchInputStore.data,
            autocompleteResultData: this.autocompleteResultStore.data,
            didYouMeanResultData: this.didYouMeanResultStore.data
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

        window.open(`${this.getAppProperties().get('baseUrl') || ''}/search-results?${QueryString.stringify(queryParams, {allowDots: true})}`, '_blank');
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

    handleWeakResultsToggle(e) {
        this.searchInputStore.toggleWeakResults(e.target.checked);
    },

    handleFuzzySearchToggle(e) {
        this.searchInputStore.toggleFuzzySearch(e.target.checked);
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
        </div>);
    },

    renderConfigInputs() {
        const suggestionCount = this.state.autocompleteResultData.get('count');

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
                        <label htmlFor="toggleWeakResultsInput">Weak Suggestions</label>
                    </li>
                    <li className="col s24">
                        <input type="checkbox" id="toggleFuzzyInput" value={fuzzySearch} checked={fuzzySearch} onChange={this.handleFuzzySearchToggle}/>
                        <label htmlFor="toggleFuzzyInput">Fuzzy Search</label>
                    </li>
                </ul>
                <div className="range-field-section">
                    <strong className="range-field-heading" htmlFor="range">Suggestions count: </strong>
                    <div className="range-field">
                        <input
                          type="range"
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
                <input 
                  type="text"
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

        const weakResults = this.state.searchInputData.get('weakResults');

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
                        <DidYouMeanList
                          data={{suggestionsData: this.state.didYouMeanResultData, text, filter: this.state.searchInputData.get('filter')}}
                          appProperties={this.getAppProperties()}/>
                        <AutocompleteSuggestionList
                          data={{suggestionsData: this.state.autocompleteResultData, weakResults, text, filter: this.state.searchInputData.get('filter')}}
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