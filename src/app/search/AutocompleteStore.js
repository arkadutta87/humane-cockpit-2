import Immutable from 'immutable';

import FluxStore from 'reactjs-web-boilerplate/lib/app/flux/FluxStore';
import {EVENT_SEARCH_TEXT_UPDATE, EVENT_SEARCH_PARAMS_UPDATE, EVENT_FILTER_UPDATE} from './SearchInputStore';

import WeakResultsMarker from './WeakResultsMarker';

export default class extends FluxStore {
    constructor(key, fluxContext, fluxController, searchInputStore) {
        super(key, fluxContext, fluxController);

        this.searchInputStore = searchInputStore;

        this.data = Immutable.fromJS({suggestions: null, count: 5});

        // setup listeners on search input store
        this.searchInputStore.addListener(`UPDATE:${EVENT_SEARCH_PARAMS_UPDATE}`, () => this.fetchSuggestions());
        this.searchInputStore.addListener(`UPDATE:${EVENT_FILTER_UPDATE}`, () => this.fetchSuggestions());
        this.searchInputStore.addListener(`UPDATE:${EVENT_SEARCH_TEXT_UPDATE}`, () => this.fetchSuggestions());
        
        this.weakResultsMarker = new WeakResultsMarker();
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
        if (!text || text.length < 2) {
            return this.noSuggestions();
        }

        const filter = this.searchInputStore.data.get('filter').toJS();
        const count = this.data.get('count');
        
        const fuzzySearch = this.searchInputStore.data.get('fuzzySearch');

        const requestTime = Date.now();

        //this.socket.emit('autocomplete', {request: {text, count, filter, requestTime}});

        return this.fluxContext.restClient.post(`${this.fluxController.appProperties.get('searcherApi')}/autocomplete`, {text, count, filter, requestTime, fuzzySearch})
          .then((response) => {
              this.weakResultsMarker.reset();
              
              const totalTimeTaken = (Date.now() - requestTime);
              if (response && response.entity) {
                  this.weakResultsMarker.mark(response.entity);                    
                  return this.updateData(this.data.set('suggestions', Immutable.fromJS(response.entity)).set('totalTimeTaken', totalTimeTaken));
              }

              return this.noSuggestions();
          })
          .catch(() => this.noSuggestions());
    }
}