import React from 'react';
import { Route, IndexRoute } from 'react-router';

const NotFoundPage = () => (<h1>Page Not found</h1>);

import IndexPage from './IndexPage';
import CockpitHomePage from './CockpitHomePage';
import DataViewPage from './views/DataViewPage';
import AutocompletePage from './search/AutocompletePage';
import SearchResultPage from './search/SearchResultPage';
import TermVectorsPage from './search/TermVectorsPage';
import ExplainSearchResultPage from './search/ExplainSearchResultPage';

export default function (appProperties) {
    return (<Route path={appProperties && appProperties.get('routesPrefix') || '/'} component={IndexPage}>
        <IndexRoute component={CockpitHomePage}/>
        <Route path="data-view/:type" component={DataViewPage}/>
        <Route path="autocomplete" component={AutocompletePage}/>
        <Route path="search-results" component={SearchResultPage}/>
        <Route path="analyze/termVectors/:type/:id" component={TermVectorsPage}/>
        <Route path="analyze/explain/:api/:id" component={ExplainSearchResultPage}/>
        <Route path="*" component={NotFoundPage}/>
    </Route>);
}