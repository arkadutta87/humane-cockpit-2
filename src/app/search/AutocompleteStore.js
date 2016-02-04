import Immutable from 'immutable';

//import socketIOClient from 'socket.io-client';

import FluxStore from 'reactjs-web-boilerplate/lib/app/flux/FluxStore';

export const FieldToSearchParams = {
    author: {mode: 'autocomplete', type: 'author_entity'},
    category: {mode: 'autocomplete', type: 'category_entity'},
    publisher: {mode: 'autocomplete', type: 'publisher_entity'}
};

export default class extends FluxStore {
    constructor(key, fluxContext, fluxController) {
        super(key, fluxContext, fluxController);

        this.data = Immutable.fromJS({suggestions: null, count: 2, filter: {lang: {primary: 'en', secondary: []}}});
    }

    //createSocket() {
    //    this.socket = socketIOClient(`${window.location.protocol}//${window.location.hostname}:3000`);
    //
    //    this.socket.on('autocomplete-results', result => {
    //        if (!result) {
    //            return this.noSuggestions();
    //        }
    //
    //        const totalTimeTaken = (Date.now() - result.requestTime);
    //        return this.updateData(this.data.set('suggestions', Immutable.fromJS(result)).set('totalTimeTaken', totalTimeTaken));
    //    });
    //}

    setSuggestionCount(count) {
        this.updateData(this.data.set('count', count));

        return this.suggest();
    }

    setPrimaryLanguage(lang) {
        this.updateData(this.data
          .setIn(['filter', 'lang', 'primary'], lang)
          .updateIn(['filter', 'lang', 'secondary'], (secondary) => secondary.filterNot((val) => val === lang)));

        return this.suggest();
    }

    addSecondaryLanguage(lang) {
        this.updateData(this.data.updateIn(['filter', 'lang', 'secondary'], (secondary) => secondary.push(lang)));

        return this.suggest();
    }

    removeSecondaryLanguage(lang) {
        this.updateData(this.data.updateIn(['filter', 'lang', 'secondary'], (secondary) => secondary.filterNot((val) => val === lang)));

        return this.suggest();
    }

    noSuggestions() {
        return this.updateData(this.data.set('suggestions', null).set('totalTimeTaken', null));
    }

    setText(text) {
        this.updateData(this.data.set('text', text));

        return this.suggest();
    }

    suggest() {
        const text = this.data.get('text');
        if (text) {
            const filter = this.data.get('filter').toJS();
            const count = this.data.get('count');

            const requestTime = Date.now();

            //this.socket.emit('autocomplete', {request: {text, count, filter, requestTime}});

            return this.fluxContext.restClient.post(`${this.fluxController.appProperties.get('searcherApi')}/autocomplete`, {text, count, filter, requestTime})
              .then((result) => {
                  const totalTimeTaken = (Date.now() - requestTime);
                  if (result && result.entity) {
                      return this.updateData(this.data.set('suggestions', Immutable.fromJS(result.entity)).set('totalTimeTaken', totalTimeTaken));
                  }

                  return this.noSuggestions();
              })
              .catch(() => this.noSuggestions());
        }

        return this.noSuggestions();
    }
}