import _ from 'lodash';
import Immutable from 'immutable';
import classnames from 'classnames';
import React from 'react';
import QueryString from 'qs';
import {VelocityTransitionGroup} from 'velocity-react';

import FluxControllerMixin from 'reactjs-web-boilerplate/lib/app/flux/FluxControllerMixin';

import NavBarContainer from 'reactjs-web-boilerplate/lib/app/components/NavBarContainer';
import MidSection from 'reactjs-web-boilerplate/lib/app/components/MidSection';

import {default as AutocompleteStore, FieldToSearchParams} from './AutocompleteStore';

const StoreKey = 'AutocompleteStore';

//<a target="_blank" style={{marginLeft: 15}} href={`/analyze/explain/autocomplete/${suggestion.get('_id')}`}>Explain</a>

const suggestionValue = (data) => {
    const suggestion = data.suggestion;

    let url = null;
    if (!data.noClick) {
        let queryParams = {
            text: suggestion.get(data.valueField),
            unicodeText: suggestion.get(data.unicodeValueField),
            lang: suggestion.get('lang'),
            filter: data.filter.toJS(),
            originalInput: data.inputText
        };

        queryParams = _.assign(queryParams, FieldToSearchParams[data.type]);

        url = `/search-results?${QueryString.stringify(queryParams, {allowDots: true})}`;
    }

    let title = null;
    if (url) {
        title = <a target="_blank" href={url}>{suggestion.get(data.unicodeValueField)} ({suggestion.get('lang')})</a>;
    } else {
        title = <span>{suggestion.get(data.unicodeValueField)} ({suggestion.get('lang')})</span>;
    }

    const statKeys = [];
    const statValues = [];
    data.statFields.forEach(field => field.forEach((value, key) => {
        statKeys.push(<th key={key}>{key}</th>);
        statValues.push(<td key={key}>{suggestion.get(value)}</td>);
    }));

    return (<div className="suggestion-value">
        <div>
            {title}
            <a target="_blank" style={{marginLeft: 30, fontSize: '0.8em'}} href={`/analyze/termVectors/${suggestion.get('_type')}/${suggestion.get('_id')}`}>Term Vectors</a>
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
    </div>);
};

const Suggestion = (props) => (<div className="suggestion card">
    <div className="card-body">
        {suggestionValue(props.data)}
    </div>
</div>);

const SuggestionList = (props) => {
    if (!props.data) {
        return (<noscript/>);
    }

    const text = props.data.get('text');
    const suggestions = props.data.get('suggestions');
    const filter = props.data.get('filter');

    if (!text || !suggestions) {
        return (<noscript/>);
    }

    const suggestionViews = [];

    suggestions.get('results').forEach((value, key) => {
        if (value.count() > 0) {
            const properties = props.appProperties.getIn(['autocomplete', key]);
            const name = properties && properties.get('name') || key;
            const valueField = properties && properties.get('valueField') || 'value';
            const unicodeValueField = properties && properties.get('unicodeValueField') || 'unicodeValue';
            const noClick = properties && properties.get('noSearch') || false;
            const statFields = properties && properties.get('statFields') || Immutable.List();

            suggestionViews.push(<div className="section small" key={key}>
                <div className="suggestion-section-heading"><strong>{name} suggestions: {value.count() || 0}</strong></div>
                {value.map((suggestion, index) => <Suggestion data={{suggestion, filter, text, key, noClick, valueField, unicodeValueField, statFields}} key={`${key}-${index}`}/>)}
            </div>);
        }
    });

    return (<div className="suggestions">
        <div className="section small"><span>Showing auto completion suggestions for:</span> <span className="query">{text}</span> <span
          className="time-taken">(Total Time: {props.data.get('totalTimeTaken')}ms, Service Time: {suggestions.get('serviceTimeTaken')}ms, Query Time: {suggestions.get('queryTimeTaken')}ms)</span>
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
        this.getFluxController().createStore(AutocompleteStore, StoreKey);
        this.registerStore(StoreKey);

        return {
            data: this.getStoreData(StoreKey),
            filterCollapsed: false
        };
    },

    //componentDidMount() {
    //    this.store().createSocket();
    //},

    store() {
        return this.getStore(StoreKey);
    },

    topBar() {
        return (<div className="top-bar center-align middle-align">
            <h5 className="page-title">{this.getAppProperties().get('cockpitName', 'Cockpit')} - Autocomplete</h5>
        </div>);
    },

    handleTextChange(e) {
        const text = e.target.value;
        this.store().setText(text);
    },

    handleSearch(e) {
        if (e.keyCode !== 13) {
            return;
        }

        const queryParams = {
            text: this.state.data.get('text'),
            filter: this.state.data.get('filter').toJS(),
            mode: 'organic'
        };

        window.open(`/search-results?${QueryString.stringify(queryParams, {allowDots: true})}`, '_blank');
    },

    handlePrimaryLanguageChange(e) {
        if (e.target.checked) {
            this.store().setPrimaryLanguage(e.target.value);
        }
    },

    handleSecondaryLanguageChange(e) {
        if (e.target.checked) {
            this.store().addSecondaryLanguage(e.target.value);
        } else {
            this.store().removeSecondaryLanguage(e.target.value);
        }
    },

    handleSuggestionCountChange(e) {
        const count = e.target.value;
        this.store().setSuggestionCount(count);
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
                    const checked = this.state.data.getIn(['filter', 'lang', 'primary']) === langCode;
                    return (<li className="col s12 m8" key={id}>
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
                    const disabled = this.state.data.getIn(['filter', 'lang', 'primary']) === langCode;
                    const checked = !disabled && this.state.data.getIn(['filter', 'lang', 'secondary']).some((code) => code === langCode);
                    return (<li className="col s12 m8" key={id}>
                        <input type="checkbox" id={id} value={langCode} onChange={this.handleSecondaryLanguageChange} disabled={disabled} checked={checked}/>
                        <label htmlFor={id}>{langKey} ({langUnicode})</label>
                    </li>);
                })}
            </ul>
        </div>);
    },

    renderFilterInputBody() {
        const suggestionCount = this.state.data.get('count');

        return (<div className="card-body">
            {this.renderPrimaryLanguages()}
            {this.renderSecondaryLanguages()}

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
        </div>);
    },

    renderFilterInput() {
        return (<div className="card">
              <div className="card-header">
                  <a className="collapsible" href="" onClick={this.handleFilterCollapsibleClick}>
                      Set filters <i className={classnames('fa', 'fa-chevron-up', (this.state.filterCollapsed ? 'down' : 'up'))}/>
                  </a>
              </div>
              <VelocityTransitionGroup component="div" enter="slideDown" leave="slideUp">
                  {this.state.filterCollapsed ? null : this.renderFilterInputBody()}
              </VelocityTransitionGroup>
          </div>
        );
    },

    renderForm() {
        const text = this.state.data.get('text');

        return (<form role="form" className="autocomplete-form" action="javascript:void(0);">
            {this.renderFilterInput()}
            <div className="input-field">
                <input type="text"
                       className="validate"
                       id="text"
                       autoComplete="off"
                       placeholder="Your Search Query"
                       value={text}
                       onChange={this.handleTextChange}
                       onKeyUp={this.handleSearch}/>
            </div>
        </form>);
    },

    render() {
        return (<div className="page-content cockpit-page autocomplete-page">
            <header>
                <NavBarContainer>
                    {this.topBar()}
                </NavBarContainer>
            </header>
            <main>
                <div className="row">
                    <MidSection>
                        <div>
                            {this.renderForm()}
                        </div>
                        <SuggestionList data={this.state.data} appProperties={this.getAppProperties()}/>
                    </MidSection>
                </div>
            </main>
        </div>);
    }
});