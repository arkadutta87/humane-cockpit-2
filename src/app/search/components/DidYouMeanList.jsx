import _ from 'lodash';
import React from 'react';
import QueryString from 'qs';

const DidYouMeanResult = (props) => {
    const appProperties = props.appProperties;
    const data = props.data;
    const suggestion = data.suggestion;

    let queryParams = {
        text: suggestion.get('result'),
        filter: data.filter.toJS()
    };

    queryParams = _.assign(queryParams, {mode: 'organic'});

    const url = `${appProperties && appProperties.get('cockpitUrlPrefix') || ''}/search-results?${QueryString.stringify(queryParams, {allowDots: true})}`;

    let view = null;
    if (url) {
        view = <a target="_blank" href={url}>{suggestion.get('result')}</a>;
    } else {
        view = <span>{suggestion.get('result')}</span>;
    }

    return (<div className="suggestion card">
        <div className="card-body">
            {view}
        </div>
    </div>);
};

DidYouMeanResult.propTypes = {
    data: React.PropTypes.object.isRequired,
    appProperties: React.PropTypes.object.isRequired
};

export const DidYouMeanList = (props) => {
    if (!props.data) {
        return (<noscript/>);
    }

    const text = props.data.text;
    const suggestions = props.data.suggestionsData.get('suggestions');
    const filter = props.data.filter;

    if (!text || !suggestions) {
        return (<noscript/>);
    }

    const results = suggestions.get('results');
    if (results.count() === 0) {
        return (<noscript/>);
    }

    return (<div className="suggestions section">
        <div className="suggestions-section-heading">Did You Mean Suggestions: {results.count() || 0}</div>
        {
            results
              .map((suggestion, index) =>
                <DidYouMeanResult data={{suggestion, text, filter}} appProperties={props.appProperties} key={index}/>)
        }
    </div>);
};

DidYouMeanList.propTypes = {
    data: React.PropTypes.object.isRequired,
    appProperties: React.PropTypes.object.isRequired
};