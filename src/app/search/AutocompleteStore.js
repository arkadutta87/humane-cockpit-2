import _ from 'lodash';
import Immutable from 'immutable';

import FluxStore from 'reactjs-web-boilerplate/lib/app/flux/FluxStore';

import {EVENT_SEARCH_TEXT_UPDATE, EVENT_SEARCH_PARAMS_UPDATE, EVENT_FILTER_UPDATE} from './SearchInputStore';

export default class extends FluxStore {
    constructor(key, fluxContext, fluxController, searchInputStore) {
        super(key, fluxContext, fluxController);

        this.searchInputStore = searchInputStore;

        this.data = Immutable.fromJS({suggestions: null, count: 5, hideWeakSuggestions: true});

        // setup listeners on search input store
        this.searchInputStore.addListener(`UPDATE:${EVENT_SEARCH_PARAMS_UPDATE}`, () => this.fetchSuggestions());
        this.searchInputStore.addListener(`UPDATE:${EVENT_FILTER_UPDATE}`, () => this.fetchSuggestions());
        this.searchInputStore.addListener(`UPDATE:${EVENT_SEARCH_TEXT_UPDATE}`, () => this.fetchSuggestions());
    }

    hideWeakSuggestions(value) {
        this.updateData(this.data.set('hideWeakSuggestions', value));
    }

    setSuggestionCount(count) {
        this.updateData(this.data.set('count', count));

        return this.suggest();
    }

    noSuggestions() {
        return this.updateData(this.data.set('suggestions', null).set('totalTimeTaken', null));
    }

    fetchSuggestions() {
        const text = this.searchInputStore.data.get('text');
        if (!text) {
            return this.noSuggestions();
        }

        const filter = this.searchInputStore.data.get('filter').toJS();
        const count = this.data.get('count');

        const requestTime = Date.now();

        //this.socket.emit('autocomplete', {request: {text, count, filter, requestTime}});

        return this.fluxContext.restClient.post(`${this.fluxController.appProperties.get('searcherApi')}/autocomplete`, {text, count, filter, requestTime})
          .then((result) => {
              const totalTimeTaken = (Date.now() - requestTime);
              if (result && result.entity) {
                  const relevancyScores = [];

                  // calculate relevancy scores
                  if (result.entity.multi) {
                      _(result.entity.results).values().forEach(suggestionGroup => {
                          _.forEach(suggestionGroup.results, suggestion => {
                              suggestion._relevancy = suggestion._score / (suggestion._weight || 1.0);
                              relevancyScores.push(suggestion._relevancy);
                          });
                      });
                  } else {
                      _.forEach(result.entity.results, suggestion => {
                          suggestion._relevancy = suggestion._score / (suggestion._weight || 1.0);
                          relevancyScores.push(suggestion._relevancy);
                      });
                  }

                  // sort relevancy scores
                  relevancyScores.sort((scoreA, scoreB) => scoreB - scoreA);

                  console.log('Sorted Relevancy Scores: ', relevancyScores);

                  // iterate over the relevancy scores to find point at which score drops suddenly.
                  let previousRelevancy = 0;
                  let deflectionScore = 0;
                  _.forEach(relevancyScores, score => {
                      if (previousRelevancy && score < 0.5 * previousRelevancy) {
                          deflectionScore = previousRelevancy;
                          return false;
                      }

                      previousRelevancy = score;

                      return true;
                  });

                  console.log('Deflection Score: ', deflectionScore);

                  if (result.entity.multi) {
                      _(result.entity.results).values().forEach(suggestionGroup => {
                          _.forEach(suggestionGroup.results, suggestion => {
                              if (suggestion._relevancy >= deflectionScore) {
                                  return true;
                              }

                              suggestion._weakSuggestion = true;
                              return true;
                          });
                      });
                  } else {
                      _.forEach(result.entity.results, suggestion => {
                          if (suggestion._relevancy >= deflectionScore) {
                              return true;
                          }

                          suggestion._weakSuggestion = true;
                          return true;
                      });
                  }

                  return this.updateData(this.data.set('suggestions', Immutable.fromJS(result.entity)).set('totalTimeTaken', totalTimeTaken));
              }

              return this.noSuggestions();
          })
          .catch(() => this.noSuggestions());
    }
}