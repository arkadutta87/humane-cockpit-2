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

    markWeakResults(results, name) {
        if (!this.relevancyScores) {
            this.relevancyScores = {};
        }

        if (!this.relevancyScores[name]) {
            this.relevancyScores[name] = [];
        }

        const relevancyScores = this.relevancyScores[name];

        _.forEach(results, result => {
            result._relevancy = result._score / (result._weight || 1.0);
            relevancyScores.push(result._relevancy);
        });

        // sort relevancy scores
        relevancyScores.sort((scoreA, scoreB) => scoreB - scoreA);

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

        _.forEach(results, result => {
            if (result._relevancy >= deflectionScore) {
                return true;
            }

            result._weakResult = true;
            return true;
        });
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
          .then((response) => {
              this.relevancyScores = null;
              
              const totalTimeTaken = (Date.now() - requestTime);
              if (response && response.entity) {
                  if (response.entity.multi) {
                      _(response.entity.results).values().forEach(suggestionGroup => {
                          this.markWeakResults(suggestionGroup.results, suggestionGroup.name);
                          return true;
                      });
                  } else {
                      this.markWeakResults(response.entity.results, response.entity.name);
                  }

                  return this.updateData(this.data.set('suggestions', Immutable.fromJS(response.entity)).set('totalTimeTaken', totalTimeTaken));
              }

              return this.noSuggestions();
          })
          .catch(() => this.noSuggestions());
    }
}