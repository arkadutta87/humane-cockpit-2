import Immutable from 'immutable';

import FluxStore from 'reactjs-web-boilerplate/lib/app/flux/FluxStore';

import {EVENT_SEARCH_TEXT_UPDATE} from './SearchInputStore';

export default class extends FluxStore {
    constructor(key, fluxContext, fluxController, searchInputStore) {
        super(key, fluxContext, fluxController);

        this.searchInputStore = searchInputStore;

        this.data = Immutable.fromJS({suggestions: null});

        // setup listeners on search input store
        this.searchInputStore.addListener(`UPDATE:${EVENT_SEARCH_TEXT_UPDATE}`, () => this.fetchSuggestions());
    }

    noSuggestions() {
        return this.updateData(this.data.set('suggestions', null).set('totalTimeTaken', null));
    }

    fetchSuggestions() {
        const text = this.searchInputStore.data.get('text');
        if (!text || text.length < 2) {
            return this.noSuggestions();
        }

        const requestTime = Date.now();

        return this.fluxContext.restClient.get(`${this.fluxController.appProperties.get('searcherApi')}/didYouMean?text=${text}&requestTime=${requestTime}`)
          .then((response) => {
              const totalTimeTaken = (Date.now() - requestTime);
              if (response && response.entity) {
                  return this.updateData(this.data.set('suggestions', Immutable.fromJS(response.entity)).set('totalTimeTaken', totalTimeTaken));
              }

              return this.noSuggestions();
          })
          .catch(() => this.noSuggestions());
    }
}