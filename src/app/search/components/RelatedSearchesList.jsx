import _ from 'lodash';
import React from 'react';
import QueryString from 'qs';

const buildSuggestionView = (suggestion, filter, text, appProperties) => {
    const name = suggestion.get('_name');
    const properties = appProperties.getIn(['autocomplete', name]);
    const valueField = properties && properties.get('valueField') || 'value';
    const unicodeValueField = properties && properties.get('unicodeValueField') || 'unicodeValue';

    const searchMode = properties && properties.get('searchMode');
    const searchType = properties && properties.get('searchType');

    const lang = suggestion.get('_lang');

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

            //lang: suggestion.get('_lang'),
            filter: filter.toJS(),
            originalInput: text
        };

        queryParams = _.assign(queryParams, {mode: searchMode, type: searchType});

        url = `${appProperties && appProperties.get('baseUrl') || ''}/search-results?${QueryString.stringify(queryParams, {allowDots: true})}`;
    }

    return {id: suggestion.get('_id'), display, url, name, unicodeKey, enKey, displayKey};
};

export const RelatedSearchesList = (props) => {
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

RelatedSearchesList.propTypes = {
    data: React.PropTypes.object.isRequired,
    appProperties: React.PropTypes.object.isRequired
};