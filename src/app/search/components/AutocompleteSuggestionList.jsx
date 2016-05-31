import _ from 'lodash';
import React from 'react';
import QueryString from 'qs';
import Immutable from 'immutable';

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
        if (suggestion.get('_lang')) {
            display = `${suggestion.get(displayField)} (${suggestion.get('_lang')})`;
        } else {
            display = suggestion.get(displayField);
        }
    }

    let url = null;
    if (searchMode) {
        let queryParams = {
            text: suggestion.get(valueField),
            unicodeText: suggestion.get(unicodeValueField),

            //lang: suggestion.get('_lang'),
            filter: data.filter.toJS(),
            originalInput: data.inputText
        };

        queryParams = _.assign(queryParams, {mode: searchMode, type: searchType});

        url = `${appProperties && appProperties.get('baseUrl') || ''}/search-results?${QueryString.stringify(queryParams, {allowDots: true})}`;
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
    if (suggestion.get('_weakResult')) {
        weakSuggestionDisclaimer = <div style={{backgroundColor: 'yellow', textAlign: 'center'}}>This is a weak suggestion.</div>;
    }

    return (<div className="suggestion-value">
        <div>
            {title}
            <a target="_blank" style={{marginLeft: 30, fontSize: '0.8em'}}
               href={`${appProperties && appProperties.get('baseUrl') || ''}/analyze/termVectors/${suggestion.get('_type')}/${suggestion.get('_id')}`}>Term Vectors</a>
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
                <td>{suggestion.get('_weight')}</td>
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

export const AutocompleteSuggestionList = (props) => {
    if (!props.data) {
        return (<noscript/>);
    }

    const text = props.data.text;
    const filter = props.data.filter;
    const suggestions = props.data.suggestionsData.get('suggestions');
    const weakResults = props.data.weakResults;

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
                {
                    results
                      .filter(suggestion => weakResults || !suggestion.get('_weakResult'))
                      .map((suggestion, index) =>
                        <Suggestion data={{suggestion, filter, text, key, properties}} appProperties={props.appProperties} key={`${key}-${index}`}/>)
                }
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

    if (suggestionViews.length === 0) {
        return (<noscript/>);
    }

    return (<div className="suggestions section">
        <div className="suggestions-section-heading">Entity Suggestions: {suggestionViews.length} types</div>
        <div className="section small time-taken right-align">
            Total Time: {props.data.suggestionsData.get('totalTimeTaken')}ms, Service Time: {suggestions.get('serviceTimeTaken')}ms, Query Time: {suggestions.get('queryTimeTaken')}ms
        </div>
        {suggestionViews}
    </div>);
};

AutocompleteSuggestionList.propTypes = {
    data: React.PropTypes.object.isRequired,
    appProperties: React.PropTypes.object.isRequired
};